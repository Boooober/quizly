import * as crypto from "crypto";
import * as fs from "fs";
import * as command from "@pulumi/command";
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as docker from "@pulumi/docker-build";

const gcpCfg = new pulumi.Config("gcp");
const project = gcpCfg.require("project");
const region = gcpCfg.require("region");

// --- Catalog data store: Vertex AI Search over sunglasses.jsonl, queried by the agent.
const catalogFile = "../sunglasses.jsonl";
const dataBucket = new gcp.storage.Bucket("data", {
    name: `${project}-quizly-data`,
    location: region,
    uniformBucketLevelAccess: true,
});
// Discovery Engine's "custom" schema keys documents on `_id`, the catalog uses `id`.
const catalogJsonl = fs
    .readFileSync(catalogFile, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => {
        const item = JSON.parse(l) as { id: string };
        return JSON.stringify({ _id: item.id, ...item });
    })
    .join("\n");
const catalogObject = new gcp.storage.BucketObject("catalog", {
    bucket: dataBucket.name,
    name: "sunglasses.jsonl",
    content: catalogJsonl,
});
const catalogStore = new gcp.discoveryengine.DataStore("catalog", {
    dataStoreId: "quizly-catalog",
    location: "global",
    displayName: "Quizly sunglasses catalog",
    industryVertical: "GENERIC",
    contentConfig: "NO_CONTENT",
    solutionTypes: ["SOLUTION_TYPE_SEARCH"],
});
// documents:import has no Pulumi resource, so shell out and re-run when the catalog changes.
const catalogImport = new command.local.Command(
    "catalog-import",
    {
        create: pulumi.interpolate`bash import-catalog.sh ${project} ${catalogStore.dataStoreId} gs://${dataBucket.name}/${catalogObject.name}`,
        triggers: [sha256(catalogJsonl), catalogStore.dataStoreId],
    },
    { dependsOn: [catalogObject] },
);

// --- Agent: ADK config only, no tools. Shipping inlineSource builds a custom container
// that answered in 10-17s even with no tool call, so catalog search lives in the backend.
const agent = new gcp.vertex.AiReasoningEngine("quizly-agent", {
    displayName: "quizly-agent",
    description: "Adaptive sunglasses consultation agent",
    region,
    spec: {
        agentFramework: "google-adk",
        sourceCodeSpec: {
            agentConfigSource: {
                adkConfig: {
                    jsonConfig: JSON.stringify({
                        agent_class: "LlmAgent",
                        name: "quizly",
                        model: "gemini-3.5-flash",
                        description: "Sunglasses consultation agent",
                        instruction: fs.readFileSync("agent/prompt.md", "utf8"),
                        // thinking off: cuts ~10s per call; JSON mime keeps replies fence-free
                        generate_content_config: {
                            thinkingConfig: { thinkingBudget: 0 },
                            responseMimeType: "application/json",
                        },
                    }),
                },
            },
            pythonSpec: { version: "3.13" },
        },
        deploymentSpec: {
            minInstances: 3,
            maxInstances: 10, // warm for demo: ~$10/day per instance (4 CPU, 4 GiB)
            // gemini-3.x is served only on the global endpoint, not europe-west1
            envs: [{ name: "GOOGLE_CLOUD_LOCATION", value: "global" }],
        },
    },
});

const engineName = pulumi.interpolate`projects/${project}/locations/${region}/reasoningEngines/${agent.name}`;

// --- Backend image: built locally with Docker, pushed to Artifact Registry.
const repo = new gcp.artifactregistry.Repository("quizly", {
    repositoryId: "quizly",
    format: "DOCKER",
    location: region,
});
const registry = `${region}-docker.pkg.dev`;
const registries = [{
    address: registry,
    username: "oauth2accesstoken",
    password: gcp.organizations.getClientConfigOutput().accessToken,
}];
const buildImage = (name: string, buildArgs?: Record<string, pulumi.Input<string>>) =>
    new docker.Image(name, {
        tags: [pulumi.interpolate`${registry}/${project}/${repo.repositoryId}/${name}:latest`],
        context: { location: `../apps/${name}` },
        platforms: ["linux/amd64"],
        push: true,
        buildOnPreview: false,
        buildArgs,
        registries,
    });
const image = buildImage("backend");

// --- Backend runtime: Cloud Run as a service account allowed to query the agent.
const sa = new gcp.serviceaccount.Account("backend", {
    accountId: "quizly-backend",
    displayName: "quizly backend",
});
new gcp.projects.IAMMember("backend-aiplatform-user", {
    project,
    role: "roles/aiplatform.user",
    member: pulumi.interpolate`serviceAccount:${sa.email}`,
});
new gcp.projects.IAMMember("backend-discoveryengine-viewer", {
    project,
    role: "roles/discoveryengine.viewer",
    member: pulumi.interpolate`serviceAccount:${sa.email}`,
});
const service = new gcp.cloudrunv2.Service("backend", {
    name: "quizly-backend",
    location: region,
    deletionProtection: false,
    invokerIamDisabled: true, // public; Editor role cannot set run IAM policy, and this needs no binding
    template: {
        scaling: { minInstanceCount: 1 },
        serviceAccount: sa.email,
        containers: [{
            image: image.ref,
            envs: [
                { name: "AGENT_ENGINE", value: engineName },
                { name: "CATALOG_DATA_STORE", value: catalogStore.name },
            ],
        }],
    },
});

// --- Frontend: static Vite build served by nginx, public.
const frontend = new gcp.cloudrunv2.Service("frontend", {
    name: "quizly-frontend",
    location: region,
    deletionProtection: false,
    invokerIamDisabled: true,
    template: { containers: [{ image: buildImage("frontend", { VITE_API_URL: service.uri }).ref }] },
});

// --- Images: sunglasses photos (PNG). Publicly readable.
const images = new gcp.storage.Bucket("images", {
    name: `${project}-quizly-images`,
    location: region,
    uniformBucketLevelAccess: true,
});
new gcp.storage.BucketIAMMember("images-public-read", {
    bucket: images.name,
    role: "roles/storage.objectViewer",
    member: "allUsers",
});

export const imagesBucket = images.name;
export const backendUrl = service.uri;
export const frontendUrl = frontend.uri;
export const agentEngine = engineName;
export const catalogDataStore = catalogStore.name;

function sha256(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
}

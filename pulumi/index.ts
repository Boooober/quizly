import * as fs from "fs";
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as docker from "@pulumi/docker-build";

const gcpCfg = new pulumi.Config("gcp");
const project = gcpCfg.require("project");
const region = gcpCfg.require("region");

// --- Agent: pure ADK config in Agent Engine, no agent code. Edit agent/prompt.md and `pulumi up`.
const agent = new gcp.vertex.AiReasoningEngine("quizly-agent", {
    displayName: "quizly-agent",
    description: "Generates quizzes from a topic or source text",
    region,
    spec: {
        agentFramework: "google-adk",
        sourceCodeSpec: {
            agentConfigSource: {
                adkConfig: {
                    jsonConfig: JSON.stringify({
                        agent_class: "LlmAgent",
                        name: "quizly",
                        model: "gemini-2.5-flash",
                        description: "Quiz generator",
                        instruction: fs.readFileSync("agent/prompt.md", "utf8"),
                    }),
                },
            },
            pythonSpec: { version: "3.13" },
        },
        deploymentSpec: { minInstances: 0, maxInstances: 2 }, // ponytail: dev sizing, cold starts accepted
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
const buildImage = (name: string) => new docker.Image(name, {
    tags: [pulumi.interpolate`${registry}/${project}/${repo.repositoryId}/${name}:latest`],
    context: { location: `../apps/${name}` },
    platforms: ["linux/amd64"],
    push: true,
    buildOnPreview: false,
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
const service = new gcp.cloudrunv2.Service("backend", {
    name: "quizly-backend",
    location: region,
    deletionProtection: false,
    invokerIamDisabled: true, // public; Editor role cannot set run IAM policy, and this needs no binding
    template: {
        serviceAccount: sa.email,
        containers: [{
            image: image.ref,
            envs: [{ name: "AGENT_ENGINE", value: engineName }],
        }],
    },
});

// --- Frontend: static Vite build served by nginx, public.
const frontend = new gcp.cloudrunv2.Service("frontend", {
    name: "quizly-frontend",
    location: region,
    deletionProtection: false,
    invokerIamDisabled: true,
    template: { containers: [{ image: buildImage("frontend").ref }] },
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

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
const image = new docker.Image("backend", {
    tags: [pulumi.interpolate`${registry}/${project}/${repo.repositoryId}/backend:latest`],
    context: { location: "../apps/backend" },
    platforms: ["linux/amd64"],
    push: true,
    buildOnPreview: false,
    registries: [{
        address: registry,
        username: "oauth2accesstoken",
        password: gcp.organizations.getClientConfigOutput().accessToken,
    }],
});

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

// --- Images: sunglasses photos (PNG). Private; grant access when a reader/writer is known.
const images = new gcp.storage.Bucket("images", {
    name: `${project}-quizly-images`,
    location: region,
    uniformBucketLevelAccess: true,
});

export const imagesBucket = images.name;
export const backendUrl = service.uri;
export const agentEngine = engineName;

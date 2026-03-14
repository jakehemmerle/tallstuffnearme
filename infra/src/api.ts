import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { name, environment, gcpProject, gcpRegion, domain } from "./config";
import { dbUrlSecret } from "./secrets";
import { cloudRunSa } from "./iam";
import { shared } from "./shared-ref";

// Image is built and pushed by CI — Pulumi references it by tag
const registryUrl = shared.getOutput("registryUrl") as pulumi.Output<string>;
const imageName = pulumi.interpolate`${registryUrl}/app:${environment}`;

// Cloud Run service — serves both frontend and API
export const service = new gcp.cloudrunv2.Service(name("app"), {
  name: name("app"),
  location: gcpRegion,
  project: gcpProject,
  ingress: "INGRESS_TRAFFIC_ALL",
  template: {
    serviceAccount: cloudRunSa.email,
    scaling: {
      minInstanceCount: 0,
      maxInstanceCount: 2,
    },
    containers: [
      {
        image: imageName,
        ports: { containerPort: 3001, name: "http1" },
        envs: [
          {
            name: "DATABASE_URL",
            valueSource: {
              secretKeyRef: {
                secret: dbUrlSecret.secretId,
                version: "latest",
              },
            },
          },
        ],
        resources: {
          limits: {
            cpu: "1",
            memory: "512Mi",
          },
        },
      },
    ],
  },
});

// Allow unauthenticated access
export const invoker = new gcp.cloudrunv2.ServiceIamMember(name("invoker"), {
  name: service.name,
  location: gcpRegion,
  project: gcpProject,
  role: "roles/run.invoker",
  member: "allUsers",
});

// Custom domain mapping
export const domainMapping = new gcp.cloudrun.DomainMapping(name("domain"), {
  name: domain!,
  location: gcpRegion,
  project: gcpProject,
  metadata: {
    namespace: gcpProject,
  },
  spec: {
    routeName: service.name,
  },
});

export const serviceUrl = service.uri;

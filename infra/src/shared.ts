import * as gcp from "@pulumi/gcp";
import * as neon from "pulumi-neon";
import * as pulumi from "@pulumi/pulumi";
import { gcpProject, gcpRegion, neonOrgId } from "./config";

// --- DNS ---

export const dnsZone = new gcp.dns.ManagedZone("tallshitnearme-zone", {
  name: "tallshitnearme-zone",
  dnsName: "tallshitnearme.com.",
  project: gcpProject,
});

// --- Artifact Registry ---

export const registry = new gcp.artifactregistry.Repository("tallshit-registry", {
  repositoryId: "tallshitnearme",
  location: gcpRegion,
  format: "DOCKER",
  project: gcpProject,
});

export const registryUrl = pulumi.interpolate`${gcpRegion}-docker.pkg.dev/${gcpProject}/tallshitnearme`;

// --- Neon ---

export const neonProject = new neon.Project("tallshitnearme", {
  name: "tallshitnearme",
  regionId: "aws-us-east-1",
  orgId: neonOrgId,
  pgVersion: 17,
});

const defaultBranchId = neonProject.branch.apply((b) => b.id);
const endpointHost = neonProject.branch.apply((b) => b.endpoint.host);

// Role for database access — password is auto-generated
export const dbRole = new neon.Role("tallshit-role", {
  projectId: neonProject.id,
  branchId: defaultBranchId,
  name: "tallshit_owner",
});

// Staging database
export const stagingDb = new neon.Database("tallshit-staging", {
  projectId: neonProject.id,
  branchId: defaultBranchId,
  name: "tallshit_staging",
  ownerName: dbRole.name,
});

// Prod database
export const prodDb = new neon.Database("tallshit-prod", {
  projectId: neonProject.id,
  branchId: defaultBranchId,
  name: "tallshit_prod",
  ownerName: dbRole.name,
});

// Connection strings
function connectionString(dbName: pulumi.Output<string>): pulumi.Output<string> {
  return pulumi.interpolate`postgresql://${dbRole.name}:${dbRole.password}@${endpointHost}/${dbName}?sslmode=require`;
}

export const stagingDbUrl = connectionString(stagingDb.name);
export const prodDbUrl = connectionString(prodDb.name);

import * as gcp from "@pulumi/gcp";
import { name, gcpProject } from "./config";
import { dbUrlSecret } from "./secrets";

// Service account for Cloud Run
export const cloudRunSa = new gcp.serviceaccount.Account(name("cloudrun-sa"), {
  accountId: name("cloudrun-sa"),
  displayName: `Cloud Run SA (${name("")})`,
  project: gcpProject,
});

// Allow Cloud Run SA to access the database URL secret
export const secretAccessBinding = new gcp.secretmanager.SecretIamMember(name("secret-access"), {
  secretId: dbUrlSecret.id,
  role: "roles/secretmanager.secretAccessor",
  member: cloudRunSa.email.apply((email) => `serviceAccount:${email}`),
  project: gcpProject,
});

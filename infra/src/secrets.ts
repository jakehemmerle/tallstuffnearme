import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { name, gcpProject } from "./config";
import { shared } from "./shared-ref";

// DATABASE_URL stored in GCP Secret Manager, value comes from shared stack
export const dbUrlSecret = new gcp.secretmanager.Secret(name("db-url"), {
  secretId: name("db-url"),
  project: gcpProject,
  replication: {
    auto: {},
  },
});

const config = new pulumi.Config("tallshitnearme");
const environment = config.require("environment");

const dbUrl = shared.getOutput(
  environment === "prod" ? "prodDbUrl" : "stagingDbUrl"
) as pulumi.Output<string>;

export const dbUrlSecretVersion = new gcp.secretmanager.SecretVersion(name("db-url-version"), {
  secret: dbUrlSecret.id,
  secretData: dbUrl,
});

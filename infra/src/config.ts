import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config("tallshitnearme");
const gcpConfig = new pulumi.Config("gcp");

export const environment = config.get("environment"); // undefined for shared stack
export const domain = config.get("domain");
export const apiDomain = config.get("apiDomain");
export const gcpProject = gcpConfig.require("project");
export const gcpRegion = gcpConfig.require("region");
export const neonOrgId = "org-withered-mud-28878668";

// Resource naming helper — for env-specific resources
export function name(resource: string): string {
  return `tallshit-${environment}-${resource}`;
}

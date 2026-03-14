import * as pulumi from "@pulumi/pulumi";

// Single StackReference to the shared stack — used by all env-stack modules
export const shared = new pulumi.StackReference("shared");

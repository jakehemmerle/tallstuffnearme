import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { gcpProject, domain, apiDomain } from "./config";
import { shared } from "./shared-ref";

const dnsZoneName = shared.getOutput("dnsZoneName") as pulumi.Output<string>;

// CNAME for the main domain (frontend + API served from same Cloud Run service)
export const domainDnsRecord = new gcp.dns.RecordSet("domain-dns", {
  name: `${domain}.`,
  type: "CNAME",
  ttl: 300,
  managedZone: dnsZoneName,
  project: gcpProject,
  rrdatas: ["ghs.googlehosted.com."],
});

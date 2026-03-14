import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";
import { gcpProject, domain, environment } from "./config";
import { shared } from "./shared-ref";

const dnsZoneName = shared.getOutput("dnsZoneName") as pulumi.Output<string>;

// Apex domains (tallshitnearme.com) can't use CNAME — need A/AAAA records.
// Subdomains (staging.tallshitnearme.com) use CNAME to ghs.googlehosted.com.
const isApex = environment === "prod";

export const domainDnsRecord = isApex
  ? // Cloud Run domain mapping IPs for apex domains
    // See: https://cloud.google.com/run/docs/mapping-custom-domains#dns_update
    new gcp.dns.RecordSet("domain-dns", {
      name: `${domain}.`,
      type: "A",
      ttl: 300,
      managedZone: dnsZoneName,
      project: gcpProject,
      rrdatas: [
        "216.239.32.21",
        "216.239.34.21",
        "216.239.36.21",
        "216.239.38.21",
      ],
    })
  : new gcp.dns.RecordSet("domain-dns", {
      name: `${domain}.`,
      type: "CNAME",
      ttl: 300,
      managedZone: dnsZoneName,
      project: gcpProject,
      rrdatas: ["ghs.googlehosted.com."],
    });

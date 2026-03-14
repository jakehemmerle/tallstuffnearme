import * as pulumi from "@pulumi/pulumi";
import { environment } from "./src/config";

if (!environment) {
  // Shared stack — DNS zone, Artifact Registry, Neon databases
  const shared = require("./src/shared");
  module.exports = {
    dnsZoneName: shared.dnsZone.name,
    dnsNameServers: shared.dnsZone.nameServers,
    registryUrl: shared.registryUrl,
    stagingDbUrl: pulumi.secret(shared.stagingDbUrl),
    prodDbUrl: pulumi.secret(shared.prodDbUrl),
    neonProjectId: shared.neonProject.id,
  };
} else {
  // Environment stack — Cloud Run service + DNS record
  const { serviceUrl, domainMapping } = require("./src/api");
  const { domainDnsRecord } = require("./src/dns");

  module.exports = {
    serviceUrl,
    domain: domainMapping.name,
  };
}

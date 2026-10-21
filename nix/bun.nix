{ bun, fetchurl, stdenvNoCC }:

let
  version = "1.4.3";
  archive = {
    x86_64-linux = {
      name = "bun-linux-x64";
      hash = "sha256-PnMFKNiXdfA/h/BcBnh8TfQJnQo38/JS57gpyyOBbhg=";
    };
    aarch64-darwin = {
      name = "bun-darwin-aarch64";
      hash = "sha256-gK/UwGm0am+o8+xSC+vHUKeEPkqNW5WD0prUNsAKNAM=";
    };
  }.${stdenvNoCC.hostPlatform.system};
in
bun.overrideAttrs {
  inherit version;
  src = fetchurl {
    url = "https://github.com/oven-sh/bun/releases/download/bun-v${version}/${archive.name}.zip";
    inherit (archive) hash;
  };
}

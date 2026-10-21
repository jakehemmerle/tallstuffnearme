{ lib, stdenv, stdenvNoCC, fetchurl, autoPatchelfHook, openssl, zlib }:

let
  engineRevision = "280c870be64f457428992c43c1f6d557fab6e29e";
  platform = {
    x86_64-linux = {
      name = "debian-openssl-3.0.x";
      sha256 = "cf89a3a7abdc05860751340ce7b3e45fa2ce8db819bd3051e6090b6a65617768";
    };
    aarch64-darwin = {
      name = "darwin-arm64";
      sha256 = "923618b679433c342bd10b1873bbe5a6500340baa40e7c6a510cdce2532e5806";
    };
  }.${stdenvNoCC.hostPlatform.system};
in
stdenvNoCC.mkDerivation {
  pname = "tallshitnearme-prisma-schema-engine";
  version = "7.5.0";
  src = fetchurl {
    url = "https://binaries.prisma.sh/all_commits/${engineRevision}/${platform.name}/schema-engine.gz";
    inherit (platform) sha256;
  };
  nativeBuildInputs = lib.optionals stdenvNoCC.hostPlatform.isLinux [ autoPatchelfHook ];
  buildInputs = lib.optionals stdenvNoCC.hostPlatform.isLinux [ stdenv.cc.cc.lib openssl zlib ];
  dontUnpack = true;
  installPhase = ''
    mkdir -p "$out/bin"
    gzip -dc "$src" > "$out/bin/schema-engine"
    chmod +x "$out/bin/schema-engine"
  '';
  meta = {
    license = lib.licenses.asl20;
    platforms = [ "x86_64-linux" "aarch64-darwin" ];
  };
}

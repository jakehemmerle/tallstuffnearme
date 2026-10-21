{ lib, stdenvNoCC, bun, nodejs_22, openssl, cacert, makeWrapper, callPackage }:

let
  sourceRoot = ../.;
  prismaEngine = callPackage ./prisma-engine.nix { };
  src = lib.cleanSourceWith {
    src = sourceRoot;
    filter = path: type:
      let
        relative = lib.removePrefix "${toString sourceRoot}/" (toString path);
        parts = lib.splitString "/" relative;
        name = baseNameOf path;
      in
        builtins.elem (builtins.head parts) [
          "src" "web" "scripts" "bin" "prisma" "package.json" "bun.lock"
          "prisma.config.ts" "tsconfig.json"
        ]
        && !(builtins.any (part: builtins.elem part [
          "node_modules" ".next" "out" "generated" "test-results" "playwright-report"
        ]) parts)
        && !(lib.hasPrefix ".env" name)
        && !(lib.hasSuffix ".tsbuildinfo" name);
  };
  dependencies = stdenvNoCC.mkDerivation {
    pname = "tallshitnearme-dependencies";
    version = "1";
    nativeBuildInputs = [ bun cacert ];
    dontUnpack = true;
    dontFixup = true;
    outputHashMode = "recursive";
    outputHashAlgo = "sha256";
    outputHash = {
      x86_64-linux = "sha256-hJPGuTl2c9+HpK/B1wesFbw6BCIrmwNdIyWqBjXBEIs=";
      aarch64-darwin = "sha256-kHV0RNwxKWdaRUfwASYQfsZTCEfW1gsFeWhBHquqV2A=";
    }.${stdenvNoCC.hostPlatform.system};
    buildPhase = ''
      export BUN_INSTALL_CACHE_DIR="$TMPDIR/bun-cache"
      mkdir -p web infra
      cp ${../package.json} package.json
      cp ${../bun.lock} bun.lock
      cp ${../web/package.json} web/package.json
      cp ${../infra/package.json} infra/package.json
      bun install --frozen-lockfile --ignore-scripts --filter '!tallshitnearme-infra'
      # Bun races creating dependency-local lifecycle bins; these scripts are disabled.
      # Keep the project and workspace bins used by the CLI and development commands.
      rm -rf node_modules/.bun/*/node_modules/.bin
    '';
    installPhase = ''
      mkdir -p "$out/web"
      cp -R node_modules "$out/"
      if [ -d web/node_modules ]; then
        cp -R web/node_modules "$out/web/"
      fi
    '';
  };
in
stdenvNoCC.mkDerivation {
  pname = "tallshitnearme";
  version = "1.0.0";
  outputs = [ "out" "cliSource" ];
  inherit src;
  nativeBuildInputs = [ bun nodejs_22 openssl makeWrapper ];
  NEXT_TELEMETRY_DISABLED = "1";
  PRISMA_HIDE_UPDATE_MESSAGE = "1";
  PRISMA_GENERATE_NO_ENGINE = "1";
  PRISMA_SCHEMA_ENGINE_BINARY = "${prismaEngine}/bin/schema-engine";
  NEXT_PUBLIC_API_URL = "";
  buildPhase = ''
    runHook preBuild
    export XDG_CACHE_HOME="$TMPDIR/cache"
    cp -R ${dependencies}/node_modules .
    if [ -d ${dependencies}/web/node_modules ]; then
      cp -R ${dependencies}/web/node_modules web/
    fi
    chmod -R u+w node_modules web
    bun node_modules/prisma/build/index.js generate
    (cd web && node node_modules/next/dist/bin/next build)
    bun build src/index.ts --target=bun --outfile=dist/index.js
    runHook postBuild
  '';
  installPhase = ''
    runHook preInstall
    mkdir -p "$out/lib/tallshitnearme/src" "$out/bin"
    cp dist/index.js "$out/lib/tallshitnearme/src/index.js"
    cp -R web/out "$out/lib/tallshitnearme/public"
    makeWrapper ${bun}/bin/bun "$out/bin/tallshitnearme" \
      --add-flags "$out/lib/tallshitnearme/src/index.js" \
      --set NODE_ENV production
    mkdir -p "$cliSource/lib/tallshitnearme"
    cp -R src scripts bin prisma "$cliSource/lib/tallshitnearme/"
    ln -s ${dependencies}/node_modules "$cliSource/lib/tallshitnearme/node_modules"
    cp package.json bun.lock prisma.config.ts tsconfig.json "$cliSource/lib/tallshitnearme/"
    runHook postInstall
  '';
  passthru = { inherit dependencies prismaEngine; };
  meta = {
    description = "FAA obstacle map with a same-origin API";
    license = lib.licenses.mit;
    mainProgram = "tallshitnearme";
    platforms = [ "x86_64-linux" "aarch64-darwin" ];
  };
}

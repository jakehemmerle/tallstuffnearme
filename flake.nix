{
  description = "Tallshitnearme application and development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/7fc6f2c20af09cdcaf48b92ec3121860139ec668";
    nixpkgs-darwin.url = "github:NixOS/nixpkgs/f205b5574fd0cb7da5b702a2da51507b7f4fdd1b";
  };

  outputs = { self, nixpkgs, nixpkgs-darwin }:
    let
      systems = [ "x86_64-linux" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
      packagesFor = system: import (if system == "aarch64-darwin" then nixpkgs-darwin else nixpkgs) {
        inherit system;
        overlays = [ (final: previous: {
          bun = final.callPackage ./nix/bun.nix { bun = previous.bun; };
        }) ];
      };
    in {
      packages = forAllSystems (system:
        let
          pkgs = packagesFor system;
          application = pkgs.callPackage ./nix/package.nix { };
        in {
          default = application;
          tallshitnearme = application;
          cli = pkgs.runCommand "tallshitnearme-cli" {
            nativeBuildInputs = [ pkgs.makeWrapper ];
            meta.mainProgram = "tsnm";
          } ''
            mkdir -p "$out/bin"
            makeWrapper ${pkgs.bash}/bin/bash "$out/bin/tsnm" \
              --add-flags ${./bin/tsnm} \
              --set TSNM_SOURCE_DIR ${application.cliSource}/lib/tallshitnearme \
              --set PRISMA_SCHEMA_ENGINE_BINARY ${application.prismaEngine}/bin/schema-engine \
              --prefix PATH : ${pkgs.lib.makeBinPath (with pkgs; [
                bash bun nodejs_22 openssl postgresql_17 jq curl coreutils sops age
              ])}
          '';
        });

      apps = forAllSystems (system: {
        default = {
          type = "app";
          program = "${self.packages.${system}.tallshitnearme}/bin/tallshitnearme";
          meta.description = "Run the Tallshitnearme HTTP server";
        };
      });

      devShells = forAllSystems (system:
        let pkgs = packagesFor system;
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              bun
              nodejs_22
              openssl
              postgresql_17
              sops
              age
              git
              jq
              curl
            ];
            NEXT_TELEMETRY_DISABLED = "1";
            PRISMA_HIDE_UPDATE_MESSAGE = "1";
            PRISMA_SCHEMA_ENGINE_BINARY = "${self.packages.${system}.tallshitnearme.prismaEngine}/bin/schema-engine";
            shellHook = ''
              export PATH="$PWD/bin:$PATH"
            '';
          };
        });
    };
}

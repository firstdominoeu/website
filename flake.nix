{
	inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
	inputs.flake-parts.url = "github:hercules-ci/flake-parts";
	inputs.bun2nix.url = "github:nix-community/bun2nix";
	inputs.bun2nix.inputs.nixpkgs.follows = "nixpkgs";

	outputs = inputs @ { flake-parts, bun2nix, ... }:
	flake-parts.lib.mkFlake {
		inherit inputs;
	} {
		systems = [
			"x86_64-linux"
			"x86_64-darwin"
			"aarch64-linux"
			"aarch64-darwin"
		];

		perSystem = { pkgs, config, system, ... }:
		let
			bun = bun2nix.packages.${system}.default;
		in {
			devShells.default = pkgs.mkShell {
				nativeBuildInputs = [
					pkgs.nushell
					pkgs.nixd
					pkgs.nixpkgs-fmt
					pkgs.bun
					pkgs.html-tidy
					pkgs.htmlhint
					pkgs.live-server

					config.packages.dev
				];
			};

			# work in progress : ql commands
			packages.dev = pkgs.writers.writeNuBin "dev" (builtins.readFile ./dev.nu);

			packages.default = bun.mkDerivation {
				pname = "main";
				version = "0.1.0";
				src = ./.;
				buildScript = "bun run build";

				bunCompileToBytecode = true;
				bunDeps = bun.fetchBunDeps {
					bunNix = ./bun.nix;
				};

				extraBunBuildFlags = [
					"--minify"
					"--sourcemap"
					"--target=bun"
					"--drop=console"
					"--drop=debugger"
					"--no-splitting"
					"--loader=.html:text"
					"--loader=.css:text"
					"--loader=.svg:base64"
					"--loader=.ico:base64"
				];

				module = "src/index.ts";
			};

			packages.docker_image = pkgs.dockerTools.streamLayeredImage {
				name = "main";
				tag = "latest";

				contents = [
					pkgs.cacert

					config.packages.default
				];

				config.Cmd = [
					"${config.packages.default}/bun/main"
				];
				config.ExposedPorts."8080/tcp" = {};
			};
		};
	};
}

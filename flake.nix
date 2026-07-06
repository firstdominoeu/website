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

		perSystem = { pkgs, system, ... }: 
		let
			bun = bun2nix.packages.${system}.default;
		in {
			packages.default = bun.mkDerivation {
				pname = "main";
				version = "0.1.0";
				src = ./.;
				buildScript = "bun run build";
				
				bunDeps = bun.fetchBunDeps {
					bunNix = ./bun.nix;
				};
			};
			
			devShells.default = pkgs.mkShell {
				nativeBuildInputs = [
					pkgs.nixd
					pkgs.nixpkgs-fmt
					pkgs.bun
					pkgs.html-tidy
					pkgs.htmlhint
				];
			};
		};
	};
}

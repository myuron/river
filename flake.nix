{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    treefmt-nix.url = "github:numtide/treefmt-nix";
    agent-skills = {
      url = "github:Kyure-A/agent-skills-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    anthropic-skills = {
      url = "github:anthropics/skills";
      flake = false;
    };
  };

  outputs =
    inputs@{
      self,
      nixpkgs,
      flake-parts,
      treefmt-nix,
      agent-skills,
      anthropic-skills,
    }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        treefmt-nix.flakeModule
      ];
      systems = [
        "x86_64-linux"
      ];
      perSystem =
        { pkgs, ... }:
        let
          agentLib = agent-skills.lib.agent-skills;
          sources = {
            anthropic = {
              path = anthropic-skills;
              subdir = "skills";
            };
            # Project-specific skills, tracked in ./skills (all enabled)
            local = {
              path = ./skills;
            };
          };
          catalog = agentLib.discoverCatalog sources;
          allowlist = agentLib.allowlistFor {
            inherit catalog sources;
            enableAll = [ "local" ];
            enable = [
              "skill-creator"
              "frontend-design"
            ];
          };
          selection = agentLib.selectSkills {
            inherit catalog allowlist sources;
            skills = { };
          };
          bundle = agentLib.mkBundle { inherit pkgs selection; };
          localTargets = {
            claude = agentLib.defaultLocalTargets.claude // {
              enable = true;
            };
          };
        in
        {
          treefmt = {
            projectRootFile = "flake.nix";
            programs = {
              nixfmt.enable = true;
              oxfmt.enable = true;
            };
            settings.global.excludes = [
              "pnpm-lock.yaml"
              "public/**"
            ];
          };
          devShells = {
            default = pkgs.mkShell {
              packages = with pkgs; [
                nodejs
                pnpm
                just
                oxfmt
                playwright-mcp
              ];
              # Use nixpkgs' browsers: Playwright's downloaded ones don't run on NixOS.
              # Keep @playwright/test pinned to the same version as playwright-driver.
              PLAYWRIGHT_BROWSERS_PATH = "${pkgs.playwright-driver.browsers}";
              PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
              PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = "1";
              shellHook = agentLib.mkShellHook {
                inherit pkgs bundle;
                targets = localTargets;
                quiet = true;
              };
            };
          };
        };
    };
}

## Development & Environment Setup

[![Nix-Powered](https://img.shields.io/badge/Nix-Flakes-blue?logo=nixos&logoColor=white)](https://zero-to-nix.com/start)

This repository uses `nix` to guarantee that everyone builds and runs the code with the exact same dependencies and tools. 

> **New to Nix?** You do **not** need NixOS. This works natively on macOS and any standard Linux distribution. For a full, beginner-friendly guide, check out **[Zero to Nix](https://zero-to-nix.com/start)**.

### One-Time Setup (If you don't have `nix`)

If you don't have `nix` installed, run the official Determinate Systems installer and restart your terminal:

```bash
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```

### Standard Commands

```bash
nix develop  # Drops you into a shell with all tools pre-installed
nix run      # Runs the main application immediately
nix build    # Builds the project locally
```

### IDE & Editor Integration

To ensure your IDE hooks into the correct tools and compilers, always let `nix` or `direnv` load the environment before opening your editor.

#### Using `nix develop`

```bash
nix develop
code .
```

#### Using `direnv` (Recommended)

Once allowed, `direnv` manages everything dynamically based on your current terminal directory.

```bash
# First time entering the repository, allow direnv to run:
direnv allow
code .
```

> **How does `direnv` work?** Whenever you navigate into this directory, your tools are automatically loaded. The moment you leave the directory, those tools instantly disappear from your shell, keeping your system completely clean.

### Cleaning Up

`nix` keeps old build dependencies isolated so they don't break other projects. If you want to safely clean up old versions and free up storage space across your system, run:

```bash
nix-collect-garbage -d
```







Website domain:

```text
firstdominoofficial.eu
```

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.


`nix shell github:nix-community/bun2nix -c bun2nix -o bun.nix`

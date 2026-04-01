# macOS System Optimizer

Electrobun desktop app for real-time macOS monitoring plus opt-in Mole-powered cleanup and optimization workflows.

## What the app does

The current app ships two major surfaces:

- **System dashboard**
  - CPU load with overall, user/system, and per-core activity
  - Memory usage with RAM, available memory, active memory, and swap usage
  - Disk capacity plus live read/write operations when available
  - Network interfaces and throughput when the collector has stable samples
  - Top running processes with PID, CPU, memory, user, and state
  - Collector health so partial metric failures stay visible instead of crashing the UI
- **Mole workflows**
  - Detects whether the `mo` CLI is available on `PATH`
  - Shows Mole status/health summary when `mo status --json` succeeds
  - Exposes four workflows: `clean`, `optimize`, `installer`, and `purge`
  - Lets you run **preview** (`--dry-run`) and **apply** variants, with command output shown in-app

## Prerequisites

### 1. macOS + Bun

This repository is a macOS desktop app. Install Bun first, then use Bun to install all project dependencies.

The project already depends on `electrobun`, so you do **not** need a separate global Electrobun install. The Bun scripts in `package.json` use the local project dependency.

### 2. Optional: Homebrew + Mole

The monitoring dashboard works without Mole, but the optimization panel depends on the `mo` CLI.

Install Mole with Homebrew:

```bash
brew install mole
```

If you install Mole after the app is already running, restart the app so the Electrobun/Bun main process can resolve `mo` on `PATH`.

## Setup

```bash
bun install
```

Optional quick check if you installed Mole:

```bash
mo --help
```

## Development workflow

### Recommended: HMR development

```bash
bun run dev:hmr
```

This starts the Vite dev server and the Electrobun app together. Use this when you want fast renderer iteration.

### Bundled development mode

```bash
bun run dev
```

This launches Electrobun with the bundled renderer output instead of Vite HMR. It is useful when you want to exercise the packaged renderer path during development.

Important: `bun run dev` does **not** hot-reload renderer edits by itself. If you change renderer code while using this mode, rebuild before expecting those changes to show up:

```bash
bun run build
```

### One-shot local start

```bash
bun run start
```

This builds the renderer and launches Electrobun once.

## Build

### Standard build

```bash
bun run build
```

This runs `vite build` for the renderer and then `electrobun build` for the desktop app.

### Canary build

```bash
bun run build:canary
```

Build outputs are written under the repository's generated `dist/` and `build/` directories.

## Using the app

### Monitoring dashboard

- Live updates are enabled by default.
- The refresh cadence can be changed in the UI.
- Live updates can be paused/resumed.
- The process table limit can be adjusted in the UI.
- If a specific collector fails, that panel shows an error state instead of taking down the whole dashboard.

### Mole workflows

The Mole panel supports these workflow families:

| Workflow | Preview command | Apply command | Notes |
| --- | --- | --- | --- |
| Clean caches and logs | `mo clean --dry-run` | `mo clean` | Can remove caches, logs, and temporary files |
| Optimize system health | `mo optimize --dry-run` | `mo optimize` | Applies Mole's optimization/maintenance routines |
| Remove installer files | `mo installer --dry-run` | `mo installer` | Targets leftover `.dmg`, `.pkg`, and `.zip` files |
| Purge old build artifacts | `mo purge --dry-run` | `mo purge` | Targets old development artifacts in Mole-configured paths |

The app shows the latest command result, exit status, duration, and combined stdout/stderr output. It also keeps a short recent history in the UI.

## Behavior when Mole is unavailable

If `mo` is not installed or not on `PATH`:

- the monitoring dashboard still works
- the Mole panel shows that Mole was not detected
- the UI displays the install hint and `brew install mole`
- Mole workflow buttons stay disabled
- the app does not crash just because Mole is unavailable

## Mole dependency and cleanup safety model

The app does **not** implement its own cleanup engine. It shells out to the locally installed `mo` CLI and reports the result back into the UI.

Safety behavior currently implemented:

- preview/dry-run actions are available for every exposed workflow
- the UI labels these workflows as **Preview first**
- apply actions require an explicit confirmation prompt before the command is launched
- command failures and timeouts are surfaced as results instead of crashing the app
- the app shows raw combined command output so you can review what Mole reported

## Limitations and safety notes

- This app exposes only a focused subset of Mole workflows: `clean`, `optimize`, `installer`, and `purge`.
- The app does **not** replace the full Mole terminal UI.
- The app does **not** run cleanup automatically in the background.
- Confirmation is a guardrail, not a sandbox. Running an apply action still runs the real Mole command on your machine.
- There is no in-app undo/rollback flow for Mole operations.
- Preview output is only as informative as the underlying Mole command. Review the command output before applying any destructive action.
- `clean`, `installer`, and `purge` can remove files from your system or configured development paths. Make sure you understand what Mole is targeting before confirming.
- The network panel may show interface identity before throughput stabilizes; byte-per-second values can require an extra sample to become useful.
- This repository covers local development/build usage only. It does not document notarization, signing, or distribution packaging.

## Verification

Smallest relevant verification for this repo:

```bash
bun run build
```

If you are also validating the Mole dependency on your machine, these are useful manual checks:

```bash
mo --help
mo status --json
mo optimize --dry-run
```

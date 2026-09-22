# Onboarding a repository (why each decision matters)

One product path for fleet policy + host plumbing — whether the operator uses
the **captain CLI** (preferred when guiding in-session) or the **dashboard**.
Do not invent a third path that only hand-edits `pool.config.json`.

This is the **why**. The step-by-step conversation — what to probe, what to ask
the user, and how to verify — is [standing-up.md](standing-up.md).

## Onboard a new repo

### Dashboard

Keep a dashboard user in the dashboard. Start from **Setup → Repositories →
Add repo** or Account **Add repo**, with the intended pool selected.

1. Paste the repo URL, or choose a discovered repo after connecting its forge.
2. Review its target branch and detected checks. Keep recommended workspace
   settings unless the repo needs a different isolation model.
3. Connect missing providers required by the repo policy. Reuse an existing connection
   after verifying its identity and pool readiness.
4. Save, complete binding, and read back the repo in **Repositories**. If the
   host is disconnected or needs a redeploy, resolve that before claiming the
   repo is ready.
5. Follow one small task through checks and its expected output. Saving a repo
   does not prove the checkout, agent login, or PR path works.

**Add repo** opens only the repo steps (`add-repo` → `repo-bind`) and exits
after binding. It does not restart completed fleet setup or take the user
through unrelated settings. Use sidebar **Setup** / Admin **Open Setup** when
they actually want the full setup flow. Existing repos can be edited in
**Setup → Repositories**.

### Captain CLI (preferred when guiding / same outcomes)

Commands below assume the bash aliases from [SKILL.md](SKILL.md) (`$WQ`).

**Repo add / update** (this document’s focus):

```bash
$WQ repo onboard <url>                         # inspect; clone on demand
$WQ repo onboard <repoKey> --path <checkout> --apply
$WQ repo show <repoKey>                        # read back saved + observed policy
```

Inspect the proposal before applying. Explain its target branch, required
checks, and missing connections in a short summary. Resolve missing commands
from actual scripts, CI, or repo docs; ask only when that evidence is absent.
Use `--gate-command <id>=<cmd>` for a confirmed command, `--setup-command <cmd>`
to replace inferred setup, and `--workspace-mode` only when the recommendation
does not fit. `$WQ repo update <repoKey> --path <checkout>` shows the change to
an existing repo before the same `--apply` path.

**A URL is enough.** With no local checkout, onboard clones into
`<cloneRoot>/<repoKey>/base` — deliberately the pool's warm-base path, so
provision adopts that clone (fetch) instead of leaving a second copy on disk. An
existing checkout there is reused, never clobbered; without a host
`repos.cloneRoot` it refuses and asks for `--clone-dir` / `--path` rather than
scattering a clone. `--no-clone` keeps the old refusal when you want it.
An occupied non-git destination is refused with its contents left unchanged;
inspect it or select another clone root. An empty directory can be used in
place. Onboarding does not delete a failed clone's leftover files on retry.
The seed URL must be an `https://` or `git@` remote — a filesystem path
(`/mnt/d/…`, a drive letter, `file://`) is refused. `--path` inspects (and
may donate a **Linux** skill path); it is not a substitute for cloning the
forge URL after host git/gh works.

**Workspace mode matches SETUP** (`worktree` / `existing_checkout` / `cow_clone`).
Dry-run prints the recommendation and the other two options (tree facts + CoW
probe). Inspect the recommendation yourself and keep isolated execution when
supported. Ask before leasing a person's active checkout or changing requested
concurrency; override with `--workspace-mode`. `--checkout-path` leases that directory
(`existing_checkout`); `--path` alone does not force that mode. Do **not**
hand-edit `pool.config.json` for mode — `--apply` persists via the host-seed
path.

**Full first-run** (connect a host → add a repo → prove the first task) uses
`$WQ setup …` — preferred captain path; same desired-config / progress /
credential documents as SETUP, not a second TUI. Checklist + gaps:
`$WQ setup path` and
[first-run.md § Captain-led setup](first-run.md#captain-led-setup-preferred).

This document is the **why** for repo add. The commands are the **how**. Do not
hand-edit `pool.config.json` and the server profile separately unless the
command cannot reach the host.

## Jump back / re-open onboarding

| Need                      | Where                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Full Setup again          | Sidebar **Setup**, Admin **Open Setup**, or bare `?onboarding=1` (`FULL_ONBOARDING_HREF`)                              |
| Add one more seed only    | Quiet Account **Add repo** / Setup → Repositories (+) (`?onboarding=1&step=add-repo&mode=repo`), or `$WQ repo onboard` |
| Deep-link full Setup step | `?onboarding=1&step=<id>` (e.g. `pair`, `add-repo`) — full rail; omit `mode` (or do not pass `mode=repo`)              |
| Deep-link repo-only add   | `?onboarding=1&step=add-repo&mode=repo` — Repo phase only; exit after `repo-bind`                                      |
| Re-pair the host          | Pool **pair** → mint code → `workq-pool init --base-url … --code … --yes` ([first-run.md](first-run.md))               |

Constants live in `apps/dashboard/src/lib/onboarding-entry.ts`
(`ADD_REPO_ONBOARDING_HREF`, `FULL_ONBOARDING_HREF`, `mode` query).

Completed progress stays `completed` until the operator deliberately re-enters
full Setup. Do not reset progress or desired configuration just to add another
repo.

## Filing work (one intake)

After a repo is onboarded, work enters the fleet through **one** intake path per
request:

| Path                          | When to use                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `$WQ create` (+ brief/deps)   | Captain / interactive session; default for day-to-day dispatch                   |
| GitHub Issues + `fleet` label | When GH Issues intake has auto-grab on — label an **unassigned** issue; leave it |

Do **not** label an issue `fleet` **and** `$WQ create` the same work — that
duplicates intake. Check the actual intake label; `fleet` is an example, not a
universal value. A `workq-pool/<exact-pool-name>` label pins an issue to a pool;
unknown or conflicting pins are skipped. Intake settings are server-wide:
do not change live capture configuration to test an isolated pool.

Turning capture on (or checking which repos it covers) is `$WQ setup intake
show|set|clear`. It read-modify-writes, so a partial `set` keeps the rest;
capture needs `--auto-grab on` plus a non-empty `--repo` list. Warnings mean
captures would park on `__unassigned__` — set `--capture-pool` / `--repo-pool`
before calling it live.

## Captain from a product checkout

**Onboarding a repo and installing captain are different steps.** `$WQ repo
onboard` (or dashboard **Add repo**) saves fleet policy for a repository — gates,
workspace mode, integrations. It does **not** put the captain client in that
checkout. After a repo is onboarded, you can file work about it without opening
that repo at all:

```bash
$WQ create --repo <owner/name> --title "…" --brief-file brief.md
```

Use captain **inside** a product checkout when Cursor's code context while you
write the brief is worth the setup — not because dispatch requires it.

### One install per machine (not per repo)

Install captain **once** on your harness, outside product repositories. Canonical
sources live under `apps/pool/skills/workq-captain/` in the workq monorepo;
`.cursor/skills/workq-captain/` in a checkout is a **generated mirror** (same for
`.agents/skills/`). Do **not** copy that tree — or `config.json` / `workq.secret.json`
— into each product repo you captain from:

| Anti-pattern                                          | Why it fails                                                                         |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Copy `workq-captain` into `<product>/.cursor/skills/` | Stale fork after every pool `full-upgrade`; you maintain N divergent copies          |
| Commit captain config or secrets in a product repo    | `workq.secret.json` is a **personal** API key; product checkouts are the wrong place |

Point your **user-level** captain install at a single built workq checkout (see
below). Open Cursor in whichever repo you are briefing — workq or a product tree —
and invoke the same `$WQ` from that session.

**In the workq monorepo**, the pool already mirrors captain at
`.cursor/skills/workq-captain/`; configure there only when you are captaining from
that checkout. Everywhere else, keep one install under your account harness (for
example `~/.cursor/skills/workq-captain` on macOS/Linux) and symlink or refresh
from `apps/pool/skills/workq-captain/` when you upgrade the fleet — still **one**
tree, not one per product repo.

First-time `config.json` / `workq.secret.json`: [first-run.md § Captain config](first-run.md#2-captain-config-interactive-identity). Field reference:
[reference.md § Configuration](reference.md#configuration).

### Built `workqRoot` is still required

Captain resolves the worker CLI at `<workqRoot>/packages/worker/dist/cli.js`
(and pool tooling under `apps/pool/dist/` when needed). That path comes from
`workqRoot` in captain `config.json`, or `WORKQ_ROOT` / `WORKQ_CLI` overrides.
If the monorepo on disk is missing or not built, `$WQ` refuses with setup hints
— typically `npm run build -w @workq/worker` from the workq checkout. A product
repo on the machine does not substitute for that; onboard only registers the repo
with the fleet.

### Config and secrets (precedence)

Captain loads settings from the **captain skill directory** (`skillDir`), not from
the product repo you have open:

| Layer                 | What wins                                                                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Environment           | `WORKQ_URL`, `WORKQ_TOKEN`, `WORKQ_CONSUMER_ID`, `WORKQ_DISPLAY_NAME`, `WORKQ_ORIGIN_LABEL`, `WORKQ_ROOT`, `WORKQ_CLI`, `WORKQ_POOL_CLI`, `WORKQ_STATE_FILE`, `WORKQ_POOL_HOME`, `WORKQ_SKILLS_DIR` — any set value overrides files |
| `config.json`         | Gitignored overrides beside the skill (`baseUrl`, `workqRoot`, `consumerId`, …)                                                                                                                                                     |
| `config.example.json` | Committed template when `config.json` is absent; treat fields as templates until you copy to `config.json` or set env                                                                                                               |
| `workq.secret.json`   | Personal API token when `WORKQ_TOKEN` is unset                                                                                                                                                                                      |

`WORKQ_SKILLS_DIR` is for pool-injected harness paths (workers, orchestrated
runs). Captains normally rely on the skill tree that contains the loader (user
install or the workq checkout mirror), not a per-repo `WORKQ_SKILLS_DIR` export.

### Windows / WSL2

Do not symlink captain, `workqRoot`, or config across the Windows ↔ WSL2 distro
boundary — paths and line endings diverge and bash invocations break. Keep captain
and its `workqRoot` on **one side** (typically Windows Cursor + captain config on
Windows, API/pool/workers in the distro). Full routing:
[windows-host.md](windows-host.md) and [Windows host path
(WSL2)](../../../../docs/suite/workq/devops/windows-wsl2.md).

## Failures this flow exists to prevent

| Failure                         | What went wrong                                           | How the flow refuses it                                                       |
| ------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Invented gate command           | A plausible `npm run …` that the repo does not have       | Commands only from observed scripts/CI; else **UNRESOLVED**                   |
| Host/server drift               | Policy only on the host overlay; dashboard shows defaults | `--apply` writes host plumbing **and** server profile together                |
| Empty capability map            | Analyst provision dead at first collect                   | Capability probe before apply succeeds                                        |
| Assumed self-merge              | `mergeRequiresNonAuthorApproval` guessed                  | Measured from branch protection / left for seed when unread                   |
| Silent Maven←TS bar             | Node default gates on a Maven reactor                     | Maven/Gradle without evidenced commands → unresolved, not inherited Node cmds |
| Second clone on disk            | Onboard cloned somewhere the pool then re-cloned          | URL-only clone lands on the pool warm-base path, or refuses                   |
| Warm base from a local path     | `origin` is a checkout path; fetch / reset dies           | Seed URL must be https:// or git@; `--path` inspects only                     |
| Unprotected because unreadable  | A 403 read as "no protection" → self-merge policy         | `unread` ≠ unprotected; unprotected needs classic **and** rulesets to answer  |
| Destructive redeploy mid-flight | Seed/selection change wiped worktrees                     | Flow **says** redeploy is required; it does **not** schedule one              |

## Propose, then apply

Dry-run is the default. The proposal shows:

### Remote captain (no local pool)

When the captain machine is **not** the pool host — set `"poolHome": false` in
captain `config.json`, or simply have no `pool.config.json` at the configured
`poolHome` — `$WQ repo onboard|update --apply` writes through the same host
APIs the dashboard uses:

1. desired-config seed (`orchestrator.seedRepos`)
2. server repo profile
3. host execution (`putHostSeedExecution` — workspace mode, checkout paths, setup commands)

The pool daemon must be connected. A disconnected host refuses with actionable
copy (bring the pool up, then retry) — the same 409 the dashboard surfaces on Save.

Co-located captains with a local `pool.config.json` keep the existing dual-write
path (host file + server APIs atomically on the captain host).

The proposal shows:

- Detected forge (from origin URL) and mismatch when unrecognized
- Where the checkout came from (cloned for this onboard, or reused)
- Default-branch **protection**: `branch_protection` / `rulesets` when read,
  or `unread` + the reason (see below)
- `workqRepoJson: ok|ignored|absent` — whether `.workq/repo.json` merged
  (`ok`), was present but rejected loudly (`ignored` + reason), or missing
- Which proposal leaves came from `repo_file` (when the file merged)
- `requiredGates` wanted from checks/tooling
- `gateCommands` only when evidenced
- **UNRESOLVED** gates that need `--gate-command` (or a real script/CI line)
- Gates **absent** because tooling was not observed (not invented)
- Workspace-mode recommendation + the other two SETUP options (with CoW probe
  reasons). Investigate the recommendation; override with `--workspace-mode`.
  Never hand-edit `pool.config.json` for mode.
- Integration ownership suggestions (exact skill dirs high; aliases low)
- The **capability map** those integrations produce (IssueTracker / CodeReview /
  Chat / Ci) — what the provisioning credential probe will assert

### Warm-base setup commands

Setup commands run in the warm base after clone/fetch — once per base, not once
per worktree — so a dependency install or a one-time build is paid for every
item that follows. The inspector proposes them from observed tooling (`npm ci`,
`npm run setup`, `./mvnw … dependency:resolve`) and proposes **nothing** when
tooling is not observable, the same rule as gate commands.

When the repo needs something the tree cannot evidence, say so:

```bash
$WQ repo onboard <repoKey> --path <checkout> --apply \
  --setup-command "pnpm install --frozen-lockfile" \
  --setup-command "pnpm build"
```

Repeatable and ordered. Passing any replaces inference for that run and beats a
`.workq/repo.json` `onboard.setupCommands` hint. A command that fails is logged
and does not block the base — do not put a gate in here.

`npm ci` is not enough when workers run a different Node than the pool daemon.
cursor-agent bundles its own `node` (often 24); distro/standup Node is often 22. Native addons (`better-sqlite3`) follow the Node that ran `npm ci`. The
pool prepends the agent binary during setup; captains prove it before smoke
with `ensure-host-native-addons.js` ([standing-up.md](standing-up.md) §A.4b).
Do not paper over the ABI with a `npm rebuild` line in `setupCommands` — that
rebuild still uses whichever `node` is first on PATH.

`linkNodeModules` is the sibling knob and the one worth thinking about. On, a
worktree symlinks the warm base's `node_modules` instead of installing its own:
for a Node monorepo whose setup command installs into the base, that turns a
multi-minute install per item into nothing. The cost is isolation — a branch
that changes dependencies sees the base's versions, and an install run inside
one worktree is visible from the others. It is off pool-wide by default; a
repo that pays for it (or a Maven/Gradle repo that must stay off) overrides it
per seed under SETUP → Add repo → Advanced.

### What the inspector reads

Nothing here is asked of a human, and nothing is invented from a sibling repo's
stack:

| Evidence                                                                                | Proposes                                                           |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.cursor/skills/<name>-integration/`                                                    | that integration, **repo**-owned                                   |
| remote URL forge                                                                        | the forge integration, **pool**-owned                              |
| `.github/workflows/*`, `.circleci/config.yml`, `Jenkinsfile`, `bitbucket-pipelines.yml` | matching CI integration (pool-owned) + the commands in those files |
| `package.json` scripts                                                                  | Node gate commands                                                 |
| `pom.xml` / `build.gradle` (+ wrappers)                                                 | unit + build **wanted**; commands only from CI                     |
| `playwright.config.*` / `cypress.config.*` + e2e script                                 | flow-capture harness, `e2eStrategy`                                |

A dedicated CI service (CircleCI, Jenkins) outranks forge-native CI for `Ci`,
and `Ci` is only claimed when CI config exists — a GitHub remote with no workflow
file does not get one. Actions and Bitbucket Pipelines are read through their
forge API, so they name the **forge** integration rather than a CI-only id.

### Branch protection: read, unprotected, or unread

Three distinct outcomes, and only the first two are evidence:

| Outcome                                      | How it is reached                                                                | Effect                                                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| protected (`branch_protection` / `rulesets`) | a classic rule, or a ruleset, came back with rules                               | `requirePullRequest=true` + required checks mapped                                                   |
| unprotected                                  | classic said 404 **and** rulesets answered with an empty list                    | keep `requirePullRequest=true` (GitHub not enforcing is not evidence the team accepts direct pushes) |
| **`unread`**                                 | no `gh`, no auth, 403 (e.g. private repo without the plan), or any other failure | conservative `requirePullRequest=true`, low confidence                                               |

Both halves are required for the _fact_ of "unprotected" because rulesets
protect branches the classic 404 does not know about. That fact still does
not flip `requirePullRequest` off. `--no-protection` skips the read entirely.
`mergeRequiresNonAuthorApproval` is measured from the same read, or left to the
seed when unread — never guessed.

`--apply` refuses while any gate command is unresolved, when forge is
unrecognized (set `forge` / `forgeMismatchAcknowledged` on the seed first), or
when the capability map would fail the provisioning credential assert.

## Authoring `.workq/repo.json` (captains)

Repo authors (or captains preparing a customer checkout) commit fleet policy the
**repo** owns — build/test bar, default base branch, review lenses — so onboard
does not re-type it into the server profile every time.

| Do                                                                                                                                               | Do not                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Copy `.workq/repo.json.example` → `.workq/repo.json` and edit, or `$WQ repo json <key> --write` after the profile pins the bar you want portable | Put secrets, tokens, or credential names in the file. Generate does not copy this fleet's resolved defaults — omitted gates stay omitted |
| Keep sections under `quality` / `testing` / `review` / `load` / `integrations` / `onboard`                                                       | Set top-level `execution`, `cloneRoot`, `setupCommands`, `checkoutPath`, or other host plumbing                                          |
| Put purpose / pathHints / setupCommands under `onboard`                                                                                          | Expect auth to be in the file — captain still prompts                                                                                    |
| Validate with the schema (`RepoOwnedPolicy` in `@workq/protocol`)                                                                                | Invent a second path like `.work/config.json`                                                                                            |
| Commit on the default branch the warm base tracks                                                                                                | Expect a worktree edit alone to change provision (warm base is SoT)                                                                      |

**Precedence (unchanged):** server profile and host overlay always beat
`repo_file`. A valid file is the lowest non-default layer; dry-run attributes
those leaves to `repo_file`. Malformed JSON, unknown keys, or forbidden
plumbing keys → file **ignored** with a loud reason (fail-open; never partial
apply). Full contract: `docs/suite/workq/engineering/repo-config.md`.

Captain + dashboard propose share the same parser (`parseRepoOwnedText`). After
the file lands in the target repo, `$WQ repo onboard|update --path …` dry-run
should show `workqRepoJson: ok` and list `repo_file` leaves — not
`ignored — no parser provided`.

### Optional commit offer (when the file is missing)

After a successful `--apply`, when `workqRepoJson` is `absent` or `ignored`,
stdout prints an opt-in recipe to file fleet work that commits a sanitized
`RepoOwnedPolicy` JSON (same projection as `sanitizeRepoOwnedFromProposal` —
never secrets / `execution` / `cloneRoot` / `setupCommands`). Pass
`--file-repo-json` with `--apply` to create the item; without the flag the
recipe is printed only. When the file is already `ok`, the offer is omitted
(overwrite is out of scope). SETUP operators see the same Raise on the
invent-policy banner in add-repo.

## Both layers, one operation

| Layer              | What                                                                       | Where                                      |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------ |
| Host plumbing      | `execution`, `checkoutPath`, `setupCommands`, secrets refs, seed URL/forge | `pool.config.json` on the pool host        |
| Server policy      | `quality` / `testing` / `integrations` / … (no `execution`)                | Server repo profile via API                |
| Desired seed hints | forge, `mergeRequiresNonAuthorApproval`                                    | Desired-config `repos` area when available |

A mid-flight server failure restores the previous host file. After apply, run
`$POOL doctor` on the host and check required credential readiness before
starting the first task ([standing-up.md §B.5](standing-up.md#b5-verify)). Fix
findings the repo will hit; proceed with a known blocker only if requested.

Describe the actual stage: **saved** means configuration persisted; **ready**
means the host and needed connections passed their checks; **first task
delivered** means its checks and output are visible. Use one useful authorized
task to prove checkout, branch convention, gates, and PR creation. Required
human review is a handoff, not a reason to bypass approval or call landing
verified. A separate smoke is useful only when it tests an otherwise unproven
path. Exporting `.workq/repo.json` and enabling intake can wait until later.

## Update

`$WQ repo update <repoKey>` re-inspects and prints a diff. Dry-run changes
nothing. Apply records the same dual write with attribution on the server
profile.

## Related

- Captain from a product checkout (this page, § above)
- Stand-up runbook (probe → ask → verify): [standing-up.md](standing-up.md)
- First-run pairing + wizard: [first-run.md](first-run.md)
- Contract layer design: `docs/suite/workq/engineering/onboarding.md`
- Per-repo policy model: `docs/suite/workq/engineering/repo-config.md`
- Suite captain index: `docs/suite/workq/user/captain.md`

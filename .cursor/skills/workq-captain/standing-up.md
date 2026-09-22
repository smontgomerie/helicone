# Standing up a fleet, and onboarding a repo into it

Open this when someone says **"let's get a pool stood up"** or **"set up this
repo: `<url>`"** and expects you to just do it. This is the conversation script:
what to detect, what to ask, what to run, and how to prove each step landed.

Three companions, and they do not overlap with this one:

| Document                                     | What it is                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| [first-run.md](first-run.md)                 | Chain detail + the POSIX troubleshooting table. Go there when a probe fails.         |
| [windows-host.md](windows-host.md)           | Native Windows → WSL2 only. macOS/Linux captains do not open this.                   |
| [onboarding-a-repo.md](onboarding-a-repo.md) | **Why** repo onboard decides what it decides, and the dashboard surfaces.            |
| This file                                    | POSIX order. win32 captains read windows-host.md for invocators, then continue here. |

```bash
WQ="node $SKILLS/workq-captain/scripts/workq.js"
POOL="npx workq-pool"
```

If the [SKILL.md](SKILL.md) host probe said `win32`, read
[windows-host.md](windows-host.md) first (bootstrap + PowerShell invocators),
then **continue this file**. Captain CLI is `node …/workq.js` on Windows with
`poolHome: false`; API / pool / workers are `wsl -d <distro> -- bash -lc '…'`.
If the probe said WSL, you are already in the distro — invocators are plain
bash. darwin / native linux: stay in this file; do not open windows-host.md.

## Get one repository working

There are two supported setup tracks. **Captain-led is the default** when the
person asks you to set up Workq: own the whole sequence from starting the API
and dashboard, through pool pairing and repo integrations, to a completed
repository smoke task. The person supplies the repo and goal and handles only
unavailable access, personal authentication, or unresolved decisions. Do not
turn this into instructions to work through the dashboard's Setup screens.

**Manual UI setup** is the other track: the person chooses and saves settings
in the dashboard. Use it when they explicitly choose to configure things by
hand. A browser login or secure credential entry during captain-led setup is
a single handoff, not a reason to switch tracks. If asked to continue setup
started in the UI, read back the same saved configuration and finish its gaps.
Both tracks converge on the same pool, repo policy, and evidence.

**Detect, reuse, apply, prove.** A setup request authorizes the routine,
reversible changes needed to set it up. Inspect first, explain the small set
of relevant changes, and continue without another approval for each field.
Ask only for missing identity, an ambiguous destination, user-controlled
authentication, or a policy decision that cannot be established from evidence.
Read back every write before relying on it.

Keep first-run focused: one host, one repo, its required connections, and one
useful task. Reuse a working harness and existing capacity. On a new host,
start with two workers, an orchestrator, and optional analyst/librarian roles
off unless the user requested otherwise. Do not make the user choose those
internal roles, workspace modes, or every available integration up front.

Keep the chosen surface: run commands yourself when managing setup in this
session; use the dashboard when the user is working there. For their own login
or secret entry, provide the exact screen or a complete command they can run
in a fresh terminal, with paths and pool filled in. Never hand them `$WQ`
without defining it, ask them to paste secrets into chat, or send them back
through a step that already passed.

Before writes, identify the server and pool. For an isolated trial, use its
separate configuration and credentials throughout. Working live repos are
read-only examples unless the user explicitly included them in the changes.
Do not enable intake, notifications, unattended landing, or change another
pool as a side effect of setup.

---

## Route the request first

| They said                                  | Go to                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| "set up workq", nothing exists yet         | [A. Stand up a fleet](#a-stand-up-a-fleet), starting at §A.-1                              |
| "stand up a pool", nothing exists yet      | [A. Stand up a fleet](#a-stand-up-a-fleet)                                                 |
| "set up this repo: `<url \| path>`"        | [B. Onboard a repo](#b-onboard-a-repo) (run §A.0 probe first)                              |
| "wire up Jira / Slack / CircleCI"          | [C. Integrations and credentials](#c-integrations-and-credentials)                         |
| "make the fleet pick up our GitHub issues" | [D. Ticket intake](#d-ticket-intake)                                                       |
| "set our quality / review / landing bar"   | [E. Prepare the repo for success](#e-prepare-the-repo-for-success)                         |
| "how should I use this fleet?"             | [F. Teach the operating model](#f-teach-the-operating-model)                               |
| "nothing is running" / a probe disagrees   | [first-run.md](first-run.md) (POSIX) or [windows-host.md](windows-host.md) (`win32` / WSL) |

A repo request against a fleet that does not exist is still §A first — onboard
writes to a pool, and there has to be one.

---

## A. Stand up a fleet

### A.-1 Start the API + dashboard (when `/health` is unreachable)

Find the workq monorepo before giving commands; do not assume the captain's
current checkout is it. Ask for the install location only when probing cannot
find one. Then run from that root:

```bash
test -f .env || cp .env.example .env
npm install
npm run build
npm run dev
curl -fsS http://127.0.0.1:9876/health
```

**Offer a clickable dashboard link in chat** — do not only say "open the
dashboard." For local Vite:

[Dashboard](http://127.0.0.1:5173/dashboard/)

Paste that markdown so they can jump in and confirm it renders. For a remote
deployment, use its configured dashboard URL instead of starting a second local
server.

Do not claim the stack is ready from a successful build. Require `/health`, a
rendering dashboard, and then `$WQ whoami`. Identity comes next because
`WORKQ_ROOT_USER_EMAIL` is read at server boot; when bootstrap changes it,
restart once and re-run the probes.

### A.0 Probe (always, before any question)

```bash
$WQ whoami                                     # identity + bound/reachable pools
$WQ setup path                                 # the headless checklist, with gaps
$WQ setup progress show --pool <id>            # where the SETUP cursor actually is
$WQ fleet --digest                             # capacity, queue, unhealthy pools
node $SKILLS/workq-captain/scripts/pools.js    # is a pool alive on THIS machine
$WQ setup credential list                      # what is already configured
$WQ repo list                                  # seeds already onboarded
```

Say the answer out loud in one or two sentences before you change anything:
which server, which account, whether a pool is paired, and which of the steps
below are already done. Then skip every step that already passes — re-running
pairing on a working fleet is how you take a working fleet down.

If `whoami` names a **shared service token**, stop and say so: everything you
file will be attributed to nobody in particular.

### A.0.5 Seed their identity (when `whoami` fails)

First distinguish an unreachable server, a rejected existing key, and an
unconfigured captain. Restore the configured connection when it exists; a
failed request is not permission to replace the root identity or create a new
pool. On a confirmed fresh local installation, ask only for their email and
handle the mechanical setup. Existing OAuth deployments keep their sign-in
flow and root identity.

```bash
node $SKILLS/workq-captain/scripts/bootstrap.js --email <them@company.com> \
  [--name "<Their Name>"] [--pool <name>]
```

One command covers: `WORKQ_ROOT_USER_EMAIL` written into `.env` (they become
the always-admin root, seeded on boot), dev-login, **creating the pool record**
— API-key minting is pool-bound and will not create it, so a fresh server
refuses to mint until one exists — minting _their own_ personal key, and
writing captain `config.json` + `workq.secret.json`.

Three things it will tell you rather than guess:

| It says                           | You do                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| no server at `<url>`              | Start the intended local server when in scope; for remote servers, report the connection failure |
| root email changed — restart      | The server reads it at boot; restart before pairing                                              |
| dev login disabled (Google OAuth) | Only then is a browser needed: they sign in, mint a key, you pass `--token`                      |

The key is **theirs**, not a service token — that is the whole point. Never
substitute `WORKQ_DEV_SEED_API_KEY`: it is bound to the seed pool and
attributes everything they file to the pool instead of to them. Omit `--pool`
on a fresh local server — bootstrap skips the seeded `dev` pool and creates one
from the hostname. Pass `--pool` only when several real pools already exist.

### A.1 Ask only for gaps

The minimum input is the first repo URL or local checkout, the intended host
when there is more than one, and their email if this is a fresh installation.
Do not ask again for information already in the request or working config.
Inspect the repo next; its scripts, documentation, policy, and CI settle most
remaining choices. Ask one compact batch for unresolved decisions after that
inspection, not a questionnaire about hypothetical future usage.

### A.2 Pair the host

Pairing is the only way a pool gets a token. Never paste a captain key into
`pool.config.json`.

```bash
$WQ setup pair --pool <id>                     # prints the ready init command
# → hand the printed `workq-pool init --base-url … --code …` to the host operator
$WQ setup pair-status <code-prefix> --pool <id>   # poll until the host appears
```

On the host (theirs to run, or yours if it is this machine):

```bash
$POOL init --base-url <server> --code <code> --host-name <bound-pool-from-whoami> [--clone-root <path>]
$POOL doctor --preflight-only        # fix every preflight ✗; Upgrade fingerprint ✗ is expected before first start
```

If the minted code starts with `-`, remint or pass `--code=<code>` — the CLI
otherwise treats it as a new flag.

Do **not** `$POOL start` yet — set librarian / analyst / harness in §A.3 first.
`init` defaults `childWorkers` to **5** (capped at half the host cores).
Apply the first-run sizing from §A.3 before starting; preserve the existing
size when this is an already-working host.

Verify pairing: `$WQ setup pair-status <prefix> --pool <id>` until redeemed.

### A.2b Remote captain (laptop manages a remote pool)

When the captain is **not** co-located with the pool host, skip local pool
install. Pair and size through `$WQ setup` (`pair`, `roles-sizing`, credentials)
the same way the dashboard does. In captain `config.json`, set `"poolHome": false`
so the CLI does not look for a local `pool.config.json`.

Repo onboard/update `--apply` then writes desired-config, the server profile, and
host execution over the API (`putHostSeedExecution`). The remote pool daemon must
be running — a disconnected host refuses with the same remediation the dashboard
shows on Save.

### A.3 Capacity, roles, harness

```bash
$WQ setup roles-sizing --workers 2 --librarian off --analyst off
$WQ setup desired show --pool <id>       # confirm it landed in desired-config
# Host file still has init's default (5, or half-cores if that is smaller) until:
$POOL scale --workers 2                  # after first start if shrink refused (ghost roster)
$POOL start
$WQ fleet --digest
```

`workq-pool scale` alone only edits the host file. Use `roles-sizing` so the
server, the dashboard, and the host agree. Then `start`. A registration
without a live supervisor looks staffed and claims nothing — `pools.js` is
for that (skip it when `"poolHome": false`; the daemon is in WSL).

### A.4 Connect GitHub once

Save the GitHub connection and sync it to the pool before adding private repos.
Pool-owned repositories use their selected connection for API requests, Git
clone/fetch/push, and `gh` pull-request commands. Workers receive the token in
their process environment; it is not written into repository Git config.
Use repository Integrations → Test connection to check read, push, and merge
permissions. Reviews and branch checks still apply to individual PRs.
Host `gh auth login` / SSH remains a fallback when no saved token is selected.
A missing named connection must be repaired instead of borrowing another account.
See [§C](#c-integrations-and-credentials) for sync and connection selection.

### A.4b Worker Node ABI (native addons)

Standup / doctor want **distro** Node 22+ to run the pool and API. Workers
running `cursor-cli` inherit **cursor-agent's bundled Node** (often 24). Those
are different `NODE_MODULE_VERSION`s. Warm-base `setupCommands` (`npm ci`) must
compile native addons (`better-sqlite3`) for the **worker** Node. The pool
prepends that binary onto PATH during setup **when it can resolve
cursor-agent's bundled `node`** (`cursor-agent` on the daemon PATH, or
`WORKQ_WORKER_NODE`). On a `cursor-cli` worker fleet, failing to resolve it
refuses setup rather than compiling for distro Node. A `codex-cli` /
`claude-code` worker fleet runs `npm` under distro Node, so it installs
normally and needs no prepend. Do not add `npm rebuild` to `setupCommands` as
a substitute.

After fleet `cursor-agent login` and a warm base with `node_modules`, prove
before the first smoke:

```bash
node $SKILLS/workq-captain/scripts/ensure-host-native-addons.js --apply
# win32 captain:
# node .cursor/skills/workq-captain/scripts/ensure-host-native-addons.js --apply
```

`--apply` rebuilds addons in `<cloneRoot>/<repoKey>/base` (default `workq`)
with the agent Node first, then `require('better-sqlite3')`. Do not rebuild a
live worktree while Verify is running.

### A.5 First repo — see [§B](#b-onboard-a-repo)

### A.6 Finish with one useful task

```bash
$WQ watch --once --attention
$WQ setup progress complete evidence --pool <id>  # after the proof below
$WQ setup progress show --pool <id>   # cursor should be at done
```

Use [B.5](#b5-verify) to follow the first small, authorized task through checkout,
verification, and the expected output. Do not require a separate throwaway
smoke when that task proves the same path. `$WQ setup smoke --apply` is an
optional diagnostic for create → claim → visibility; it does not prove a repo
can produce a PR, and cancelling it after claim is not delivery.

Report the repo, task link, evidence, and next action. If review is required,
say "first PR ready for your review" and leave that decision to the reviewer.
Only report landing as verified after observing the merge. A completed Setup
cursor records progress; it does not substitute for any of these observations.

For a setup smoke without a requested code change, use an existing focused
repository test: a real worker must prepare its checkout, install the needed
dependencies, run the check, and attach its result. Follow it until finished;
do not substitute the create/claim diagnostic. Keep tracked files unchanged.
Report that this proves preparation and execution, not PR publishing or merge.
Include the working dashboard URL, API health, account and pool, host readiness,
repo/provider access-check coverage, and the task's command evidence in the
final handoff. Do not mark an unresolved required integration as ready.

---

## B. Onboard a repo

The whole point: **you should be able to take a bare URL and finish.** Do not
ask a human for anything the checkout can tell you.

### B.1 Inspect (dry-run is the default)

```bash
$WQ repo onboard <url | path | repoKey>            # dry-run proposal
$WQ repo onboard <url> --clone-dir <root>          # override the clone root
$WQ repo onboard <url> --no-clone                  # refuse to clone; make me pass --path
$WQ repo update  <repoKey> --path <checkout>       # re-inspect + diff vs current
```

A git URL with no local checkout is **cloned for you**, into
`<cloneRoot>/<repoKey>/base` — the same path the pool's warm base uses, so
provision later fetches it instead of cloning a second copy. An existing
checkout there is reused, never clobbered. Without a host `pool.config.json` to
name `repos.cloneRoot`, it refuses and asks for `--clone-dir` or `--path`
rather than dropping a clone somewhere arbitrary.

Private GitHub repos use the selected saved connection after it syncs to the
host. Host Git authentication is the fallback for repositories without a saved
GitHub token or with repository-owned authentication. Check the connection in
the repository’s Integrations tab when a clone or push is denied.

`--path` supplies inspection (and Linux skill-donor paths). A Windows or
`/mnt/<drive>` `--path` is **not** persisted as `checkoutPaths` and must not
be `git clone`d into `cloneRoot`. Pass the https:// URL so provision fetches
the forge remote.

### B.2 Summarize the decisions that matter

Read the full proposal yourself. Tell the user the repo and target branch,
the checks workers will run, required connections still missing, and the next
action. Do not narrate every implementation field. Use this table to inspect
the evidence; investigate `unread` or `UNRESOLVED` findings before asking the
user for what the checkout, CI, or existing configuration can answer:

| Line                    | What it means                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `repository … @ branch` | Default branch, taken from the checkout                                                             |
| `forge`                 | Identified from the remote URL. Unrecognized blocks `--apply` until the seed declares one           |
| `checkout`              | Cloned or reused, and where                                                                         |
| `workspace`             | Recommended mode (`worktree` / `existing_checkout` / `cow_clone`) + reason                          |
| `workspace options`     | Alternatives to the recommendation; expose only when isolation or capacity requires a user decision |
| `protection`            | `branch_protection` / `rulesets` = read; **`unread`** = the credential could not see it             |
| `integrations`          | Owner per integration, with the evidence that proposed it (see B.3)                                 |
| `capabilities`          | The analyst capability map (IssueTracker / CodeReview / Chat / Ci)                                  |
| `workqRepoJson`         | `ok` merged, `ignored` + loud reason, or `absent`                                                   |
| `requiredGates`         | Gates wanted from required checks and observed tooling                                              |
| gate commands           | Only ever from a real script / CI line. Missing ones are **UNRESOLVED**                             |
| `(absent)` gates        | Tooling was not observed, so the gate was omitted rather than invented                              |

**Choose isolation from evidence.** Dry-run recommends from tree facts + the
host CoW probe (never “Mac ⇒ CoW”). Maven/large trees on a CoW-capable volume
prefer `cow_clone` over `existing_checkout`. When the recommendation is not
obvious, prefer an isolated worktree when the repo supports it. Ask before
leasing a human's active checkout or changing requested concurrency, and pass
`--workspace-mode worktree|existing_checkout|cow_clone`. `--checkout-path`
means “lease this checkout” (`existing_checkout`); `--path` inspects and can
supply checkoutPaths / skill donors without forcing that mode. **Never
hand-edit `pool.config.json` for workspace mode** — `--apply` is the write
(same host-seed persist path as SETUP).

**`protection: unread` is not "unprotected".** It means a 403, no `gh`, or no
auth. **A successful read of "unprotected" also does not lower the bar** —
GitHub not enforcing PRs is not evidence the team accepts direct pushes.
Keep `requirePullRequest=true` and preserve the existing approval policy.
Resolve unread protection with the correct forge access or repository policy.
Ask about non-author approval only when evidence cannot settle it. Do not
offer direct pushes or weaker checks as an onboarding shortcut.

### B.3 What auto-detect covers (so you know what is left to ask)

| Evidence in the repo                                                                    | What it proposes                                                                                                                                                                 |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.cursor/skills/<name>-integration/`                                                    | That integration, **repo**-owned (the repo ships the skill)                                                                                                                      |
| Remote URL forge (github / bitbucket)                                                   | The forge integration, **pool**-owned                                                                                                                                            |
| `.github/workflows/*`, `.circleci/config.yml`, `Jenkinsfile`, `bitbucket-pipelines.yml` | The matching CI integration, pool-owned, plus **root-runnable** commands in those files. A block that `cd`s is dropped (UNRESOLVED), not extracted without its working directory |
| `package.json` scripts                                                                  | typecheck / lint / unit / build / e2e / postgres commands                                                                                                                        |
| `pom.xml` + `mvnw`, `build.gradle` + `gradlew`                                          | unit + build gates — **commands only from CI**, never guessed                                                                                                                    |
| `playwright.config.*` / `cypress.config.*` + an e2e script                              | flow-capture harness and `e2eStrategy`                                                                                                                                           |
| `AGENTS.md`, `.cursor/rules/*`                                                          | Observations recorded on the proposal                                                                                                                                            |
| `.workq/repo.json`                                                                      | Repo-owned policy + `onboard` briefing (purpose, setupCommands, capabilities). Generate from a live fleet with `$WQ repo json <key> --write`                                     |

A dedicated CI service outranks forge-native CI for the `Ci` capability, and
`Ci` is only claimed when the repo actually carries CI config — a GitHub remote
with no workflow file does not get one.

### B.4 Resolve what it could not

```bash
$WQ repo onboard <repoKey> --path <checkout> --apply \
  --gate-command unit='./gradlew test' \
  --gate-command build='./gradlew assemble'
```

Only pass `--gate-command` for a real repo-root command established from CI,
scripts, documentation, or the user's answer. Inspect the actual CI working
directory when extraction could not express it; do not ask a user to look up
code you can read. `--apply` refuses while any gate is unresolved. Never invent
a plausible command or remove a required gate to get past that refusal.

`--apply` writes the desired-config seed (`orchestrator.seedRepos`), the server
profile, and host plumbing together, then prints whether `workq-pool redeploy`
is required (it never schedules one mid-flight). A failed seed write must not
leave a profile the fleet cannot check out.

The inspector may leave a placeholder purpose. Draft a short orientation from
the README and tree: what the repo does and where the first task belongs.
Keep existing seed briefing and `.workq/repo.json` guidance. Use the repo editor
or supported seed update path to save missing orientation, reading back the
whole seed and preserving other repos. Ask only about ambiguous product terms
you could not establish; do not require the user to author `layoutSummary`,
`pathHints`, or `keywords` before a worker can begin.

### B.5 Verify

```bash
$WQ repo show <repoKey>          # stored profile + resolved layers + provenance
$WQ repo list
$POOL doctor                     # on the pool host — after apply, not only at first start
```

Apply does not re-run preflight. Doctor after adding repos is how you catch
keys that were never entered, or that vanished on an upgrade. Jenkins and
CircleCI **warn** (`!`) when tokens are missing — the pool still starts; Fix CI
and a smoke that hits those APIs still die mid-task. Bitbucket **fails** (`✗`)
when the pool owns it. Those two probes are presence, not a live token check;
`$WQ setup credential verify --name jenkins|bitbucket` is the live probe when
the bag looks filled (§C).

**Take findings seriously.** Do not file the smoke recipe while doctor still
names a problem this repo will hit — any `✗`, or a `!` on Jenkins / CircleCI /
Bitbucket / Jira the proposal wired. Say what is missing in their language,
collect + verify (§C), then doctor again.

On a Node repo, also prove native addons under the **worker** Node before
smoke ([§A.4b](#a4b-worker-node-abi-native-addons)):

```bash
node $SKILLS/workq-captain/scripts/ensure-host-native-addons.js --apply
```

A green doctor on distro Node 22 does not prove `better-sqlite3` loads in
cursor-agent Node 24.

Only file smoke with doctor still dirty if they **ask to proceed anyway**. Tell
them what will likely fail (PR open, Fix CI console). Default is wait.

Use the printed smoke recipe to shape the first task's verification. Prefer
the small real task already requested; otherwise prepare a concrete candidate
and obtain the missing task authorization before filing. Follow it until its
checks and expected output are visible. A PR waiting for required human review
is a successful handoff, not evidence that landing already works. Never merge,
publish, or enable auto-landing merely to finish the onboarding checklist.

Later, when this fleet's **stored** profile is the one you want the next machine to
confirm, write it into the repo. Pin gates on the profile first — generate
exports what the profile stored, not this fleet's resolved defaults.

```bash
$WQ repo json <repoKey>                 # review the portable file
$WQ repo json <repoKey> --write         # <checkout>/.workq/repo.json
```

That file is the pinned quality bar plus `onboard` briefing. Omitted gates
stay omitted (stderr says so). Auth stays out — the next captain still
collects tokens.

---

## C. Integrations and credentials

Start from the selected repo's declared policy and proposal, then the first
task. Explain which integrations the repo supplies itself and which need a
pool credential. A detected repo-owned skill is not a request to collect a
second pool token. Explicit `.workq/repo.json` ownership overrides inferred
ownership for that provider; preserve it.

Collect the credentials the resulting capability map requires, reusing saved
ones when their identity, scope, and destination are correct. Do not promise
`repo onboard --apply` can skip a mapped pool-owned capability: it refuses
missing credentials. If detection conflicts with the repo's documented usage,
resolve the ownership in the supported repo editor/policy before proceeding;
do not silently remove required capabilities. Connections outside the selected
policy, such as future tracker, chat, or issue intake, can wait.

**Ask in their language, not in flags.** They should never have to know that
`--field-env` exists, or which integration id maps to their tracker. Lead with
what the repo already evidenced and the task needs:

> "This repo uses GitHub for pull requests and CircleCI for checks. I'll check
> those connections before the first task. Its policy doesn't require tracker
> or chat connections."

For a missing connection, ask only for what the recipe needs, and tell
them to run the masked enter command in **their own terminal** (not paste it to
chat, and not `export` in a different shell — that cannot reach the captain
process):

> "In your terminal, run:
> `$WQ setup credential recipe --name jira` # shows baseUrl, email, apiToken + mint link
> `$WQ setup credential enter --name jira --verify --bind --pool <id>`
> It prompts for site URL, Atlassian email, and API token (token masked). Tell me
> when it prints the result — do not paste secrets here."

These are captain aliases for the examples: replace `$WQ` with the actual
`node /absolute/path/to/workq.js` invocation and `<id>` with the selected pool
before sending a command to the operator. If they chose the dashboard, use
its connection form instead of requiring a second terminal flow.

On Windows PowerShell with a WSL-hosted API, they run the same command in the
PowerShell session where captain talks to `http://127.0.0.1:…`. Secrets stay in
that Node process over HTTP; there is no Windows→WSL env inheritance.

You may also hand them a noninteractive form when scripting:

```bash
$WQ setup credential list
$WQ setup credential recipe --name jira
$WQ setup credential enter --name github --verify --bind --pool <id>
$WQ setup credential enter --name jira --verify --bind --pool <id>
# Reuse an already-saved credential; do not ask them to enter it again:
$WQ setup credential verify --name github
$WQ setup credential bind --name github --pool <id> --from-server-store
$WQ setup credential readiness --name github --pool <id>
# or noninteractive (explicit file/stdin — never implicit; never a different shell's export):
$WQ setup credential upsert --name github --fields-file ./github.fields
#   (file lines: token=… ; or --fields-file - with KEY=value on stdin)
$WQ setup credential upsert --name jira --fields-file ./jira.fields
#   (file lines: baseUrl=https://example.atlassian.net
#                email=you@example.com
#                apiToken=… ; delete the file after upsert)
# retained env path (same shell as the command):
$WQ setup credential upsert --name github --field-env token=GITHUB_TOKEN
$WQ setup credential upsert --name jira \
  --field-env baseUrl=JIRA_BASE_URL \
  --field-env email=JIRA_EMAIL \
  --field-env apiToken=JIRA_API_TOKEN
$WQ setup credential verify --name github          # live identity probe
$WQ setup credential upsert --name jira --profile secondary --fields-file ./jira-secondary.fields
$WQ setup credential delete --name jira --profile secondary
```

Report the **verify** / enter status back in their language too — "that Jira token is
authenticating as `svc-ci`, not as you; is that intended?" is the finding they
care about, not the exit code. Enter prints `saved` / `verify` / `bind` /
`readiness` planes separately — never treat a successful save as full onboarding.
`--verify --bind` saves, verifies, and binds in one entry flow; failed verification
skips binding. A successful identity probe still does not prove repo access or
every requested capability. Check the reported coverage and host readiness,
then exercise the actual operation in the first task. After `upsert`, bind
explicitly: a credential saved only on the server is not ready for workers.

**Prefer `credential enter` or `--field-env` / `--fields-file`, never `--field`.**
`--field` puts secrets on argv and in `ps` (and often shell history). A separate
terminal's `export` does not propagate into the agent — that is why enter reads
in the process that runs the command. Do not tell people that a literal `export`
cannot enter history; prefer enter / fields-file so secrets need not sit in env
or argv at all.

**Always verify after upsert.** `verify` runs the same probe the dashboard
Verify button does and reports the identity behind the credential, which is how
you catch a token that authenticates as the wrong bot. `unknown` means there is
no probe for that provider — say "unverified", do not report it as working.
`--strict` exits 3 for scripted checks.

Ownership, when the proposal did not settle it:

| `provider` | Meaning                                                          |
| ---------- | ---------------------------------------------------------------- |
| `repo`     | The repo ships the skill and owns the integration                |
| `pool`     | The fleet holds the credential                                   |
| `none`     | Explicitly off for this repo (and refused as a capability owner) |

```bash
$WQ setup desired patch --area integrations --set <leaf>=<json>
$WQ repo set <repoKey> --set integrations.jira='{"provider":"pool"}'
```

Rich Jira custom-field forms remain a dashboard surface — say so rather than
pretending the CLI covers them.

**Stay inside the built-in catalog.** Distributed integration skills currently
cover GitHub, GitHub Issues, Jira, CircleCI, Jenkins, Slack, and Teams.
Forge-native CI is reached through the forge integration. Do not offer a
provider merely because it is common. A repo may ship its own integration skill
or other per-repo tooling; describe that honestly as bring-your-own support,
then verify the repo actually contains it before promising the capability.

**Chat is origin-aware, not a broadcast sink.** Slack / Teams credentials do
not mean routine fleet events should be posted there. Replies go back when that
chat conversation originated the item, or when a pipeline explicitly includes
a chat action. Tell the operator this during setup so "configured" is not
mistaken for "will post everything."

---

## D. Ticket intake

Use `$WQ create` for the first captain-led task. GitHub Issues capture is
optional and should be configured only when requested. Two intake paths for
the same request create duplicate work. Before changing capture, read its
current configuration; intake settings are server-wide, so a pool selection
does not make them private to an isolated pool.

```bash
$WQ setup intake show
$WQ setup intake set --repo <owner/name> --label fleet --capture-pool <pool> --auto-grab on
$WQ setup intake set --repo-pool <owner/name>=<pool>      # route one repo
$WQ setup intake set --auto-grab off                      # keep settings, stop claiming
$WQ setup intake set --close-on-terminal off              # keep issues open
$WQ setup intake clear                                    # back to env / default
```

`set` reads the current settings and merges, so a partial edit keeps the rest.
List flags (`--repo`, `--close-except`, `--unlabel-except`) replace their list;
`--repo-pool` merges one key. Capture requires **auto-grab on** and a non-empty
`--repo` list; empty repos or auto-grab off means no claiming (laptop hosts
should leave auto-grab off).

Explain these conditions when enabling capture:

- Auto-grab must be on — label + unassigned alone does not capture.
- The poller only sees issues with the intake label **and no assignee**.
  Assigning an issue holds it back.
- Warnings from `show` / `set` mean captures will park on `__unassigned__` —
  fix `--capture-pool` or `--repo-pool` before calling it done.
- With intake on, do **not** also `$WQ create` a labelled issue.
- Per-issue pin (orthogonal to the intake label): `workq-pool/<exact-pool-name>`
  on the GitHub issue. Unknown or conflicting pins are skipped (no claim), not
  defaulted. No pin → repo map / default capture pool as usual.

Verify by labelling one unassigned issue and watching it appear:

```bash
$WQ list --status todo
$WQ watch --once --attention
```

---

## E. Prepare the repo for success

Repo onboarding is not finished at clone + auth. Translate the organization's
standards into the server profile so every item inherits them. Reuse the
dry-run evidence and current policy. The following are a checklist for the
captain, not a required user questionnaire. Resolve them from the repo first
and ask only where a missing answer blocks the first task or changes policy:

- Which branch should ordinary PRs land on? Are campaign / feature branches
  used for deferred integration?
- Which gates are required, and what exact repo-root commands run them?
- Is each unit / integration / e2e suite required locally, scoped because a
  named remote carrier runs the full suite, or intentionally absent?
- Is self-review required? Is non-author approval required? Which review lenses
  fit this codebase (correctness, security, architecture, performance, etc.)?
- How should UI or other human-visible behavior be proven? Name the real
  harness / shot command in `testing.evidenceHowTo`; never invent one.
- What landing policy is acceptable on the default, feature, and release
  branches?

Use the repo profile surface, not a worker ticket:

```bash
$WQ repo show <repoKey>                    # stored + resolved + provenance
$WQ repo set <repoKey> --set quality.defaultBaseBranch=develop
$WQ repo set <repoKey> --set testing.e2eStrategy=scoped
$WQ repo set <repoKey> --set testing.evidenceHowTo='<real harness guidance>'
# List-valued quality.requiredGates, testing.gateCommands, and review.lenses
# replace as wholes. Prefer repo onboard --apply / the dashboard editor when
# setting several related leaves so the resulting policy is reviewed together.
$WQ repo show <repoKey>                    # read back the resolved result
$WQ repo json <repoKey> --write            # optional portable repo-owned bar
```

Do not set `unitStrategy=scoped` without naming
`testing.unitFullSuiteRemote`; scoped means the full suite still runs
somewhere, not that it disappeared. When `e2eStrategy` / `unitStrategy` is
`none`, the resolver removes that gate instead of publishing a contradictory
pipeline.

Explain the resulting pipeline in user terms: workers investigate / plan,
implement, run exactly the configured Verify gates, self-review with the
configured lenses, open the PR, wait for external review, then land. The
pipeline is both progress and enforcement; evidence is attached to the step
that produced it.

### E.1 Evidence

Make sure `testing.evidenceHowTo` names any repo-specific proof path the defaults
cannot infer. Then prove one smoke item can attach command evidence and, for a
UI repo, a real image artifact. Bug work should carry the same regression
command red before / green after; UI changes should carry before / after images
when applicable. Evidence must demonstrate the outcome and its coverage, not
repeat "tests passed."

### E.2 Landing modes

Read current state first:

```bash
$WQ unattended status
$WQ fleet --digest
```

Prefer human approval initially. Per-item `--auto-merge` is the narrower first
step; pool-wide `$WQ unattended on --yes` is ambient and should only follow a
successful observed sample. Neither bypasses configured gates, review policy,
mergeability, or forge checks.

Ask which branch receives unattended changes and say the risk explicitly.
Auto-landing is best for low-risk mechanical work or a campaign / feature
branch whose integration verification is deliberately deferred to a later
promotion gate. Deferral means individually green changes can still interact
badly. Do not enable ambient landing directly into a protected integration or
release branch unless its automated gates and review policy are intentionally
strong enough to make the decision.

---

## F. Teach the operating model

Finish the first setup with the task link and three useful next prompts:

- "Set up this other repo: <URL>."
- "Have the fleet fix <specific problem>; show me how you'll verify it."
- "What needs my attention?"

Explain only the operating detail needed for their next action. The following
is reference material for later questions, not a required first-run lecture:

1. **Use a strong reasoning model for the captain.** The captain plans and
   supervises the campaign; weak planning
   can waste many worker turns.
2. **Plan before multiplying.** Inspect code and tracker context, remove
   duplicates, pin acceptance criteria and scope, and build a dependency DAG
   before filing. Parallelize independent seams; serialize only real interface
   dependencies.
3. **Good fits:** independent bugs, broad test expansion, migrations,
   mechanical refactors, documentation campaigns, and well-planned features
   whose pieces are easy to verify.
4. **Bad first fit:** ambiguous greenfield work that needs conversational
   iteration. Establish the architecture and one working vertical pattern in a
   solo agent / IDE session, then fleet out the repeatable pieces.
5. **Autonomous by design.** Workers should investigate through landing
   end-to-end. Use `blocked`, transcripts, `feedback`, `steer`, `set-brief`,
   dependency repair, retry, cancel, or takeover for exceptions—do not
   micromanage every turn.
6. **Not a harness replacement.** Workq coordinates Cursor / Claude / Codex
   agents; it does not replace their interactive development experience.
7. **Tokens multiply too.** Stop intake on a systemic failure. Diagnose and
   prove one repaired path before releasing the backlog.
8. **Optional roles:** analyst advises from fleet-wide evidence; librarian
   maintains compact durable memory. Neither is an engineering worker. Enable
   them after the core loop is healthy.

Show the diagnosis loop rather than only describing it:

```bash
$WQ fleet --digest
$WQ blocked
$WQ watch --once --attention
$WQ depends show <id>
$WQ show <id>
$WQ transcript <id> --tail
$WQ runs --since today --group-by role
```

Finish by pointing the operator to
`docs/suite/workq/user/captain-onboarding.md` for the concise user guide and
`SKILL.md` for day-to-day planning, DAG, steering, and recovery mechanics.

---

## Refusals you should welcome

These are the flow working, not obstacles to route around. If you find yourself
about to invent a value to get past one, stop and ask instead.

| Refusal                               | The right response                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| UNRESOLVED gate command               | Read scripts/CI first; ask only for missing evidence, then pass `--gate-command` |
| forge unrecognized                    | Declare `forge` on the seed (and acknowledge the mismatch) first                 |
| capability probe failed               | Collect + verify that credential (§C), then re-apply                             |
| clone refused, no clone root          | `--clone-dir` or `--path` — do not scatter a clone                               |
| clone refused, auth / Username        | `gh auth status` or switch the URL to SSH — do not inject a token                |
| clone refused, filesystem origin      | Seed URL was a local path — pass https:// or git@; do not clone `/mnt/*`         |
| credential store unavailable          | Set `WORKQ_CREDENTIAL_ENCRYPTION_KEY` and restart the server                     |
| `protection: unread`                  | Repair forge access or read repo policy; preserve PR + approval requirements     |
| `workqRepoJson: ignored — <reason>`   | Read the reason to them; fix the file or proceed with it ignored                 |
| intake warning about `__unassigned__` | Set a capture pool before declaring intake live                                  |

## Onboarding footguns (quick reference)

| Footgun                                   | Symptom                                                          | Fix                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `workq-pool scale` without `roles-sizing` | Host count moves; server desired-config does not                 | `$WQ setup roles-sizing --workers N`                                                        |
| Missing encryption key                    | Credential store unavailable in SETUP                            | `WORKQ_CREDENTIAL_ENCRYPTION_KEY` + server restart                                          |
| Preflight asymmetry                       | Jira warns, GitHub fails — pool still “up”                       | Configure before first claim; see Integrations preflight table                              |
| Selection without redeploy                | Old skills/rules on warm bases                                   | `workq-pool redeploy` after Skills & rules save                                             |
| Read token without push auth              | Green doctor; PR open fails                                      | Select a connection with Contents write access and sync it to the pool                      |
| Warm base cloned from a local path        | `origin` is a filesystem path; fetch / reset dies                | Clone the https:// or git@ URL after host git/gh works. win32/WSL: windows-host.md § GitHub |
| `NODE_MODULE_VERSION` / better-sqlite3    | Unit tests crash; compiled against 127, worker Node wants 137    | `ensure-host-native-addons.js --apply`. Distro Node ≠ cursor-agent Node.                    |
| Smoke before re-running doctor            | Apply saved; first item dies on missing Jenkins / Bitbucket keys | `$POOL doctor` after apply; file smoke only when clean, or they ask to proceed anyway       |

## When dashboard (or host tooling) is the right surface

Captain covers supported integration setup end-to-end. Hand off only for honest
gaps — do not redirect for operations `$WQ setup` already performs. Say this
plainly rather than improvising a CLI equivalent: rich Jira custom-field forms,
some Fleet step bodies, host sizing / role flip / redeploy, and skill-secret
editing live in Admin, the pool TUI, or `workq-pool`. The honest current list is
in `$WQ setup path` and
[first-run.md § Gaps](first-run.md#gaps-called-out-loudly).

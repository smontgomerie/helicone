# First run and system troubleshooting

Open this when the stack is missing, half-configured, or the fleet looks alive
but nothing moves. Day-to-day captain work stays in [SKILL.md](SKILL.md);
command detail stays in [reference.md](reference.md). Onboarding a **new repo**
(or reopening repository settings) lives in
[onboarding-a-repo.md](onboarding-a-repo.md).

**Driving a stand-up conversation** — "let's get a pool stood up", "set up this
repo: `<url>`" — is [standing-up.md](standing-up.md): the probe-then-ask order,
the questions worth asking, and the verification after each step. Come back here
for the chain detail below and the troubleshooting table when a probe fails.

Help the person get one repository ready and complete one useful task. Detect
what is missing, perform the next supported step, verify, then continue. Reuse
working setup and confirm the intended server and pool before writes. Start
the first small, authorized task only after the host and repository are ready.

If the [SKILL.md](SKILL.md) host probe said `win32` or WSL, invocators and
distro deltas live in [windows-host.md](windows-host.md) — captain stays on
Windows; API/pool run in WSL. macOS / native Linux: stay here.

```bash
WQ="node $SKILLS/workq-captain/scripts/workq.js"
POOL="npx workq-pool"   # from the workq repo after `npm run build -w @workq/pool`
```

## Happy path (pairing-first)

**Prefer captain-led setup** in the interactive session (`$WQ setup …` /
[standing-up.md](standing-up.md)). The dashboard Setup rail writes the **same**
documents and is an equally supported choice when the operator prefers a UI —
never a forced redirect for operations captain can perform. Do **not** treat
hand-editing `pool.config.json` tokens or inventing a second checklist as the
way in.

1. **Server + dashboard** — API healthy; operator can sign in (dashboard link
   for confirmation; captain drives the rest).
2. **Captain identity** — personal API key in captain `config.json` /
   `workq.secret.json` so `$WQ whoami` names a real person (not a shared service
   token).
3. **Connect the host** — `$WQ setup pair --pool <id>` mints the code and prints
   the `workq-pool init …` command. Run it on the intended host when access and
   setup are authorized; otherwise give that command to its operator. Verify
   pairing, agent sign-in, and `$POOL doctor`, then start the host. Dashboard
   **Setup → Host** supports the same pairing flow.
4. **Add the repository** — inspect with `$WQ repo onboard`, reuse its declared
   policy and working integrations, then apply the setup. Connect only missing
   credentials required by that policy and the first task. Follow
   [onboarding-a-repo.md](onboarding-a-repo.md) for inspection and verification.
5. **Finish one useful task** — file one small, authorized task and follow it
   through checkout, verification, and its expected output. Report the task
   link and evidence; a PR ready for required human review is a valid handoff.
   An optional create/claim smoke checks dispatch only and does not prove
   repository productivity.

Reuse working capacity and agent settings. Capacity tuning, extra roles, and
advanced defaults are optional unless they block this task or the user asks
for them; `setup roles-sizing` remains available when a change is needed.

Print the checklist with `$WQ setup path`. Skip any step that already passes.
Contract detail: `docs/suite/workq/engineering/onboarding.md`.

## How to guide

1. **Probe once.** Server up? Captain config ready? Host paired and pool
   running? Say the answer out loud before changing anything.
2. **One gap at a time.** Fix the earliest blocker in the chain below; re-check
   before opening the next.
3. **Ask only for what needs the person.** The captain identity must belong to
   the actual person; never invent an identity or borrow a shared token.
   Browser sign-in, provider consent, and credentials unavailable to the
   session may need their action. Give the exact next step for that gap.
   Mint and redeem pairing codes through supported commands when authorized
   and the host is accessible; copying a code is not inherently human-only.
4. **Done means useful output.** Confirm `$WQ whoami`, host readiness, and
   repository access, then observe the first task's checkout, checks, and
   expected result. `$WQ fleet --digest`, local `pools.js` status, and completed
   Setup progress are supporting checks, not proof of delivery. If the user
   requested configuration only, report that boundary and whether a task has
   actually run. Preserve required review and merge approvals.

## First-run chain

Skip any step that already passes.

### 1. Server and dashboard

From the workq monorepo root:

```bash
cp .env.example .env    # once; defaults are enough for local
npm install
npm run build
npm run dev             # API :9876 + Vite dashboard
curl -sS http://127.0.0.1:9876/health
```

Open [Dashboard](http://127.0.0.1:5173/dashboard/) (or `/dashboard/` behind the
server). The captain must paste that markdown link in chat so the operator can
jump in — not only say "open the dashboard."

- **No Google OAuth in `.env`:** local email login is available (dev bypass).
- **Production sign-in:** set `WORKQ_GOOGLE_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI`
  and `WORKQ_SESSION_SECRET`. Root admin is `WORKQ_ROOT_USER_EMAIL`.
- Optional shortcut: `WORKQ_DEV_SEED_API_KEY` seeds a root key in bypass mode so
  you can skip minting one in the UI for local-only captain work.

For PR screenshot embeds on a real deploy (optional locally): create a **public**
evidence repo (e.g. `skatamatic/workq-evidence`), set `WORKQ_EVIDENCE_REPO` + a
contents-write token (or reuse `WORKQ_GITHUB_TOKEN`), smoke with `$EV add` of a
PNG and confirm `$EV list --markdown` shows a `raw.githubusercontent.com` URL.
See devops docs for GC (`workq-server evidence-gc`).

### 2. Captain config (interactive identity)

Dashboard → **User → API keys** → create → copy once.

That key is identity for everything **you** (the captain) do with `$WQ`. Prefer
the person's own key over a borrowed or shared service token. It is **not** a
substitute for pairing the pool daemon — pool hosts get a **pool-bound** key via
pairing (next step).

```bash
cp $SKILLS/workq-captain/config.example.json \
   $SKILLS/workq-captain/config.json
cp $SKILLS/workq-captain/workq.secret.example.json \
   $SKILLS/workq-captain/workq.secret.json
```

Edit:

| Field                         | Value                                        |
| ----------------------------- | -------------------------------------------- |
| `baseUrl`                     | `http://127.0.0.1:9876` (or the real server) |
| `workqRoot`                   | Absolute path to this monorepo               |
| `consumerId` / `displayName`  | Stable id and how messages are signed        |
| `workq.secret.json` → `token` | The API key from this step                   |

Then:

```bash
npm run build -w @workq/worker   # if $WQ errors that the CLI is missing
$WQ whoami                       # must name the account behind the key
```

`$WQ` prints setup steps when config is incomplete — follow those before
improvising paths.

### 3. Dashboard Setup

The dashboard Setup UI has a left rail for **Host**, **Integrations**, and
**Repositories**. Start with the host and one repository. Repository defaults
and **Advanced settings** remain available when a task needs them.

**Chrome captains should guide against**

| Piece            | What operators see                                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Left Setup rail  | Host and Integrations under Pool; Add repository, Defaults, and saved repos under Repositories; advanced settings collapsed |
| Main pane        | Leaf title + short lead → interactive body → docked **Save / Continue / Revert** when dirty (no Skip / Leave)               |
| Progressive body | Primary choices first; auth + Test when enabled; defaults visible; advanced in collapsed sections                           |
| Provider rows    | Provider name and logo; connection state and the next useful action                                                         |

Pairing lives under **Host**: mint a code, run the ready `workq-pool init …`
command on the intended host, and wait for host presence. Once host setup is
ready, **Continue** opens **Add repository**. Connect only the integrations
that its policy and first task need; keep existing repository-owned choices.

Admin desired-config editors write the **same** documents. Re-open does not
resurrect a second “legacy onboarding” flag.

- First visit: the empty board offers **Set up your first pool**. Sidebar
  **Setup** (or bare `?onboarding=1`) opens the same flow. Admin **Open Setup**
  is another entry point; opening Setup does not require resetting configuration.
- **Jump back / full re-open:** sidebar **Setup**, Admin **Open Setup**, or bare
  `?onboarding=1` (optional `&step=<id>`). Grandfathered `completed` stays
  completed until deliberate re-entry; re-entry does not blindly wipe
  desired-config.
- **Add another repo later (repo-only):** Account **Add repo** or Setup →
  **Add repository** (`?onboarding=1&step=add-repo&mode=repo`) opens repository
  setup; `$WQ repo onboard` supports the same work. After saving, verify the
  repository and follow its first useful task rather than stopping at a saved
  integration binding. Detail:
  [onboarding-a-repo.md](onboarding-a-repo.md).

### 4. Redeem pairing on the host

On the machine that will run agents (after the dashboard shows a pairing code):

```bash
npm run build -w @workq/pool
$POOL init \
  --base-url http://127.0.0.1:9876 \
  --code <pairing-code> \
  [--host-name <name>] [--clone-root <path>] \
  [--role orchestrator|standalone-workers] [--harness cursor-cli]
```

`init` redeems the code, writes `~/.workq-pool/pool.config.json` with the
pool-bound token, and runs provision (Cursor CLI, memory seed, readiness)
unless you pass `--pair-only` (then run `$POOL setup` when ready).

**Non-interactive init (`--pair-only`).** Scripted / CI pairing must pass every
required flag on the command line — stdin prompts are not wired in this build.
Minimum:

```bash
$POOL init \
  --base-url http://127.0.0.1:9876 \
  --code <pairing-code> \
  --pair-only \
  [--host-name <name>] [--clone-root <path>] \
  [--role orchestrator|standalone-workers] [--harness cursor-cli]
```

`--base-url` and `--code` are required. `--clone-root` defaults to
`~/.workq-pool/bases`. `--host-name` is the **dashboard pool name** (exact,
case-sensitive) — pass the bound name from `$WQ whoami`, not a guessed DNS
label. When omitted, `init` starts from `os.hostname()` then rewrites to the
bound pool after redeem (Windows mixed-case hostnames vs a lowercased pool
is the usual miss). After `--pair-only`, run `$POOL setup` (or `$POOL doctor`
then `$POOL start`) when the host should provision harness + memory seed.

If the minted code starts with `-`, remint or pass `--code=<code>` — the CLI
otherwise treats it as a new flag.

```bash
$POOL auth                       # if doctor/setup say Cursor is signed out
$POOL doctor                     # ✗ blocks start; ! is degraded but usable
$POOL start
node $SKILLS/workq-captain/scripts/pools.js
$WQ fleet --digest
```

Preflight on `setup` / `doctor` / `start` catches the failures that otherwise
look like "agents keep dying" — unsigned Cursor CLI, unreachable server, missing
worker CLI. Fix every `✗` before treating the fleet as ready.

**Re-pair:** if the host token is wrong or unbound, mint a fresh code and re-run
`init` with `--yes` (overwrites local config intentionally). Do not paste a
personal captain key into `pool.config.json` as a workaround.

**Escape hatch only:** hand-editing `pool.config.json` / copying tokens is for
break-glass recovery when pairing cannot run — never the guided happy path.
Validate after any hand-edit: `$POOL config validate`.

### 5. Prove the loop (optional)

Prefer the wizard **Defaults → Evidence** leaf when driving SETUP in the UI. For an
optional headless loop proof (file a tiny item, wait for claim, cancel with reason
`first-run-ok`), use:

```bash
$WQ setup smoke --apply          # or the create recipe below
# equivalent:
$WQ create --title "Captain first-run loop proof" \
  --brief "No code. Confirm claim, then cancel with reason first-run-ok." \
  --session "first-run-$(date +%Y%m%d)" --json
$WQ watch --once --attention
$WQ blocked
# cancel the loop-proof item when a worker claims it, or cancel immediately if you
# only needed create → fleet visibility
$WQ setup progress complete evidence   # or skip — retired id `smoke` aliases here
```

**GitHub Issues intake** (when auto-grab is on for the fleet): add the intake
label (usually `fleet`) to an unassigned issue — that is capture, not a second
queue. Do not also `$WQ create` the same work. Detail in
[onboarding-a-repo.md](onboarding-a-repo.md#filing-work-one-intake).

If create (or labelled intake) works but nothing claims, stop and use the
troubleshooting table — do not keep filing.

## Captain-led setup (preferred)

`$WQ setup` is the preferred captain path for supported integration setup —
**not** a fallback, not a second wizard, and not “only edit `pool.config.json`”.
Every write goes through the same APIs the dashboard uses (pairing mint,
desired-config area PATCH, named credentials, onboarding-progress PUT, repo
onboard apply). Operators who prefer the UI use dashboard Setup for the same
documents; hand back only for honest gaps (rich Jira custom-field forms, some
Fleet step bodies) listed under Gaps below.

```bash
$WQ setup path                   # checklist + honest gaps
$WQ setup pair --pool <id>       # mint; prints workq-pool init …
$WQ setup pair-status <prefix> --pool <id>
$WQ setup roles-sizing --workers 4 --librarian on --harness-worker cursor-cli
$WQ setup credential recipe --name jira          # canonical fields + where to mint
$WQ setup credential enter --name github --verify
$WQ setup credential enter --name jira --verify  # prompts baseUrl, email, apiToken
# noninteractive (same shell / file — never a different shell's export):
$WQ setup credential upsert --name github --field-env token=GITHUB_TOKEN
$WQ setup credential upsert --name jira --fields-file ./jira.fields
#   (file lines: baseUrl=…  email=…  apiToken=… ; delete the file after)
$WQ setup credential verify --name github        # live identity probe
$WQ setup credential bind --name github --pool <id> --from-server-store
$WQ setup credential readiness --name github --pool <id>
$WQ setup desired patch --area fleet-defaults|integrations|pipelines --set …
$WQ setup intake show|set|clear                  # GitHub Issues capture
$WQ setup progress show|complete|skip <stepId>   # welcome…evidence (`smoke` aliases to evidence)
$WQ repo onboard <repoKey|url> [--path <checkout>] [--workspace-mode …] --apply
$WQ setup smoke --apply
```

Prefer `credential enter` (masked TTY in **this** terminal) or `--field-env` /
`--fields-file`. Avoid `--field` — it puts secrets on argv and in `ps` (and often
shell history). A separate shell's `export` cannot reach the captain process;
that is a process boundary, not a claim that exports skip history. Verify after
each save: `verify` reports the identity behind the credential (`unknown` means
no probe exists for that provider — say unverified). Identity success is not
full readiness — bind + `readiness` when the host needs the secret. `intake set`
read-modify-writes; `--strict` on `verify` / `intake` exits 3 for scripted gates.

Repo onboard dry-run / apply uses the **same three workspace modes as SETUP**
(`worktree`, `existing_checkout`, `cow_clone`). Read the printed options; ask
when the recommendation is not obvious; pass `--workspace-mode` to override.
Do not hand-edit `pool.config.json` for workspace mode.

Progress complete/skip uses the same `withStepOutcome` cursor advance as the
dashboard shell (`@workq/domain`), so the SETUP rail and headless path cannot
diverge on step ids or skip/complete semantics.

### Gaps (called out loudly)

| Leaf / surface                                        | Headless today                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| Rich Jira custom-field forms / some Fleet step bodies | API-writable leaves via `desired patch`; rich forms stay dashboard siblings     |
| Host plumbing (cloneRoot, binaries)                   | `workq-pool init` / host `pool.config.json` only — never desired-config         |
| `workq-pool scale --workers`                          | Host-only; **does not** update server `roles-sizing` — use `setup roles-sizing` |

### Common onboarding footguns

| Footgun                                    | Symptom                                                                       | Fix                                                                                         |
| ------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `workq-pool scale` without `roles-sizing`  | Host worker count changes; SETUP Host Capacity / server cursor stay stale     | `$WQ setup roles-sizing --workers N` (CLI prints a reminder after `scale`)                  |
| Missing `WORKQ_CREDENTIAL_ENCRYPTION_KEY`  | Named credentials silently unavailable; SETUP Integrations shows store banner | Set key on server, restart — see `docs/suite/workq/engineering/onboarding.md`               |
| Jira warns / GitHub fails preflight        | Pool “started” but mid-ticket failures                                        | SETUP Integrations → **Doctor preflight: warn vs fail** table; configure before first claim |
| Profile skills/rules edit without redeploy | Saved selection; workers still run old bundle                                 | Save, then `workq-pool redeploy` on host (SETUP Skills & rules banner)                      |
| GitHub read token only                     | Doctor green; `git push` / PR open fails                                      | Select a GitHub connection with Contents write access; sync it to the pool                  |
| Warm base cloned from a local path         | `origin` is `/mnt/…` or a drive letter; fetch / reset dies                    | Clone the forge URL after host git/gh works. Windows: `windows-host.md` § GitHub            |
| `NODE_MODULE_VERSION` / better-sqlite3     | Worker `npm test` crashes; addon compiled for distro Node 22                  | `ensure-host-native-addons.js --apply`. Prove require() under cursor-agent's bundled node.  |

Do not invent a parallel “legacy onboarding” flag or a captain-only progress
catalog. Canonical step ids are `ONBOARDING_STEP_IDS` in `@workq/domain`.

## Optional integrations (after the loop works)

| Integration    | Why                                              | Where                                                                                      |
| -------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| GitHub token   | Merge/close polling so `under_review` can finish | Server named credentials / `WORKQ_GITHUB_TOKEN`                                            |
| GitHub webhook | Merges noticed in ~1s instead of poll cadence    | `WORKQ_GITHUB_WEBHOOK_SECRET` + repo webhook                                               |
| Slack          | Thread push + Socket Mode                        | `WORKQ_SLACK_*` + app manifest under `deploy/`                                             |
| Teams          | Conversation push + Bot Framework webhook        | `WORKQ_TEAMS_*` + `deploy/teams-bot-setup.md` (Integrations / env; no SETUP rail step yet) |
| Cursor notify  | Desktop/command ping when a worker asks          | `WORKQ_CURSOR_NOTIFY_*` on the server                                                      |
| Postgres       | Hosted persistence                               | `WORKQ_DATABASE_URL`                                                                       |

Prefer `$WQ setup credential enter --name <id> --verify` (or upsert /
`--field-env` / `--fields-file`) for the same admin store the dashboard
Integrations leaf writes. Dashboard remains an equal choice when the operator
wants the UI. Example (Teams):
`--name teams --field-env appId=TEAMS_APP_ID --field-env appPassword=TEAMS_APP_PASSWORD`,
then `$WQ setup credential verify --name teams`. None of these are required for
a local first claim. Add them when the symptom shows up (reviews never settle,
no Slack/Teams thread, etc.).

## System troubleshooting

Probe with `$WQ whoami`, `$WQ fleet --digest`, and `pools.js` before guessing.

| Symptom                                 | Check / fix                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$WQ` prints setup steps                | Captain `config.json` / `workq.secret.json` / `workqRoot`; build `@workq/worker`                                                                                                                                                                                                                                                                                                                                                                                            |
| `whoami` fails / 401                    | Wrong or revoked token; mint a new key; confirm `baseUrl`                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `curl …/health` fails                   | `npm run dev` not running; wrong host/port; check `.env` `WORKQ_PORT`                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dashboard blank / login loop            | Dev bypass vs Google misconfigured; redirect URI; `WORKQ_SESSION_SECRET`                                                                                                                                                                                                                                                                                                                                                                                                    |
| Host never paired / `never_paired`      | Mint a fresh pairing code; `$POOL init --base-url … --code …` (add `--yes` to re-pair). If the code starts with `-`, remint or `--code=<code>`. Do not paste a captain key into `pool.config.json`                                                                                                                                                                                                                                                                          |
| `pools.js`: not installed               | `$POOL init` (or `setup` after `--pair-only`), then `doctor` / `start`                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pools.js`: down / stale pid            | Supervisor died; `$POOL start` (or `restart`). Fleet registrations can look staffed while nothing listens.                                                                                                                                                                                                                                                                                                                                                                  |
| `pools.js` up, `fleet` empty            | Pool `workq.baseUrl` ≠ captain `baseUrl`, or token points at another account/server — re-pair if the host key is unbound                                                                                                                                                                                                                                                                                                                                                    |
| Pool up, stream not connected           | Pickup lags on poll only; `$POOL restart`. If it stays down, `doctor` + server reachability                                                                                                                                                                                                                                                                                                                                                                                 |
| `doctor` ✗ cursor auth                  | `$POOL auth` until the CLI reports a signed-in user. Fleet login uses the harness `homeDir` (`~/.workq-pool/harness-home/cursor-cli` + `AGENT_CLI_CREDENTIAL_STORE=file`), not the interactive IDE login.                                                                                                                                                                                                                                                                   |
| `doctor` ✗ workq server                 | Server down, bad URL, or bad token in `pool.config.json` — re-pair rather than inventing a token                                                                                                                                                                                                                                                                                                                                                                            |
| `doctor` ✗ worker CLI                   | Missing **or stale** `packages/worker/dist/cli.js` on `workq.rootPath`. Rebuild there: `npm run build -w @workq/worker --prefix <root>`. Merging main does not update that binary (`dist/` is gitignored). Then `workq-pool restart` so agents load it.                                                                                                                                                                                                                     |
| `todo` ready, nobody claims             | No free capacity; deps not cleared; pool role/slots; `$POOL status` / TUI. **Also:** protocol skew — `pools.js` warns on recent evaluate errors, or `~/.workq-pool/logs/supervisor.log` shows `invalid_enum_value` / Zod failures on `listItems`. Fix: `npm run build -w @workq/protocol -w @workq/pool && workq-pool restart`. Captain `--session` attaches `source.kind: cursor_chat`; an old pool process that never loaded that enum cannot claim any item in the list. |
| Agents exit immediately                 | Cursor signed out or CLI broken — `doctor`, not more tickets                                                                                                                                                                                                                                                                                                                                                                                                                |
| Items stuck `under_review`              | GitHub credentials; webhook optional; see devops runbook                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Infra noise on Problems                 | Pool credentials, clones, skill secrets; fix host then clear                                                                                                                                                                                                                                                                                                                                                                                                                |
| Work attributed to the wrong person     | Shared/service key; `$WQ whoami` before the next dispatch                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `TS2305` missing `@workq/domain` export | Captain or warm-base `packages/domain/dist` behind source / `origin/develop`. Rebuild domain with app/worker on the same checkout; refresh bases (or `workq-pool redeploy --yes` when the fleet is idle). See engineering pool README “After merging pipeline / domain changes”.                                                                                                                                                                                            |
| Bare `$PIPE add` trails after Post PR   | Live server still on pre-nest-append domain (only nested under Self-review, or not at all). Fast-forward captain checkout, rebuild `@workq/domain` + consumers, restart tsx server. Separate class: stale worker CLI ignoring `--parent` — rebuild `packages/worker/dist` + `workq-pool restart`.                                                                                                                                                                           |
| Silent CLI / API drift                  | Flags or enums that exist on develop but not in the running binary/process: worker `dist` older than `src`, pool still on old `@workq/protocol`, or server checkout behind. Symptoms look like “ignored flags”, Zod `invalid_enum_value`, or nest defaults that do not match docs. Rebuild the drifted package(s) together and restart server/pool.                                                                                                                         |

Day-to-day item symptoms (blocked questions, wrong `watch` cursor, escalations)
stay in [reference.md](reference.md) under **When something is wrong**.

## What you are not replacing

Host sizing, role flip, redeploy, and skill secret editing belong to
`workq-pool` / the pool TUI / Admin. Point the operator there once the host is
known broken in a way `doctor` already names — do not re-implement ops in chat.

---
name: workq-captain
description: >-
  Drive a workq fleet from an interactive agent session: investigate a problem
  or a design, break it into tasks a worker can finish alone, file them, and
  follow the work until it lands. Also answers "what is the fleet doing right
  now", detects whether a local pool is actually running, unblocks workers that
  asked a question, and takes over anything escalated. Use when the user wants
  to hand work to the fleet — "get these four bugs fixed", "have the pool
  implement this design", "what are my agents up to", "anything waiting on me" —
  or mentions workq, the queue, the pool, dispatching, or their JIRA pile. Also
  stands a fleet up from nothing and onboards a repository from just a git URL
  ("let's get a pool stood up", "set up this repo: <link>") — probe the host
  first (windows-host.md on win32/WSL, standing-up.md on macOS/Linux);
  first-run.md when a POSIX probe fails, not the dispatch loop below.
---

# workq-captain

You are the captain. Orchestrators supervise, workers do the work, and you
decide what the work _is_.

That is the job in one line: turn something a person wants into a set of tasks
that can each be finished alone, hand them out, and stay accountable for the
result. Everything below serves that. You have full authority — you can file,
cancel, answer, take over and finish anything yourself — but spending your own
turn on something a worker could do is the one way to waste the fleet.

## Start with the user's outcome

For setup requests, the finish line is **one repository doing useful work**.
Do not turn first-run into a tour of every setting. Inspect what already works,
reuse it, connect what the repo policy and first task require, and follow it through
the repository's verification and review policy.

- A repo URL is enough to start. Read its documentation, scripts, CI, and
  existing policy before asking about commands or conventions.
- Ask only for missing identity, an ambiguous destination, a secret or login
  the user controls, and decisions the evidence cannot settle. Use existing
  settings and safe defaults for routine choices; setup authorization covers
  the corresponding reversible configuration writes.
- Keep the user's chosen surface. Run supported commands yourself during a
  captain session; help dashboard users finish in the dashboard. Give a
  specific handoff only for a login or operation that needs their action.
- Name the target server and pool before writes. A test or isolated-pool
  request never authorizes changing the live pool, its intake, or credentials.
- Report **saved**, **verified**, **ready for a task**, and **task delivered**
  separately. A saved profile or token is not proof workers can use it. Leave
  human review pending when policy requires it; setup does not authorize a
  merge or enable unattended landing.

Start with [standing-up.md](standing-up.md), using the host routing below.
Advanced roles, intake automation, portable policy, and capacity tuning can
wait until the first task succeeds unless the user asked for them.

Set up aliases and use them for everything. `$WQ` is your alias, not a command
to paste into a user's fresh terminal; give them a fully resolved invocation.

**Pick the host file before you type.** One probe, then open exactly the matching
runbook — do not mix them:

```bash
node -e "console.log(JSON.stringify({platform:process.platform,wsl:process.env.WSL_DISTRO_NAME||null}))"
```

| `platform`                            | `wsl`       | Open                                                                                                                                                                                                      |
| ------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `win32`                               | —           | [windows-host.md](windows-host.md): bootstrap the distro, then **keep captaining here**. Invoke `node …/workq.js` (bash `$WQ` does not expand). API / pool / workers run in WSL via `wsl -d <distro> --`. |
| `linux`                               | distro name | [windows-host.md](windows-host.md) § Already in WSL, then [standing-up.md](standing-up.md).                                                                                                               |
| `darwin`, or `linux` with `wsl: null` | —           | [standing-up.md](standing-up.md) / [first-run.md](first-run.md). Do **not** open windows-host.md.                                                                                                         |

```bash
WQ="node $SKILLS/workq-captain/scripts/workq.js"
MEM="node $SKILLS/workq-captain/scripts/memory.js"
AN="node $SKILLS/workq-captain/scripts/analyst.js"
$WQ help          # every command, with flags (includes captain-only `repo`)
$WQ whoami        # account + bound / reachable pools for this key
$WQ repo list     # server repo profiles for this pool (captain-only)
$MEM read index   # fleet memory (read-only; see §1)
```

Check `whoami` once at the start of a session. Everything you file is attributed
to the account behind your API key, and that account is what "mine" means in
`watch` and `blocked` — so a key borrowed from someone else's setup files work
perfectly well and then hides it from you. It also lists the pool bound to the
key and every reachable pool; when several appear, pass `--pool` on `create`
(or use a pool-bound key) so work does not land in the wrong tenant. If it
reports a shared service token, say so before dispatching: nothing you file can
be traced back to the person you are working for.

## Before you dispatch: is anyone home?

```bash
$WQ fleet --digest                                   # free slots, queue, unhealthy pools
node $SKILLS/workq-captain/scripts/pools.js   # is the pool on THIS machine up
$WQ fleet                                            # same, plus the per-worker roster
$WQ intake status                                    # maintenance hold?
$WQ unattended status                                # ambient auto-land on/off?
```

`fleet --digest` is the loop-friendly form — capacity, queue depth, unhealthy
pools, no roster. Drop `--digest` when you need to see who. When intake is
paused it leads with **INTAKE PAUSED**. When unattended auto-land is on it also
shows `unattended: on (by <who>)`. `pools.js` catches the case the server
cannot see: a supervisor that died leaves its registration behind, so the fleet
looks staffed while nothing is listening. It also warns when the supervisor log
shows recent `evaluate error` lines (protocol skew — pool up, slots idle, todos
never claimed).

### Unattended auto-land (pool-scoped)

Turns on ambient auto-land for parked `under_review` items when the repo's
merge capability (`canAutoLand`) clears — no per-item `--auto-merge` required.
Attribution is `approvedBy: unattended`. Repos that still need human review stay
held; the wait line / `$WQ show` says so (`held for human review — unattended
mode cannot land <repo>: <reason>`). This is an operator convenience, **not** a
way around the quality bar: CI green + mergeable still hold.

```bash
$WQ unattended status                # mode + N eligible / M held for human
$WQ unattended on --yes              # confirmation required (or --reason "<why>")
$WQ unattended off
$WQ fleet --digest                   # should show unattended: on (by …)
```

Who enabled it and what landed are auditable on the server. Older APIs without
`/v1/unattended` fail loudly on this verb — upgrade rather than assuming off.

### Maintenance hold (pause intake — not drain)

Before upgrading the API or restarting pools, **pause intake** so in-flight
agents finish. Do **not** use `workq-pool stop` / drain for that — drain aborts
agents and returns held work to `todo`.

```bash
$WQ intake pause                 # no new todo claims (critical included)
$WQ fleet --digest               # should lead with INTAKE PAUSED
# …wait for in_progress to clear, or accept leftovers…
# …upgrade / restart…
$WQ intake resume
```

The flag is server-side and survives restarts. Filing still works; items sit in
`todo` until resume.

Filing into a dead fleet is not an error. The work waits in `todo` and starts
when a pool comes up. But say so rather than letting someone watch a queue that
cannot move.

If the server, captain config, or pool are not set up yet — or the probes above
disagree in a way you cannot explain — stop dispatching and stand it up:
[standing-up.md](standing-up.md) is the runbook (what to probe, what to ask, in
what order, for both a fleet and a repo) on macOS and native Linux.
[windows-host.md](windows-host.md) is the Windows path — captain stays in this
session; API / dashboard / pool run in WSL2. [first-run.md](first-run.md)
has POSIX chain detail and the troubleshooting table for when a probe fails.
Pairing-first either way — do not hand-edit `pool.config.json` tokens or revive
the old five-step wizard as the happy path.

**"Let's get a pool stood up" / "set up this repo: `<link>`"** is not a
conversation you improvise. Probe the host first (table above). `win32` /
WSL: [windows-host.md](windows-host.md). Otherwise [standing-up.md](standing-up.md).
It takes a bare GitHub/Bitbucket URL or a local git directory and finishes: clone
into the pool's warm-base path, read the tree for gates and integrations, read
branch protection, collect and verify only the credentials the repo evidences,
then apply both layers.

### Repo policy (server profiles) + onboard/update

**Captain-led onboarding is the recommended track.** When asked to spin up
Workq, own API/dashboard startup, pool creation and pairing, repository and
integration setup, and a real worker smoke task through completion. Reuse
working services and configuration. Do not send the person through the manual
UI checklist for steps you can perform; ask only for missing access, personal
authentication, or unresolved decisions. The manual dashboard track remains
available when they choose to configure the settings themselves.

When a human says a repo's quality bar / review lenses / testing strategy should
change for the **fleet**, record it on the server profile — do not file a worker
ticket to edit playbook prose for that. Server profiles are the authoritative
fleet layer (`docs/suite/workq/engineering/repo-config.md`).

**Onboard or reconfigure a seed** via captain `$WQ repo onboard` (propose-then-apply)
**or** dashboard **Add repo** (repo-only Setup: Account quiet CTA or Setup →
Repositories primary) — same outcomes, captain preferred when guiding in-session.
Full Settings-IA Setup is sidebar **Setup**, Admin **Open Setup**, or bare
`?onboarding=1`, not Add-repo. Why each decision matters, including deep-links
and one-intake: [onboarding-a-repo.md](./onboarding-a-repo.md).

**Captain-led first-run** (pair, roles-sizing, credentials, progress, smoke) is
`$WQ setup …` — preferred path during a captain session; see
[first-run.md § Captain-led setup](./first-run.md#captain-led-setup-preferred)
and `$WQ setup path`. Dashboard Setup writes the same documents when the
operator prefers the UI — not a forced redirect.

```bash
$WQ repo list [--pool <id|name>]              # profiles + resolved summary
$WQ repo show <repoKey> [--pool <id|name>]    # stored + resolved + provenance
$WQ repo set <repoKey> --set quality.defaultBaseBranch=develop
$WQ repo onboard <repoKey|url|path> [--path <checkout>]   # dry-run proposal
$WQ repo onboard <url> [--clone-dir <root>] [--no-clone]  # URL-only: clone on demand
$WQ repo update <repoKey> [--path <checkout>]             # diff vs current
$WQ repo onboard <repoKey> --path <checkout> --apply [--gate-command id=cmd]…
$WQ help repo                                 # flags and refusals
$WQ setup path                                # captain-led first-run checklist
$WQ setup credential recipe --name <id>       # canonical fields + mint links
$WQ setup credential enter --name <id> --verify --bind --pool <id>
$WQ setup credential verify --name <id>       # live identity probe
$WQ setup credential readiness --name <id> --pool <id>  # host can use it
$WQ setup intake show|set|clear                # GitHub Issues capture
$WQ help setup
```

A git URL with no checkout is cloned into `<cloneRoot>/<repoKey>/base` — the
pool's warm-base path, so provision fetches it rather than cloning twice
(`--no-clone` refuses instead). The URL must be `https://` or `git@`; a
local path is refused. On win32 / WSL, wire host git/gh first
([windows-host.md](windows-host.md) § GitHub) then clone that URL. `--path`
inspects; it does not become the warm base. After fleet login, prove native
addons under cursor-agent's Node (`ensure-host-native-addons.js`) before the
onboarding smoke. The proposal reads GitHub branch
protection via `gh` (classic rules **and** rulesets); when it cannot, it says
`unread` and keeps `requirePullRequest=true` rather than guessing.

Dry-run is the default. `--apply` writes host plumbing (`pool.config.json`) and
the server profile together; it refuses invented gate commands (UNRESOLVED until
you pass `--gate-command` or the tree evidences a real script/CI line). It does
**not** schedule `workq-pool redeploy` while work may be in flight — it tells you
when redeploy is required.

`repoKey` is the catalog seed key (`workq`), not `owner/name`. Writes need
manage on the pool and are attributed; the API enforces the self-review floor
and refuses plumbing on the **server** profile (host plumbing is written only by
`onboard`/`update --apply`). This surface is **captain-only** — it is not on the
worker CLI.

**Honest scope today:** `$WQ repo show` prints the stored server profile plus
**observed** host-resolved policy from `poolProvision` when an orchestrator has
reported it (full layers + provenance). Absent / stale / multi-host conflict /
unavailable (workers list failed) are labeled explicitly — never collapsed into
"using defaults". Profile writes still record fleet intent on the server; host
overlays keep winning until a profile leaf overrides them.

**Tune via `$WQ repo` when:** onboarding a new seed, reconfiguring an existing
one, or changing the fleet bar (gates, default base, e2e strategy, review lenses,
load ceiling).

**File a ticket instead when:** secrets rotation, harness binary paths,
dashboard/TUI, pool cache consumption, or code that _consumes_ policy (playbook
gates). Those stay out of the captain apply path.

## 1. Understand it before you split it

You are the only one who sees the whole request. A worker sees one task and the
brief you wrote, so anything you did not work out becomes something they guess
at — separately, four different ways.

**Read memory first** — before you split, and again before you write a brief.
The index holds the repo map, how codebases interact, and ambiguous terms; each
`repo:<key>` holds conventions and known friction a worker should not rediscover.

```bash
$MEM list [--json]            # enumerate scopes (no host shell)
$MEM health [<scope>] [--since <when>] [--json]  # fullness + at-cap + churn
$MEM read index
$MEM read repo:<key>          # each repo the request might touch
$MEM read user:<key>          # when you know who asked
```

Missing documents are fine: proceed without inventing memory. You **read** only
— `$MEM` refuses write; the librarian owns that path. Detail:
[reference.md](reference.md#memory-read-only).

Read the code. Read the ticket. If a term in the request (or in the index
**ambiguous terms** section) could name more than one thing, **ask the person
now** — "the engine" is a different week's work depending on which engine, and
no amount of grep tells you which they meant.

Do the investigation that only makes sense once: which files, which layer, what
the existing pattern is, what already broke last time. That finding belongs in
every brief you write, not rediscovered per worker.

**Cross-repo requests.** When the index **cross-repo interactions** section says
two codebases interact and the request touches both, file **separate items per
repo** with `--depends-on` / gates — never one item that asks a worker to cross
repos (workers do not). See [Chains](#chains-when-one-task-needs-another-first).

## 2. Split it so the pieces do not collide

The test of a good split is that each task can be finished, reviewed and merged
without waiting on another one.

- **Split by seam, not by size.** Four files in one module is one task. One file
  touched by four tasks is a merge conflict you scheduled on purpose.
- **Sequence what genuinely depends.** If B needs A's interface, file both and
  link them — do not hold B back in your head. See
  [Chains](#chains-when-one-task-needs-another-first).
- **One reviewable change each.** If you cannot describe the PR in a sentence,
  it is two tasks.
- **Say what done means.** A task with no finish line comes back as "I did some
  of it".
- **UI-visible work: put the proof command in the brief.** "Done" means
  before/after **image** shots (`$EV add --kind image --file …`, or a fetchable
  image URL) from a named harness or `*-shots.mjs` path (or an explicit escape
  hatch) — not `sips`/path text standing in for the PNG. Workers follow the
  playbook UI evidence bar; briefs that omit verification push them toward thin
  prose. See `docs/suite/workq/engineering/testability.md` (§ Dashboard
  Playwright harnesses) and [reference.md](reference.md#the-brief).

For a batch out of a tracker, read the tickets first — `jira-integration` if
they are Jira; GitHub Issues if that repo's intake is on. Four tickets are not
automatically four tasks: two may be the same bug, and one may be a question
you can answer in a sentence without spending a worker at all.

## 3. Write the brief

The brief is the whole of what a worker gets. `--title` is a label; `--brief` is
the job.

Before drafting, `$MEM read repo:<key>` (and `user:<key>` when you know who
asked) so conventions, known friction, and how they like work delivered land in
the brief instead of being rediscovered. Missing docs: proceed; do not invent.

**Every `--brief-file` opens with a Repository header** — repo identity plus the
https GitHub URL. Put it first so it lands in the worker's "request, verbatim"
above the problem statement. Burying `owner/name` in prose (or only naming a
pool seed key) is how workers guess create vs workq.

```markdown
## Repository

- **scopear/workq**: https://github.com/scopear/workq
```

Multi-repo: list each seed / remote. No codebase: say none and why (e.g. process
or docs-only with no checkout). Prefer `owner/name` with the clickable
`https://github.com/...` link; the pool catalog key alone is not enough here.

### Pick one intake — never both

GitHub Issues intake and `$WQ create` are **two queues**. Using both files two
items. A `bug`-only GitHub issue is a tracker note: the poller never sees it,
workers never claim it, and the closer never runs when the work finishes.

**GitHub Issues intake (preferred for this repo when auto-grab is on — Setup UI
tracked in scopear/workq#984) — independent tickets only.** Label the issue
with the **intake label** and stop. This fleet's label is **`fleet`** (domain
default is `workq` — check `GET /v1/admin/github-issues-intake` when unsure).
Leave the issue **unassigned** — intake polls `assignee=none`. Capture only
runs when auto-grab is enabled on the server; label + unassigned alone is not
enough.

```bash
gh issue create --repo scopear/workq --label bug --label fleet \
  --title "Companion centre-pivot writes metadata but nothing moves" \
  --body-file /tmp/task-1.md
# Do not $WQ create. Do not assign it to yourself.
```

The issue body **is** the brief (Repository header first, same sections as
below). Intake captures it, the notifier comments as it runs, and
`closeOnTerminal` closes the GitHub issue when the item is done.

**Never put ordered / dependent work on GitHub Issues auto-grab.** Intake does
not wire workq dependency DAGs. Parallel `fleet` issues race across slots (and
across pools) with no landing gate. If B must wait on A — including migrate →
delete, stacked PRs, or “land X before Y” — file with **`$WQ create
--depends-on`** (see [Chains](#chains-when-one-task-needs-another-first)). You
may still open GitHub issues **without** `fleet` as tracker notes and
`$WQ issue-link` them — add `--filed-by-fleet` when you opened the issue
yourself, so the item's terminal state closes it instead of leaving an orphan.
Do not invent body/label `Depends-on:` conventions for
intake; that is explicitly out of product scope.

**`$WQ create`** when there is no GitHub issue (Jira, Slack, captain-only
brief), when you need a **dependency chain**, or when you need `--session` /
`--priority` on the card immediately:

```bash
$WQ create --title "Companion centre-pivot writes metadata but nothing moves" \
  --brief-file /tmp/task-1.md \
  --repo scopear/workq \
  --pool mac-studio \
  --url https://tracker.example/BUG-1 \
  --session cursor-2026-07-26-pivot --requester "<the user's name>"
```

If that `--url` is a GitHub issue, do **not** add the intake label (`fleet`) —
the workq item is already the intake. Adding `fleet` afterwards is a duplicate.

Pass `--repo <owner/name>` whenever the brief has a Repository header. Unscoped
cards do not appear under a positive board Repos filter.

Pass `--pool <id|name>` when filing with a personal key that reaches more than
one pool (or when you want to be explicit). A pool-bound API key already
settles the tenant — omit the flag, or pass the bound id/name. With several
reachable pools and no `--pool`, create refuses and prints the candidates
rather than silently picking one (`whoami` lists bound + reachable). Session
users omit `poolId` unless you pass `--pool` → items land on `__unassigned__`.
The migration `__unassigned__` sentinel is never a candidate.

Add `--auto-merge` for low-risk fleet chores in repositories where the bot is
allowed to merge. It still waits for green checks and resolved review feedback;
it only removes the separate workq approval. Change the choice later with
`$WQ set-auto-merge <id> --on|--off`. If GitHub refuses a gated merge, the first
attempt records an `auto-merge blocked: …` repo warning so later items wait for
a human instead of repeatedly spending landing agents.

Pass `--session` on everything you file for a person who is in the room with you.
It attaches a back-channel, and without one every word the fleet says about that
item — the greeting, the plan, the question it is stopped on, the final summary —
is written to the timeline and delivered to nobody. Pick one stable string per
session, reuse it across the batch, and keep it recognisable so you know which
dispatch a later ping belongs to. `--requester` is who is waiting, and defaults to
the account behind your key.

Whether that delivery reaches anything depends on the server: it runs
`WORKQ_CURSOR_NOTIFY_CMD` per notification and raises a desktop notification when
`WORKQ_CURSOR_NOTIFY_DESKTOP` is on. Nothing can push into an open editor chat, so
neither replaces §4 — but with the desktop ping configured, a question that would
have waited for your next poke gets one within seconds. Say so if the user asks
why they were not told: the delivery is configured on the server, not by you.

Write it for a competent engineer who has never seen this code. Pin **outcomes
and constraints**, not edits — a prescribed mechanism reads as an approved
decision and outranks the worker's discovery. See
[reference.md](reference.md#outcomes-not-edits) for the before/after.

Workers judge a feature brief against a named
[completeness rule](../workq-playbook/reference.md#feature-plan-gate-ask-vs-proceed)
(acceptance criteria, clear scope boundary, no unresolved ambiguous term,
assumable open choices). A brief that meets it **builds without a plan
round-trip** — the worker `say`s what it is doing and which assumptions it made.
A thin or ambiguous brief still stops for `plan_approval`. There is **no**
captain-set "brief is the plan" flag; write the sections below so the document
itself decides. Do not rely on the old habit that every feature parks for plan
approval.

- **Repository** first (above) — identity + https GitHub link
- What is wrong or wanted, in plain terms, and how to see it
- **Where to start** — file/symbol **pointers** so they find the code fast, not
  "remove X" / "add Y to Z"
- What done looks like, concretely enough to test (for UI: the harness /
  shots script that produces before/after images)
- What you already ruled out, so nobody re-walks your dead ends
- What is **out of scope**, which is how you stop a bug fix becoming a refactor
- **Point at the bar** — reference
  `.cursor/rules/engineering-quality-bar.mdc` (mirrored from
  `apps/pool/rules/…`) rather than restating engineering standards per ticket

**Brief economy (complete ≠ long).** Every brief becomes an agent's prompt and
shares the handoff with triage, chain context, and memory — so padding crowds
out the lines a worker can act on. There is **no** character or word cap: a
complex ticket may need length; a number would be gamed by writing thinner
rather than tighter. Cut what does not earn its space.

| Usually earns its space                             | Usually does not                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Outcome and concrete done-criteria                  | Restating always-applied rules (local CI, mirrors, quality bar) — point once              |
| File/symbol **pointers**                            | Paragraphs explaining what a file already does                                            |
| Ruled-out dead ends with enough signal to skip them | Investigation narrative a worker cannot act on                                            |
| One clear scope boundary                            | The same fence three times ("Out of scope" + "Boundary with siblings" + in-body warnings) |

Self-check before `$WQ create`: could a competent engineer who has never seen
this code act from this alone? Does any line survive only because it sounds
thorough? Prefer a pointer over a restatement. Worked before/after from a real
long brief: [reference.md](reference.md#brief-economy).

**Suggested shapes stay unverified.** If you want to float an implementation
idea, put it under a heading like "one possible shape — verify against the repo
before adopting; discovery overrides this". A worker that finds a better-fitting
existing pattern is _expected_ to deviate. When you float a name or detail the
worker may override, say so explicitly so they do not park to re-ask it.

**Do not name a shortcut as the plan.** Words like "minimal fix", "quick", or
"just" describe expected size — never the approach. State the outcome and the
constraint instead ("break the init cycle without lazy/inline imports", not
"prefer a minimal import/init fix").

**Deletions get a cost question.** When the outcome removes eager / prewarm /
preload work, the brief must ask where that cost moves and require the PR to
answer — not order the removal alone.

`--brief-file` is the normal way in: write the brief to a file, review it, file
it. A brief typed as a shell argument is a brief that got shortened to fit. The
file itself should start with the Repository header so copy-paste create
examples never omit it.

Filing does not assign. Work lands in `todo`; an orchestrator triages it and
picks a worker. Use `--key` when a dispatch script might run twice.

**Reviewing a pull request is not a brief.** When the job is "what do you make of
this PR", there is nothing to describe — the change is the request. `$WQ review
<pr-url>` files it, and the fleet reads, reviews and posts. Add `--monitor` and the
item stays with the pull request, reviewing again each time the author responds,
until it merges or closes; without it, one pass and done. That choice is worth
making per PR rather than per batch: a watch holds a slot for as long as the author
takes, which is right for a change you need landed and expensive across a backlog.
Authors parking the PR they just opened use `$WQ submit --pr`, not `$WQ review`.

## Priority: jump the queue without displacing work by accident

Every item has a priority: `low | normal | high | critical`. The fleet dequeues
**critical > high > normal > low**, then oldest first within a level.

**Captain default: omit `--priority` so creates stay `normal`.** Do not pass
`high` or `critical` unless the person you are working for explicitly asks for
that urgency (or later asks you to bump with `set-priority`). Filing a batch of
“important” chores as high empties the high lane and hides real jumps.

```bash
$WQ create --title "…" --brief-file /tmp/a.md          # normal (default)
$WQ set-priority wi_12 high          # only when the human asked to bump
$WQ set-priority wi_12 critical      # emergency only — see below
```

- **high** — jumps the normal backlog without interrupting running agents. Use
  only on request.
- **critical** — prod-down / all-hands. Prefer this only when waiting for a free
  slot is not acceptable. When the pool has no capacity, **critical can displace
  a running item**; that victim is parked as `waiting_resume` (not cancelled,
  not escalated), so the fleet reclaims it when a slot frees — no `$WQ take`.
  Legacy victims already stuck in `needs_human` from older preempts: **`$WQ unstick <id>`**.
  If you have time to scale the pool instead, do that — see
  `docs/suite/workq/engineering/pool/capacity.md`.

Pool-managed agents cannot file or raise to `critical` (they get an error). A
captain with a personal API key can; that is intentional so a human owns the
call.

## Smart seats: pin sparingly, or let policy route

Smart seats are a **reserved** class (`agents.worker.classes.<id>` with
`smart: true`) — usually a high-reasoning model. Pinning is how you spend that
reservation on purpose. The fleet also has a configurable **routing policy**
that can send difficult or risky triage onto smart seats without a pin; the
orchestrator owns those signals (see
[workq-orchestrator](../workq-orchestrator/SKILL.md#fleet-routing-policy)). Your
job is the explicit override.

**Precedence (do not re-derive):** captain pin → fleet routing policy → default
general seats. A pin always wins over policy.

```bash
$WQ create --title "…" --brief-file /tmp/a.md --smart          # any smart class
$WQ create --title "…" --brief-file /tmp/a.md --class opus     # named class
$WQ set-smart wi_12 --smart                                   # retarget / pin later
$WQ set-smart wi_12 --class opus
$WQ set-smart wi_12 --clear                                   # drop the pin; policy can apply again
```

`--smart` and `--class` are mutually exclusive on create. Bare `set-smart <id>`
defaults to `--smart`. Unknown class names are refused with the known list.

### When a pin earns its keep

Pin (or `--class` onto the smart-marked class) when **you** already know this
ticket needs the reserved seat and waiting for one is acceptable:

- Cross-cutting correctness: authz / tenancy / pool boundaries, state machines,
  concurrency, harness lifecycle — the kind of work where a wrong answer is
  expensive to unwind.
- A redesign or investigation where the brief itself says a strong model, or
  the human asked for the smart seat by name.
- A one-off that policy would miss (policy is triage difficulty/risk only;
  “this looks ordinary but must not fail” is a captain call).

### When to leave it alone

Leave the pin off when policy or a general seat is enough:

- Docs, copy, mechanical renames, focused one-file fixes with an obvious test.
- Ordinary product work where triage `difficulty` / `risk` already encode the
  need — let the configured policy claim `prefer-smart` or `smart-only`.
- A batch of chores. Pinning every item turns the smart partition into a second
  queue and starves the work you actually reserved those seats for.

### What `smart-only` starvation looks like

A captain pin with `mode: smart` resolves to **`smart-only`**: the item waits
until a smart-marked seat is free. It does **not** overflow onto general seats.
On the card that shows up as claim deferral `waiting-for-smart-seat` (wait it
out — not an actionable `blocked` interrupt). Policy can choose the softer
`prefer-smart` (smart first, then any general seat); a pin cannot.

If every interesting ticket is pinned, and you only have one or two smart seats,
the pin queue never drains while general seats sit idle. Check
`$WQ fleet --digest` and `$WQ show <id>` (pin + deferral) before stacking more
pins. Clear a pin with `set-smart --clear` when the ticket no longer deserves
the reservation.

**Limits, reset, and parks** (scopes, precedence, `$WQ token-usage-reset`,
hard-limit vs capacity `waiting_resume`, unenforceable harnesses) live in
[reference.md — Token limits and parks](reference.md#token-limits-and-parks).

## Chains: when one task needs another first

File the whole plan at once and let the queue hold the order. The alternative —
keeping the sequence in your head and filing B when A lands — makes you the
scheduler, and you are a scheduler who leaves at the end of the session.

**Chains are `$WQ create` only — not GitHub Issues `fleet`.** Auto-grab has no
dependency graph. Filing A then B as sibling `fleet` issues is how order is
lost. Use `--depends-on` below; keep any GitHub tracker issues unlabelled for
intake (or `bug` only) and link them after create.

**Cross-repo is a chain, not a single item.** Workers never cross repos. When
`$MEM read index` shows a **cross-repo interactions** line that applies and the
request touches both sides, file one item per repo, link them with
`--depends-on`, and put the shared finding in every brief. One ticket that names
two codebases is a ticket no worker can finish.

```bash
A=$($WQ create --title "Exporter interface" --brief-file /tmp/a.md --json | jq -r .id)
$WQ create --title "CSV exporter"  --brief-file /tmp/b.md --depends-on "$A"
$WQ create --title "JSON exporter" --brief-file /tmp/c.md --depends-on "$A"
```

Omit `--gate` (or pass `--gate merged`) so B and C wait until A is **complete**
(`done` / merged onto the base). That is the default: the next worker starts from
a tree that already contains A's change. A blocked item is never offered to a
worker, so B and C sit in `todo` — visible, attributed, with their briefs written
while the plan was fresh — until then.

Opt into stacked-PR throughput only when you accept rebasing onto a moving branch:

```bash
$WQ create --title "CSV exporter" --brief-file /tmp/b.md --depends-on "$A" --gate review
```

Choose deliberately — the gate is the whole difference in how long a chain takes
and what the next worker's tree looks like:

- **`merged`** (default when `--gate` is omitted): B starts only once A is
  `done`. Prefer this for most chains.
- **`review`** (opt in): B starts as soon as A's PR opens, branched off A's
  branch, and rebases when A merges. Four parts cost roughly one review cycle
  instead of four, at the price of a stacked branch whose base can move.

Say **why** in `--reason` on the edge, not only in the brief: the worker is told
it was waiting, and a worker that does not know what it was waiting for cannot
tell when the reason has stopped applying.

```bash
$WQ depends show <id>                        # the chain, with live status
$WQ handoff <id>                             # one item's place in it, in full
$WQ depends rm  <id> <otherId>               # unblocks it now
```

Three things to know before you build a chain:

- **Decide the shape before you file it.** `--depends-on` on `create` is the only
  reliable way to make an item wait. Filed unlinked, it is claimable within
  seconds, so `depends add` afterwards is refused unless the item is still parked
  behind an edge that has not cleared — extending a block is safe, inventing one
  on claimable work is a race with the worker picking it up. If you really know it
  has not started, `depends add --force --reason "..."` is yours to use and is
  recorded on the edge.
- **A chain is a serial plan.** Three items behind one are three workers not
  working. Link what genuinely depends and leave the rest parallel — if half your
  batch is one line, you have described an order of work, not distributed it.
- **Death cascades.** Cancelling A cancels everything waiting on it, because that
  is what calling off a line of work means. `cancel` refuses the first attempt and
  lists what else would go; `--cascade` is you saying yes to all of it. A worker
  _rejecting_ A escalates its dependents to `needs_human` instead of binning them,
  so you get to decide — one agent's judgement should not quietly kill three of
  your tickets.
- **Raising a gate mid-flight.** `depends gate <id> <otherId> --set merged` changes
  an existing edge. If the dependent already started under the old gate and the
  new one is unmet, the first call refuses and names the wipe; `--yes` then
  scorches that run back to clean `todo` (not cancel) so it stays blocked until
  the upstream actually reaches the new gate.

Rings are refused outright, forced or not, and so is an edge pointing at work that
was already rejected: both produce a ticket that looks like it is waiting and is
actually stopped. An item may wait for at most 8 others — past that you are
describing a release, and the release should be its own item with the parts hung
off it.

When a link can never clear — A was rejected, or somebody deleted it — the ticket
behind it is not blocked in any useful sense: it is stopped, and no amount of
waiting fixes it. `$WQ blocked` lists those alongside the questions waiting on you
and prints the command to cut the link, because that is the decision:

```bash
$WQ blocked                      # includes work stuck behind something that died
$WQ depends unstick <id>         # cut every dead link at once → it goes back in the queue
$WQ cancel <id> --reason "..."   # not worth doing without it → say so and close it
```

Cutting the link makes the item claimable; it does not make it possible. Whatever
A was going to produce still has not been produced, so a worker handed the freed
ticket will go looking for it. Update the brief or leave a note saying what
changed before you let one near it.

The one time to start a ticket over its own block is when you know the code it
needs is somewhere the gate cannot see: `$WQ claim <id> --force`. Workers cannot
do this — the server refuses it from anything the pool runs — so it means you have
made a judgement, and the worker you hand it to may find the ground missing.

## Campaigns: grouping related work (not ordering it)

A campaign is a named, tinted grouping of related tickets in one pool — so you can
ask "how's this initiative doing?" without listing everything and eyeballing
titles. File with `create --campaign <id|name>`, or attach later with
`campaign add`. Glance with `campaign show`; `campaign list` separates active
from archived.

A campaign does **not** order work — that is still `--depends-on`. It does **not**
replace a prose plan under `docs/campaigns/` when the effort needs a design doc.
It **can** declare an integration branch and shared guidance (below). See
`$WQ help campaign` for the verb family and valid tint ids.

### Campaign usually means a feature branch

When the tickets are one coherent effort that should land as a single
feature → default PR, declare the integration branch **at campaign creation**
(**D-2**). Create owns the branch: it is created off the repo default and fails
closed if it cannot — do not leave that to the first worker.

```bash
$WQ campaign create --name "Campaign support" --tint teal \
  --description "G1…G7" \
  --base feature/campaign-support --repo scopear/workq
$WQ create --title "…" --brief-file /tmp/g1.md --repo scopear/workq \
  --campaign "Campaign support"
```

Members without their own `--base` / `set-base` inherit the campaign base
everywhere a base is resolved (handoff, fork, Verify, landing gate) — **D-1**.
An item that declares its own base keeps it (stacked `workq/<depId>`, one-off
retargets). `$WQ show` prints effective `base:` with `(item-declared)` or
`(campaign default)`.

**When not to use a shared branch**

- A handful of **unrelated** tickets that only share a tint for board filtering —
  create the campaign **without** `--base`. A shared branch forces a fake
  integration PR and couples landings that should not wait on each other.
- Work that **must reach the repo default incrementally** (hotfix, migrate-then-
  delete that has to ship mid-campaign, anything reviewers need on the default
  before the rest exists). File those against the default; keep the campaign as
  a tint only, or split the must-land-now slice out of the branched campaign.

Tint-only campaigns are still useful. Do not invent a branch to make the board
look tidy.

### File the landing item when you create the campaign (**D-3**)

The landing item is an ordinary work item — no auto-filing, no second queue.
File it **up front**, not after the first member PR lands, so the campaign's
shape is visible on the board and you cannot forget the close-out.

Shape:

- **PR base** = the repo default (from RepoPolicy / the checkout's base-branch
  rule — not a hardcoded name in this skill). If the landing card is attached to
  the campaign, pass `--base <repo-default>` so **D-1** does not inherit the
  feature branch as the PR target.
- **PR head** = the campaign integration branch. Put that in the brief: open or
  update `feature/…` → default; do not invent a parallel head.
- **`--depends-on <each member>:merged`** so it stays blocked until every member
  has landed on the integration branch.
- **`--smart`** (or `--class <smart-class>`) when this card is also the G5
  accumulated-branch review — C1 pin only (**D-8**); never a harness-id flag.

```bash
# After filing members G1…Gn (ids in $MEMBERS):
# <repo-default> = RepoPolicy quality.defaultBaseBranch (or the checkout rule)
$WQ create --title "Land Campaign support: feature → default" \
  --brief-file /tmp/land.md \
  --repo owner/name \
  --base <repo-default> \
  --campaign "Campaign support" \
  --smart \
  --depends-on "$M1:merged" --depends-on "$M2:merged" # …each member
$PIPE set <landing-id> --template integration-review   # G5 mode
```

Point the brief at
[integration-review](../workq-playbook/workflows/integration-review.md) for the
accumulated-diff verdict, and at
[campaign-integration-e2e](../../../../docs/suite/workq/engineering/campaign-integration-e2e.md)
when you also want G6.

**More than eight members.** One item may wait on at most `MAX_DEPENDENCIES`
(8). Past that the server refuses: work that needs more wait-edges is a **plan**,
not a ticket — file wave / plan items that each depend on ≤8 members at
`:merged`, then hang the landing item off those waves. Do not silently omit
members from the DAG.

### Pin the integration gate (G5 / G6 via C1)

| Pin                       | Reach for when                                                                                                                     | How                                                                                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **G5** integration review | The campaign has a shared branch and you need one answer: did the merged subtasks do the thing, and did any overreach?             | Landing (or campaign-close) item with `--smart` / `--class`, pipeline template `integration-review`. Reviews `origin/<default>...origin/<feature>` — not a re-run of per-member self-review. |
| **G6** Codex / smart e2e  | The integration tip needs automated full-corpus e2e evidence before a human lands feature → default (product / UI / runtime risk). | Sibling ordinary item: `--base <feature>` (or inherit), `--smart` or `--class <codex-smart-class>`, `--depends-on …:merged`, **no** auto-merge. Filing shape lives in the suite doc above.   |

**Both** when the campaign is product-visible and cross-cutting (review for
completeness/overreach **and** e2e on the tip). **G5 alone** for skill/docs /
prompting campaigns where there is no meaningful e2e surface. **G6 alone** is
unusual — prefer G5 whenever there is a shared branch to judge. Neither invents
a second model or harness chooser (**D-8**).

### Write campaign guidance instead of repeating the goal (**D-4**, **D-6**)

Shared guidance is a **separate field** from `description` (drawer header /
short label). Set it with `campaign create` / `campaign set` using
`--guidance "…"` or `--guidance-file <path>`, or edit the item drawer
**Campaign** tab → **Shared guidance**. Prefer a UTF-8 file for multiline
text: the CLI preserves line breaks and literal shell characters. Guidance
must be non-empty and at most 4,000 characters; storage trims surrounding
whitespace. `campaign set <id|name> --clear-guidance` clears it. The three
guidance options are mutually exclusive; a guidance-only update is valid.

```bash
$WQ campaign set "Campaign support" --guidance-file /tmp/campaign-guidance.md
$WQ campaign show "Campaign support"
```

Set guidance before filing members so their opening prompts contain the
shared context. Changing it does not interrupt an active run. To verify live
delivery, inspect each worker's original transcript and actual PR base — see
[campaign smoke proof](reference.md#campaign-smoke-proof).

**Precedence (say it this way):** the ticket defines the work; the campaign
explains why the ticket exists. Guidance must not read as instructions that
outrank `## The request, verbatim`. Guidance that sounds like a second brief
("also fix X", "while you are there widen Y") causes the per-ticket overreach
the integration review exists to catch — write the goal and constraints, not a
shadow ticket.

### Retrofitting a branch mid-flight

Honest common case: members already opened (or merged) PRs against the repo
default before anyone wanted a shared branch.

```bash
$WQ campaign set "Campaign support" --base feature/campaign-support --repo scopear/workq
```

`--base` on set still owns the branch (creates off the default if missing;
reuses an existing related branch). What is **no longer recoverable** without
deliberate git surgery you should not pretend is routine:

- PRs **already merged to the default** stay on the default — they do not move
  onto the new feature branch.
- In-flight member PRs that already target the default need an explicit retarget
  / rebase onto the feature branch (`set-base` / `gh pr edit --base`) if you
  still want them on the integration tip; silent inheritance only helps
  **new** silent members.

After retrofit: file (or fix) the landing item with `:merged` deps for what
remains, write guidance if missing, and pin G5/G6 for the tip you actually have.
Do not rewrite history to un-merge early landings into the feature branch as
part of ordinary captain dispatch.

## 4. Follow it without babysitting it

You are the requester on everything you file. Nothing arrives in your session on
its own, so a worker's question reaches you only when you come and look — and a
question nobody answers is a worker stopped dead. But sitting and staring at a
watch is a waste of the session that dispatched the work.

So check in between your own tasks — prefer the quiet forms:

```bash
$WQ blocked                      # anything waiting on me? quiet when no
$WQ watch --once --attention     # same idea while you were following a run
$WQ fleet --digest               # capacity + queue, no roster spam
$WQ runs --since today --group-by role   # fleet-health over the run corpus
$WQ calibration --since month            # estimate-vs-actual per repo × type
```

`$WQ blocked` is the cold answer to "anything waiting on me?": questions,
escalations, review ready for your approve, stalled CI, stuck deps. It stays
quiet when the answer is no. `watch --once --attention` (alias `--blocked-only`)
keeps only those interrupts while you have a cursor on in-flight work — routine
"still working" milestones stay out, and a clean check-in prints
`Nothing needs you.`

`$WQ runs` answers questions _across_ runs — how many worker turns today, by
role, whether a session resumed, whether content like a memory brief showed up
(`--grep`) — over the server corpus, with retention completeness stated. Prefer
it over hand-grepping `~/.workq-pool/logs/runs`. One stuck item still uses
`transcript <id> --tail`.

Full `watch --once` still exists when you want the firehose (greetings, plans,
every milestone). It remembers how far you have read, so poking it twice does
not replay the run. Prefer attention / blocked for day-to-day captain loops.

The rhythm that works: dispatch, do your own work, poke with `blocked` or
`watch --once --attention`, answer what is blocking, carry on.

An item in review is not idle, and the watch says which kind of waiting it is —
"Waiting on CI", "Waiting for a reviewer", "Approved on GitHub", "Review: 3 open
comments" — the first time each one becomes true, with when it was last checked.
The same line is on `list` and at the end of the pipeline in `show`:

```bash
$WQ list --status under_review   # a lane of tickets, each with its hold-up
$WQ show <id>                    # the `waiting:` line, above the raw readings
```

Two of those answers are about you. **Approved on GitHub** means the PR has a tick
and nothing will merge until you approve it here (`$WQ approve <id>`), which hands
it back to an agent to land. And a hold-up "checked 40 minutes ago" is not slow CI:
the watcher has stopped, and the fix is on the server, not the ticket.

Items you filed with `review --monitor` sit in the same lane and read from the
other side: **Waiting for the author** means the review is posted and their move,
**They have responded** means the next pass is queued behind a quiet period so it
reads their whole answer. Neither needs you. They finish themselves when the pull
request merges or closes.

Coming back cold — a new session, a day later, no memory of what you sent out:

```bash
$WQ blocked             # anything waiting on you, oldest first; quiet when no
```

Sit and wait instead when you have nothing else to do, or when you are following
one thing closely:

```bash
$WQ watch --attention          # only interrupts; babysits past each one (use --stop to exit)
$WQ watch --once --attention   # check in and exit; quiet when nothing needs you
$WQ watch --attention --repo workq   # scope to repos you own (--exclude-repo drops others)
$WQ watch                      # full firehose of everything you filed
$WQ watch wi_a wi_b            # just these
$WQ watch --timeout 600        # bounded, when something else needs the terminal
$WQ watch --since 2h           # re-read from a point in time, not your cursor
```

## 5. Influencing work in flight

Four channels look adjacent in help. They are not interchangeable — pick by who
must read the text and when:

| Command     | Who reads it                                                           | When it works                                                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `note`      | Timeline / dashboard. Working agent **only at adoption** (`next --id`) | Stage commentary and lookups. Not a channel to a live agent after adoption.                                                                                                                                             |
| `direct`    | Next claim / resume prompt (standing direction)                        | Before claim or across a park (`todo`, `waiting_resume`, …). Survives lease drop.                                                                                                                                       |
| `steer`     | Live agent (soft-stop + reinject)                                      | `in_progress`, `waiting_feedback`, `under_review`, `needs_human`. Refused on `todo`.                                                                                                                                    |
| `set-brief` | Durable Request on the item                                            | Amending intent. Do not use `note` as a substitute. Captain / personal key only. For screenshots: create → `$EV add --kind image` → `set-brief` with `![…](/evidence/<id>)` (two-step server-side; no pre-item upload). |

When a run is already going and you need to change what it is doing — not park
it, not kill it — inject direction:

```bash
$WQ steer <id> --text "Skip Cypress — unit-test the resolver only."
```

That is **not** `$WQ say`. `say` messages whoever asked for the work; it does
not reach the agent. `steer` queues `pendingSteer` for the pool to reinject into
the live Cursor turn. Until the pool consumes steers, they sit pending
(last-write-wins if you steer again). Same claim continues — this is not a new
lease. Contrast: `ask` parks for a human answer; `cancel` kills the agent and
rejects the item. Full contrast table in
[reference.md](reference.md#steering-a-live-run).

```bash
$WQ blocked                             # what is waiting on you, and for how long
$WQ feedback <id> --text "<answer>"     # answer a question; work resumes
$WQ steer <id> --text "<direction>"     # inject into the live agent (does not park)
$WQ direct <id> --text "<direction>"    # standing direction for the next claim/resume
$WQ say <id> --text "<text>"            # message the requester (does not steer)
$WQ approve <id>                        # land a PR that is approved on GitHub
$WQ take <id>                           # adopt a *real* escalate (human must finish)
$WQ unstick <id> --reason "…"           # false needs_human → todo (fleet again)
$WQ recall <id>                         # where it got to, and why
$WQ transcript <id>                     # what the agent actually did
$WQ runs --since today --group-by role  # fleet-health across many runs
$WQ cancel <id> --reason "<why>"        # call it off and stop the agent
$WQ designloop-drive <id>               # captain owns a Designloop lease (no UI button)
$WQ designloop-undrive <id>             # hand Designloop back so overlay Submit can wake a worker
```

**Designloop Drive is captain-only — there is no board button.** `$WQ designloop-drive`
claims the lease and stays in `design_review`; overlay Submit is refused (`409`)
until `$WQ designloop-undrive`. Refuse Drive while a watcher already holds
`in_progress` (same-worker Open session). This is **not** `$WQ takeover` (that
rescues a stuck implement run).

**`needs_human` has two exits — pick the right one:**

| Situation                                                                      | Do this                                                                        |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| Human must finish or decide (real escalate)                                    | `$WQ take` → work it / answer / cancel                                         |
| False escalate — return to fleet (critical preempt, wrong escalate, “unstick”) | `$WQ unstick <id> --reason "…"` → `todo`. Do **not** take+release              |
| After take, you change your mind and want the fleet again                      | Still **unstick** (it releases then clears). Plain `release` re-parks on human |

**`take` + `release` does not unstick** — it puts the item back on the human pile
(`Released …; still waiting on a human.`). That is intentional for real
takeovers; use `unstick` when agents should own the work again.

Answer questions quickly and completely. A worker that asked is stopped, and a
half-answer buys a second question and another wait. If the answer is genuinely
the user's to give rather than yours, ask them — but ask for everything the
worker needs in one go, and put the worker's own question in front of them
rather than paraphrasing it.

When something comes back for review, read the PR against the brief you wrote.
If it solved a different problem, that is usually a brief that was ambiguous —
worth fixing in the next one rather than only in the PR.

For a **non-trivial fleet PR**, do not do one serial generalist read yourself.
Fan out parallel lens Tasks (via
[reviewer-engine](../reviewer-engine/SKILL.md) — including `pattern-conformance`
when the diff shape calls for it; collapsed distinctions live inside
`correctness`), run those Tasks on fast models, and keep your own tokens for
synthesis and the write-up.
Wall-clock cost is the slowest lens, not the sum — serial captain reading is
what made reviews ~10× too expensive.

Approving is not finishing. `$WQ approve <id>` on an item with an open PR sends it
back to `in_progress` and hands it to an agent to land: rebase if it conflicts, fix
the checks if they are red, merge, then report. So keep watching after you approve
— that phase can ask you a question or escalate like any other, and the item is
only `done` once the change is actually in. An item with no PR, or one whose PR is
already merged, closes out immediately as before.

**Open PRs against the item's declared target base**, or the repo's default
branch when none is declared. Never open a PR against a session `wip/*` branch
unless the ticket explicitly says otherwise. Stacked dependency work still
targets `workq/<dependencyId>` while that dependency is open; once it merges,
rebase onto whatever it merged into (declared base on a campaign, otherwise the
repo default) and retarget there. Repo-specific defaults live in that checkout's
`.cursor/rules/` — not here.

**Fail-closed before you treat a PR as landed.** Approving or watching a merge
into `wip/*` is how the board showed done while the real landing branch lacked
the code. Before `$WQ approve` / celebrating a merge / filing follow-ups that
assume it shipped:

```bash
node $SKILLS/workq-playbook/scripts/assert-pr-base.js <pr-url> --item <id>
```

On refuse: leave a note, retarget (`gh pr edit --base <declared-or-default>`) or
file a retarget task — do not mark the parent done. A `workq/*` base only counts
as stacked while its dependency PR is still open (leftover refs after
squash-merge fail closed). Intentional session bases opt in with the
`allow-wip-base` PR label.

## 6. Report back like a person

The user asked you, not the queue. When work lands, tell them what happened, not
that a status changed: what was wrong, what fixed it, what is worth knowing, and
anything still open. Link the PRs. If one of four failed, lead with that.

## Analyst reports (when enabled)

The fleet Analyst advises; it does not file or claim work. When a report lands:

1. `$AN report latest` (or `report show <id>`), then `$AN topics show <topicId>`
   and walk deltas / observations named there — do not act on a summary alone.
2. Decide and act yourself (or file a worker ticket with a real brief).
3. **Record the intervention in the same sitting** — `POST /v1/analyst/interventions`
   with `topicId`, what you changed, and `expectedEffect`. Skipping this breaks
   the effectiveness loop the dashboard charts against.

Day-to-day detail and curl shape:
`docs/suite/workq/user/captain.md` (§ Analyst reports and interventions).
Engineering model: `docs/suite/workq/engineering/analyst.md`.

## Rules

- **Delegate by default.** You may do anything yourself; doing what a worker
  could have done is how a fleet ends up idle behind a busy captain.
- **Never file a task you could not do yourself from the brief alone.** If it
  needs context you have and did not write down, you have not finished writing.
- **Complete without padding.** Protect outcome, done-criteria, pointers,
  ruled-out dead ends, and one scope fence. Drop restated standing rules,
  file tours, duplicated fences, and investigation narrative. No hard length
  cap — see [Brief economy](#3-write-the-brief) and
  [reference.md](reference.md#brief-economy).
- **Ambiguity goes back to the person, not into a task.** Guessing on their
  behalf spends the whole fleet on the wrong thing at once.
- **Check capacity before a batch.** Five tasks into a fleet of one is a queue,
  not parallelism, and you should say so rather than imply speed.
- **Default creates to `normal`.** Omit `--priority` unless the human asks for
  `high` / `critical`. Reserve `critical` for true emergencies — it can bump
  running work into `waiting_resume` (claimable again without `$WQ take`).
- **PRs target the item's declared base (or the repo default), not `wip/*`.**
  Session branches are local scratch. Before treating a PR as landed, run
  `assert-pr-base.js --item <id>` (playbook) — refuse `wip/*` without the
  `allow-wip-base` label, refuse a `workq/*` base whose dependency PR is no
  longer open, and refuse a PR aimed at the repo default when the item declared
  a different base; leave a note and file a retarget task instead of marking
  done. Repo-specific defaults live in that checkout's `.cursor/rules/`.
- **Keep the human in the loop about their own work.** You are their view into
  the fleet; do not go quiet while five tasks run.
- **Never dispatch and disappear.** Nothing notifies you, so work you filed and
  stopped checking on is work that stops at the first question and stays
  stopped. `blocked` or `watch --once --attention` between your own tasks is
  the whole discipline — not the firehose.
- **Never claim work you filed to run it yourself by accident.** `take` is for
  escalations; `takeover` is for rescuing a stuck run. Both are deliberate.
- **Tune fleet policy with `$WQ repo`, not a worker ticket.** Server profiles
  are captain-only; host plumbing and skill/rule selection stay out of scope.

## Composing with other skills

- [jira-integration](../jira-integration/SKILL.md) — read the pile, resolve
  tickets to real requirements, write findings back
- [workq-playbook](../workq-playbook/SKILL.md) — how workers execute what you
  file; worth reading once, so your briefs land in the shape they expect
- [parallel-worktree](../parallel-worktree/SKILL.md) — if you do implement
  something yourself, do it in isolation like everyone else

More detail — every command, the item lifecycle, dispatch patterns — is in
[reference.md](reference.md). Standing a fleet or a repo up end to end (what to
probe, what to ask): [standing-up.md](standing-up.md) (POSIX) or
[windows-host.md](windows-host.md) (`win32` / WSL). Bootstrap chain detail and
host/system repair (pairing-first): [first-run.md](first-run.md). Why repo
onboard decides what it decides, and the dashboard surfaces:
[onboarding-a-repo.md](onboarding-a-repo.md).

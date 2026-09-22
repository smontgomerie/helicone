# workq-captain reference

Detail behind [SKILL.md](SKILL.md). Read that first. Standing a fleet or repo up
from nothing: [standing-up.md](standing-up.md). Bootstrap chain detail and host
repair (pairing-first): [first-run.md](first-run.md). Why repo onboard decides
what it does / re-open: [onboarding-a-repo.md](onboarding-a-repo.md).

If the [SKILL.md](SKILL.md) host probe said `win32`, stop and open
[windows-host.md](windows-host.md). This file is bash-only.

```bash
WQ="node $SKILLS/workq-captain/scripts/workq.js"
MEM="node $SKILLS/workq-captain/scripts/memory.js"
$WQ help <command>     # authoritative flags; beats guessing
$MEM read index        # fleet memory before split / brief
```

## Memory (read-only)

The captain reaches the **same** host store the pool uses
(`~/.workq-pool/memory/`, or `WORKQ_POOL_HOME` from captain `poolHome`). It does
not keep a second copy. Write belongs to the librarian; this wrapper refuses
.every verb except `read` / `list` / `health` / `help`.

```bash
$MEM="node $SKILLS/workq-captain/scripts/memory.js"
$MEM list [--json]           # enumerate scopes without host shell access
$MEM health [<scope>] [--since <iso>] [--json]  # fullness, at-cap sections, revision churn
$MEM read index              # repo map, cross-repo interactions, ambiguous terms
$MEM read repo:<key>         # conventions, known friction, where things live
$MEM read user:<key>         # how they like work delivered
$MEM help
$MEM write …                 # refused (exit 2)
```

**When to read.** Before splitting a request, and before writing a brief — so
conventions and friction land in the brief instead of being rediscovered.
Missing documents: proceed; do not invent memory.

**Cross-repo.** If `index` → **cross-repo interactions** names two codebases and
the request touches both, file **separate items per repo** with `--depends-on`
(see [Chains](SKILL.md#chains-when-one-task-needs-another-first)). Never one
cross-repo item.

**How it resolves the CLI.** In order: `WORKQ_POOL_CLI` if set, else
`workqRoot/apps/pool/dist/main.js` (fails closed with a clear error when
`workqRoot` / `WORKQ_POOL_CLI` is configured but the file is missing — no silent
PATH fallback), else this checkout's `apps/pool/dist/main.js`, else `workq-pool`
on `PATH` (prints a warning). Sets `WORKQ_POOL_HOME` from `poolHome` so an
interactive checkout hits the pool host store.

## Handing work out

Pick **one** intake. GitHub Issues intake (this fleet: label **`fleet`**, unassigned) **or** `$WQ create` — never both. A `bug`-only GitHub issue is not a workq item. Details: [SKILL.md](SKILL.md#pick-one-intake--never-both).

- `$WQ create --title "<one line>" [--brief "<text>" | --brief-file <path>] [--repo <owner/name>] [--base <branch>] [--smart | --class <name>] [--pool <id|name>] [--priority low|normal|high|critical] [--url <link>] [--label <tool>] [--actor <who>] [--about <itemId>] [--depends-on <id>[:gate] ...] [--gate merged|review|checks] [--auto-merge] [--key <k>] [--json]` — omit `--priority` → `normal`; pass `--repo` from the brief Repository header (unscoped Todo still shows under a positive Repos filter; stamp early so in-flight cards stay filterable); `--pool` attributes to a first-class pool (bound API keys settle this without the flag; personal keys with several reachable pools require `--pool` and refuse with the candidate list if missing — never pick silently; legacy/service tokens omit unless `--pool` is passed; `whoami` lists bound + reachable); `--smart` / `--class <name>` set a durable captain pin (mutually exclusive — see [SKILL.md — Smart seats](SKILL.md#smart-seats-pin-sparingly-or-let-policy-route)); `--depends-on` repeats or comma-list; `:review` / `:merged` / `:checks` sets one edge; omit `--gate` for `merged` (wait until complete); pass `review`/`checks` only to opt into stacked-PR throughput
- `$WQ set-smart <id> [--smart | --class <name> | --clear]` — set, retarget, or clear the captain pin; bare `set-smart <id>` defaults to `--smart`
- `$WQ review <pr-url> [--monitor] [--repo <owner/name>] [--pool <id|name>] [--title "<one line>"] [--key <k>] [--json]` — file a review of a pull request the fleet did not write; `--pool` applies to this create form only; `--monitor` follows it until it merges or closes, otherwise it is a single pass
- `$WQ review --for <id> --pr <pr-url> [--monitor]` — point an item already filed at a pull request, or upgrade a single pass to a watch (cannot change pool; `--pool` is refused)
- Authors who just opened their own PR park with `$WQ submit <id> --pr <url>` only — never `$WQ review <wi_*>` / `review <wi_*> --pr` (those refuse)
- `$WQ set-brief <id> --brief "…" | --brief-file <path> [--title "…"]` — amend the durable Request after create (captain / personal key only; pool agents refused)
- **Brief images (two-step on the server — no pre-item blob API):** create the item first, attach with `$EV add <id> --kind image --title "…" --desc "…" --file shot.png`, then `$WQ set-brief` including `![alt](/evidence/<evId>)` (root-relative so the drawer + Vite proxy resolve it). `$EV list <id>` prints the evidence id / url after upload. Dashboard Add Task paste/drop sequences the same APIs in one operator action. Blob GET `/evidence/<id>` stays capability-by-id (unchanged).
- `$WQ set-priority <id> <low|normal|high|critical>` — bump urgency after create (also `--priority` / `--set`); humans only for `critical`
- `$WQ set-auto-merge <id> --on|--off` — change whether a green, unblocked PR may proceed directly to landing
- `$WQ depends show <id>` — the connected chain with live status
- `$WQ handoff <id>` — one item's place in the chain: what cleared and what it produced, what is outstanding, what waits on it
- `$WQ depends rm <id> <otherId>` / `$WQ depends unstick <id>` — cut one edge, or every edge that can never clear
- `$WQ depends add <id> <otherId> [--gate merged|review|checks] [--reason "..."] [--force|--yes]` — late adds on claimable/in-flight work need confirmation (scorches the live run back to clean todo); extending an existing block is fine; new chains belong in `create --depends-on`; gate defaults to `merged`
- `$WQ depends gate <id> <otherId> --set merged|review|checks [--yes]` — change an existing edge's gate; raising under in-flight work refuses once, then `--yes` wipes that run back to clean `todo` (not cancel)
- `$WQ fleet [--digest] [--json]` — free capacity first; `--digest` skips the roster (loop-friendly); may show `SOFT TOKEN LIMIT (…)` when soft limits are refusing new work
- `$WQ token-usage-reset --scope fleet|class|seat [--id <classOrSeatId>]` — zero cumulative counters for that scope and bump epoch (admin credential); does **not** change configured `tokenLimits` — see [Token limits and parks](#token-limits-and-parks)
- `$WQ intake pause|resume|status [--json]` — pause new todo claims for maintenance (not drain/stop); digest shows INTAKE PAUSED
- `$WQ watch [<id>...] [--all] [--once] [--attention] [--repo <key>] [--exclude-repo <key>] [--since <when>] [--interval <s>] [--timeout <s>] [--keep-going] [--stop] [--verbose]` — `--attention` / `--blocked-only` keeps only interrupts; blocking `--attention` babysits past each one (`--stop` exits on first); `--repo` / `--exclude-repo` scope
- `$WQ blocked [--all] [--json] [--repo <key>] [--exclude-repo <key>]` — anything waiting on you (questions, approve-needed, stalled CI, saturated/stalled reviewer waits, stuck deps, actionable claim deferrals on **todo** and **waiting_resume** — soft token limits and hard token-limit parks); quiet when no
- `$WQ repo list|show|set|onboard|update …` — **captain-only** server repo profiles + propose/apply onboard. `onboard`/`update` default to dry-run; `--apply` dual-writes host plumbing + server profile (never invents gate commands). A bare git URL is cloned into the pool warm-base path (`--no-clone` / `--clone-dir` override); GitHub protection is read via `gh` (classic + rulesets) or reported `unread`. See `standing-up.md` (how) and `onboarding-a-repo.md` (why). Seed key not `owner/name`. Not on the worker CLI. `$WQ help repo`
- `$WQ setup pair|pair-status|roles-sizing|desired|credential|intake|progress|smoke …` — captain-led first-run against the same documents as the dashboard SETUP rail (preferred path; dashboard remains an equal choice). `credential verify` is a live identity probe; `intake show|set|clear` is fleet GitHub Issues capture (read-modify-write). `$WQ setup path` prints the checklist and the honest gaps
- `node $SKILLS/workq-captain/scripts/pools.js [--json]` — is the pool on this machine actually alive
- `node $SKILLS/workq-captain/scripts/tidy-closed.js [--apply]` — prune merged leftover heads (`workq/wi_*` closed/merged, plus any other remote/local whose latest PR is MERGED — e.g. historical `cursor/*`). Dry-run first; never touches open PR heads or protected refs (`main`/`develop`/`wip/`/`workq/spare/`)

### Campaign smoke proof

Declare the shared branch and guidance before filing member tickets:

```bash
$WQ campaign create --name "Campaign smoke" --pool <pool> \
  --base feature/campaign-smoke --repo owner/name \
  --guidance-file /tmp/campaign-guidance.md
$WQ create --title "Smoke member A" --brief-file /tmp/member-a.md \
  --repo owner/name --pool <pool> --campaign "Campaign smoke" --session <session>
```

Campaign create/set with `--base` and `--repo` ensures the branch exists on
GitHub, starting from its default branch when missing. An existing related
branch is accepted; inability to provision refuses the campaign write.
Members inherit the campaign base when they have no item-declared base.
An item `--base` / `set-base` overrides that default; a live review-gated
dependency still supplies the temporary stack base.

For an inheritance smoke, omit member `--base`. Put a unique benign marker
only in campaign guidance, and keep the literal branch and marker out of the
member briefs. Give members separate small outputs under `docs/campaigns/`
and ask each to record the campaign context and target base received in its
opening prompt. Verify all of the following for **each** member:

- `show <id> --json`: item `targetBase` is absent, while `campaign.targetBase`
  and `campaign.guidance` are present. Plain `show` labels `(campaign default)`.
- `transcript <id> --kind work --grep "<marker>"`: the original opening prompt
  contains `Campaign context (not scope)` and the marker. Inspect its
  `Declared base` section and provisioning-derived `NOTE ON YOUR BRANCH` too.
  If a later resume is current, use `runs --item <id> --kind work --include-runs`
  to locate the first run and read that transcript by run ID.
- Inspect the prepared checkout or pool fork log to confirm the branch used,
  then verify the real PR's `baseRefName` and run
  `assert-pr-base.js <pr-url> --item <id>` before treating it as landed.

`handoff <id>` shows the dependency chain; it does not reproduce the worker's
opening prompt. Current campaign state or a worker's self-report alone does
not prove what was delivered at assignment. Guidance explains the shared
goal; the member brief defines its scope. A smoke that only targets the feature
branch does not deliver changes to the repository default.

### Priority

Levels: `low | normal | high | critical` (default `normal`). Dequeue order is
critical → high → normal → low, then oldest first within a level.

Omit `--priority` unless the human asks — creates default to **normal**. Use
**high** only on request to jump the backlog without interrupting anyone. Use **critical**
only for prod-down / all-hands: when slots are full it can displace a running
item, and that victim is parked as `waiting_resume` (not cancelled, not
escalated — the fleet reclaims it when a slot frees). Prefer
scaling when you have time — see `docs/suite/workq/engineering/pool/capacity.md`.
A critical-preempt victim is **not** a human decision: `$WQ unstick <id>
--reason "critical preempt"` returns it to the fleet. Do not `take`+`release`
(that re-parks on human) or leave it on `needs_human` forever.
Pool agents cannot set `critical`; a captain with a personal key can.

```bash
$WQ create --title "…" --brief-file /tmp/a.md   # normal (omit --priority)
$WQ set-priority wi_12 high                     # only when asked
$WQ set-priority wi_12 critical                 # emergency; humans only
```

Use `--auto-merge` for low-risk fleet chores in repos that allow bot merges. Review
feedback, conflicts, and required checks still block it. A gated refusal records
one `auto-merge blocked: …` repo warning; later items stay with a human rather
than repeatedly trying a landing agent.

## Token limits and parks

Limits are **token-denominated** (`tokenLimits` — never `tokenBudget`, which is
the Analyst/Librarian prompt-packing cap). Configure them in Setup / Admin HTTP
(`GET/PUT/DELETE /v1/admin/token-limits` for fleet + seat bags; class bags on
`agents.worker.classes.<id>.tokenLimits`). There is no worker CLI to edit the
bags — only to reset cumulative counters.

### What each dimension means

| Axis          | Values                       | Meaning                                                                                                           |
| ------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Scope**     | `fleet` \| `class` \| `seat` | Where the bag lives. Seat keys are worker / presence ids, not slot indexes.                                       |
| **Window**    | `perTask` \| `cumulative`    | One run vs spend until a captain reset.                                                                           |
| **Severity**  | `soft` \| `hard`             | Soft refuses **new** work (in-flight continues). Hard parks **in-flight** to `waiting_resume` at a turn boundary. |
| **Direction** | `input` \| `output`          | `input` = billed input (`inputTokens + cacheReadTokens + cacheWriteTokens`).                                      |

Every nested field is optional — a fleet-wide hard cumulative output limit alone
is valid config.

### Precedence (when two scopes apply)

For the same `(severity × window × direction)`, **more specific wins**:
**seat > class > fleet**. A higher seat allowance intentionally overrides a
tighter fleet cap; the runtime does not pick “whichever is tighter”.

### Soft vs hard — what you do

|                | Soft                                                                                      | Hard                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Effect         | New claims refuse (`soft-token-limit` / `soft-limit` on **todo**); in-flight keeps going  | Active run parks to `waiting_resume` at turn edge; claim deferral `token-limit`; note carries `[park:token-limit]`                                       |
| How you notice | `$WQ blocked` (`soft-token-limit` on todo), `$WQ fleet --digest` → `SOFT TOKEN LIMIT (…)` | `$WQ blocked` (`token-limit` on `waiting_resume`), `$WQ show <id>` (note `[park:token-limit]`), Workers meters                                           |
| What to do     | Raise the limit, wait for the window, or `$WQ token-usage-reset` for cumulative           | Same — reset or change the limit; resume waits until the hard status clears                                                                              |
| Capacity park  | —                                                                                         | Same status `waiting_resume`, but **no** `[park:token-limit]` / `token-limit` deferral — usually wait for a free slot; do nothing unless the human asked |

`waiting-for-slot`, `waiting-for-smart-seat`, and host-load deferrals are
**wait-it-out** (not actionable). Do not reset token counters for those.

### The reset verb

```bash
$WQ token-usage-reset --scope fleet
$WQ token-usage-reset --scope class --id smart
$WQ token-usage-reset --scope seat --id w1
```

Zeros **cumulative** counters for that scope and bumps the epoch. Requires an
admin credential (same rail as run-log retention). Does **not** edit configured
`tokenLimits`.

Reset fleet vs one seat are different operations — pick the scope that tripped.
**When not to reset:** a limit that keeps firing is information (the budget is
real). Resetting in a loop so work can continue is how a budget stops meaning
anything. Prefer changing the limit in Setup when the ceiling is wrong; reset
when you intentionally open a new cumulative window (new day, new campaign,
cleared incident).

### Unenforceable limits

If a harness declares `usageReporting: 'unsupported'` (or usage comes back
`unavailable` / `unsupported`), configured limits **cannot bind**. Setup /
desired-config PUT and Admin token-limit writes refuse or warn loudly; Workers
meters show `unsupported` rather than fake headroom from zeros. Shipped
adapters (`cursor-cli`, `claude-code`, `codex-cli`) report `supported`. Check
the class harness capability and meter status before assuming coverage —
capability matrix: `docs/suite/workq/engineering/pool/harnesses.md`.

## Checking in vs sitting and waiting

Day-to-day captain loops prefer the quiet surfaces:

```bash
$WQ blocked                      # cold: anything waiting on me?
$WQ watch --once --attention     # same, while following in-flight work
$WQ fleet --digest               # capacity + queue, no roster
```

`blocked` is quiet when nothing needs you. `watch --attention` keeps only
questions, escalations, approve-needed review, stalled CI, and reviewer waits
no agent will claim (fleet saturated / stalled past 30m) — not every milestone.
Full `watch` is still there when you want the firehose. Scope with `--repo` /
`--exclude-repo` so a parked item elsewhere cannot blind you.

`watch` itself has two timing modes:

**`--once` — check in and get on with it.** Prints what happened since your last
check and exits. Your read position is remembered per item in a cursor file
beside the state file. With `--attention`, a clean check-in says
`Nothing needs you.`; without it, `Nothing new since you last looked`.

**Blocking — sit here and babysit.** Streams as it happens. With `--attention`,
it keeps going past each interrupt so one parked item cannot look like a finished
watch (`--stop` restores exit-on-first). Without `--attention`, it still stops
when something needs you; `--keep-going` watches past that. Prefer `--attention`
so the stream stays readable. Bound a long sit with `--timeout`.

Both report anything **currently** waiting on a person, not only what changed on
this poll. That matters for check-ins: an item that was already blocked when you
last looked is still blocking a worker now, and saying "nothing changed" about it
would be true and useless.

Both show the whole conversation, including your own side of it:

```
w1: Hi Kyle — I'm the worker picking this up.
w1 asked: Which engine — the 3D engine in engine.ts, or the workflow engine?
Kyle (captain) answered: The 3D engine in engine.ts. Workflow engine is out of scope.
w1: Understood — scoping to engine.ts. PR shortly.
```

That is why a replay is worth having. Reading a finished run back tells you what
was decided and who decided it — including which ambiguities you resolved by
hand, which is the part you will have forgotten by the time the PR arrives and
the part no diff can tell you.

`--since` overrides the saved cursor: `--since 2h`, `--since today`,
`--since all` to re-read a run from the beginning. Cursors are forgotten after a
fortnight without a look.

## Following

- `$WQ list --status <todo|in_progress|waiting_feedback|under_review|waiting_resume|needs_human|done|rejected>` — occupancy alias `parked` = `waiting_feedback` + `under_review` + `waiting_resume`
- `$WQ show <id>` — the item as a worker sees it, including the brief you wrote (also pin, triage difficulty/risk, claim deferral)
- `$WQ recall <id>` — live state: pipeline, who holds it, what it is waiting on
- `$WQ transcript <id> --tail` — live pulse: last ~60 lines of the current/open work run
- `$WQ transcript <id> [--grep <s>]` — full archaeology / search what the agent did
- `$WQ related <id>` — follow-ups and duplicates linked to it
- `$WQ evidence <id> --markdown` — the proof it attached, PR-ready
- `$WQ history [--since today] [--search <s>] [--json]` — finished work

## Steering a live run

`$WQ steer` injects mid-run direction into the agent on a live item. Status and
lease stay put — this is continuing work with new direction, not a new claim.

```bash
$WQ steer <id> --text "Skip Cypress — cover the resolver with a unit test only."
$WQ steer <id> --text-file /tmp/steer.md
```

The server stores `pendingSteer` and emits `work_item.steered`. A pool consumes
that (halt + resume with the new prompt) and acks it. Until the pool adapter is
wired, steers **queue**; a second steer while one is pending replaces the
pending text (last-write-wins).

| Command            | Who reads it                                                         | When                                                             |
| ------------------ | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `note`             | Timeline only; agent sees notes **only at adoption**                 | Stage commentary — not a live-agent channel after adoption       |
| `direct`           | Next claim / resume prompt (standing direction; survives lease drop) | Before claim or across a park (`todo`, `waiting_resume`, …)      |
| `steer`            | Live agent (soft-stop)                                               | `in_progress`, `waiting_feedback`, `under_review`, `needs_human` |
| `set-brief`        | Durable Request on the item                                          | Amending intent; not stage chatter                               |
| `say`              | Whoever asked — **does not** inject into the agent                   | Outbound milestones / answers                                    |
| `ask` / `feedback` | Park for a human answer, then resume                                 | HITL                                                             |
| `cancel`           | —                                                                    | Kill the agent and reject the item                               |

`$WQ direct <id> --text "…" | --text-file <path> | --clear` — last-write-wins
standing orders for the next agent open; pool injects on claim/resume and soft-
stops a live run like steer. Captain / personal key only. `$WQ help direct`.

Steerable while `in_progress`, `waiting_feedback`, `under_review`, or
`needs_human`. Works the same on worker-owned and orchestrator-owned runs.
On `todo` / `waiting_resume`, steer is refused and the error names `direct`.

## Intervening

- `$WQ feedback <id> --text "<answer>"` — answer a question; the item resumes
- `$WQ steer <id> --text "<direction>"` — inject into the live agent (see above)
- `$WQ direct <id> --text "<direction>"` — standing direction across handoff (see above)
- `$WQ say <id> --text "<text>"` — message whoever asked; does **not** steer the agent
- `$WQ take <id>` — adopt a **real** escalate (human must finish or decide)
- `$WQ unstick <id> --reason "<why>"` — clear a **false** `needs_human` → `todo` (fleet again). Alias: `clear-escalation`
- `$WQ takeover <id> [--force]` — wrest back a run that is stuck
- `$WQ designloop-drive <id>` — captain owns a Designloop lease (stays `design_review`; no dashboard button). Overlay Submit is 409 until undrive. Refused while a watcher holds `in_progress`. Not `takeover`.
- `$WQ designloop-undrive <id>` — return the Designloop lease so overlay Submit can wake a worker
- `$WQ cancel <id> --reason "<why>" [--cascade]` — stop the agent and reject the item; refuses the first time if other work is stacked behind it, and lists what would go
- `$WQ duplicate <id> --of <canonicalId>` — collapse a repeat

### `needs_human`: take vs unstick

| Situation                                                                      | Do this                                                                     |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Human must finish or decide (real escalate)                                    | `$WQ take` → work it / answer / cancel                                      |
| False escalate — return to fleet (critical preempt, wrong escalate, “unstick”) | `$WQ unstick <id> --reason "…"` → `todo`. Do **not** take+release           |
| After take, you change your mind and want the fleet again                      | Still **unstick** (releases then clears). Plain `release` re-parks on human |

**`take` + `release` does not unstick.** Release after `take` returns to
`needs_human` by design (`Released …; still waiting on a human.`). That is
correct for real human takeovers; it is the wrong recipe for “put it back on
the agent queue.”

### Stuck shapes (quick recipes)

| Stuck shape                                                | Do this                                                         |
| ---------------------------------------------------------- | --------------------------------------------------------------- |
| Dependency can never clear (upstream rejected / cancelled) | `$WQ depends unstick <id>`                                      |
| False `needs_human` (critical preempt, mistaken escalate)  | `$WQ unstick <id> --reason "…"`                                 |
| Lease zombie / silent worker                               | `$WQ recall` / `transcript --tail`, then `takeover` or `cancel` |
| Fleet-health across many runs (memory reach, exit rates)   | `$WQ runs --since today [--group-by role\|session] [--grep …]`  |
| Estimate-vs-actual drifting (repo × classification)        | `$WQ calibration --since month` (History panel too)             |
| Waiting for a human answer                                 | `$WQ feedback`, not `take`                                      |
| Critical preempt victim left on human pile                 | Recognize capacity theft → **unstick**, not take forever        |

## Where an item goes

```
todo ──► in_progress ──► under_review ──► done
             │  ▲              │
             │  └──────────────┘  approve with a PR open → back to in_progress
             │                    to land it (rebase, checks, merge), then done
             │  ▲
             │  └── waiting_feedback   (asked you something; answer with feedback)
             ├────► needs_human        (take = human owns; unstick = fleet again)
             └────► rejected           (cancelled, or not worth doing)
```

`todo` means filed and unrouted. Nothing is assigned at creation: an
orchestrator triages it, decides the classification, and hands it to a worker.
An item can sit in `todo` indefinitely if no pool is running — which is what
`fleet` and `pools.js` are for.

The loop out of `under_review` is the one to know: approving an item whose PR is
still open does not finish it. It goes back to `in_progress` for an agent to land
the change — rebasing a conflict, fixing red checks, merging, then writing the
summary — and reaches `done` only when the change is actually in. So the board and
the PR cannot drift apart, and an approval that turns out to need work says so
instead of quietly closing. `done` means merged; `rejected` means it will not be.

## Dispatch patterns

**A batch out of a tracker.** Read the tickets first, then decide what is
actually work. Two may be the same bug; one may be a question you can answer in
a sentence.

```bash
for key in BUG-1 BUG-2 BUG-3; do
  # write /tmp/$key.md from the ticket + your own reading of the code
  $WQ create --title "$(head -1 /tmp/$key.md)" --brief-file /tmp/$key.md \
    --url "https://tracker.example/$key" --key "dispatch-$key"
done
$WQ watch --attention
```

`--key` makes each call idempotent, so re-running the loop after a failure
halfway through does not file duplicates.

**A design, split across workers.** Do the shared investigation once and put its
conclusions in every brief. Read `$MEM read index` (and each `repo:<key>`) first
so cross-repo interactions and conventions shape the split. File the whole plan,
including the parts that cannot start yet, and link them — the queue holds the
order so you do not have to:

```bash
$MEM read index
A=$($WQ create --title "Exporter interface" --brief-file /tmp/a.md --json | jq -r .id)
$WQ create --title "CSV exporter" --brief-file /tmp/b.md \
  --depends-on "$A" --key dispatch-b
$WQ depends show "$A"     # check the shape before you walk away
```

**Across two repos.** Same pattern, one item per repo (workers do not cross):

```bash
$MEM read index   # confirm cross-repo interactions
CREATE=$($WQ create --title "Create: emit event" --repo scopear/worklink-create-2 \
  --brief-file /tmp/create.md --json | jq -r .id)
$WQ create --title "Workq: consume event" --repo scopear/workq \
  --brief-file /tmp/workq.md --depends-on "$CREATE" --key dispatch-workq-side
```

Omit `--gate` so each part waits until the one before it is **complete**
(merged onto the base) — that is the default and what most chains want. Pass
`--gate review` (or `checks`) only when you deliberately want stacked-PR
throughput and accept rebasing onto a moving branch.

**Open PRs against the item's declared target base**, or the repo's default
branch when none is declared — never a session `wip/*` branch, unless the ticket
explicitly says otherwise. Stacked dependency PRs may target
`workq/<dependencyId>` while that dependency is open. Before approve / land /
“it merged”, run
`node $SKILLS/workq-playbook/scripts/assert-pr-base.js <pr-url> --item <id>` —
refuse `wip/*` without the `allow-wip-base` label, refuse a `workq/*` base whose
dependency PR is no longer open (leftover branch refs after squash-merge do not
count), and refuse a PR aimed at the repo default when the item declared a
different base; note + retarget task, never mark done on a bad base.

If stacked work was a mistake and a dependent already started under `review`,
raise the gate with `depends gate <id> <otherId> --set merged`. The first call
refuses and names the wipe; `--yes` then scorches that run back to clean `todo`
(not cancel) so it stays blocked until the upstream actually merges.

**Reviewing pull requests you did not write.** One item per pull request, because
one item is one conversation with one author:

```bash
gh pr list --state open --json url --jq '.[].url' | while read -r pr; do
  $WQ review "$pr" --key "review-$(basename "$pr")"
done
```

Bare, that is one pass each: read, post, done. Add `--monitor` and each item
follows its pull request instead, reviewing again every time the author responds
until it merges or closes — worth it for a change you actually need to land, and
a slot held open for days if you point it at the whole backlog. Pick per PR.

**One task, watched closely.** `$WQ create ... --json` to capture the id, then
`$WQ watch <id>` and stay with it.

**Dispatch, then work, then poke.** The normal shape once more than one thing is
in flight. Nothing notifies you, so the check-in is the whole mechanism:

```bash
$WQ create --title "…" --brief-file /tmp/a.md --key dispatch-a
$WQ create --title "…" --brief-file /tmp/b.md --key dispatch-b
# … go and do your own work …
$WQ watch --once --attention   # anything need you?
# … answer what is blocking, go back to your own work …
$WQ blocked                    # cold re-check; quiet when no
```

**Picking up cold.** New session, yesterday's dispatch, no memory of what you
sent out:

```bash
$WQ blocked               # who is stuck on you, and for how long
$WQ fleet --digest        # anyone home? queue depth?
$WQ list --status under_review
$WQ watch --once --attention --all
```

## The brief

The single highest-leverage thing you write. A worker's whole understanding of
the job is this text plus whatever it can find in the repo.

**Read `$MEM read repo:<key>` (and `user:<key>` when known) before drafting** —
conventions, known friction, and delivery preferences belong in the brief.
Missing docs: proceed without inventing.

**Open every brief with a Repository header** (repo identity + https GitHub URL).
It must be the first section of the `--brief-file` — not buried under Problem,
and not only a pool seed key in prose. Multi-repo: list each. No checkout: say
none and why. Chain handoffs and resume prompts still surface `target repo` /
`repo:` near the top; the clickable URL in this header is what keeps a
revision/landing agent from guessing create vs workq.

### Outcomes, not edits

Pin the **outcome and the constraints**. Leave mechanism to discovery plus
review. "Where to start" is pointers (files, symbols), not instructions
("remove X", "wire Y into Z"). A suggested shape must be labeled unverified so
discovery is expected to override it. Never name a shortcut ("minimal",
"quick", "just") as the approach — say the outcome and the constraint. When
the outcome removes eager/prewarm/preload work, ask where the cost moves and
require the PR to answer. Point at
`.cursor/rules/engineering-quality-bar.mdc` instead of restating the bar.

**Before** (prescribes mechanism — workers treat it as approved):

```markdown
## Where to start

- ProjectLoader.tsx — remove buildLiveGraphWithProgress and the load-time
  referencedAssetPrewarm that exists only to feed that build
- vite.config.ts — add *-harness.html to multi-page build.rollupOptions.input
- Prefer a minimal import/init fix over a large domains rewrite
```

**After** (outcome + pointers; shape optional and marked):

```markdown
## Where to start

- `client/src/classes/ProjectLoader.tsx` — load-tail liveGraph / prewarm call sites
- `client/src/classes/GraphService.ts` — resident ready / ensure path
- `client/vite.config.ts` — how HTML entries are served in dev vs production build

## One possible shape — verify against the repo before adopting; discovery overrides this

Defer resident graph build until first graph need (ensure + modal), reusing
whatever prep the load path already does. Do not assume harness HTML belongs in
production rollup input — check how this repo (and workq) keeps harnesses
dev-only.

## Constraints

- Break any init cycle without lazy/inline imports
- If load-time prewarm/eager work goes away: say in the PR where that cost
  moves, and prove it is not serialized behind idle scheduling on first AI use
- Follow `.cursor/rules/engineering-quality-bar.mdc`
```

A quiet example that still works (pointers, no edit orders):

```markdown
## Repository

- **scopear/workq**: https://github.com/scopear/workq

## Problem

Centring the top-level pivot from the AI companion writes `metadata.pivot`
but nothing moves on screen.

Reproduce: ask the companion to centre the pivot on any multi-part model; the
handle stays at the origin.

## Where to start

- Codegen path for SetObjectPivot
- UI's SetObjectPivotAction (works today — applies a bounding-box offset to
  displayOffset; companion path does not)

Done when: asking the companion to centre the pivot moves the handle exactly
as the inspector's Center control does, with a test covering it.

Already ruled out: not a SyntaxHeal problem — heal is doing what it is told,
the instruction is wrong before it gets there.

Out of scope: multi-select pivots, and the inspector UI itself.
```

For **UI-visible** tasks, "Done when" must name the proof path — for example
"before/after shots from `apps/dashboard/scripts/shots/dependency-graph-shots.mjs`
via `$EV run` / `$EV add --kind image`" — so the worker does not invent prose
evidence. Prefer an existing Playwright/toy harness; see
`docs/suite/workq/engineering/testability.md` (§ Dashboard Playwright harnesses).
Do **not** demand a visible OS mouse cursor in screenshots — CDP never draws
one; live-journey / harness-runner already install the shared DOM overlay
(`apps/dashboard/scripts/evidence-cursor.mjs`).

Note what it does: names the repo first, states the fault, points at the entry
without ordering edits, defines done, hands over a dead end, and draws a
boundary. Everything a competent stranger needs and nothing they would have
found in a minute anyway.

### Brief economy

A brief is long for two different reasons. One is substance: root-cause
evidence, pointers, ruled-out dead ends, a concrete definition of done. Cutting
those makes workers re-derive your analysis — worse than length. The other is
padding: restated standing rules, file tours, the same scope fence said three
ways, and investigation narrative nobody can act on.

**Why it matters.** The brief is an agent's prompt. It competes with triage,
chain handoff, and memory in the same packet. Padding is not free — it pushes
actable lines down and invites truncation elsewhere. That is not an argument
for a hard character or word cap (numbers get gamed by thinner writing, and a
genuinely complex ticket should be allowed to be long). It is an argument for
cutting lines that do no work.

**Self-check before filing.** Could a competent engineer act on this with
nothing else? Does any line survive only because it sounds thorough? Prefer a
`path:symbol` pointer over a paragraph that restates what the file is for.
Point at `.cursor/rules/engineering-quality-bar.mdc` and
`.cursor/rules/local-ci-before-pr.mdc` once — do not paste their contents.
One Out of scope section beats Out of scope + Boundary with siblings + in-body
warnings that repeat the same list.

#### Worked example — `wi_4d89b954` (reviewer-engine skill)

Filed brief was **6426 characters**. Same job after economy: **~3000**, with
every actable piece kept (evidence, two causes, outcome, pointers, done
criteria, single scope fence, bar pointers).

**Before — padding called out** (excerpts from the filed brief):

```markdown
## Where to start

- …self-review.md… pr-deep-review…reference.md…
- Mirror + provisioning: `apps/pool/src/provision/skills.ts`,
  `skills-mirror.ts` (every skill exists twice —
  `apps/pool/skills/<id>` bundled to worker bases and `.cursor/skills/<id>`
  for interactive sessions, and the mirror check fails when they diverge).
  ← prose explaining a convention the pointers already name

## What done looks like

4. **Provisioned**: present in both `apps/pool/skills/` and `.cursor/skills/`,
   byte-identical per the mirror check, …
5. Full local CI per `.cursor/rules/local-ci-before-pr.mdc` plus …
   ← done-criteria restating standing rules / mirror check

## Boundary with the sibling tickets

Three items depend on this one…

## Out of scope

- Changing how any workflow currently routes (siblings own that).
  ← same fence twice

## Bar

`.cursor/rules/engineering-quality-bar.mdc` and
`.cursor/rules/local-ci-before-pr.mdc`. Use the pattern that already exists —
this repo has a settled convention for skill layout, mirroring and
provisioning; follow it rather than inventing a fourth shape.
← pointer plus a restatement of the quality bar
```

**After — complete brief** (substance kept, padding cut):

```markdown
# A compact reviewer-engine skill the fleet can actually hand to a subagent

## Repository

- **scopear/workq**: https://github.com/scopear/workq

## The problem, with evidence

Item `wi_4a0581b1` (PR #268): dashboard claimed a three-lens adversarial
self-review; the run tree had one child (`rl_94efb6cc`) and no lens subagents.
Pipeline `Lens:` rows were typed by the worker. Transcript: reviewer did
`git diff` / Read / Grep itself and emitted findings — never selected lenses,
never spawned one Task per lens, never used the finding schema.

Two causes in scope:

1. **Improvised reviewer prompt** — `workflows/self-review.md` §Topology
   mandates `worker → Task: reviewer → Task: lenses` in prose, but there is no
   copy-paste prompt.
2. **Deep-review skill unusable as a subagent brief** —
   `pr-deep-review-and-comment/SKILL.md` (~57 KB) is mostly GitHub posting /
   preview; a self-reviewer must not do those. Lens rubric in its
   `reference.md` never reaches the agent.

## What we want

A **compact, mode-agnostic reviewer-engine skill** small enough to hand to a
subagent verbatim, covering what every fleet review shares: pin diff (worktree

- merge-base SHA); lens roster + selection; mandatory one-Task-per-lens fan-out
  by the reviewer; finding schema + synthesis; three modes (self-review: no
  `gh`/posting; external PR: post via deep-review scripts; re-review:
  verification-first). Plus **copy-verbatim** reviewer and lens Task prompt
  templates.

_(One possible shape — verify against the repo; discovery overrides. New skill
dir with `SKILL.md` + `prompts/`; or playbook workflow / prompts under the
existing review skill — say why if you pick those.)_

## Where to start

- `workflows/self-review.md` — §Topology / §Loop step 2 (contract templates
  must encode)
- `pr-deep-review-and-comment/reference.md` — Specialist report contract,
  roster, synthesis rubric (extract or point; do not rewrite from scratch)
- `apps/pool/src/provision/skills.ts`, `skills-mirror.ts` — mirror + provision
  pattern
- `apps/pool/pool.config.example.json` `skills` array (operators also update
  live `~/.workq-pool/pool.config.json` — say so in the PR)

## What done looks like

1. Skill short enough for a subagent to read in full; templates + diff alone
   run the fan-out.
2. Fan-out and no-write contract are **copyable**, not merely described.
3. One authoritative home for lens content (extract here + point from old
   location, or reference out).
4. Provisioned in both skill trees, on the pool `skills` list, covered by
   provisioning / mirror tests.

## Out of scope

Sibling tickets own: lens-row enforcement, rewiring `self-review.md` onto this
skill, fleet-mode rewrite of deep-review `SKILL.md` (pointer-only in
`reference.md` if you touch that skill). Not fixing PR #268 (evidence only).
No workflow routing changes; no provisioning changes beyond adding this skill.

## Bar

`.cursor/rules/engineering-quality-bar.mdc` ·
`.cursor/rules/local-ci-before-pr.mdc`
```

What stayed: the failure evidence, both causes, the outcome and modes, the
unverified shape, pointers, testable done-criteria, one scope fence, bar
pointers. What went: the mirror tour, the second scope section, restated local
CI / "use the pattern that already exists", and done-criteria that only repeated
standing rules.

## Origin: who filed it, and who is waiting

Work you file carries `origin.kind = "agent"` with the label from your config —
"Cursor", "Claude Code" — so whoever picks it up knows a person is waiting
rather than a cron job.

The domain deliberately does not enumerate tools. The kind says _what sort of
thing_ filed it, and the label says _which one_, so a new client needs no schema
change.

The actor is not yours to set. The server reads it off your API key and stamps
the account behind it, the same way a Slack or Teams item is tied to the person
who typed it — an item you file shows `Cursor · kyle@scopeapp.com` and links to
your workq account, whatever `displayName` says locally. A name you sent would
be ignored where it agreed and a forgery where it did not.

Two consequences worth knowing:

- **"Mine" means the account, not the name.** `watch` and `blocked` scope to
  what your key filed. If work you dispatched does not appear, run `whoami`
  before assuming the queue lost it.
- **A shared service token has no account.** Work still files, and the actor
  falls back to your configured `displayName` on your word alone. `whoami` says
  so plainly. Use a personal key so the server can vouch for you.

`displayName` still matters: it is how you sign messages you write, and it is
the only attribution available on a service token.

Origin is display; the **source** is the back-channel. Slack and Teams items
carry a conversation / thread to push into. Yours carry one only if you pass
`--session <id>` on `create`, which files the item with a `cursor_chat` source
naming the conversation you are in and `--requester` naming who is waiting in
it.

That matters more than it sounds. Without a source, a notification for the item is
built and then dropped — there is nowhere to send it — so a worker's greeting, its
milestones and the question it is stopped on exist only on the item, and reach you
when you `watch`. With one, the server can deliver: it runs
`WORKQ_CURSOR_NOTIFY_CMD` per notification with the message on stdin and the
details in `WORKQ_NOTIFY_*`, and raises a macOS notification for the kinds that
want a person when `WORKQ_CURSOR_NOTIFY_DESKTOP` is set.

Be honest about the limit: nothing can push a message into an open editor chat, so
neither of those puts a worker's question in front of you mid-turn. They get you a
ping and a hook to route it somewhere you will see. `blocked` or
`watch --once --attention` between your own tasks is still the discipline that
does not depend on any of it.

## Configuration

`$SKILLS/workq-captain/config.json` (gitignored; copy from
`config.example.json`):

| Key           | Meaning                                                                         |
| ------------- | ------------------------------------------------------------------------------- |
| `baseUrl`     | workq server, e.g. `http://127.0.0.1:9876`                                      |
| `consumerId`  | your identity on the queue, e.g. `captain-kyle`                                 |
| `displayName` | how you sign messages, e.g. `Kyle (captain)`. Not your attribution — see Origin |
| `originLabel` | the tool you are driving: `Cursor`, `Claude Code`                               |
| `workqRoot`   | absolute path to the workq monorepo (locates the CLI)                           |
| `poolHome`    | local pool directory; defaults to `~/.workq-pool`                               |

The API token goes in `workq.secret.json` (gitignored) or `WORKQ_TOKEN`. Mint a
personal key from the dashboard under Account → API keys; it is shown once. Use
your own rather than borrowing one: the key is your identity here, not just your
admission.

**Precedence:** environment overrides win over files; then gitignored
`config.json`; then committed `config.example.json` when `config.json` is absent.
The API token comes from `WORKQ_TOKEN` or `workq.secret.json` beside the skill.
Install captain once per machine — not a copy per product repo:
[onboarding-a-repo.md § Captain from a product checkout](onboarding-a-repo.md#captain-from-a-product-checkout).

Every file value can be overridden by environment: `WORKQ_URL`, `WORKQ_TOKEN`,
`WORKQ_CONSUMER_ID`, `WORKQ_DISPLAY_NAME`, `WORKQ_ORIGIN_LABEL`, `WORKQ_ROOT`,
`WORKQ_CLI`, `WORKQ_POOL_CLI`, `WORKQ_STATE_FILE`, `WORKQ_POOL_HOME`,
`WORKQ_SKILLS_DIR` (pool harness injection; not the normal captain install shape).

## When something is wrong

Bootstrap, captain/pool config, `doctor` failures, and "is the host actually
up" belong in [first-run.md](first-run.md). This table is the day-to-day queue
view once the loop already works.

| Symptom                                                                 | Likely cause                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Work sits in `todo` and nothing happens                                 | No pool running. `$WQ fleet --digest`, then `pools.js`. If `pools.js` is up with idle slots but warns about evaluate errors, protocol skew — rebuild protocol/pool and restart.                                                                                                                                                                                                                                                                       |
| `pools.js` says up, `fleet` shows nobody                                | Pool is pointed at a different server; check `baseUrl` in both configs.                                                                                                                                                                                                                                                                                                                                                                               |
| `pools.js` says **UNHEALTHY** (stream / evaluate / wire probe)          | Not ready to claim even if slots are idle. Stream-down still polls slowly; evaluate/wire failures are usually protocol skew — `npm run build -w @workq/protocol -w @workq/pool && workq-pool restart`. `workq-pool doctor` re-runs the wire probe.                                                                                                                                                                                                    |
| `pools.js` up, idle slots, todos waiting, evaluate errors in log        | Server wire shape ahead of the pool process (e.g. new `source.kind`). Same rebuild/restart as above.                                                                                                                                                                                                                                                                                                                                                  |
| Pool up but "not connected to the change stream"                        | Treated as unhealthy in `pools.js` / status. Restart the pool; backup poll is not live capacity.                                                                                                                                                                                                                                                                                                                                                      |
| Disk full / orphans suspected / “what is eating space?”                 | Do **not** hand-delete worktrees. On the pool host: `workq-pool disk` (bases + worktrees + local transcripts) then `workq-pool gc --dry-run` before `--apply`. On the server host: `workq-server storage` then `workq-server run-logs-gc` / `evidence-gc` dry-run before `--apply`. For merged topic branches still on origin (`cursor/*`, ad-hoc `feat/*`, closed `workq/wi_*`): `node $SKILLS/workq-captain/scripts/tidy-closed.js` then `--apply`. |
| Takeover / cancel and the agent’s uncommitted work vanished             | It should not — dirty or un-pushed trees are moved to `<cloneRoot>/<repoKey>/quarantine/<itemId>_…` (see `.workq-quarantine.json` inside). Check that path or `workq-pool disk` before rewriting from transcripts.                                                                                                                                                                                                                                    |
| A worker went quiet mid-run                                             | `$WQ recall <id>` then `$WQ transcript <id> --tail`. Rescue with `takeover`, stop with `cancel`. After force takeover, look under `quarantine/` (row above) if the worktree path is gone.                                                                                                                                                                                                                                                             |
| `watch` returns instantly with nothing                                  | Nothing you filed is in flight. `$WQ watch --all` to see the whole queue.                                                                                                                                                                                                                                                                                                                                                                             |
| Work you filed never appears in `watch` or `blocked`                    | It is attributed to a different account. `$WQ whoami`, and check whose key you are using.                                                                                                                                                                                                                                                                                                                                                             |
| `watch --once --attention` says nothing needs you but you expected some | Your cursor is past the interrupt, or it is ordinary CI/reviewer wait (not captain attention). `$WQ blocked` / `watch <id> --once --since all`.                                                                                                                                                                                                                                                                                                       |
| A worker has been silent for ages                                       | It may be blocked and you never looked. `$WQ blocked` shows the wait and its age.                                                                                                                                                                                                                                                                                                                                                                     |
| `needs_human` but should be fleet work                                  | Critical preempt or a mistaken escalate. `$WQ unstick <id> --reason "…"`. Do not take+release.                                                                                                                                                                                                                                                                                                                                                        |
| An item you filed is `needs_human`                                      | Decide which exit: real escalate → `$WQ take <id>`; false escalate / critical preempt → `$WQ unstick <id> --reason "…"`. **take+release does not return work to agents.**                                                                                                                                                                                                                                                                             |

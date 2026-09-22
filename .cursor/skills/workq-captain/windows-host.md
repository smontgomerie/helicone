# Windows host (captain anywhere, fleet in WSL2)

Open this after the host probe in [SKILL.md](SKILL.md) says `win32`, or
`linux` with `WSL_DISTRO_NAME` set. macOS and native Linux captains must not
follow this file — their runbook is [standing-up.md](standing-up.md) /
[first-run.md](first-run.md).

**Model:** the captain session can stay where the human is (this Windows
Cursor window). The **API, dashboard, pool daemon, and workers** run inside a
real Ubuntu WSL2 distro. Native Windows Node is refused for the pool
(`doctor` / `start`; skip-preflight cannot bypass). `docker-desktop` is WSL2
but is not a worker shell.

Do **not** ask them to reopen the captain in WSL. Do **not** treat a green
native-Windows `npm run dev` as the pool. Product path:
`docs/suite/workq/devops/windows-wsl2.md`.

## Detect (do not guess)

```bash
node -e "console.log(JSON.stringify({platform:process.platform,wsl:process.env.WSL_DISTRO_NAME||null}))"
```

| Result                                         | This session                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `platform: "win32"`                            | Captain on Windows. § Native Windows (bootstrap), then § Drive WSL, then [standing-up.md](standing-up.md) with the invocators below.              |
| `platform: "linux"` and `wsl` is a distro name | Captain already inside WSL. Skip bootstrap if `-Check` is green. § Drive WSL invocators are just bash. Continue [standing-up.md](standing-up.md). |
| `darwin` or `linux` with `wsl: null`           | Wrong file. Close it.                                                                                                                             |

## Invocators (PowerShell captain)

Bash `$WQ=…` / `$WQ help` does nothing useful in PowerShell. Use node:

```powershell
$SKILLS = Join-Path (Get-Location) '.cursor\skills'
$WQ = { node (Join-Path $SKILLS 'workq-captain\scripts\workq.js') @args }
$Distro = 'Ubuntu-24.04'
function Invoke-WqWsl([string] $Cmd) { wsl -d $Distro -- bash -lc $Cmd }
```

Then `& $WQ whoami`, `& $WQ setup path`. Distro commands must keep `$` away
from PowerShell: it expands `$HOME` / `$PATH` / `$dest` (and `~`) **before**
bash sees them, which is how you get `cp: /.env`. Escape (`$HOME) or pass a
**single-quoted** `bash -lc '…'` string that PowerShell does not interpolate:

```powershell
Invoke-WqWsl 'curl -fsS http://127.0.0.1:9876/health'
Invoke-WqWsl 'cd ~/workq && npm install'
Invoke-WqWsl 'export PATH="$HOME/.local/bin:$PATH"; node "$HOME/workq/apps/pool/dist/main.js" doctor'
```

Set captain `config.json` `"poolHome": false` so `$WQ` / `pools.js` do not
read `C:\Users\…\.workq-pool` while the daemon uses `/home/…/.workq-pool`.
This is the same remote-captain rule as [standing-up.md](standing-up.md) §A.2b.

---

## Native Windows (bootstrap the distro)

From the workq checkout (elevate if WSL is missing):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\host\wsl2-bootstrap.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File deploy\host\wsl2-bootstrap.ps1 -Check
```

Expect exit 0, default distro Ubuntu (or similar) — not `docker-desktop` —
and `%USERPROFILE%\.wslconfig` `networkingMode=mirrored`. Then continue here;
do not stop the session.

---

## GitHub on the pool host (before any clone)

Workers, warm-base fetch, and `gh pr create` use **host** `git` / `gh` inside
the distro. `$WQ setup credential enter --name github --verify` (or upsert) is a
different store (the server merge poller / Issues). Wire both; the named
credential does not make `git clone https://…` work.

### Named credential smoke (PowerShell captain ↔ WSL API)

Run enter in the **Windows** PowerShell where `$WQ` reaches the mirrored API
(`http://127.0.0.1:9876`). Do not export the token in WSL expecting the Windows
Node process to see it:

```powershell
# Interactive (masked) — preferred
$WQ setup credential enter --name github --verify

# Noninteractive file (KEY=value lines; never commit the file; delete after upsert)
$WQ setup credential upsert --name github --fields-file $env:TEMP\gh.fields
$WQ setup credential verify --name github
Remove-Item -Force $env:TEMP\gh.fields -ErrorAction SilentlyContinue
```

Then bind the pool host from the same captain session after the server row is
saved (`--from-server-store`), and check readiness — saved ≠ host-ready.

Windows `gh` is the operator login. Reuse it from WSL. Do not invent a second
Linux `gh auth login` unless GitHub CLI is not installed on Windows.

1. On Windows: `gh auth status` (run `gh auth login` if it is not logged in).
2. From this checkout:

```powershell
node .cursor\skills\workq-captain\scripts\ensure-host-github.js --apply `
  --prove-url https://github.com/<owner>/<repo>.git
```

That script never prints tokens. It symlinks `gh.exe` into the distro
`~/.local/bin/gh`, points WSL git at `gh auth git-credential` for
`https://github.com`, and proves `git ls-remote --heads` against the forge
URL from a Linux cwd.

Do **not** clone a Windows checkout onto ext4 as `~/workq` or the warm base.
A `/mnt/d/…` or `wslpath` origin copies uncommitted dirt, and later
`git fetch` / `reset --hard origin/<base>` dies.
If HTTPS still hangs **after** `ls-remote` succeeded, timeout and retry the
URL clone — still do not clone `/mnt/*`.

`wsl2-standup.sh` wires the same helper when Windows `gh.exe` is visible, so a
second run / packed host still gets it. That is too late for the first
`~/workq` clone — run `ensure-host-github.js` first.

Then continue § Drive WSL.

---

## Drive WSL (API, dashboard, pool)

All of this is `wsl -d Ubuntu-24.04 -- bash -lc '…'` from the captain machine.
[standing-up.md](standing-up.md) / [first-run.md](first-run.md) still own the
order (A.-1 health, identity, pair, start). These deltas are Windows-only:

1. Clone on the **Linux ext4 disk** (`~/workq`, `~/.workq-pool/bases`) from the
   **https:// GitHub URL**, never `/mnt/c/…`. Host git/gh must already work
   (§ GitHub). Bound a 45s `timeout` on the URL clone so a hang is not a
   10-minute wait. `git clone` writes LF. **Do not `cp` scripts from the
   Windows working tree** without `sed -i 's/\r$//'` — bash dies with
   `set: pipefail: invalid option`. Copying `.env` is the usual exception;
   standup strips CR on `.env` if present.
2. Linux deps + doctor from that clone: `bash deploy/host/wsl2-standup.sh`
   (or `--check`).
3. Start API + dashboard **inside the distro** from `~/workq`: `npm install && npm run build && npm run dev`.
   If `.env` was copied from Windows, strip CR (`sed -i 's/\r$//' .env`) or bash
   will fail with `$'\r': command not found`. Mirrored networking makes
   `http://127.0.0.1:9876` (API) and `http://127.0.0.1:5173/dashboard/` reachable
   from the Windows captain. After `/health` is ok, paste a markdown dashboard
   link in chat so they can jump in — same as [standing-up.md](standing-up.md) §A.-1.
4. `workspaceMode: worktree`. CoW / `cow_clone` is refused on WSL volumes.
5. Pair **in the distro**. Until `workq-pool` is on the Linux PATH, invoke
   `node ~/workq/apps/pool/dist/main.js`. Pass `--host-name` from `$WQ whoami`
   (the bound pool name, exact case) — not Windows `os.hostname()`. Bootstrap
   lowercases the hostname when it creates the pool; WSL `init` used to write
   the mixed-case DNS hostname and then fail register + identity preflight.
   `init` now rewrites `host.name` to the bound pool after redeem; still pass
   the flag so the pairing label matches. Default clone root is
   `~/.workq-pool/bases`. If a minted code starts with `-`, remint or pass
   `--code=<code>`.
6. Fleet `cursor-agent login` is a **third** login — not the Windows Cursor IDE
   and not `cursor-agent login` under the Ubuntu user store:

   ```bash
   NO_OPEN_BROWSER=1 HOME=~/.workq-pool/harness-home/cursor-cli \
     AGENT_CLI_CREDENTIAL_STORE=file cursor-agent login
   workq-pool auth --harness cursor-cli --logged-in
   ```

7. After fleet login (and after the warm base has `node_modules`), prove native
   addons load under **cursor-agent's bundled Node**, not distro Node 22:

```powershell
node .cursor\skills\workq-captain\scripts\ensure-host-native-addons.js --apply
```

`$EV run` / `npm test` in a worker inherit the agent's Node (often 24,
`NODE_MODULE_VERSION` 137). Warm-base `npm ci` used to see distro Node 22
(ABI 127) and compile `better-sqlite3` the worker cannot load. Pool setup
prepends the agent `node` when it can resolve it (on a `cursor-cli` worker
fleet, failing to resolve it refuses setup); this script rebuilds an
already-wrong tree. Do not rebuild a worktree while a gate is running.

Then continue [standing-up.md](standing-up.md) at §A.-1 (or §A.0 when `/health`
already answers). Captain commands stay on Windows via `& $WQ`; pool/server
commands stay `Invoke-WqWsl`.

---

## Full upgrade

`npm run full-upgrade` from this Windows checkout is enough — do not also run
Git Bash against the Windows tree or iterate distros. The dispatcher hops **once**
(`wsl.exe -d <default>`) into `~/workq` and runs `scripts/full-upgrade.sh`
there. Same npm script inside WSL runs locally (no hop).

If the default distro is `docker-desktop`, set `WORKQ_WSL_DISTRO` or
`wsl --set-default` to Ubuntu / similar. Override the clone with
`WORKQ_WSL_CHECKOUT` (Linux path only — never `/mnt/c`). Details:
`.cursor/commands/full-upgrade.md`.

---

## Reset (retry from scratch)

Wipes the **WSL fleet host**, not the Windows product checkout. Captain stays
here.

1. In the distro: `workq-pool stop` (or `node ~/workq/apps/pool/dist/main.js stop`).
2. Stop API/dashboard (`npm run dev` in the distro).
3. `wsl --unregister <distro>` — the Ubuntu (or similar) pool distro, **never**
   `docker-desktop`.
4. Remove `%USERPROFILE%\.wslconfig` so bootstrap rewrites mirrored networking.
5. Remove `%USERPROFILE%\.workq-pool` if present (Windows must not be the daemon
   home).
6. Delete the captain skill `workq.secret.json` so the next bootstrap mints
   against a fresh server.
7. Re-run `wsl2-bootstrap.ps1`, then continue this file from § Native Windows.

Leave Docker Desktop installed. Leave the Windows git checkout in place.

---

## Troubleshooting (Windows / WSL only)

POSIX symptoms stay in [first-run.md](first-run.md). Use this table only when
the probe was `win32` or WSL.

| Symptom                                                                                | Check / fix                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doctor` ✗ supported host (Windows)                                                    | Pool is running on native Windows Node. Bootstrap, then `workq-pool` **inside** the distro. `docker-desktop` is not a worker shell. Skip-preflight cannot bypass this.                                                                              |
| `fetch failed` on `workq-pool init` from WSL                                           | Server on `127.0.0.1` unreachable under default NAT. Bootstrap writes `.wslconfig` `networkingMode=mirrored`, then `wsl --shutdown`.                                                                                                                |
| `$WQ` no-ops / fleet reads Windows `~\.workq-pool`                                     | Bash aliases in PowerShell, or `poolHome` is a Windows path. Use `node …/workq.js`; set `"poolHome": false`. Do not attach the captain to WSL unless they want to.                                                                                  |
| `doctor` ✗ cursor auth (WSL)                                                           | Ubuntu-user `cursor-agent login` is not the fleet store. Use the `HOME=…/harness-home/cursor-cli` command above, then `workq-pool auth --harness cursor-cli --logged-in`.                                                                           |
| Copying scripts from the Windows working tree                                          | `git clone` writes LF. `cp` of a `core.autocrlf` checkout leaves CR; bash then fails with `set: pipefail: invalid option`. Strip CR or clone, do not copy `.sh` from `/mnt/*`.                                                                      |
| HTTPS clone hangs / `origin` is `/mnt/d/…`                                             | Host git/gh was skipped, or someone cloned the Windows checkout. Run `ensure-host-github.js --apply --prove-url <url>`, then clone the https URL onto ext4. Never use a Windows path (`/mnt/*` or `wslpath`) as origin.                             |
| Unit tests die with `NODE_MODULE_VERSION` / `better_sqlite3.node was compiled against` | Distro Node (22, ABI 127) compiled sqlite; workers run cursor-agent Node (24, ABI 137). Run `ensure-host-native-addons.js --apply`. Do not `npm ci` with `/usr/bin/node` in the warm base.                                                          |
| `host.name` does not match API key pool / workers fail to register                     | Windows hostname is mixed-case; bootstrap creates a lowercased pool. Set `--host-name` from `$WQ whoami`, or rely on `init` rewriting after redeem. Do not re-init `--yes` just to fix the name — edit `host.name` in the Linux `pool.config.json`. |
| Full `doctor` ✗ fingerprint / "Not ready to start" on a fresh host                     | Expected before the first `start`. `start` gates on preflight only; the daemon writes the fingerprint. Do not `redeploy` just to clear that ✗.                                                                                                      |
| `scale --workers N` before first `start` says excess seats are non-idle                | Init already registered the default roster (5, or half-cores if smaller). Start the daemon, then idle shrink. `--yes` drains; do not use it on a healthy first boot.                                                                                |

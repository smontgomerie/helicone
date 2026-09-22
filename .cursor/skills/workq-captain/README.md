# workq-captain (this checkout)

Installed for driving the local workq fleet from Cursor while developing
**this** repo. Canonical skill sources also live under `apps/pool/skills/`
(fanned out onto worker bases). This copy is what Cursor loads.

```bash
WQ="node $SKILLS/workq-captain/scripts/workq.js"
$WQ whoami
$WQ fleet --digest
$WQ blocked
node $SKILLS/workq-captain/scripts/pools.js
```

Config (gitignored): `config.json` + `workq.secret.json`. Examples are committed.
Standing a fleet or a repo up end to end: [standing-up.md](standing-up.md)
(macOS / native Linux). Windows / WSL: [windows-host.md](windows-host.md) first.
First-run bootstrap (pairing-first): [first-run.md](first-run.md). Why repo
onboard decides what it does / re-open: [onboarding-a-repo.md](onboarding-a-repo.md).

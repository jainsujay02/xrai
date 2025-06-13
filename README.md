# XrAI Priority Worklist

A lightweight, end-to-end demo that

1. **Uploads** a chest X-ray + metadata (React *data-entry* form)
2. **Scores & triages** the study with LLaVA-Rad (Python backend)
3. **Displays** an auto-refreshing worklist (React *worklist* UI)

Everything runs locally—no Docker, no database—via two shell scripts.

---

* [Live ports](#live-ports)
* [Quick start](#quick-start)
* [File layout](#file-layout)
* [Environment variables](#environment-variables)
* [Troubleshooting](#troubleshooting)
* [Credits](#credits)
* [License (Highly Restricted)](#license-highly-restricted)

---

## Live ports

| Service             | URL                                                                      | Notes                |
| ------------------- | ------------------------------------------------------------------------ | -------------------- |
| **Flask API**       | [http://localhost:5050/api/worklist](http://localhost:5050/api/worklist) | CORS-enabled backend |
| **Worklist UI**     | [http://localhost:3000](http://localhost:3000)                           | CRA dev server       |
| **Data-entry form** | [http://localhost:4000](http://localhost:4000)                           | CRA dev server       |

---

## Quick start

```bash
git clone https://github.com/your-org/xrai-worklist.git
cd xrai-worklist

# one-time
chmod +x setup.sh shutdown.sh

# launch *everything* (Flask, triage-runner, 2× React)
./setup.sh

# stop all background services
./shutdown.sh
```

First run may take a minute while dependencies install.

---

## File layout

```text
backend/
├─ server.py            Flask API  (submit + worklist routes)
├─ triage_runner.py     Polls data_entry.csv → calls model → updates worklist
├─ worklist.csv         ← scored studies land here
├─ data_entry.csv       ← /api/submit appends here
├─ uploads/             ← JPEGs/PNGs saved here
frontend/               React app: priority worklist (port 3000)
data_entry/             React app: upload form      (port 4000)
setup.sh                one-click launcher
shutdown.sh             safe stop
.run/ …                 (auto-created) venv, logs, PIDs
```

---

## Troubleshooting

| Symptom                               | Fix                                                                                     |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| **Worklist stuck on “Loading…”**      | Check `.run/logs/backend.out` – Flask must be listening on **5050**.                    |
| **Runner logs “parse\_error”**        | Model occasionally returns non-JSON; row is skipped. Re-submit later.                     |
| **Ports busy after shutdown**         | `shutdown.sh` kills anything on 3000/4000/5050; if still busy, run `lsof -i :3000` etc. |
| **Corrupted `data_entry.csv` header** | Delete the file (it will be recreated) or ensure the first line ends with `\n`.         |

---

## Credits

* **LLaVA-Rad** — Microsoft
* React, Bootstrap, Day.js, React-Select

---

## License (Highly Restricted)

```
Copyright © 2025 Sujay Jain. All rights reserved.

Redistribution, modification, and commercial or non-commercial use
of this repository, in whole or in part, are strictly prohibited
without the prior written consent of the copyright holder.

This code is provided for internal demonstration and evaluation
purposes only, WITHOUT WARRANTY OF ANY KIND, express or implied.
```

> For permission to use or reference this work, please contact the author directly.

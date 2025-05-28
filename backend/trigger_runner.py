# #!/usr/bin/env python3
# """
# triage_runner.py
# ────────────────
# Monitor data_entry.csv → call llavarad /report service + GPT-4o
# → update worklist.csv with triage score & rationale.
# """

# import os, base64, io, json, time, re, csv, logging
# from pathlib import Path

# import pandas as pd
# import requests
# from PIL import Image
# from openai import OpenAI

# # ─── paths ──────────────────────────────────────────────────────────────
# DATA_DIR      = Path(__file__).parent
# ENTRY_CSV     = DATA_DIR / "data_entry.csv"
# WORKLIST_CSV  = DATA_DIR / "worklist.csv"
# UPLOADS_DIR   = DATA_DIR / "uploads"
# LEDGER_TXT    = DATA_DIR / ".triaged_uids"

# FASTAPI_URL   = "http://127.0.0.1:8000/report"     # <-- change if needed
# OPENAI_MODEL  = "gpt-4o"
# POLL_SEC      = 5
# MAX_TOKENS    = 40

# # ─── logging ────────────────────────────────────────────────────────────
# logging.basicConfig(level=logging.INFO,
#     format="triage-runner | %(levelname)s: %(message)s")

# # ─── helpers ────────────────────────────────────────────────────────────
# client = OpenAI()   # needs OPENAI_API_KEY env-var
# JSON_RE = re.compile(r"\{.*?\}", re.S)

# def img_b64(study_uid: str) -> str:
#     p = UPLOADS_DIR / study_uid
#     if not p.exists():
#         raise FileNotFoundError(p)
#     return base64.b64encode(p.read_bytes()).decode()

# def call_report(image_b64: str, reason: str | None) -> str:
#     r = requests.post(FASTAPI_URL, json={
#         "image_base64": image_b64,
#         "reason_for_study": reason
#     }, timeout=120)
#     r.raise_for_status()
#     return r.json()["report"]

# def call_openai(report: str, reason: str | None) -> tuple[int, str]:
#     system = ("You are a radiologist triage assistant. "
#               'Return ONLY valid JSON {"score":<1-5>, "rationale":"…≤40 words…"} .')
#     user = f"Findings:\n{report}"
#     if reason: user += f"\nReason for study: {reason}"

#     resp = client.chat.completions.create(
#         model=OPENAI_MODEL,
#         temperature=0.0,
#         max_tokens=MAX_TOKENS,
#         messages=[{"role":"system","content":system},
#                   {"role":"user","content":user}]
#     ).choices[0].message.content

#     m = JSON_RE.search(resp)
#     if not m: return 0, "parse_error"
#     d = json.loads(m.group(0));  return d["score"], d["rationale"]

# def load_ledger() -> set[str]:
#     return set(LEDGER_TXT.read_text().splitlines()) if LEDGER_TXT.exists() else set()

# def save_ledger(s: set[str]): LEDGER_TXT.write_text("\n".join(s))

# # ─── main loop ──────────────────────────────────────────────────────────
# def main():
#     if "OPENAI_API_KEY" not in os.environ:
#         logging.error("OPENAI_API_KEY not set"); return

#     processed = load_ledger()
#     logging.info("Watching %s …", ENTRY_CSV)

#     while True:
#         try:
#             if not ENTRY_CSV.exists():
#                 time.sleep(POLL_SEC); continue

#             df_entry = pd.read_csv(ENTRY_CSV)
#             new = df_entry[~df_entry["study_uid"].isin(processed)]

#             if new.empty:
#                 time.sleep(POLL_SEC); continue

#             df_work = pd.read_csv(WORKLIST_CSV) if WORKLIST_CSV.exists() \
#                       else pd.DataFrame(columns=[
#                           "patient_id","body_part","scan_type","ts",
#                           "triage_score","rationale","status",
#                           "override","study_uid"
#                       ])

#             for _, row in new.iterrows():
#                 uid    = row["study_uid"]
#                 reason = str(row.get("reason","")).strip()
#                 logging.info("Triage %s …", uid)

#                 try:
#                     report  = call_report(img_b64(uid), reason)
#                     score, rationale = call_openai(report, reason)
#                 except Exception as e:
#                     logging.error("%s failed: %s", uid, e); continue

#                 new_data = {
#                     "patient_id":   row["patient_id"],
#                     "body_part":    row["body_part"],
#                     "scan_type":    row["scan_type"],
#                     "ts":           row["ts"],
#                     "triage_score": score,
#                     "rationale":    rationale,
#                     "status":       "New Study",
#                     "override":     "No",
#                     "study_uid":    uid,
#                 }
#                 mask = df_work["study_uid"] == uid
#                 if mask.any(): df_work.loc[mask, new_data.keys()] = new_data.values()
#                 else:          df_work = pd.concat([df_work, pd.DataFrame([new_data])],
#                                                    ignore_index=True)

#                 processed.add(uid)
#                 logging.info("Done %s → score %s", uid, score)

#             df_work.to_csv(WORKLIST_CSV, index=False)
#             save_ledger(processed)

#         except Exception as e:
#             logging.error("Loop error: %s", e)

#         time.sleep(POLL_SEC)

# if __name__ == "__main__":
#     main()

#!/usr/bin/env python3
"""
triage_runner.py
────────────────
Monitor data_entry.csv → call llavarad /report service + GPT-4o
→ update worklist.csv with triage score & rationale.
"""

import os, base64, io, json, time, re, csv, logging
from pathlib import Path

import pandas as pd
import requests
from PIL import Image
from openai import OpenAI

# ─── paths ──────────────────────────────────────────────────────────────
DATA_DIR      = Path(__file__).parent
ENTRY_CSV     = DATA_DIR / "data_entry.csv"
WORKLIST_CSV  = DATA_DIR / "worklist.csv"
UPLOADS_DIR   = DATA_DIR / "uploads"
LEDGER_TXT    = DATA_DIR / ".triaged_uids"

FASTAPI_URL   = "http://127.0.0.1:8000/report"
OPENAI_MODEL  = "gpt-4o"
POLL_SEC      = 5
MAX_TOKENS    = 40

# ─── logging ────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO,
    format="triage-runner | %(levelname)s: %(message)s")

# ─── helpers ────────────────────────────────────────────────────────────
client = OpenAI()          # needs OPENAI_API_KEY
JSON_RE = re.compile(r"\{.*?\}", re.S)

def img_b64(study_uid: str) -> str:
    p = UPLOADS_DIR / study_uid
    if not p.exists():
        raise FileNotFoundError(p)
    return base64.b64encode(p.read_bytes()).decode()

def call_report(image_b64: str, reason: str | None) -> str:
    r = requests.post(FASTAPI_URL, json={
        "image_base64": image_b64,
        "reason_for_study": reason
    }, timeout=120)
    r.raise_for_status()
    return r.json()["report"]

def call_openai(report: str, reason: str | None) -> tuple[int, str]:
    system = ("You are a radiologist triage assistant. "
              'Return ONLY valid JSON {"score":<1-5>, "rationale":"…≤40 words…"} .')
    user = f"Findings:\n{report}"
    if reason:
        user += f"\nReason for study: {reason}"

    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0.0,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "system", "content": system},
                  {"role": "user",   "content": user}],
    ).choices[0].message.content

    match = JSON_RE.search(resp)
    if not match:
        return 0, "parse_error"
    parsed = json.loads(match.group(0))
    return int(parsed["score"]), parsed["rationale"]

def load_ledger() -> set[str]:
    if not LEDGER_TXT.exists():
        return set()
    return set(LEDGER_TXT.read_text().splitlines())

def save_ledger(keys: set[str]):
    LEDGER_TXT.write_text("\n".join(keys))

# ─── main loop ──────────────────────────────────────────────────────────
def main():
    if "OPENAI_API_KEY" not in os.environ:
        logging.error("OPENAI_API_KEY not set")
        return

    processed = load_ledger()
    logging.info("Watching %s …", ENTRY_CSV)

    while True:
        try:
            if not ENTRY_CSV.exists():
                time.sleep(POLL_SEC)
                continue

            df_entry = pd.read_csv(ENTRY_CSV, dtype=str, keep_default_na=False)

            # unique key: study_uid + ts  (always new per submission)
            df_entry["uid_key"] = df_entry["study_uid"] + "|" + df_entry["ts"]
            new_rows = df_entry[~df_entry["uid_key"].isin(processed)]

            if new_rows.empty:
                time.sleep(POLL_SEC)
                continue

            df_work = pd.read_csv(WORKLIST_CSV, dtype=str, keep_default_na=False) \
                      if WORKLIST_CSV.exists() else pd.DataFrame(columns=[
                          "patient_id", "body_part", "scan_type", "ts",
                          "triage_score", "rationale", "status",
                          "override", "study_uid"
                      ])

            for _, row in new_rows.iterrows():
                key    = row["uid_key"]
                uid    = row["study_uid"]
                reason = row["reason"].strip()

                logging.info("Triage %s …", key)

                try:
                    report = call_report(img_b64(uid), reason)
                    score, rationale = call_openai(report, reason)
                except Exception as e:
                    logging.error("%s failed: %s", key, e)
                    continue

                new_data = {
                    "patient_id":   row["patient_id"],
                    "body_part":    row["body_part"],
                    "scan_type":    row["scan_type"],
                    "ts":           row["ts"],
                    "triage_score": score,
                    "rationale":    rationale,
                    "status":       "New Study",
                    "override":     "No",
                    "study_uid":    uid,
                }

                mask = df_work["study_uid"] == uid
                if mask.any():
                    df_work.loc[mask, new_data.keys()] = new_data.values()
                else:
                    df_work = pd.concat(
                        [df_work, pd.DataFrame([new_data])], ignore_index=True
                    )

                processed.add(key)
                logging.info("Done %s → score %s", key, score)

            df_work.to_csv(WORKLIST_CSV, index=False)
            save_ledger(processed)

        except Exception as e:
            logging.error("Loop error: %s", e)

        time.sleep(POLL_SEC)

if __name__ == "__main__":
    main()

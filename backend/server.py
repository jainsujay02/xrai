import csv
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import datetime

app = Flask(__name__)
CORS(app)

# CORS(
#      app,
#      resources={r"/api/*": {"origins": [
#          "http://localhost:3000",
#          "http://localhost:4000"
#      ]}},
#      methods=["GET", "POST", "OPTIONS"],
#      allow_headers=["Content-Type"],
#      supports_credentials=False
#  )


@app.route("/api/worklist")
def get_worklist():
    path = os.path.join(os.path.dirname(__file__), "worklist.csv")
    df = pd.read_csv(path, dtype=str, keep_default_na=False)   # ← 1. no NaN
    df = df.iloc[:, :9]                                        # ← 2. drop spill-over cols
    df.columns = [
        "patient_id", "study_uid", "triage_score", "ts",
        "body_part", "status", "override", "scan_type", "rationale"
    ]
    return jsonify(df.to_dict(orient="records"))

@app.route('/api/update_override', methods=['POST'])
def update_override():
    data = request.get_json()
    patient_id = data['patient_id']
    new_override = data['override']

    path = os.path.join(os.path.dirname(__file__), 'worklist.csv')

    rows = []
    with open(path, 'r') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            if row['patient_id'] == patient_id:
                row['override'] = new_override
            rows.append(row)

    with open(path, 'w', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    return jsonify(success=True)

@app.route('/api/update_status', methods=['POST'])
def update_status():
    data = request.get_json()
    patient_id = data['patient_id']
    new_status = data['status']

    path = os.path.join(os.path.dirname(__file__), 'worklist.csv')

    rows = []
    with open(path, 'r') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            if row['patient_id'] == patient_id:
                row['status'] = new_status
            rows.append(row)

    with open(path, 'w', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    return jsonify(success=True)

@app.route('/api/update_priority', methods=['POST'])
def update_priority():
    data = request.get_json()
    patient_id = data['patient_id']
    new_score = str(data['triage_score'])

    path = os.path.join(os.path.dirname(__file__), 'worklist.csv')
    log_path = os.path.join(os.path.dirname(__file__), 'override_log.txt')

    rows = []
    for_write = []
    with open(path, 'r') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            if row['patient_id'] == patient_id:
                # Check for override logging
                if row['override'].lower() == 'yes' and row['triage_score'] != new_score:
                    header = (
                        "        time         |     patient_id     |       study_uid       |    body_part     | former_priority | new_priority |     study_date      | scan_type\n"
                    )

                    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    scan_date_str = datetime.datetime.fromtimestamp(int(row['ts'])).strftime("%Y-%m-%d %H:%M:%S")

                    line = f"{now_str:^21}  {row['patient_id']:^18}  {row['study_uid']:^22}  {row['body_part']:^17}  {row['triage_score']:^16}  {new_score:^14}  {scan_date_str:^20}  {row['scan_type']:^9}\n"

                    if not os.path.exists(log_path) or os.path.getsize(log_path) == 0:
                        with open(log_path, 'w') as log_file:
                            log_file.write(header)
                            log_file.write(line)
                    else:
                        with open(log_path, 'a') as log_file:
                            log_file.write(line)
                row['triage_score'] = new_score
            rows.append(row)

    with open(path, 'w', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)

    return jsonify(success=True)


# New route: /api/submit
@app.route('/api/submit', methods=['POST'])
def submit_entry():
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    image = request.files['image']
    form_data = request.form.to_dict()

    if not all(k in form_data for k in ['patientId', 'name', 'bodyPart', 'scanType', 'reason']):
        return jsonify({'error': 'Missing form data'}), 400

    upload_dir = os.path.join(os.path.dirname(__file__), 'uploads')
    os.makedirs(upload_dir, exist_ok=True)

    ts = int(datetime.datetime.now().timestamp())
    study_uid = image.filename
    image.save(os.path.join(upload_dir, study_uid))

    new_entry = {
        'patient_id': form_data['patientId'],
        'name': form_data['name'],
        'ts': ts,
        'study_uid': study_uid,
        'body_part': form_data['bodyPart'],
        'scan_type': form_data['scanType'],
        'reason': form_data['reason']
    }


        # ... all the code that builds `new_entry` stays the same ...

    path = os.path.join(os.path.dirname(__file__), "data_entry.csv")

    # 1) Do we need to write a header?
    need_header = not os.path.isfile(path) or os.path.getsize(path) == 0

    # 2) Will we need to prepend a newline before appending the next row?
    prepend_newline = False
    if not need_header:
        with open(path, "rb") as fh:
            fh.seek(-1, os.SEEK_END)          # read the last byte
            last_char = fh.read(1)
            prepend_newline = last_char not in {b"\n", b"\r"}

    with open(path, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=new_entry.keys())

        if need_header:
            writer.writeheader()

        if prepend_newline:
            f.write("\n")                     # ensure header and row separate

        writer.writerow(new_entry)

    return jsonify({'message': 'Form submitted successfully'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=True)
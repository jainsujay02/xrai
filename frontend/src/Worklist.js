// import React, { useState, useRef, useEffect } from "react";
// import "./Worklist.css";
// import "./PopUp.css";
// import Table from "react-bootstrap/Table";
// import { BsChevronDown, BsChevronUp } from "react-icons/bs";
// import Select from "react-select";
// import { fetchWorklist } from "./flask/fetchWorklist";
// import dayjs from "dayjs";

// export default function Worklist() {
//   /* ── state ───────────────────────────────────────────────────── */
//   const [data, setData] = useState([]);
//   const [sortConfig, setSortConfig] = useState({
//     key: "triage_score",
//     direction: "ascending",
//   });
//   const [selectedPatient, setSelectedPatient] = useState(null);
//   const [statusFilter, setStatusFilter] = useState("All");
//   const popupRef = useRef(null);

//   /* ── polling loop ────────────────────────────────────────────── */
//   useEffect(() => {
//     const load = () =>
//       fetchWorklist()
//         .then(setData)
//         .catch(console.error);

//     load();
//     const id = setInterval(load, 15000);
//     return () => clearInterval(id);
//   }, []);

//   /* ── override-lock calculation ───────────────────────────────── */
//   const reported   = data.filter((r) => r.status === "Reported");
//   const overrides  = reported.filter((r) => r.override === "Yes").length;
//   const overrideLock = reported.length
//     ? overrides / reported.length > 0.1   // >10 %
//     : false;

//   /* ── sorting & filtering ─────────────────────────────────────── */
//   const sorted = [...data].sort((a, b) => {
//     if (overrideLock) return b.ts - a.ts;           // newest first
//     if (!sortConfig.key) return 0;
//     const dir = sortConfig.direction === "ascending" ? 1 : -1;
//     if (a[sortConfig.key] < b[sortConfig.key]) return -1 * dir;
//     if (a[sortConfig.key] > b[sortConfig.key]) return 1 * dir;
//     return 0;
//   });

//   const filtered = sorted.filter(
//     (r) => statusFilter === "All" || r.status === statusFilter
//   );

//   const requestSort = (key) => {
//     if (overrideLock && key === "triage_score") return;
//     let dir = "ascending";
//     if (sortConfig.key === key && sortConfig.direction === "ascending")
//       dir = "descending";
//     setSortConfig({ key, direction: dir });
//   };

//   const handleOutsideClick = (e) =>
//     popupRef.current && e.target === popupRef.current && setSelectedPatient(null);

//   /* ── render ──────────────────────────────────────────────────── */
//   return (
//     <div className="App">
//       {/* banner when override pressure >10 % */}
//       {overrideLock && (
//         <div className="alert alert-danger text-center mb-0">
//           &gt;10 % of reported cases are manually overridden. Priority colours
//           are disabled; list is ordered by study time.
//         </div>
//       )}

//       {/* heading + filter */}
//       <div
//         style={{
//           position: "sticky",
//           top: 0,
//           zIndex: 2,
//           backgroundColor: "#f9f9f9",
//           paddingTop: "1rem",
//         }}
//       >
//         <h2>Priority Worklist</h2>
//         <div style={{ marginBottom: "15px" }}>
//           <label
//             htmlFor="statusFilter"
//             style={{ paddingLeft: "1.5rem", fontFamily: "Trebuchet MS" }}
//           >
//             Filter by Status:
//           </label>
//           <select
//             id="statusFilter"
//             value={statusFilter}
//             onChange={(e) => setStatusFilter(e.target.value)}
//             style={{
//               marginLeft: "10px",
//               fontFamily: "Trebuchet MS",
//               fontSize: "0.9rem",
//             }}
//           >
//             <option value="All">All</option>
//             <option value="Reported">Reported</option>
//             <option value="New Study">New Study</option>
//           </select>
//         </div>
//       </div>

//       {/* table */}
//       <div style={{ maxHeight: "80vh", overflowY: "scroll" }}>
//         <Table bordered hover size="sm" className="table table-striped custom-table">
//           <thead
//             style={{
//               position: "sticky",
//               top: 0,
//               backgroundColor: "#f9f9f9",
//               zIndex: 1,
//             }}
//           >
//             <tr>
//               {[
//                 ["patient_id", "PATIENT ID"],
//                 ["body_part", "BODY PART"],
//                 ["triage_score", "PRIORITY LEVEL"],
//                 ["status", "STATUS"],
//                 ["ts", "STUDY DATE"],
//                 ["override", "OVERRIDE"],
//                 ["scan_type", "SCAN TYPE"],
//               ].map(([key, label]) => (
//                 <th key={key} onClick={() => requestSort(key)}>
//                   <div className="d-flex justify-content-between align-items-center">
//                     <span>{label}</span>
//                     <span style={{ width: "1em", marginRight: "0.25em" }}>
//                       {sortConfig.key === key ? (
//                         sortConfig.direction === "ascending" ? (
//                           <BsChevronDown />
//                         ) : (
//                           <BsChevronUp />
//                         )
//                       ) : (
//                         ""
//                       )}
//                     </span>
//                   </div>
//                 </th>
//               ))}
//             </tr>
//           </thead>

//           <tbody>
//             {filtered.map((row, i) => (
//               <tr
//                 key={i}
//                 onClick={() => setSelectedPatient(row)}
//                 style={{ cursor: "pointer" }}
//               >
//                 <td>{row.patient_id}</td>
//                 <td>{row.body_part}</td>

//                 {/* coloured boxes */}
//                 <td style={{ display: "flex", gap: "4px" }}>
//                   {[1, 2, 3, 4, 5].map((lvl) => {
//                     const active = Number(row.triage_score) === lvl;
//                     const colours = {
//                       1: "#980000",
//                       2: "#d66905",
//                       3: "#f9aa15",
//                       4: "#578300",
//                       5: "#02bd8f",
//                     };
//                     return (
//                       <div
//                         key={lvl}
//                         className="priority-level"
//                         style={{
//                           width: 27,
//                           height: 27,
//                           borderRadius: 4,
//                           fontWeight: "bold",
//                           fontSize: 18,
//                           display: "flex",
//                           alignItems: "center",
//                           justifyContent: "center",
//                           color: "#f6f8f3",
//                           backgroundColor: colours[lvl],
//                           opacity: active && !overrideLock ? 1 : 0.25,
//                         }}
//                       >
//                         {active && !overrideLock ? lvl : ""}
//                       </div>
//                     );
//                   })}
//                 </td>

//                 <td>{row.status}</td>
//                 <td>{dayjs.unix(row.ts).format("YYYY-MM-DD HH:mm")}</td>
//                 <td>{row.override}</td>
//                 <td>{row.scan_type}</td>
//               </tr>
//             ))}
//           </tbody>
//         </Table>
//       </div>

//       {/* ── pop-up (dropdowns fixed with stopPropagation) ────────── */}
//       {selectedPatient && (
//         <div
//           className="popup-container"
//           ref={popupRef}
//           onClick={handleOutsideClick}
//         >
//           <div className="popup" onClick={(e) => e.stopPropagation()}>
//             <button
//               onClick={() => setSelectedPatient(null)}
//               className="exit-button"
//             >
//               ×
//             </button>
//             <h3 className="title">Patient Details</h3>

//             <p>
//               <strong className="label">Patient ID:</strong>{" "}
//               {selectedPatient.patient_id}
//             </p>
//             <p>
//               <strong className="label">Body Part:</strong>{" "}
//               {selectedPatient.body_part}
//             </p>

//             {/* priority squares */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "10px",
//                 marginBottom: "1em",
//               }}
//             >
//               <strong className="label">Priority:</strong>
//               {[1, 2, 3, 4, 5].map((lvl) => {
//                 const active = Number(selectedPatient.triage_score) === lvl;
//                 const colours = {
//                   1: "#980000",
//                   2: "#d66905",
//                   3: "#f9aa15",
//                   4: "#578300",
//                   5: "#02bd8f",
//                 };
//                 return (
//                   <div
//                     key={lvl}
//                     style={{
//                       width: 27,
//                       height: 27,
//                       borderRadius: 4,
//                       fontWeight: "bold",
//                       fontSize: 18,
//                       display: "flex",
//                       alignItems: "center",
//                       justifyContent: "center",
//                       color: "#f6f8f3",
//                       backgroundColor: colours[lvl],
//                       opacity: active ? 1 : 0.25,
//                       cursor:
//                         selectedPatient.override === "Yes" ? "pointer" : "default",
//                     }}
//                     onClick={() => {
//                       if (selectedPatient.override !== "Yes") return;
//                       setSelectedPatient({
//                         ...selectedPatient,
//                         triage_score: lvl,
//                       });
//                       setData((prev) =>
//                         prev.map((p) =>
//                           p.patient_id === selectedPatient.patient_id
//                             ? { ...p, triage_score: lvl }
//                             : p
//                         )
//                       );
//                       fetch("http://127.0.0.1:5050/api/update_priority", {
//                         method: "POST",
//                         headers: { "Content-Type": "application/json" },
//                         body: JSON.stringify({
//                           patient_id: selectedPatient.patient_id,
//                           triage_score: lvl,
//                         }),
//                       })
//                         .then((r) => r.json())
//                         .then(console.log)
//                         .catch(console.error);
//                     }}
//                   >
//                     {active ? lvl : ""}
//                   </div>
//                 );
//               })}
//             </div>

//             {/* Status dropdown */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "10px",
//                 marginBottom: "1em",
//               }}
//             >
//               <strong className="label">Status:</strong>
//               <Select
//                 value={{
//                   value: selectedPatient.status,
//                   label: selectedPatient.status,
//                 }}
//                 onChange={(opt) => {
//                   const updated = opt.value;
//                   setSelectedPatient({ ...selectedPatient, status: updated });
//                   setData((prev) =>
//                     prev.map((p) =>
//                       p.patient_id === selectedPatient.patient_id
//                         ? { ...p, status: updated }
//                         : p
//                     )
//                   );
//                   fetch("http://127.0.0.1:5050/api/update_status", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({
//                       patient_id: selectedPatient.patient_id,
//                       status: updated,
//                     }),
//                   })
//                     .then((r) => r.json())
//                     .then(console.log)
//                     .catch(console.error);
//                 }}
//                 isSearchable={false}
//                 className="dropdown-button"
//                 options={[
//                   { value: "Reported", label: "Reported" },
//                   { value: "New Study", label: "New Study" },
//                 ]}
//                 styles={{
//                   control: (p, s) => ({
//                     ...p,
//                     boxShadow: "none",
//                     border: "1.5px solid #d3d3d3",
//                     borderRadius: "8px",
//                     backgroundColor: s.isFocused ? "#e6e6e6" : "#f1f1f1",
//                     fontSize: "1.75vmin",
//                     fontWeight: "bold",
//                   }),
//                   option: (p, s) => ({
//                     ...p,
//                     backgroundColor: s.isSelected
//                       ? "#15c6e3"
//                       : s.isFocused
//                       ? "#dbdbdb"
//                       : "#f1f1f1",
//                     fontSize: "1.75vmin",
//                   }),
//                 }}
//                 menuPortalTarget={document.body}
//                 menuPosition="fixed"
//               />
//             </div>

//             <p>
//               <strong className="label">Study Date:</strong>{" "}
//               {dayjs.unix(selectedPatient.ts).format("YYYY-MM-DD HH:mm")}
//             </p>

//             {/* Override dropdown */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "10px",
//                 marginBottom: "1em",
//               }}
//             >
//               <strong className="label">Override:</strong>
//               <Select
//                 value={{
//                   value: selectedPatient.override,
//                   label: selectedPatient.override,
//                 }}
//                 onChange={(opt) => {
//                   const updated = opt.value;
//                   setSelectedPatient({ ...selectedPatient, override: updated });
//                   setData((prev) =>
//                     prev.map((p) =>
//                       p.patient_id ===	selectedPatient.patient_id
//                       ? { ...p, override: updated }
//                       : p
//                     )
//                   );
//                   fetch("http://127.0.0.1:5050/api/update_override", {
//                     method: "POST",
//                     headers: { "Content-Type": "application/json" },
//                     body: JSON.stringify({
//                       patient_id: selectedPatient.patient_id,
//                       override: updated,
//                     }),
//                   })
//                     .then((r) => r.json())
//                     .then(console.log)
//                     .catch(console.error);
//                 }}
//                 isSearchable={false}
//                 className="dropdown-button"
//                 options={[
//                   { value: "Yes", label: "Yes" },
//                   { value: "No", label: "No" },
//                 ]}
//                 styles={{
//                   control: (p, s) => ({
//                     ...p,
//                     boxShadow: "none",
//                     border: "1.5px solid #d3d3d3",
//                     borderRadius: "8px",
//                     backgroundColor: s.isFocused ? "#e6e6e6" : "#f1f1f1",
//                     fontSize: "1.75vmin",
//                     fontWeight: "bold",
//                   }),
//                   option: (p, s) => ({
//                     ...p,
//                     backgroundColor: s.isSelected
//                       ? "#15c6e3"
//                       : s.isFocused
//                       ? "#dbdbdb"
//                       : "#f1f1f1",
//                     fontSize: "1.75vmin",
//                   }),
//                 }}
//                 menuPortalTarget={document.body}
//                 menuPosition="fixed"
//               />
//             </div>

//             <p>
//               <strong className="label">Scan Type:</strong>{" "}
//               {selectedPatient.scan_type}
//             </p>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useRef, useEffect } from "react";
import "./Worklist.css";
import "./PopUp.css";
import Table from "react-bootstrap/Table";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import Select from "react-select";
import { fetchWorklist } from "./flask/fetchWorklist";
import dayjs from "dayjs";

export default function Worklist() {
  /* ── state ───────────────────────────────────────────────────── */
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "triage_score",
    direction: "ascending",
  });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const popupRef = useRef(null);

  /* ── polling loop ────────────────────────────────────────────── */
  useEffect(() => {
    const load = () =>
      fetchWorklist()
        .then(setData)
        .catch(console.error);

    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  /* ── override-lock calculation ───────────────────────────────── */
  const reported   = data.filter((r) => r.status === "Reported");
  const overrides  = reported.filter((r) => r.override === "Yes").length;
  const overrideLock = reported.length ? overrides / reported.length > 0.1 : false;

  /* ── sorting & filtering ─────────────────────────────────────── */
  const sorted = [...data].sort((a, b) => {
    if (overrideLock) return b.ts - a.ts;           // newest first when locked
    if (!sortConfig.key) return 0;
    const dir = sortConfig.direction === "ascending" ? 1 : -1;
    if (a[sortConfig.key] < b[sortConfig.key]) return -1 * dir;
    if (a[sortConfig.key] > b[sortConfig.key]) return 1 * dir;
    return 0;
  });

  const filtered = sorted.filter(
    (r) => statusFilter === "All" || r.status === statusFilter
  );

  const requestSort = (key) => {
    if (overrideLock && key === "triage_score") return;
    let dir = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending")
      dir = "descending";
    setSortConfig({ key, direction: dir });
  };

  const handleOutsideClick = (e) =>
    popupRef.current && e.target === popupRef.current && setSelectedPatient(null);

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="App">
      {overrideLock && (
        <div className="alert alert-danger text-center mb-0">
          &gt;10 % of reported cases are manually overridden. Priority colours
          are disabled; list is sorted by study time.
        </div>
      )}

      {/* heading + filter */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          backgroundColor: "#f9f9f9",
          paddingTop: "1rem",
        }}
      >
        <h2>Priority Worklist</h2>
        <div style={{ marginBottom: "15px" }}>
          <label
            htmlFor="statusFilter"
            style={{ paddingLeft: "1.5rem", fontFamily: "Trebuchet MS" }}
          >
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              marginLeft: "10px",
              fontFamily: "Trebuchet MS",
              fontSize: "0.9rem",
            }}
          >
            <option value="All">All</option>
            <option value="Reported">Reported</option>
            <option value="New Study">New Study</option>
          </select>
        </div>
      </div>

      {/* table */}
      <div style={{ maxHeight: "80vh", overflowY: "scroll" }}>
        <Table bordered hover size="sm" className="table table-striped custom-table">
          <thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#f9f9f9",
              zIndex: 1,
            }}
          >
            <tr>
              {[
                ["patient_id", "PATIENT ID"],
                ["body_part", "BODY PART"],
                ["triage_score", "PRIORITY LEVEL"],
                ["status", "STATUS"],
                ["ts", "STUDY DATE"],
                ["override", "OVERRIDE"],
                ["scan_type", "SCAN TYPE"],
              ].map(([key, label]) => (
                <th key={key} onClick={() => requestSort(key)}>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{label}</span>
                    <span style={{ width: "1em", marginRight: "0.25em" }}>
                      {sortConfig.key === key ? (
                        sortConfig.direction === "ascending" ? (
                          <BsChevronDown />
                        ) : (
                          <BsChevronUp />
                        )
                      ) : (
                        ""
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={i}
                onClick={() => setSelectedPatient(row)}
                style={{ cursor: "pointer" }}
              >
                <td>{row.patient_id}</td>
                <td>{row.body_part}</td>

                {/* coloured boxes */}
                <td style={{ display: "flex", gap: "4px" }}>
                  {[1, 2, 3, 4, 5].map((lvl) => {
                    const active = Number(row.triage_score) === lvl;
                    const colours = {
                      1: "#980000",
                      2: "#d66905",
                      3: "#f9aa15",
                      4: "#578300",
                      5: "#02bd8f",
                    };
                    return (
                      <div
                        key={lvl}
                        className="priority-level"
                        style={{
                          width: 27,
                          height: 27,
                          borderRadius: 4,
                          fontWeight: "bold",
                          fontSize: 18,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#f6f8f3",
                          backgroundColor: colours[lvl],
                          opacity: active && !overrideLock ? 1 : 0.25,
                        }}
                      >
                        {active && !overrideLock ? lvl : ""}
                      </div>
                    );
                  })}
                </td>

                <td>{row.status}</td>
                <td>{dayjs.unix(row.ts).format("YYYY-MM-DD HH:mm")}</td>
                <td>{row.override}</td>
                <td>{row.scan_type}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* pop-up ─────────────────────────────────────────────────── */}
      {selectedPatient && (
        <div
          className="popup-container"
          ref={popupRef}
          onClick={handleOutsideClick}
        >
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedPatient(null)}
              className="exit-button"
            >
              ×
            </button>
            <h3 className="title">Patient Details</h3>

            <p>
              <strong className="label">Patient ID:</strong>{" "}
              {selectedPatient.patient_id}
            </p>
            <p>
              <strong className="label">Body Part:</strong>{" "}
              {selectedPatient.body_part}
            </p>

            {/* priority squares (hidden in fallback) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "1em",
              }}
            >
              <strong className="label">Priority:</strong>
              {[1, 2, 3, 4, 5].map((lvl) => {
                const active = Number(selectedPatient.triage_score) === lvl;
                const colours = {
                  1: "#980000",
                  2: "#d66905",
                  3: "#f9aa15",
                  4: "#578300",
                  5: "#02bd8f",
                };
                return (
                  <div
                    key={lvl}
                    style={{
                      width: 27,
                      height: 27,
                      borderRadius: 4,
                      fontWeight: "bold",
                      fontSize: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f6f8f3",
                      backgroundColor: colours[lvl],
                      opacity: active && !overrideLock ? 1 : 0.25,
                      cursor:
                        selectedPatient.override === "Yes" ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (selectedPatient.override !== "Yes" || overrideLock)
                        return;
                      setSelectedPatient({
                        ...selectedPatient,
                        triage_score: lvl,
                      });
                      setData((prev) =>
                        prev.map((p) =>
                          p.patient_id === selectedPatient.patient_id
                            ? { ...p, triage_score: lvl }
                            : p
                        )
                      );
                      fetch("http://127.0.0.1:5050/api/update_priority", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          patient_id: selectedPatient.patient_id,
                          triage_score: lvl,
                        }),
                      })
                        .then((r) => r.json())
                        .then(console.log)
                        .catch(console.error);
                    }}
                  >
                    {active && !overrideLock ? lvl : ""}
                  </div>
                );
              })}
            </div>

            {/* Status dropdown */}
            <DropdownRow
              label="Status:"
              value={selectedPatient.status}
              options={[
                { value: "Reported", label: "Reported" },
                { value: "New Study", label: "New Study" },
              ]}
              onChange={(updated) => {
                setSelectedPatient({ ...selectedPatient, status: updated });
                setData((prev) =>
                  prev.map((p) =>
                    p.patient_id === selectedPatient.patient_id
                      ? { ...p, status: updated }
                      : p
                  )
                );
                fetch("http://127.0.0.1:5050/api/update_status", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    patient_id: selectedPatient.patient_id,
                    status: updated,
                  }),
                })
                  .then((r) => r.json())
                  .then(console.log)
                  .catch(console.error);
              }}
            />

            <p>
              <strong className="label">Study Date:</strong>{" "}
              {dayjs.unix(selectedPatient.ts).format("YYYY-MM-DD HH:mm")}
            </p>

            {/* Override dropdown */}
            <DropdownRow
              label="Override:"
              value={selectedPatient.override}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              onChange={(updated) => {
                setSelectedPatient({ ...selectedPatient, override: updated });
                setData((prev) =>
                  prev.map((p) =>
                    p.patient_id === selectedPatient.patient_id
                      ? { ...p, override: updated }
                      : p
                  )
                );
                fetch("http://127.0.0.1:5050/api/update_override", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    patient_id: selectedPatient.patient_id,
                    override: updated,
                  }),
                })
                  .then((r) => r.json())
                  .then(console.log)
                  .catch(console.error);
              }}
            />

            <p>
              <strong className="label">Scan Type:</strong>{" "}
              {selectedPatient.scan_type}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── small helper component for dropdown rows ───────────────────── */
function DropdownRow({ label, value, options, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "1em",
      }}
    >
      <strong className="label">{label}</strong>
      <Select
        value={{ value, label: value }}
        onChange={(opt) => onChange(opt.value)}
        isSearchable={false}
        options={options}
        className="dropdown-button"
        menuPortalTarget={document.body}
        menuPosition="fixed"
        styles={{
          control: (p, s) => ({
            ...p,
            boxShadow: "none",
            border: "1.5px solid #d3d3d3",
            borderRadius: "8px",
            backgroundColor: s.isFocused ? "#e6e6e6" : "#f1f1f1",
            fontSize: "1.75vmin",
            fontWeight: "bold",
          }),
          option: (p, s) => ({
            ...p,
            backgroundColor: s.isSelected
              ? "#15c6e3"
              : s.isFocused
              ? "#dbdbdb"
              : "#f1f1f1",
            fontSize: "1.75vmin",
          }),
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        }}
      />
    </div>
  );
}

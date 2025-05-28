// import React, { useEffect, useState } from "react";
// import { fetchWorklist } from "./flask/fetchWorklist";

// /* ── helper: seconds → "Xd Yh" ────────────────────────────────────── */
// function daysHours(sec) {
//   const d = Math.floor(sec / 86_400);            // 24 × 60 × 60
//   const h = Math.floor((sec % 86_400) / 3_600);  // 60 × 60
//   return `${d}d ${h}h`;
// }

// export default function Scores() {
//   const [stats, setStats] = useState(null);

//   /* ── load & crunch numbers once on mount ───────────────────────── */
//   useEffect(() => {
//     fetchWorklist()
//       .then((rows) => {
//         if (!rows.length) return;

//         const now = Date.now() / 1000;

//         /* overrides / reported ratio */
//         const reported = rows.filter((r) => r.status === "Reported");
//         const overrides = reported.filter((r) => r.override === "Yes").length;
//         const overrideRatio = reported.length
//           ? overrides / reported.length
//           : 0;

//         /* average turnaround (reported) */
//         const turns = reported.map((r) => now - Number(r.ts));
//         const avgTurn =
//           turns.length > 0
//             ? daysHours(turns.reduce((a, b) => a + b, 0) / turns.length)
//             : "—";

//         /* backlog per priority */
//         const unrep = rows.filter((r) => r.status !== "Reported");
//         const byLvl = Array.from({ length: 6 }, () => ({
//           count: 0,
//           worst: 0,
//         }));
//         unrep.forEach((r) => {
//           const lvl = Number(r.triage_score);
//           if (lvl >= 1 && lvl <= 5) {
//             byLvl[lvl].count += 1;
//             const wait = now - Number(r.ts);
//             if (wait > byLvl[lvl].worst) byLvl[lvl].worst = wait;
//           }
//         });

//         setStats({ overrideRatio, avgTurn, byLvl });
//       })
//       .catch(console.error);
//   }, []);

//   if (!stats) return <p>Loading…</p>;
//   const { overrideRatio, avgTurn, byLvl } = stats;

//   /* ── render ────────────────────────────────────────────────────── */
//   return (
//     <div style={{ maxWidth: 550 }}>
//       <h3>System Metrics</h3>

//       <ul className="list-group mb-3">
//         <li className="list-group-item d-flex justify-content-between">
//           <span>
//             Overrides / Reported&nbsp;
//             <small>(ratio)</small>
//           </span>
//           <strong>{(overrideRatio * 100).toFixed(1)} %</strong>
//         </li>
//         <li className="list-group-item d-flex justify-content-between">
//           <span>
//             Average turnaround&nbsp;
//             <small>(reported)</small>
//           </span>
//           <strong>{avgTurn}</strong>
//         </li>
//       </ul>

//       <h5>Un-reported backlog</h5>
//       <table className="table table-bordered table-sm" style={{ maxWidth: 400 }}>
//         <thead className="table-light">
//           <tr>
//             <th>Priority</th>
//             <th>Cases</th>
//             <th>Longest wait</th>
//           </tr>
//         </thead>
//         <tbody>
//           {byLvl.slice(1).map((o, idx) => (
//             <tr key={idx + 1}>
//               <td>{idx + 1}</td>
//               <td>{o.count}</td>
//               <td>{o.count ? daysHours(o.worst) : "—"}</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
import React, { useEffect, useState } from "react";
import { fetchWorklist } from "./flask/fetchWorklist";

/* helper: seconds → "Xd Yh" */
const daysHours = (sec) => {
  const d = Math.floor(sec / 86_400);          // 24*60*60
  const h = Math.floor((sec % 86_400) / 3_600);
  return `${d}d ${h}h`;
};

export default function Scores() {
  const [stats, setStats] = useState(null);

  /* crunch numbers once on mount */
  useEffect(() => {
    fetchWorklist()
      .then((rows) => {
        if (!rows.length) return;

        const now = Date.now() / 1000;

        /* overrides / reported */
        const reported   = rows.filter((r) => r.status === "Reported");
        const overrides  = reported.filter((r) => r.override === "Yes").length;
        const ratio      = reported.length ? overrides / reported.length : 0;

        /* average turnaround */
        const turns = reported.map((r) => now - Number(r.ts));
        const avg   = turns.length
          ? daysHours(turns.reduce((a, b) => a + b, 0) / turns.length)
          : "—";

        /* backlog per priority */
        const unrep = rows.filter((r) => r.status !== "Reported");
        const byLvl = Array.from({ length: 6 }, () => ({ count: 0, worst: 0 }));
        unrep.forEach((r) => {
          const lvl = Number(r.triage_score);
          if (lvl >= 1 && lvl <= 5) {
            byLvl[lvl].count += 1;
            const wait = now - Number(r.ts);
            if (wait > byLvl[lvl].worst) byLvl[lvl].worst = wait;
          }
        });

        setStats({ ratio, avg, byLvl });
      })
      .catch(console.error);
  }, []);

  if (!stats) return <p className="text-center mt-4">Loading…</p>;
  const { ratio, avg, byLvl } = stats;

  /* ── view ─────────────────────────────────────────────────────── */
  return (
    <div className="d-flex justify-content-center mt-4">
      <div className="card shadow-sm" style={{ width: 560 }}>
        <div className="card-body">
          <h4 className="text-center mb-4">System&nbsp;Metrics</h4>

          {/* top metrics */}
          <ul className="list-group mb-4">
            <li className="list-group-item d-flex justify-content-between">
              <span>
                Overrides / Reported&nbsp;
                <small className="text-muted">(ratio)</small>
              </span>
              <span className="badge text-bg-info fs-6">
                {(ratio * 100).toFixed(1)} %
              </span>
            </li>
            <li className="list-group-item d-flex justify-content-between">
              <span>
                Average turnaround&nbsp;
                <small className="text-muted">(reported)</small>
              </span>
              <span className="badge text-bg-secondary fs-6">{avg}</span>
            </li>
          </ul>

          {/* backlog table */}
          <h6 className="text-center">Un-reported backlog</h6>
          <table className="table table-sm table-striped text-center mb-0">
            <thead className="table-light">
              <tr>
                <th>Priority</th>
                <th>Cases</th>
                <th>Longest wait</th>
              </tr>
            </thead>
            <tbody>
              {byLvl.slice(1).map((obj, idx) => (
                <tr key={idx + 1}>
                  <td>{idx + 1}</td>
                  <td>{obj.count}</td>
                  <td>{obj.count ? daysHours(obj.worst) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

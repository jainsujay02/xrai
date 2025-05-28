import React, { useState } from "react";
import Worklist from "./Worklist";
import Scores from "./Scores";
import "bootstrap/dist/css/bootstrap.min.css";

export default function App() {
  const [tab, setTab] = useState("worklist");

  return (
    <div className="container-fluid p-3">
      {/* ── pill navigation ─────────────────────────────────────── */}
      <ul className="nav nav-pills mb-3">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "worklist" ? "active" : ""}`}
            onClick={() => setTab("worklist")}
          >
            Worklist
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === "scores" ? "active" : ""}`}
            onClick={() => setTab("scores")}
          >
            Scores
          </button>
        </li>
      </ul>

      {/* ── content panes ──────────────────────────────────────── */}
      {tab === "worklist" ? <Worklist /> : <Scores />}
    </div>
  );
}

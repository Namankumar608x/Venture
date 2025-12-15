import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function EditEventPage() {
  const { clubid, eventId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    maxPlayer: 1,
    registrationOpen: true,
    status: "registration",
    imgURL:"",
    Sport:"",
  });
  const [rules,setRules]=useState([{
    title:"",
    points:[],
  }]);

  /* ---------------- AUTH ---------------- */
const addRule = () => {
  setRules([...rules, { title: "", points: [] }]);
};

const removeRule = (ruleIndex) => {
  setRules(rules.filter((_, i) => i !== ruleIndex));
};

const updateRuleTitle = (ruleIndex, value) => {
  const updated = [...rules];
  updated[ruleIndex].title = value;
  setRules(updated);
};

const addPoint = (ruleIndex) => {
  const updated = [...rules];
  updated[ruleIndex].points.push("");
  setRules(updated);
};

const updatePoint = (ruleIndex, pointIndex, value) => {
  const updated = [...rules];
  updated[ruleIndex].points[pointIndex] = value;
  setRules(updated);
};

const removePoint = (ruleIndex, pointIndex) => {
  const updated = [...rules];
  updated[ruleIndex].points = updated[ruleIndex].points.filter(
    (_, i) => i !== pointIndex
  );
  setRules(updated);
};
  const getAuthConfig = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const payload = jwtDecode(token);
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("accessToken");
        return null;
      }
    } catch {
      localStorage.removeItem("accessToken");
      return null;
    }

    return { headers: { Authorization: `Bearer ${token}` } };
  };

  /* ---------------- FETCH EVENT ---------------- */

  const fetchEvent = async () => {
    try {
      const config = getAuthConfig();
      if (!config) return;

      const res = await axios.get(
        `http://localhost:5005/events/${eventId}`,
        config
      );

      const e = res.data.event;

      setForm({
        name: e.name || "",
        description: e.description || "",
        maxPlayer: e.maxPlayer || 1,
        registrationOpen: e.registrationOpen ?? true,
        status: e.status || "registration",
        imgURL:e.imgURL || "",
        Sport:e.Sport || ""
      });
        setRules(
      Array.isArray(e.rules) && e.rules.length > 0
        ? e.rules
        : []
    );
    } catch {
      setMessage("Failed to load event details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.maxPlayer < 1) {
      return setMessage("Max team size must be at least 1");
    }

    try {
      const config = getAuthConfig();
      if (!config) return;
       console.log("edit event");
      await axios.post(
        `http://localhost:5005/extra/${eventId}/edit-event`,{
             ...form, rules
        },
       
        config
      );

      navigate(`/events/${clubid}/${eventId}`);
    } catch (err) {
      console.log(err.response?.data?.message);
      setMessage(err.response?.data?.message || "Update failed");
    }
  };

  /* ---------------- STYLES ---------------- */

  const card =
    "bg-slate-800/50 border border-slate-700 rounded-xl p-6";
  const input =
    "w-full px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className={card}>
          <h1 className="text-2xl font-bold mb-1">Edit Event</h1>
          <p className="text-sm text-slate-400">
            Update event details carefully
          </p>
        </div>

        <form onSubmit={handleSubmit} className={`${card} space-y-4`}>

          {/* EVENT NAME */}
          <div>
            <label className="text-sm text-slate-400">Event Name</label>
            <input
              className={input}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>
           <div>
            <label className="text-sm text-slate-400">Event description</label>
            <input
              className={input}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
          </div>
            <div>
            <label className="text-sm text-slate-400">Event Banner link</label>
            <input
              className={input}
              value={form.imgURL}
              onChange={(e) =>
                setForm({ ...form, imgURL: e.target.value })
              }
             
            />
          </div>
           <div>
            <label className="text-sm text-slate-400">Event Type</label>
            <select
              className={input}
              value={form.Sport}
              onChange={(e) =>
                setForm({ ...form, Sport: e.target.value })
              }
            >
              <option value="">Select type of Sport</option>
              <option value="Cricket">Cricket</option>
              <option value="Football">Football</option>
              <option value="Chess">Chess</option>
              <option value="Badminton">Badminton</option>
              <option value="Volleyball">Volleyball</option>
              <option value="Other">other</option>
            </select>
          </div>

       <div className="space-y-6">
  <label className="text-sm text-slate-400">
    Rules & Guidelines
  </label>

  {rules.map((rule, ruleIndex) => (
    <div
      key={ruleIndex}
      className="border border-slate-700 rounded-lg p-4 space-y-3 bg-slate-800/40"
    >
      {/* RULE HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-300">
          Rule {ruleIndex + 1}
        </h3>

        {rules.length > 1 && (
          <button
            type="button"
            onClick={() => removeRule(ruleIndex)}
            className="text-red-400 text-sm"
          >
            Remove
          </button>
        )}
      </div>

      {/* RULE TITLE */}
      <input
        className={input}
        placeholder="Rule title (e.g. Team Composition)"
        value={rule.title}
        onChange={(e) =>
          updateRuleTitle(ruleIndex, e.target.value)
        }
      />

      {/* POINTS */}
      <div className="space-y-2">
        {rule.points.map((point, pointIndex) => (
          <div key={pointIndex} className="flex gap-2">
            <input
              className={`${input} flex-1`}
              placeholder={`Point ${pointIndex + 1}`}
              value={point}
              onChange={(e) =>
                updatePoint(
                  ruleIndex,
                  pointIndex,
                  e.target.value
                )
              }
            />

            <button
              type="button"
              onClick={() =>
                removePoint(ruleIndex, pointIndex)
              }
              className="px-3 rounded bg-red-600 hover:bg-red-500"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ADD POINT */}
      <button
        type="button"
        onClick={() => addPoint(ruleIndex)}
        className="text-sm text-emerald-400 hover:underline"
      >
        + Add Point
      </button>
    </div>
  ))}

  {/* ADD RULE */}
  <button
    type="button"
    onClick={addRule}
    className="text-sm text-blue-400 hover:underline"
  >
    + Add Another Rule
  </button>
</div>

          {/* TEAM SIZE */}
          <div>
            <label className="text-sm text-slate-400">
              Max Team Size
            </label>
            <input
              type="number"
              className={input}
              value={form.maxPlayer}
              onChange={(e) =>
                setForm({
                  ...form,
                  maxPlayer: Number(e.target.value),
                })
              }
            />
          </div>

          {/* REGISTRATION */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.registrationOpen}
              onChange={(e) =>
                setForm({
                  ...form,
                  registrationOpen: e.target.checked,
                })
              }
            />
            <span className="text-sm">
              Team registration open
            </span>
          </div>

          {/* STATUS */}
          <div>
            <label className="text-sm text-slate-400">Event Status</label>
            <select
              className={input}
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option value="draft">Draft</option>
              <option value="registration">Registration</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() =>
                navigate(`/events/${clubid}/${eventId}`)
              }
              className="px-4 py-2 rounded bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-emerald-600"
            >
              Save Changes
            </button>
          </div>
        </form>

        {message && (
          <div className="bg-slate-700 p-3 rounded text-center">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

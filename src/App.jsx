import { useState, useEffect, useMemo } from "react";

/* ─────────────────────── CONSTANTS & DATA ─────────────────────── */

const EQUIPMENT = [
  { id: "barbell", label: "Barbell", ico: "⬥" },
  { id: "dumbbells", label: "Dumbbells", ico: "◈" },
  { id: "cables", label: "Cables", ico: "▥" },
  { id: "pullup_bar", label: "Pull-Up Bar", ico: "┃" },
  { id: "bench", label: "Bench", ico: "▬" },
  { id: "squat_rack", label: "Squat Rack", ico: "╬" },
  { id: "kettlebell", label: "Kettlebell", ico: "◉" },
  { id: "ez_bar", label: "EZ Curl Bar", ico: "∿" },
  { id: "dip_bars", label: "Dip Bars", ico: "╥" },
  { id: "leg_press", label: "Leg Press", ico: "◧" },
  { id: "smith_machine", label: "Smith Machine", ico: "╫" },
  { id: "bands", label: "Bands", ico: "〰" },
  { id: "lat_pulldown", label: "Lat Pulldown", ico: "▼" },
  { id: "leg_curl_ext", label: "Leg Curl/Ext", ico: "◗" },
];

const SPLITS = [
  {
    id: "torso_limb",
    name: "Torso / Limb",
    freq: "4x/wk",
    note: "Torso A → Limb A → off → Torso B → Limb B → off → off",
    days: [
      { name: "Torso A", groups: ["chest", "back", "shoulders"] },
      { name: "Limb A", groups: ["quads", "hamstrings", "biceps", "triceps"] },
      { name: "Torso B", groups: ["back", "chest", "shoulders"] },
      { name: "Limb B", groups: ["hamstrings", "quads", "triceps", "biceps"] },
    ],
  },
  {
    id: "anterior_posterior",
    name: "Anterior / Posterior",
    freq: "4x/wk",
    note: "Anterior → Posterior → off → Anterior → Posterior → off → off",
    days: [
      { name: "Anterior A", groups: ["chest", "quads", "shoulders", "triceps"] },
      { name: "Posterior A", groups: ["back", "hamstrings", "biceps", "rear_delts"] },
      { name: "Anterior B", groups: ["quads", "chest", "shoulders", "triceps"] },
      { name: "Posterior B", groups: ["hamstrings", "back", "biceps", "rear_delts"] },
    ],
  },
  {
    id: "upper_lower",
    name: "Upper / Lower",
    freq: "4x/wk",
    note: "Upper → Lower → off → Upper → Lower → off → off",
    days: [
      { name: "Upper A", groups: ["chest", "back", "shoulders", "biceps", "triceps"] },
      { name: "Lower A", groups: ["quads", "hamstrings", "glutes", "calves"] },
      { name: "Upper B", groups: ["back", "chest", "shoulders", "triceps", "biceps"] },
      { name: "Lower B", groups: ["hamstrings", "quads", "glutes", "calves"] },
    ],
  },
  {
    id: "full_body",
    name: "Full Body EOD",
    freq: "3-4x/wk",
    note: "Train → off → Train → off → Train → off → off",
    days: [
      { name: "Full Body A", groups: ["quads", "chest", "back", "shoulders"] },
      { name: "Full Body B", groups: ["hamstrings", "back", "chest", "shoulders"] },
      { name: "Full Body C", groups: ["quads", "hamstrings", "chest", "back"] },
    ],
  },
];

const EX_DB = {
  chest: [
    { name: "Barbell Bench Press", eq: ["barbell", "bench"], joints: ["horizontal_push", "elbow_ext"], tier: 1 },
    { name: "Dumbbell Bench Press", eq: ["dumbbells", "bench"], joints: ["horizontal_push", "elbow_ext"], tier: 1 },
    { name: "Incline DB Press", eq: ["dumbbells", "bench"], joints: ["incline_push", "elbow_ext"], tier: 1 },
    { name: "Cable Flye", eq: ["cables"], joints: ["horizontal_adduction"], tier: 2 },
    { name: "Dips (Chest)", eq: ["dip_bars"], joints: ["horizontal_push", "elbow_ext"], tier: 1 },
    { name: "Push-Ups", eq: [], joints: ["horizontal_push", "elbow_ext"], tier: 3 },
  ],
  back: [
    { name: "Barbell Row", eq: ["barbell"], joints: ["horizontal_pull", "elbow_flex"], tier: 1 },
    { name: "Pull-Ups", eq: ["pullup_bar"], joints: ["vertical_pull", "elbow_flex"], tier: 1 },
    { name: "Lat Pulldown", eq: ["lat_pulldown"], joints: ["vertical_pull", "elbow_flex"], tier: 1 },
    { name: "Cable Row", eq: ["cables"], joints: ["horizontal_pull", "elbow_flex"], tier: 1 },
    { name: "Dumbbell Row", eq: ["dumbbells"], joints: ["horizontal_pull", "elbow_flex"], tier: 1 },
    { name: "Chin-Ups", eq: ["pullup_bar"], joints: ["vertical_pull", "elbow_flex_supinated"], tier: 1 },
  ],
  shoulders: [
    { name: "Overhead Press", eq: ["barbell", "squat_rack"], joints: ["vertical_push", "elbow_ext"], tier: 1 },
    { name: "DB Shoulder Press", eq: ["dumbbells"], joints: ["vertical_push", "elbow_ext"], tier: 1 },
    { name: "Lateral Raise", eq: ["dumbbells"], joints: ["shoulder_abduction"], tier: 2 },
    { name: "Cable Lateral Raise", eq: ["cables"], joints: ["shoulder_abduction"], tier: 2 },
  ],
  rear_delts: [
    { name: "Face Pull", eq: ["cables"], joints: ["horizontal_pull", "ext_rotation"], tier: 2 },
    { name: "Rear Delt Fly", eq: ["dumbbells"], joints: ["horizontal_abduction"], tier: 2 },
    { name: "Band Pull-Apart", eq: ["bands"], joints: ["horizontal_abduction"], tier: 3 },
  ],
  quads: [
    { name: "Barbell Back Squat", eq: ["barbell", "squat_rack"], joints: ["knee_ext", "hip_ext"], tier: 1 },
    { name: "Front Squat", eq: ["barbell", "squat_rack"], joints: ["knee_ext", "hip_ext"], tier: 1 },
    { name: "Leg Press", eq: ["leg_press"], joints: ["knee_ext", "hip_ext"], tier: 1 },
    { name: "Bulgarian Split Squat", eq: ["dumbbells"], joints: ["knee_ext", "hip_ext"], tier: 1 },
    { name: "Goblet Squat", eq: ["dumbbells"], joints: ["knee_ext", "hip_ext"], tier: 2 },
    { name: "Leg Extension", eq: ["leg_curl_ext"], joints: ["knee_ext"], tier: 2 },
  ],
  hamstrings: [
    { name: "Romanian Deadlift", eq: ["barbell"], joints: ["hip_hinge", "knee_flex_isometric"], tier: 1 },
    { name: "DB Romanian Deadlift", eq: ["dumbbells"], joints: ["hip_hinge"], tier: 1 },
    { name: "Leg Curl", eq: ["leg_curl_ext"], joints: ["knee_flex"], tier: 2 },
    { name: "KB Swing", eq: ["kettlebell"], joints: ["hip_hinge", "hip_ext"], tier: 2 },
    { name: "Nordic Curl", eq: [], joints: ["knee_flex"], tier: 1 },
  ],
  glutes: [
    { name: "Hip Thrust", eq: ["barbell", "bench"], joints: ["hip_ext"], tier: 1 },
    { name: "DB Hip Thrust", eq: ["dumbbells", "bench"], joints: ["hip_ext"], tier: 1 },
    { name: "Cable Kickback", eq: ["cables"], joints: ["hip_ext"], tier: 2 },
    { name: "Glute Bridge", eq: [], joints: ["hip_ext"], tier: 3 },
  ],
  biceps: [
    { name: "Barbell Curl", eq: ["barbell"], joints: ["elbow_flex_supinated"], tier: 1 },
    { name: "EZ Bar Curl", eq: ["ez_bar"], joints: ["elbow_flex_supinated"], tier: 1 },
    { name: "DB Hammer Curl", eq: ["dumbbells"], joints: ["elbow_flex_neutral"], tier: 2 },
    { name: "Cable Curl", eq: ["cables"], joints: ["elbow_flex_supinated"], tier: 2 },
  ],
  triceps: [
    { name: "Close-Grip Bench", eq: ["barbell", "bench"], joints: ["elbow_ext", "horizontal_push"], tier: 1 },
    { name: "Cable Pushdown", eq: ["cables"], joints: ["elbow_ext"], tier: 1 },
    { name: "Overhead DB Extension", eq: ["dumbbells"], joints: ["elbow_ext_overhead"], tier: 2 },
    { name: "Skull Crusher", eq: ["ez_bar", "bench"], joints: ["elbow_ext_overhead"], tier: 1 },
  ],
  calves: [
    { name: "Standing Calf Raise", eq: ["smith_machine"], joints: ["ankle_plantar"], tier: 1 },
    { name: "DB Calf Raise", eq: ["dumbbells"], joints: ["ankle_plantar"], tier: 2 },
    { name: "Leg Press Calf Raise", eq: ["leg_press"], joints: ["ankle_plantar"], tier: 2 },
    { name: "BW Calf Raise", eq: [], joints: ["ankle_plantar"], tier: 3 },
  ],
};

function pickExercises(groups, equipSet, target = 5) {
  const coveredJoints = new Set();
  const picked = [];
  for (const g of groups) {
    const pool = (EX_DB[g] || [])
      .filter((ex) => ex.eq.length === 0 || ex.eq.every((e) => equipSet.has(e)))
      .sort((a, b) => a.tier - b.tier);
    for (const ex of pool) {
      const newJoints = ex.joints.filter((j) => !coveredJoints.has(j));
      if (newJoints.length > 0 && picked.length < target) {
        picked.push({ ...ex, muscle: g });
        ex.joints.forEach((j) => coveredJoints.add(j));
        break;
      }
    }
  }
  if (picked.length < target) {
    for (const g of groups) {
      const pool = (EX_DB[g] || [])
        .filter((ex) => (ex.eq.length === 0 || ex.eq.every((e) => equipSet.has(e))) && !picked.some((p) => p.name === ex.name))
        .sort((a, b) => a.tier - b.tier);
      for (const ex of pool) {
        const newJoints = ex.joints.filter((j) => !coveredJoints.has(j));
        if (newJoints.length > 0 && picked.length < target) {
          picked.push({ ...ex, muscle: g });
          ex.joints.forEach((j) => coveredJoints.add(j));
        }
      }
      if (picked.length >= target) break;
    }
  }
  return picked;
}

const WEEK_PROTOCOL = [
  { wk: 1, label: "Wk 1 — Intro 10RM", sets: 1, note: "Work up to 1 set at your 10-rep max." },
  { wk: 2, label: "Wk 2 — Volume", sets: 2, note: "2 working sets x 8 reps using the same load as your 10RM." },
  { wk: 3, label: "Wk 3 — Load Up", sets: 2, note: "Set 1: add load, 6 reps @ 2 RIR. Set 2: same load x 6 reps." },
  { wk: 4, label: "Wk 4 — Rep Push", sets: 2, note: "Set 1: 7 reps with Wk 3 load. Set 2: reduce 10% x 7 reps." },
  { wk: 5, label: "Wk 5 — Intensity", sets: 2, note: "Set 1: increase load, 5 reps @ 1 RIR. Set 2: -10% x 5 reps." },
  { wk: 6, label: "Wk 6 — Static", sets: 2, note: "Same load as Wk 5. Set 1: 5 reps (more RIR). Set 2: -10% x 5." },
  { wk: 7, label: "Wk 7 — Load Bump", sets: 2, note: "Set 1: increase load, 6 reps @ 1 RIR. Set 2: -10% x 6 reps." },
  { wk: 8, label: "Wk 8 — Push", sets: 2, note: "Set 1: increase load, 5 reps @ 1 RIR. Set 2: -10% x 5 reps." },
  { wk: 9, label: "Wk 9 — Static", sets: 2, note: "Same loads as Wk 8. Set 1: 5 reps. Set 2: -10% x 5." },
  { wk: 10, label: "Wk 10 — Peak", sets: 2, note: "Set 1: increase load, 4 reps @ 1 RIR. Set 2: -10% x 5 reps." },
  { wk: 11, label: "Wk 11 — Static", sets: 2, note: "Same loads as Wk 10. Set 1: 4 reps. Set 2: 5 reps." },
  { wk: 12, label: "Wk 12 — Rep PR", sets: 2, note: "Set 1: hit 5 reps with your Wk 11 4-rep load! Set 2: -10% x 5." },
];

const PROTOCOL_DETAIL = [
  [{ reps: 10, rir: null, pct: "10RM", desc: "Find your 10RM" }],
  [{ reps: 8, rir: "~2", pct: "10RM", desc: "10RM load" }, { reps: 8, rir: "~2", pct: "10RM", desc: "10RM load" }],
  [{ reps: 6, rir: "2", pct: "UP", desc: "Add load" }, { reps: 6, rir: null, pct: "SAME", desc: "Same load" }],
  [{ reps: 7, rir: null, pct: "SAME", desc: "Wk3 load" }, { reps: 7, rir: null, pct: "-10%", desc: "Back-off" }],
  [{ reps: 5, rir: "1", pct: "UP", desc: "Add load" }, { reps: 5, rir: null, pct: "-10%", desc: "Back-off" }],
  [{ reps: 5, rir: "2+", pct: "SAME", desc: "Wk5 load" }, { reps: 5, rir: null, pct: "-10%", desc: "Back-off" }],
  [{ reps: 6, rir: "1", pct: "UP", desc: "Add load" }, { reps: 6, rir: null, pct: "-10%", desc: "Back-off" }],
  [{ reps: 5, rir: "1", pct: "UP", desc: "Add load" }, { reps: 5, rir: null, pct: "-10%", desc: "Back-off" }],
  [{ reps: 5, rir: null, pct: "SAME", desc: "Wk8 load" }, { reps: 5, rir: null, pct: "-10%", desc: "Same back-off" }],
  [{ reps: 4, rir: "1", pct: "UP", desc: "Add load" }, { reps: 5, rir: null, pct: "-10%", desc: "Back-off" }],
  [{ reps: 4, rir: null, pct: "SAME", desc: "Wk10 load" }, { reps: 5, rir: null, pct: "SAME", desc: "Same back-off" }],
  [{ reps: 5, rir: null, pct: "SAME", desc: "5 w/ Wk11 4-rep load" }, { reps: 5, rir: null, pct: "-10%", desc: "Back-off" }],
];

function calcNutrition(weight, height, goal, weekData) {
  const weightKg = weight * 0.453592;
  const heightCm = height * 2.54;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 28 + 5;
  const tdee = Math.round(bmr * 1.55);
  let cals = goal === "bulk" ? tdee + 300 : tdee - 500;
  if (weekData && weekData.length > 0) {
    const last = weekData[weekData.length - 1];
    if (goal === "bulk" && last.delta < 0.3) cals += 100;
    if (goal === "bulk" && last.delta > 1.0) cals -= 100;
    if (goal === "cut" && last.delta > -0.5) cals -= 100;
    if (goal === "cut" && last.delta < -1.5) cals += 100;
  }
  cals = Math.max(1200, cals);
  const protein = Math.round(weight * 1.0);
  const fat = Math.round((cals * 0.25) / 9);
  const carbs = Math.round((cals - protein * 4 - fat * 9) / 4);
  return { cals, protein, fat, carbs, tdee };
}

const BULK_FOODS = [
  { name: "Chicken Breast (5 lb)", price: 12.99, protein: 165, cals: 825, cat: "Protein" },
  { name: "Ground Beef 90/10 (3 lb)", price: 14.49, protein: 105, cals: 660, cat: "Protein" },
  { name: "Eggs (36 ct)", price: 7.99, protein: 72, cals: 504, cat: "Protein" },
  { name: "Greek Yogurt (32 oz)", price: 5.49, protein: 60, cals: 360, cat: "Protein" },
  { name: "Whole Milk (1 gal)", price: 4.29, protein: 32, cals: 600, cat: "Dairy" },
  { name: "White Rice (5 lb)", price: 4.99, protein: 30, cals: 3600, cat: "Carbs" },
  { name: "Oats (42 oz)", price: 4.49, protein: 35, cals: 1575, cat: "Carbs" },
  { name: "Sweet Potatoes (3 lb)", price: 3.99, protein: 12, cals: 540, cat: "Carbs" },
  { name: "Bananas (bunch)", price: 1.49, protein: 5, cals: 420, cat: "Carbs" },
  { name: "Bread (whole wheat)", price: 3.49, protein: 20, cals: 560, cat: "Carbs" },
  { name: "Peanut Butter (16 oz)", price: 4.99, protein: 28, cals: 1344, cat: "Fats" },
  { name: "Olive Oil (16 oz)", price: 6.99, protein: 0, cals: 3600, cat: "Fats" },
  { name: "Avocados (4 ct)", price: 4.49, protein: 4, cals: 640, cat: "Fats" },
  { name: "Mixed Veggies frozen (2 lb)", price: 3.29, protein: 8, cals: 200, cat: "Produce" },
  { name: "Broccoli (2 lb)", price: 2.99, protein: 10, cals: 120, cat: "Produce" },
  { name: "Spinach (10 oz bag)", price: 3.49, protein: 8, cals: 65, cat: "Produce" },
];

const CUT_FOODS = [
  { name: "Chicken Breast (5 lb)", price: 12.99, protein: 165, cals: 825, cat: "Protein" },
  { name: "Turkey Breast Deli (1 lb)", price: 7.99, protein: 60, cals: 360, cat: "Protein" },
  { name: "Tilapia Fillets (2 lb)", price: 9.99, protein: 90, cals: 432, cat: "Protein" },
  { name: "Egg Whites (32 oz)", price: 5.49, protein: 80, cals: 400, cat: "Protein" },
  { name: "Greek Yogurt 0% (32 oz)", price: 5.49, protein: 68, cals: 380, cat: "Protein" },
  { name: "Brown Rice (2 lb)", price: 3.49, protein: 15, cals: 1440, cat: "Carbs" },
  { name: "Sweet Potatoes (3 lb)", price: 3.99, protein: 12, cals: 540, cat: "Carbs" },
  { name: "Oats (42 oz)", price: 4.49, protein: 35, cals: 1575, cat: "Carbs" },
  { name: "Broccoli (2 lb)", price: 2.99, protein: 10, cals: 120, cat: "Produce" },
  { name: "Spinach (10 oz bag)", price: 3.49, protein: 8, cals: 65, cat: "Produce" },
  { name: "Mixed Greens (5 oz)", price: 3.99, protein: 3, cals: 30, cat: "Produce" },
  { name: "Cucumber (2 ct)", price: 1.79, protein: 2, cals: 30, cat: "Produce" },
  { name: "Bell Peppers (3 ct)", price: 3.49, protein: 3, cals: 60, cat: "Produce" },
  { name: "Cauliflower Rice (frozen)", price: 2.99, protein: 4, cals: 100, cat: "Produce" },
  { name: "Almond Butter (12 oz)", price: 7.99, protein: 21, cals: 1176, cat: "Fats" },
  { name: "Olive Oil (16 oz)", price: 6.99, protein: 0, cals: 3600, cat: "Fats" },
];

const MC = { chest: "#ef4444", back: "#3b82f6", shoulders: "#f59e0b", rear_delts: "#f59e0b", quads: "#10b981", hamstrings: "#06b6d4", glutes: "#8b5cf6", biceps: "#ec4899", triceps: "#f97316", calves: "#14b8a6" };

/* ─────────────────────── MAIN APP ─────────────────────── */
export default function App() {
  const [page, setPage] = useState("training");
  const [step, setStep] = useState(0);
  const [equip, setEquip] = useState(new Set());
  const [splitId, setSplitId] = useState(null);
  const [program, setProgram] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [activeWeek, setActiveWeek] = useState(0);
  const [checked, setChecked] = useState(new Set());
  const [logs, setLogs] = useState({});
  const [nGoal, setNGoal] = useState(null);
  const [nWeight, setNWeight] = useState("");
  const [nHeight, setNHeight] = useState("");
  const [nSetup, setNSetup] = useState(false);
  const [weekCheckins, setWeekCheckins] = useState([]);
  const [checkinWt, setCheckinWt] = useState("");
  const [groLoc, setGroLoc] = useState("");
  const [stores, setStores] = useState(null);
  const [groList, setGroList] = useState(null);

  const split = SPLITS.find((s) => s.id === splitId);
  const proto = WEEK_PROTOCOL[activeWeek];
  const detail = PROTOCOL_DETAIL[activeWeek];
  const nutrition = useMemo(() => {
    if (!nWeight || !nHeight || !nGoal) return null;
    return calcNutrition(Number(nWeight), Number(nHeight), nGoal, weekCheckins);
  }, [nWeight, nHeight, nGoal, weekCheckins]);

  const handleGen = () => {
    if (!split) return;
    const eqSet = new Set([...equip]);
    setProgram(split.days.map((d) => ({ ...d, exercises: pickExercises(d.groups, eqSet, 5) })));
    setStep(2);
  };

  const logW = (ei, si, v) => setLogs((p) => ({ ...p, [`${activeWeek}-${activeDay}-${ei}-${si}`]: v }));
  const getW = (ei, si) => logs[`${activeWeek}-${activeDay}-${ei}-${si}`] || "";
  const togChk = (i) => { const k = `${activeWeek}-${activeDay}-${i}`; setChecked((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); };

  const doCheckin = () => {
    if (!checkinWt) return;
    const prev = weekCheckins.length > 0 ? weekCheckins[weekCheckins.length - 1].weight : Number(nWeight);
    setWeekCheckins((p) => [...p, { weight: Number(checkinWt), delta: Number(checkinWt) - prev }]);
    setCheckinWt("");
  };

  const findStores = () => {
    if (!groLoc) return;
    setStores([
      { name: "Aldi", dist: "0.8 mi" },
      { name: "Walmart Supercenter", dist: "1.2 mi" },
      { name: "Trader Joe's", dist: "2.1 mi" },
      { name: "Costco", dist: "3.4 mi" },
    ]);
    setGroList(nGoal === "cut" ? CUT_FOODS : BULK_FOODS);
  };

  const groTotal = groList ? groList.reduce((s, f) => s + f.price, 0).toFixed(2) : "0.00";

  const a = "#e84545", bg = "#08080c", sf = "rgba(255,255,255,0.025)", bd = "rgba(255,255,255,0.07)", dm = "rgba(255,255,255,0.35)", md = "rgba(255,255,255,0.6)";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#e4e4e8", fontFamily: "'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(.85)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
        .ani{animation:fi .4s ease-out both}
        .bp{background:linear-gradient(135deg,${a},#c23030);color:#fff;border:none;border-radius:10px;padding:13px 36px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s}
        .bp:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(232,69,69,.3)}
        .bp:disabled{opacity:.25;cursor:not-allowed;transform:none;box-shadow:none}
        .bs{background:none;border:1.5px solid ${bd};color:${md};border-radius:10px;padding:10px 22px;font-size:13px;cursor:pointer;font-family:inherit;transition:all .2s}
        .bs:hover{border-color:rgba(255,255,255,.2);color:#fff}
        .eb{border:1.5px solid ${bd};background:${sf};border-radius:11px;padding:13px 8px;cursor:pointer;transition:all .2s;text-align:center}
        .eb:hover{border-color:rgba(255,255,255,.13);transform:translateY(-1px)}
        .eb.on{border-color:${a};background:rgba(232,69,69,.07)}
        .sc{border:1.5px solid ${bd};background:${sf};border-radius:13px;padding:18px;cursor:pointer;transition:all .22s}
        .sc:hover{border-color:rgba(255,255,255,.13);transform:translateY(-1px)}
        .sc.on{border-color:${a};background:rgba(232,69,69,.05)}
        .tb{padding:10px 18px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;transition:all .2s;border:1.5px solid transparent;background:${sf};white-space:nowrap}
        .tb:hover{background:rgba(255,255,255,.05)}
        .tb.on{background:rgba(232,69,69,.1);border-color:${a};color:${a}}
        .nb{flex:1;padding:14px 0;text-align:center;cursor:pointer;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;transition:all .2s;border-bottom:2px solid transparent;color:${dm}}
        .nb:hover{color:${md}}
        .nb.on{color:${a};border-bottom-color:${a}}
        .ip{background:rgba(255,255,255,.04);border:1.5px solid ${bd};border-radius:9px;padding:11px 14px;color:#e4e4e8;font-size:14px;font-family:inherit;outline:none;width:100%;transition:border .2s}
        .ip:focus{border-color:${a}}
        .ip::placeholder{color:${dm}}
        .tg{display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
        .wp{padding:6px 14px;border-radius:8px;font-size:11px;font-weight:500;cursor:pointer;transition:all .15s;border:1px solid transparent;background:${sf};color:${dm};white-space:nowrap;font-family:'JetBrains Mono',monospace}
        .wp:hover{background:rgba(255,255,255,.05)}
        .wp.on{background:rgba(232,69,69,.12);border-color:${a};color:${a}}
        .ck{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;transition:all .2s;flex-shrink:0}
        .ck:hover{border-color:rgba(255,255,255,.25)}
        .ck.dn{background:${a};border-color:${a};animation:pop .25s ease-out}
        ::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}
      `}</style>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px 100px" }}>
        {/* HEADER */}
        <div className="ani" style={{ textAlign: "center", padding: "28px 0 6px" }}>
          <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, letterSpacing: ".3em", color: a, textTransform: "uppercase", marginBottom: 6 }}>12-Week Periodized System</div>
          <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 800, letterSpacing: "-.03em" }}>
            <span style={{ background: `linear-gradient(135deg,#fff 40%,${md})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Iron Protocol</span>
          </h1>
        </div>

        {/* NAV */}
        <div style={{ display: "flex", borderBottom: `1px solid ${bd}`, margin: "16px 0 28px", position: "sticky", top: 0, zIndex: 10, background: bg, paddingTop: 4 }}>
          {["training", "nutrition", "grocery"].map((n) => (
            <div key={n} className={`nb ${page === n ? "on" : ""}`} onClick={() => setPage(n)}>{n}</div>
          ))}
        </div>

        {/* ═══ TRAINING ═══ */}
        {page === "training" && step === 0 && (
          <div className="ani">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Select Your Equipment</h2>
            <p style={{ fontSize: 13, color: dm, marginBottom: 20 }}>Bodyweight is always available. Pick everything you have access to.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(108px,1fr))", gap: 8, marginBottom: 28 }}>
              {EQUIPMENT.map((e) => (
                <div key={e.id} className={`eb ${equip.has(e.id) ? "on" : ""}`} onClick={() => { const n = new Set(equip); n.has(e.id) ? n.delete(e.id) : n.add(e.id); setEquip(n); }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{e.ico}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: equip.has(e.id) ? "#fff" : md }}>{e.label}</div>
                  {equip.has(e.id) && <div style={{ fontSize: 9, color: a, marginTop: 2 }}>✓</div>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}><button className="bp" onClick={() => setStep(1)}>Next → Pick Split</button></div>
          </div>
        )}

        {page === "training" && step === 1 && (
          <div className="ani">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Choose Your Split</h2>
            <p style={{ fontSize: 13, color: dm, marginBottom: 20 }}>~5 exercises per session. Joint-function overlap eliminated.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {SPLITS.map((s) => (
                <div key={s.id} className={`sc ${splitId === s.id ? "on" : ""}`} onClick={() => setSplitId(s.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: dm, fontFamily: "'JetBrains Mono'" }}>{s.freq}</span>
                  </div>
                  <p style={{ fontSize: 12, color: dm, marginTop: 6 }}>{s.note}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                    {s.days.map((d) => <span key={d.name} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(232,69,69,.08)", color: a }}>{d.name}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <button className="bs" onClick={() => setStep(0)}>← Back</button>
              <button className="bp" disabled={!splitId} onClick={handleGen}>Generate Program</button>
            </div>
          </div>
        )}

        {page === "training" && step === 2 && program && (
          <div className="ani">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>{split?.name}</h2>
                <p style={{ fontSize: 12, color: dm }}>{equip.size} equipment items • ~5 exercises/session</p>
              </div>
              <button className="bs" onClick={() => { setStep(1); setProgram(null); }}>← Edit</button>
            </div>

            {/* Week selector */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Week</div>
              <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4 }}>
                {WEEK_PROTOCOL.map((_, i) => (
                  <div key={i} className={`wp ${activeWeek === i ? "on" : ""}`} onClick={() => { setActiveWeek(i); setChecked(new Set()); }}>{i + 1}</div>
                ))}
              </div>
            </div>

            {/* Protocol card */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{proto.label}</div>
              <p style={{ fontSize: 13, color: md, lineHeight: 1.5 }}>{proto.note}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                {detail.map((s, i) => (
                  <div key={i} style={{ flex: 1, minWidth: 140, background: "rgba(255,255,255,.02)", borderRadius: 8, padding: "10px 12px", border: `1px solid ${bd}` }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em" }}>Set {i + 1}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono'", marginTop: 4 }}>{s.reps} <span style={{ fontSize: 12, color: dm }}>reps</span></div>
                    <div style={{ fontSize: 11, color: md, marginTop: 2 }}>
                      {s.rir && <span style={{ color: a }}>@{s.rir} RIR </span>}
                      <span style={{ padding: "1px 5px", borderRadius: 4, fontSize: 9, background: s.pct === "UP" ? "rgba(16,185,129,.12)" : s.pct === "-10%" ? "rgba(232,69,69,.1)" : "rgba(255,255,255,.04)", color: s.pct === "UP" ? "#10b981" : s.pct === "-10%" ? a : dm, fontWeight: 600 }}>{s.pct}</span>
                      <span style={{ marginLeft: 4 }}>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Day tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
              {program.map((d, i) => <div key={i} className={`tb ${activeDay === i ? "on" : ""}`} onClick={() => setActiveDay(i)}>{d.name}</div>)}
            </div>

            {/* Exercises */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: "4px 16px 12px" }}>
              {program[activeDay]?.exercises.map((ex, i) => {
                const k = `${activeWeek}-${activeDay}-${i}`;
                const done = checked.has(k);
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 12, padding: "14px 0", borderBottom: `1px solid ${bd}`, alignItems: "start", opacity: done ? .4 : 1 }}>
                    <div className={`ck ${done ? "dn" : ""}`} onClick={() => togChk(i)} style={{ marginTop: 2 }}>{done && "✓"}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 500, textDecoration: done ? "line-through" : "none" }}>{ex.name}</span>
                        <span className="tg" style={{ background: `${MC[ex.muscle] || "#666"}18`, color: MC[ex.muscle] || "#888" }}>{ex.muscle.replace("_", " ")}</span>
                      </div>
                      <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
                        {ex.joints.map((j) => <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,.04)", color: dm }}>{j.replace(/_/g, " ")}</span>)}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {Array.from({ length: proto.sets }).map((_, si) => (
                          <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: si > 0 ? 5 : 0 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: dm, width: 28, fontFamily: "'JetBrains Mono'" }}>S{si + 1}</span>
                            <span style={{ fontSize: 11, color: md, fontFamily: "'JetBrains Mono'", minWidth: 90 }}>
                              {detail[si]?.reps}r
                              {detail[si]?.rir && <span style={{ color: a }}> @{detail[si].rir}</span>}
                              {detail[si]?.pct === "-10%" && <span style={{ color: "#f59e0b" }}> -10%</span>}
                            </span>
                            <input className="ip" style={{ width: 80, padding: "6px 8px", fontSize: 12, fontFamily: "'JetBrains Mono'" }} placeholder="lbs" value={getW(i, si)} onChange={(e) => logW(i, si, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!program[activeDay]?.exercises || program[activeDay].exercises.length === 0) && (
                <div style={{ padding: 32, textAlign: "center", color: dm, fontSize: 13 }}>No exercises matched. Try adding more equipment.</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ NUTRITION ═══ */}
        {page === "nutrition" && !nSetup && (
          <div className="ani">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Nutrition Setup</h2>
            <p style={{ fontSize: 13, color: dm, marginBottom: 24 }}>Calories & macros calculated from your stats. Weekly check-ins auto-adjust targets.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 380 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Goal</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["bulk", "cut"].map((g) => (
                    <div key={g} onClick={() => setNGoal(g)} style={{ flex: 1, padding: "14px 0", textAlign: "center", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${nGoal === g ? a : bd}`, background: nGoal === g ? "rgba(232,69,69,.07)" : sf, fontSize: 14, fontWeight: 600, color: nGoal === g ? a : md, textTransform: "uppercase", transition: "all .2s" }}>
                      {g === "bulk" ? "↑ Bulk" : "↓ Cut"}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Weight (lbs)</label>
                <input className="ip" type="number" placeholder="e.g. 180" value={nWeight} onChange={(e) => setNWeight(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Height (inches)</label>
                <input className="ip" type="number" placeholder="e.g. 70" value={nHeight} onChange={(e) => setNHeight(e.target.value)} />
              </div>
              <button className="bp" style={{ marginTop: 8 }} disabled={!nGoal || !nWeight || !nHeight} onClick={() => setNSetup(true)}>Calculate Plan</button>
            </div>
          </div>
        )}

        {page === "nutrition" && nSetup && nutrition && (
          <div className="ani">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{nGoal === "bulk" ? "↑ Bulk" : "↓ Cut"} Plan</h2>
              <button className="bs" onClick={() => setNSetup(false)}>Edit</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginBottom: 20 }}>
              {[
                { l: "Calories", v: nutrition.cals, u: "kcal", c: a },
                { l: "Protein", v: nutrition.protein, u: "g", c: "#3b82f6" },
                { l: "Carbs", v: nutrition.carbs, u: "g", c: "#10b981" },
                { l: "Fat", v: nutrition.fat, u: "g", c: "#f59e0b" },
              ].map((m) => (
                <div key={m.l} style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: 16, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>{m.l}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono'", color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 11, color: dm }}>{m.u}/day</div>
                </div>
              ))}
            </div>

            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: dm, textTransform: "uppercase", marginBottom: 4 }}>TDEE</div>
              <div style={{ fontSize: 13, color: md }}>{nutrition.tdee} kcal/day (moderate activity) → {nGoal === "bulk" ? "+300 surplus" : "-500 deficit"}</div>
            </div>

            {/* Macro bar */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: dm, textTransform: "uppercase", marginBottom: 10 }}>Macro Split</div>
              <div style={{ height: 14, borderRadius: 7, overflow: "hidden", display: "flex", marginBottom: 8 }}>
                <div style={{ width: `${(nutrition.protein * 4 / nutrition.cals) * 100}%`, background: "#3b82f6", transition: "width .3s" }} />
                <div style={{ width: `${(nutrition.carbs * 4 / nutrition.cals) * 100}%`, background: "#10b981", transition: "width .3s" }} />
                <div style={{ width: `${(nutrition.fat * 9 / nutrition.cals) * 100}%`, background: "#f59e0b", transition: "width .3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: md }}>
                <span>Protein {Math.round((nutrition.protein * 4 / nutrition.cals) * 100)}%</span>
                <span>Carbs {Math.round((nutrition.carbs * 4 / nutrition.cals) * 100)}%</span>
                <span>Fat {Math.round((nutrition.fat * 9 / nutrition.cals) * 100)}%</span>
              </div>
            </div>

            {/* Check-in */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Weekly Check-In</h3>
              <p style={{ fontSize: 12, color: dm, marginBottom: 12 }}>Log weight weekly. Calories auto-adjust if {nGoal === "bulk" ? "gain" : "loss"} rate is off target.</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="ip" style={{ flex: 1, maxWidth: 160 }} type="number" placeholder="Current lbs" value={checkinWt} onChange={(e) => setCheckinWt(e.target.value)} />
                <button className="bp" style={{ padding: "11px 20px", fontSize: 13 }} onClick={doCheckin} disabled={!checkinWt}>Log</button>
              </div>
              {weekCheckins.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: dm, marginBottom: 6 }}>HISTORY</div>
                  {weekCheckins.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,.02)", fontSize: 13, marginBottom: 3 }}>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 500 }}>Wk {i + 1}</span>
                      <span style={{ fontFamily: "'JetBrains Mono'" }}>{c.weight} lbs</span>
                      <span style={{ color: c.delta >= 0 ? "#10b981" : a, fontFamily: "'JetBrains Mono'", fontWeight: 600 }}>{c.delta >= 0 ? "+" : ""}{c.delta.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ GROCERY ═══ */}
        {page === "grocery" && (
          <div className="ani">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Grocery Planner</h2>
            <p style={{ fontSize: 13, color: dm, marginBottom: 20 }}>{nGoal ? `${nGoal === "bulk" ? "Bulking" : "Cutting"} list optimized for your macros.` : "Set up nutrition first for a tailored list."}</p>

            {!nGoal ? (
              <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: 24, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: md, marginBottom: 12 }}>Head to Nutrition tab first.</p>
                <button className="bp" onClick={() => setPage("nutrition")}>Go to Nutrition →</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <input className="ip" style={{ flex: 1 }} placeholder="Enter zip code or city..." value={groLoc} onChange={(e) => setGroLoc(e.target.value)} />
                  <button className="bp" style={{ padding: "11px 24px", fontSize: 13 }} onClick={findStores} disabled={!groLoc}>Find Stores</button>
                </div>

                {stores && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Nearby Stores</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 8 }}>
                      {stores.map((s, i) => (
                        <div key={i} style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 10, padding: 14 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: 12, color: dm, marginTop: 2 }}>{s.dist}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {groList && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em" }}>{nGoal === "bulk" ? "Bulking" : "Cutting"} Weekly List</div>
                      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700, color: a }}>${groTotal}</div>
                    </div>

                    {["Protein", "Carbs", "Fats", "Produce", "Dairy"].map((cat) => {
                      const items = groList.filter((f) => f.cat === cat);
                      if (!items.length) return null;
                      return (
                        <div key={cat} style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: md, marginBottom: 4, padding: "6px 0", borderBottom: `1px solid ${bd}` }}>{cat}</div>
                          {items.map((f, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                                <div style={{ fontSize: 11, color: dm, marginTop: 2 }}>{f.protein}g protein · {f.cals} cal</div>
                              </div>
                              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 600, color: md }}>${f.price.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                    <div style={{ background: "rgba(232,69,69,.05)", border: "1px solid rgba(232,69,69,.15)", borderRadius: 12, padding: 16, marginTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>Weekly Estimated Total</div>
                          <div style={{ fontSize: 12, color: dm, marginTop: 2 }}>{groList.reduce((s, f) => s + f.protein, 0)}g protein · {groList.reduce((s, f) => s + f.cals, 0).toLocaleString()} cal available</div>
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 24, fontWeight: 800, color: a }}>${groTotal}</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   EQUIPMENT
   ═══════════════════════════════════════════════════════════════ */
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
  { id: "landmine", label: "Landmine", ico: "◆" },
  { id: "pec_deck", label: "Pec Deck", ico: "◐" },
  { id: "hack_squat", label: "Hack Squat", ico: "◮" },
  { id: "ghd", label: "GHD", ico: "◑" },
];

/* ═══════════════════════════════════════════════════════════════
   EXERCISE DATABASE — Creative variations with granular overlap tags

   Joint tags are intentionally specific so the picker algorithm
   naturally selects exercises with minimal redundancy.
   e.g. "h_push_free" (DB bench) vs "h_push_fixed" (barbell bench)
   have DIFFERENT tags — the free arm path recruits less tricep
   because the humerus can adduct during the press.
   ═══════════════════════════════════════════════════════════════ */
const EX_DB = {
  chest: [
    // DB variations — free arm path means the humerus adducts during the press,
    // shifting load from triceps onto pec fibers. Less lockout demand.
    { name: "Low-Incline DB Press (20°)", eq: ["dumbbells", "bench"], joints: ["inc_push_free"], tier: 1 },
    { name: "Flat DB Squeeze Press", eq: ["dumbbells", "bench"], joints: ["h_push_free", "chest_iso"], tier: 2 },
    { name: "DB Floor Press", eq: ["dumbbells"], joints: ["h_push_short"], tier: 2 },

    // Cable / fly — pure adduction with zero elbow extension = zero tricep
    { name: "Flat DB Fly", eq: ["dumbbells", "bench"], joints: ["chest_add_free"], tier: 2 },
    { name: "Low-to-High Cable Fly", eq: ["cables"], joints: ["chest_add_cable_low"], tier: 2 },
    { name: "High-to-Low Cable Fly", eq: ["cables"], joints: ["chest_add_cable_high"], tier: 2 },
    { name: "Incline Cable Fly", eq: ["cables", "bench"], joints: ["chest_add_cable_inc"], tier: 2 },
    { name: "Pec Deck (inner-range partials)", eq: ["pec_deck"], joints: ["chest_add_machine"], tier: 2 },

    // Machine / guided — more tricep than DB but still valuable
    { name: "Reverse-Band Smith Incline Press", eq: ["smith_machine", "bands", "bench"], joints: ["inc_push_accom"], tier: 1 },
    { name: "Landmine Kneeling Press", eq: ["landmine"], joints: ["arc_push"], tier: 2 },

    // Compound / bodyweight — higher tricep overlap but great for progression
    { name: "Dip (chest lean, slow eccentric)", eq: ["dip_bars"], joints: ["dec_push", "el_ext_dip"], tier: 1 },
    { name: "Push-Up (deficit, feet elevated)", eq: [], joints: ["h_push_bw"], tier: 3 },
    { name: "Standing Single-Arm Cable Press", eq: ["cables"], joints: ["h_push_cable_uni"], tier: 2 },
  ],

  back: [
    // Supported rows — zero erector load, pure lat/rhomboid
    { name: "Chest-Supported Incline DB Row", eq: ["dumbbells", "bench"], joints: ["h_pull_supported"], tier: 1 },
    { name: "Seal Row (bench on blocks)", eq: ["barbell", "bench"], joints: ["h_pull_strict"], tier: 1 },

    // Lat isolation — ZERO bicep involvement
    { name: "Straight-Arm Cable Pulldown", eq: ["cables"], joints: ["lat_iso_cable"], tier: 2 },
    { name: "DB Pullover (across bench)", eq: ["dumbbells", "bench"], joints: ["lat_ext_free"], tier: 2 },
    { name: "Cable Pullover", eq: ["cables"], joints: ["lat_ext_cable"], tier: 2 },

    // Vertical pulls — grip width changes bicep involvement dramatically
    { name: "Wide-Grip Lat Pulldown", eq: ["lat_pulldown"], joints: ["v_pull_wide"], tier: 1 },
    { name: "Neutral-Grip Pull-Up", eq: ["pullup_bar"], joints: ["v_pull_neutral_bw"], tier: 1 },
    { name: "Chin-Up (supinated)", eq: ["pullup_bar"], joints: ["v_pull_sup_bw"], tier: 1 },

    // Unilateral / unique angles
    { name: "Meadows Row (landmine)", eq: ["landmine", "barbell"], joints: ["h_pull_uni_angle"], tier: 1 },
    { name: "Single-Arm High Cable Row", eq: ["cables"], joints: ["h_pull_uni_high"], tier: 2 },
    { name: "Kayak Row (cable)", eq: ["cables"], joints: ["h_pull_rotational"], tier: 2 },

    // Heavy / power
    { name: "Snatch-Grip Barbell Row", eq: ["barbell"], joints: ["h_pull_wide_bb"], tier: 1 },
    { name: "Pendlay Row", eq: ["barbell"], joints: ["h_pull_explosive"], tier: 1 },
  ],

  shoulders: [
    // Vertical press variations — each has different delt head emphasis
    { name: "Half-Kneeling Landmine Press", eq: ["landmine", "barbell"], joints: ["v_push_arc"], tier: 1 },
    { name: "Arnold Press", eq: ["dumbbells"], joints: ["v_push_rotational"], tier: 1 },
    { name: "Seated DB Shoulder Press", eq: ["dumbbells", "bench"], joints: ["v_push_free"], tier: 1 },
    { name: "Smith Machine OHP", eq: ["smith_machine"], joints: ["v_push_fixed"], tier: 1 },

    // Lateral raises — constant tension (cable) vs peak-contraction (DB)
    { name: "Cable Lateral Raise (behind back start)", eq: ["cables"], joints: ["sh_abd_cable"], tier: 2 },
    { name: "Lean-Away DB Lateral Raise", eq: ["dumbbells"], joints: ["sh_abd_stretch"], tier: 2 },
    { name: "Lu Raise (front raise → ext. rotation)", eq: ["dumbbells"], joints: ["sh_flex_rotation"], tier: 2 },
    { name: "Cable Y-Raise", eq: ["cables"], joints: ["sh_abd_overhead"], tier: 2 },
  ],

  rear_delts: [
    { name: "Face Pull to External Rotation", eq: ["cables"], joints: ["h_pull_high_rot"], tier: 2 },
    { name: "Reverse Pec Deck", eq: ["pec_deck"], joints: ["h_abd_machine"], tier: 2 },
    { name: "Prone Incline Y-Raise (DB)", eq: ["dumbbells", "bench"], joints: ["h_abd_prone"], tier: 2 },
    { name: "Band Pull-Apart", eq: ["bands"], joints: ["h_abd_band"], tier: 3 },
    { name: "Rear Delt Cable Fly (bent)", eq: ["cables"], joints: ["h_abd_cable"], tier: 2 },
    { name: "Prone DB Rear Fly", eq: ["dumbbells"], joints: ["h_abd_free"], tier: 2 },
  ],

  quads: [
    // Squat patterns — anterior vs posterior chain bias
    { name: "Heel-Elevated Goblet Squat", eq: ["dumbbells"], joints: ["kn_ext_goblet"], tier: 1 },
    { name: "Barbell Front Squat", eq: ["barbell", "squat_rack"], joints: ["kn_ext_front_load"], tier: 1 },
    { name: "Hack Squat", eq: ["hack_squat"], joints: ["kn_ext_machine"], tier: 1 },
    { name: "Leg Press (feet low & narrow)", eq: ["leg_press"], joints: ["kn_ext_press"], tier: 1 },

    // Unilateral — balance + single-leg strength
    { name: "Front Foot Elevated Split Squat", eq: ["dumbbells"], joints: ["kn_ext_uni_elevated"], tier: 1 },
    { name: "Bulgarian Split Squat", eq: ["dumbbells", "bench"], joints: ["kn_ext_uni_deep"], tier: 1 },
    { name: "Walking Lunge (short step, upright)", eq: ["dumbbells"], joints: ["kn_ext_dynamic"], tier: 2 },

    // Isolation
    { name: "Leg Extension (pause at top)", eq: ["leg_curl_ext"], joints: ["kn_ext_iso"], tier: 2 },
    { name: "Sissy Squat", eq: [], joints: ["kn_ext_bw"], tier: 3 },
  ],

  hamstrings: [
    // Knee flexion — seated vs lying changes which head is emphasized
    { name: "Seated Leg Curl (toes pointed)", eq: ["leg_curl_ext"], joints: ["kn_flex_seated"], tier: 2 },
    { name: "Lying Leg Curl", eq: ["leg_curl_ext"], joints: ["kn_flex_prone"], tier: 2 },
    { name: "Nordic Curl (eccentric focus)", eq: [], joints: ["kn_flex_eccentric"], tier: 1 },
    { name: "Glute-Ham Raise", eq: ["ghd"], joints: ["kn_flex_hip_ext"], tier: 1 },

    // Hip hinge — bilateral vs unilateral, deficit adds ROM
    { name: "Deficit Barbell RDL (1\" platform)", eq: ["barbell"], joints: ["hip_hinge_deficit"], tier: 1 },
    { name: "Single-Leg DB RDL", eq: ["dumbbells"], joints: ["hip_hinge_uni"], tier: 1 },
    { name: "KB Swing (hip snap)", eq: ["kettlebell"], joints: ["hip_hinge_ballistic"], tier: 2 },
    { name: "Cable Pull-Through", eq: ["cables"], joints: ["hip_ext_cable_through"], tier: 2 },
    { name: "45° Back Extension (DB held)", eq: ["dumbbells"], joints: ["hip_hinge_bw_loaded"], tier: 2 },
  ],

  glutes: [
    { name: "Barbell Hip Thrust", eq: ["barbell", "bench"], joints: ["hip_ext_horiz"], tier: 1 },
    { name: "Single-Leg Hip Thrust (foot on bench)", eq: ["bench"], joints: ["hip_ext_uni"], tier: 1 },
    { name: "Cable Kickback (ankle strap)", eq: ["cables"], joints: ["hip_ext_cable_kick"], tier: 2 },
    { name: "High Box Step-Up", eq: ["dumbbells", "bench"], joints: ["hip_ext_step"], tier: 1 },
    { name: "Frog Pump", eq: [], joints: ["hip_ext_short"], tier: 3 },
    { name: "Sumo Squat (DB)", eq: ["dumbbells"], joints: ["hip_ext_wide"], tier: 2 },
    { name: "Banded Clamshell", eq: ["bands"], joints: ["hip_abd_band"], tier: 3 },
  ],

  biceps: [
    // Long head stretched (arm behind body) vs short head (arm in front)
    { name: "Incline DB Curl (45°)", eq: ["dumbbells", "bench"], joints: ["el_flex_stretched"], tier: 1 },
    { name: "Bayesian Cable Curl (arm behind)", eq: ["cables"], joints: ["el_flex_cable_behind"], tier: 1 },
    { name: "Preacher Curl (EZ bar)", eq: ["ez_bar"], joints: ["el_flex_shortened"], tier: 1 },
    { name: "Spider Curl (prone incline)", eq: ["dumbbells", "bench"], joints: ["el_flex_peak"], tier: 2 },
    { name: "Cross-Body Hammer Curl", eq: ["dumbbells"], joints: ["el_flex_neutral_cross"], tier: 2 },
    { name: "Concentration Curl", eq: ["dumbbells"], joints: ["el_flex_iso"], tier: 2 },
    { name: "Cable Curl (straight bar)", eq: ["cables"], joints: ["el_flex_cable"], tier: 2 },
  ],

  triceps: [
    // Long head stretched (arm overhead) vs lateral head (pushdown)
    { name: "Overhead Cable Extension (rope)", eq: ["cables"], joints: ["el_ext_oh_cable"], tier: 1 },
    { name: "Single-Arm OH DB Extension", eq: ["dumbbells"], joints: ["el_ext_oh_uni"], tier: 2 },
    { name: "EZ Skull Crusher", eq: ["ez_bar", "bench"], joints: ["el_ext_oh_free"], tier: 1 },
    { name: "Cable Pushdown (V-bar)", eq: ["cables"], joints: ["el_ext_pushdown"], tier: 1 },
    { name: "JM Press", eq: ["barbell", "bench"], joints: ["el_ext_compound"], tier: 1 },
    { name: "Cable Kickback", eq: ["cables"], joints: ["el_ext_peak"], tier: 2 },
    { name: "Diamond Push-Up", eq: [], joints: ["el_ext_bw"], tier: 3 },
  ],

  calves: [
    { name: "Standing Calf Raise (machine)", eq: ["smith_machine"], joints: ["ank_plantar_straight"], tier: 1 },
    { name: "Seated Calf Raise", eq: ["leg_press"], joints: ["ank_plantar_bent"], tier: 1 },
    { name: "Single-Leg DB Calf Raise", eq: ["dumbbells"], joints: ["ank_plantar_uni"], tier: 2 },
    { name: "Leg Press Calf Raise", eq: ["leg_press"], joints: ["ank_plantar_press"], tier: 2 },
    { name: "Tibialis Raise (band)", eq: ["bands"], joints: ["ank_dorsi"], tier: 3 },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   SPLIT DEFINITIONS — 3 unique rotations per type (6 days each)
   The group ORDER affects exercise selection priority.
   Cross-day uniqueness is enforced by the generator.
   ═══════════════════════════════════════════════════════════════ */
const SPLITS = [
  {
    id: "upper_lower",
    name: "Upper / Lower",
    freq: "4x/wk · 6-day rotation",
    note: "U1 → L1 → off → U2 → L2 → off → off · then U3 → L3 next week. Every session is unique.",
    days: [
      { name: "Upper A — Push Focus", groups: ["chest", "chest", "shoulders", "back", "triceps"] },
      { name: "Lower A — Squat Pattern", groups: ["quads", "quads", "hamstrings", "glutes", "calves"] },
      { name: "Upper B — Pull Focus", groups: ["back", "back", "shoulders", "chest", "biceps"] },
      { name: "Lower B — Hinge Pattern", groups: ["hamstrings", "hamstrings", "quads", "glutes", "calves"] },
      { name: "Upper C — Arms & Angles", groups: ["chest", "back", "rear_delts", "biceps", "triceps"] },
      { name: "Lower C — Unilateral", groups: ["quads", "hamstrings", "glutes", "glutes", "calves"] },
    ],
  },
  {
    id: "torso_limb",
    name: "Torso / Limb",
    freq: "4x/wk · 6-day rotation",
    note: "T1 → Li1 → off → T2 → Li2 → off → off · then T3 → Li3 next week. All days different.",
    days: [
      { name: "Torso A — Horizontal", groups: ["chest", "back", "chest", "back", "shoulders"] },
      { name: "Limb A — Quads & Bis", groups: ["quads", "quads", "hamstrings", "biceps", "biceps"] },
      { name: "Torso B — Vertical", groups: ["shoulders", "back", "back", "chest", "rear_delts"] },
      { name: "Limb B — Hams & Tris", groups: ["hamstrings", "hamstrings", "quads", "triceps", "triceps"] },
      { name: "Torso C — Angles & Cable", groups: ["chest", "back", "shoulders", "rear_delts", "chest"] },
      { name: "Limb C — Glutes & Arms", groups: ["glutes", "glutes", "calves", "biceps", "triceps"] },
    ],
  },
  {
    id: "anterior_posterior",
    name: "Anterior / Posterior",
    freq: "4x/wk · 6-day rotation",
    note: "A1 → P1 → off → A2 → P2 → off → off · then A3 → P3. Push/pull with legs.",
    days: [
      { name: "Anterior A — Compounds", groups: ["chest", "quads", "shoulders", "quads", "triceps"] },
      { name: "Posterior A — Compounds", groups: ["back", "hamstrings", "rear_delts", "hamstrings", "biceps"] },
      { name: "Anterior B — Moderate", groups: ["quads", "chest", "shoulders", "chest", "triceps"] },
      { name: "Posterior B — Moderate", groups: ["hamstrings", "back", "back", "biceps", "rear_delts"] },
      { name: "Anterior C — Unilateral", groups: ["chest", "quads", "shoulders", "quads", "triceps"] },
      { name: "Posterior C — Detail", groups: ["back", "hamstrings", "glutes", "biceps", "rear_delts"] },
    ],
  },
  {
    id: "full_body",
    name: "Full Body",
    freq: "3x/wk · 3-day rotation",
    note: "A → off → B → off → C → off → off. Each session hits everything differently.",
    days: [
      { name: "Full Body A — Squat + Press", groups: ["quads", "chest", "back", "shoulders", "biceps"] },
      { name: "Full Body B — Hinge + Pull", groups: ["hamstrings", "back", "chest", "triceps", "rear_delts"] },
      { name: "Full Body C — Unilateral Mix", groups: ["quads", "hamstrings", "chest", "back", "glutes"] },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   PROGRAM GENERATION — picks exercises across ALL days at once
   so no exercise appears on more than one day.
   Within each day, maximizes joint-function diversity.
   ═══════════════════════════════════════════════════════════════ */
function generateProgram(split, equipSet) {
  const usedNames = new Set();
  return split.days.map((day) => {
    const exercises = pickForDay(day.groups, equipSet, 5, usedNames);
    exercises.forEach((ex) => usedNames.add(ex.name));
    return { ...day, exercises };
  });
}

function pickForDay(groups, equipSet, target, usedNames) {
  const coveredJoints = new Set();
  const picked = [];
  const pickedNames = new Set();

  for (const g of groups) {
    if (picked.length >= target) break;
    const pool = (EX_DB[g] || [])
      .filter((ex) => !usedNames.has(ex.name) && !pickedNames.has(ex.name))
      .filter((ex) => ex.eq.length === 0 || ex.eq.every((e) => equipSet.has(e)))
      .sort((a, b) => a.tier - b.tier);

    let best = null;
    let bestScore = -1;
    for (const ex of pool) {
      const newJ = ex.joints.filter((j) => !coveredJoints.has(j)).length;
      const score = newJ * 10 + (4 - ex.tier);
      if (score > bestScore) { best = ex; bestScore = score; }
    }
    if (best) {
      picked.push({ ...best, muscle: g });
      pickedNames.add(best.name);
      best.joints.forEach((j) => coveredJoints.add(j));
    }
  }

  // Fill remaining if needed
  if (picked.length < target) {
    for (const g of groups) {
      if (picked.length >= target) break;
      const pool = (EX_DB[g] || [])
        .filter((ex) => !usedNames.has(ex.name) && !pickedNames.has(ex.name))
        .filter((ex) => ex.eq.length === 0 || ex.eq.every((e) => equipSet.has(e)));
      for (const ex of pool) {
        const newJ = ex.joints.filter((j) => !coveredJoints.has(j)).length;
        if (newJ > 0 && picked.length < target) {
          picked.push({ ...ex, muscle: g });
          pickedNames.add(ex.name);
          ex.joints.forEach((j) => coveredJoints.add(j));
        }
      }
    }
  }
  return picked;
}

/* ═══════════════════════════════════════════════════════════════
   WEEK PROTOCOL (12-week periodization)
   ═══════════════════════════════════════════════════════════════ */
const WEEK_PROTOCOL = [
  { wk: 1, label: "Wk 1 — Intro 10RM", sets: 1, note: "Work up to 1 set at your 10-rep max." },
  { wk: 2, label: "Wk 2 — Volume", sets: 2, note: "2 working sets × 8 reps using the same load as your 10RM." },
  { wk: 3, label: "Wk 3 — Load Up", sets: 2, note: "Set 1: add load, 6 reps @ 2 RIR. Set 2: same load × 6." },
  { wk: 4, label: "Wk 4 — Rep Push", sets: 2, note: "Set 1: 7 reps with Wk 3 load. Set 2: reduce 10% × 7." },
  { wk: 5, label: "Wk 5 — Intensity", sets: 2, note: "Set 1: increase load, 5 reps @ 1 RIR. Set 2: -10% × 5." },
  { wk: 6, label: "Wk 6 — Static", sets: 2, note: "Same load as Wk 5. Set 1: 5 reps. Set 2: -10% × 5." },
  { wk: 7, label: "Wk 7 — Load Bump", sets: 2, note: "Set 1: increase load, 6 reps @ 1 RIR. Set 2: -10% × 6." },
  { wk: 8, label: "Wk 8 — Push", sets: 2, note: "Set 1: increase load, 5 reps @ 1 RIR. Set 2: -10% × 5." },
  { wk: 9, label: "Wk 9 — Static", sets: 2, note: "Same loads as Wk 8. Set 1: 5 reps. Set 2: -10% × 5." },
  { wk: 10, label: "Wk 10 — Peak", sets: 2, note: "Set 1: increase load, 4 reps @ 1 RIR. Set 2: -10% × 5." },
  { wk: 11, label: "Wk 11 — Static", sets: 2, note: "Same loads as Wk 10. Set 1: 4 reps. Set 2: 5 reps." },
  { wk: 12, label: "Wk 12 — Rep PR", sets: 2, note: "Set 1: hit 5 reps with your Wk 11 4-rep load! Set 2: -10% × 5." },
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

/* ═══════════════════════════════════════════════════════════════
   NUTRITION
   ═══════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════
   REAL STORE FINDER — OpenStreetMap Nominatim + Overpass API
   ═══════════════════════════════════════════════════════════════ */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeLocation(query) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us`, {
    headers: { "User-Agent": "IronProtocolApp/1.0" },
  });
  const data = await res.json();
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name };
}

async function findRealStores(lat, lon, radiusMeters = 8000) {
  const query = `[out:json][timeout:12];(node["shop"="supermarket"](around:${radiusMeters},${lat},${lon});node["shop"="grocery"](around:${radiusMeters},${lat},${lon});node["shop"="convenience"](around:${radiusMeters},${lat},${lon}););out body;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
  });
  const data = await res.json();
  return data.elements
    .filter((el) => el.tags?.name)
    .map((el) => ({
      name: el.tags.name,
      brand: el.tags.brand || "",
      dist: haversine(lat, lon, el.lat, el.lon),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 10);
}

/* ═══════════════════════════════════════════════════════════════
   COLORS
   ═══════════════════════════════════════════════════════════════ */
const MC = {
  chest: "#ef4444", back: "#3b82f6", shoulders: "#f59e0b", rear_delts: "#f59e0b",
  quads: "#10b981", hamstrings: "#06b6d4", glutes: "#8b5cf6", biceps: "#ec4899",
  triceps: "#f97316", calves: "#14b8a6",
};

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
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

  // Nutrition
  const [nGoal, setNGoal] = useState(null);
  const [nWeight, setNWeight] = useState("");
  const [nHeight, setNHeight] = useState("");
  const [nSetup, setNSetup] = useState(false);
  const [weekCheckins, setWeekCheckins] = useState([]);
  const [checkinWt, setCheckinWt] = useState("");

  // Grocery — real store finder
  const [groLoc, setGroLoc] = useState("");
  const [stores, setStores] = useState(null);
  const [groList, setGroList] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState("");
  const [geoDisplay, setGeoDisplay] = useState("");

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
    setProgram(generateProgram(split, eqSet));
    setActiveDay(0);
    setStep(2);
  };

  const logW = (ei, si, v) => setLogs((p) => ({ ...p, [`${activeWeek}-${activeDay}-${ei}-${si}`]: v }));
  const getW = (ei, si) => logs[`${activeWeek}-${activeDay}-${ei}-${si}`] || "";
  const togChk = (i) => {
    const k = `${activeWeek}-${activeDay}-${i}`;
    setChecked((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  };

  const doCheckin = () => {
    if (!checkinWt) return;
    const prev = weekCheckins.length > 0 ? weekCheckins[weekCheckins.length - 1].weight : Number(nWeight);
    setWeekCheckins((p) => [...p, { weight: Number(checkinWt), delta: Number(checkinWt) - prev }]);
    setCheckinWt("");
  };

  // Real store finder
  const findStores = useCallback(async () => {
    if (!groLoc) return;
    setStoreLoading(true);
    setStoreError("");
    setStores(null);
    try {
      const geo = await geocodeLocation(groLoc);
      if (!geo) { setStoreError("Couldn't find that location. Try a zip code or city name."); setStoreLoading(false); return; }
      setGeoDisplay(geo.display);
      const results = await findRealStores(geo.lat, geo.lon);
      if (results.length === 0) { setStoreError("No stores found within 5 miles. Try a different location."); setStoreLoading(false); return; }
      setStores(results);
      setGroList(nGoal === "cut" ? CUT_FOODS : BULK_FOODS);
    } catch (e) {
      setStoreError("Network error — check your connection and try again.");
    }
    setStoreLoading(false);
  }, [groLoc, nGoal]);

  const groTotal = groList ? groList.reduce((s, f) => s + f.price, 0).toFixed(2) : "0.00";

  // Theme tokens
  const a = "#e84545", bg = "#08080c", sf = "rgba(255,255,255,0.025)", bd = "rgba(255,255,255,0.07)", dm = "rgba(255,255,255,0.35)", md = "rgba(255,255,255,0.6)";

  return (
    <div style={{ minHeight: "100vh", background: bg, color: "#e4e4e8", fontFamily: "'Outfit',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fi{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(.85)}50%{transform:scale(1.1)}100%{transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
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
        .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.1);border-top-color:${a};border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
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

        {/* ═══ TRAINING — Step 0: Equipment ═══ */}
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

        {/* ═══ TRAINING — Step 1: Split Selection ═══ */}
        {page === "training" && step === 1 && (
          <div className="ani">
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Choose Your Split</h2>
            <p style={{ fontSize: 13, color: dm, marginBottom: 20 }}>3-day rotations — every session is unique. ~5 exercises per session, joint-overlap minimized.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {SPLITS.map((s) => (
                <div key={s.id} className={`sc ${splitId === s.id ? "on" : ""}`} onClick={() => setSplitId(s.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: dm, fontFamily: "'JetBrains Mono'" }}>{s.freq}</span>
                  </div>
                  <p style={{ fontSize: 12, color: dm, marginTop: 6 }}>{s.note}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                    {s.days.map((d) => <span key={d.name} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600, background: "rgba(232,69,69,.08)", color: a }}>{d.name.split(" — ")[0]}</span>)}
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

        {/* ═══ TRAINING — Step 2: Program View ═══ */}
        {page === "training" && step === 2 && program && (
          <div className="ani">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>{split?.name}</h2>
                <p style={{ fontSize: 12, color: dm }}>{equip.size} equipment · {program.length} unique sessions · ~5 exercises each</p>
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

            {/* Day tabs — scrollable for 6 days */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
              {program.map((d, i) => (
                <div key={i} className={`tb ${activeDay === i ? "on" : ""}`} onClick={() => setActiveDay(i)} style={{ fontSize: 11, padding: "8px 14px" }}>
                  {d.name.split(" — ")[0]}
                  <div style={{ fontSize: 9, color: activeDay === i ? a : dm, marginTop: 2 }}>{d.name.split(" — ")[1] || ""}</div>
                </div>
              ))}
            </div>

            {/* Exercises */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: "4px 16px 12px" }}>
              {program[activeDay]?.exercises.map((ex, i) => {
                const k = `${activeWeek}-${activeDay}-${i}`;
                const done = checked.has(k);
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 12, padding: "14px 0", borderBottom: `1px solid ${bd}`, alignItems: "start", opacity: done ? 0.4 : 1 }}>
                    <div className={`ck ${done ? "dn" : ""}`} onClick={() => togChk(i)} style={{ marginTop: 2 }}>{done && "✓"}</div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 500, textDecoration: done ? "line-through" : "none" }}>{ex.name}</span>
                        <span className="tg" style={{ background: `${MC[ex.muscle] || "#666"}18`, color: MC[ex.muscle] || "#888" }}>{ex.muscle.replace(/_/g, " ")}</span>
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
                <div style={{ padding: 32, textAlign: "center", color: dm, fontSize: 13 }}>No exercises matched your equipment. Try adding more.</div>
              )}
            </div>
          </div>
        )}

        {/* ═══ NUTRITION — Setup ═══ */}
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

        {/* ═══ NUTRITION — Dashboard ═══ */}
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
                <div style={{ width: `${((nutrition.protein * 4) / nutrition.cals) * 100}%`, background: "#3b82f6", transition: "width .3s" }} />
                <div style={{ width: `${((nutrition.carbs * 4) / nutrition.cals) * 100}%`, background: "#10b981", transition: "width .3s" }} />
                <div style={{ width: `${((nutrition.fat * 9) / nutrition.cals) * 100}%`, background: "#f59e0b", transition: "width .3s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: md }}>
                <span>Protein {Math.round(((nutrition.protein * 4) / nutrition.cals) * 100)}%</span>
                <span>Carbs {Math.round(((nutrition.carbs * 4) / nutrition.cals) * 100)}%</span>
                <span>Fat {Math.round(((nutrition.fat * 9) / nutrition.cals) * 100)}%</span>
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
            <p style={{ fontSize: 13, color: dm, marginBottom: 20 }}>{nGoal ? `${nGoal === "bulk" ? "Bulking" : "Cutting"} list optimized for your macros. Real stores near you.` : "Set up nutrition first for a tailored list."}</p>

            {!nGoal ? (
              <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: 24, textAlign: "center" }}>
                <p style={{ fontSize: 14, color: md, marginBottom: 12 }}>Head to Nutrition tab first.</p>
                <button className="bp" onClick={() => setPage("nutrition")}>Go to Nutrition →</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input className="ip" style={{ flex: 1 }} placeholder="Enter zip code, city, or address..." value={groLoc} onChange={(e) => setGroLoc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && findStores()} />
                  <button className="bp" style={{ padding: "11px 24px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }} onClick={findStores} disabled={!groLoc || storeLoading}>
                    {storeLoading ? <><span className="spinner" /> Searching...</> : "Find Stores"}
                  </button>
                </div>
                {geoDisplay && <p style={{ fontSize: 11, color: dm, marginBottom: 16 }}>📍 {geoDisplay}</p>}
                {storeError && <p style={{ fontSize: 13, color: a, marginBottom: 16 }}>{storeError}</p>}

                {stores && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: dm, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Nearby Stores ({stores.length} found)</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
                      {stores.map((s, i) => (
                        <div key={i} style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 10, padding: 14 }}>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                          {s.brand && s.brand !== s.name && <div style={{ fontSize: 11, color: md, marginTop: 1 }}>{s.brand}</div>}
                          <div style={{ fontSize: 12, color: a, fontFamily: "'JetBrains Mono'", fontWeight: 600, marginTop: 4 }}>{s.dist.toFixed(1)} mi</div>
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

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { FOOD_DB_LOCAL } from "./foodDb.js";

/* ═══════════════════════════════════════════════════════════════
   PROFILE MANAGEMENT (localStorage)
   ═══════════════════════════════════════════════════════════════ */
function loadProfiles() { try { return JSON.parse(localStorage.getItem("ip_profiles") || "[]"); } catch { return []; } }
function saveProfiles(p) { localStorage.setItem("ip_profiles", JSON.stringify(p)); }
function loadProfile(id) { return loadProfiles().find((p) => p.id === id) || null; }
function saveProfileData(id, data) {
  const all = loadProfiles();
  const idx = all.findIndex((p) => p.id === id);
  if (idx >= 0) { all[idx].data = data; all[idx].updatedAt = Date.now(); saveProfiles(all); }
}

/* ═══════════════════════════════════════════════════════════════
   EQUIPMENT
   ═══════════════════════════════════════════════════════════════ */
const EQUIPMENT = [
  { id: "barbell", label: "Barbell" }, { id: "dumbbells", label: "Dumbbells" }, { id: "cables", label: "Cables" },
  { id: "pullup_bar", label: "Pull-Up Bar" }, { id: "bench", label: "Bench" }, { id: "squat_rack", label: "Squat Rack" },
  { id: "kettlebell", label: "Kettlebell" }, { id: "ez_bar", label: "EZ Curl Bar" }, { id: "dip_bars", label: "Dip Bars" },
  { id: "leg_press", label: "Leg Press" }, { id: "smith_machine", label: "Smith Machine" }, { id: "bands", label: "Bands" },
  { id: "lat_pulldown", label: "Lat Pulldown" }, { id: "leg_curl_ext", label: "Leg Curl/Ext" },
  { id: "landmine", label: "Landmine" }, { id: "pec_deck", label: "Pec Deck" },
  { id: "hack_squat", label: "Hack Squat" }, { id: "ghd", label: "GHD" },
];

/* ═══════════════════════════════════════════════════════════════
   EXERCISE DATABASE — with curated YouTube video IDs
   ═══════════════════════════════════════════════════════════════ */
const EX_DB = {
  chest: [
    { name: "Low-Incline DB Press (20°)", eq: ["dumbbells", "bench"], joints: ["inc_push_free"], tier: 1, vid: "1xBu2XbJTdc", cues: ["Knuckles to ceiling at the bottom", "Push the DBs apart as you press"] },
    { name: "Flat DB Squeeze Press", eq: ["dumbbells", "bench"], joints: ["h_push_free", "chest_iso"], tier: 2, vid: "G2j_lJf6ljk", cues: ["Crush the DBs together the entire rep", "Chest should cramp at the top"] },
    { name: "DB Floor Press", eq: ["dumbbells"], joints: ["h_push_short"], tier: 2, vid: "uUGDRwge4F8", cues: ["Let triceps kiss the floor, pause 1 sec", "Press straight to the ceiling"] },
    { name: "Flat DB Fly", eq: ["dumbbells", "bench"], joints: ["chest_add_free"], tier: 2, vid: "QENKPHhQVi4", cues: ["Hug a giant tree trunk", "Slight bend in elbows — never changes"] },
    { name: "Low-to-High Cable Fly", eq: ["cables"], joints: ["chest_add_cable_low"], tier: 2, vid: "u5X5x1fw_SA", cues: ["Scoop from pockets to eye level", "Lead with pinkies"] },
    { name: "High-to-Low Cable Fly", eq: ["cables"], joints: ["chest_add_cable_high"], tier: 2, vid: "8Um35Es-ROE", cues: ["Hands meet at your belly button", "Think: closing a book in front of you"] },
    { name: "Incline Cable Fly", eq: ["cables", "bench"], joints: ["chest_add_cable_inc"], tier: 2, vid: "QDkFWmZqVgk", cues: ["Arc the arms like you're pouring two pitchers", "Squeeze hard at the top for 1 sec"] },
    { name: "Pec Deck (inner-range partials)", eq: ["pec_deck"], joints: ["chest_add_machine"], tier: 2, vid: "g3T7LsEeDWQ", cues: ["Only the last half of the rep — squeeze zone", "Try to overlap your hands"] },
    { name: "Reverse-Band Smith Incline Press", eq: ["smith_machine", "bands", "bench"], joints: ["inc_push_accom"], tier: 1, vid: "WMYLbTeRDp8", cues: ["Explode through the sticking point", "Chest up, drive the bar to the ceiling"] },
    { name: "Landmine Kneeling Press", eq: ["landmine"], joints: ["arc_push"], tier: 2, vid: "bL87S-S4dKk", cues: ["Push the bar away from your face in an arc", "Brace your core — no leaning"] },
    { name: "Dip (chest lean, slow eccentric)", eq: ["dip_bars"], joints: ["dec_push", "el_ext_dip"], tier: 1, vid: "yN6Q1UI_xkE", cues: ["3 seconds down, lean forward 30°", "Feel the stretch in your chest at the bottom"] },
    { name: "Push-Up (deficit, feet elevated)", eq: [], joints: ["h_push_bw"], tier: 3, vid: "j0VBFFNsTBw", cues: ["Push the floor away from you", "Body stiff as a plank, nose between hands"] },
    { name: "Standing Single-Arm Cable Press", eq: ["cables"], joints: ["h_push_cable_uni"], tier: 2, vid: "QXSSUA9I-o0", cues: ["Punch forward and across your body", "Brace abs — don't rotate your torso"] },
  ],
  back: [
    { name: "Chest-Supported Incline DB Row", eq: ["dumbbells", "bench"], joints: ["h_pull_supported"], tier: 1, vid: "eVm92NO-EYI", cues: ["Drive elbows to your hip pockets", "Let the weight dead-hang at bottom for a stretch"] },
    { name: "Seal Row (bench on blocks)", eq: ["barbell", "bench"], joints: ["h_pull_strict"], tier: 1, vid: "YSW2SKoiN1s", cues: ["Pull the bar to your belly button", "Squeeze shoulder blades like cracking a walnut"] },
    { name: "Straight-Arm Cable Pulldown", eq: ["cables"], joints: ["lat_iso_cable"], tier: 2, vid: "hAMcfubonDc", cues: ["Push the bar down to your thighs — arms stay straight", "Think: bending a stick across your body"] },
    { name: "DB Pullover (across bench)", eq: ["dumbbells", "bench"], joints: ["lat_ext_free"], tier: 2, vid: "Datv2L6t3-4", cues: ["Reach the DB way behind your head — big stretch", "Pull with your lats, not your arms"] },
    { name: "Cable Pullover", eq: ["cables"], joints: ["lat_ext_cable"], tier: 2, vid: "32auHIqgEoM", cues: ["Arc from overhead to hip level — straight arms", "Feel your lats pull, not your hands"] },
    { name: "Wide-Grip Lat Pulldown", eq: ["lat_pulldown"], joints: ["v_pull_wide"], tier: 1, vid: "HWGntttgJQw", cues: ["Pull the bar to your collarbone, not your lap", "Lean back slightly — drive elbows down"] },
    { name: "Neutral-Grip Pull-Up", eq: ["pullup_bar"], joints: ["v_pull_neutral_bw"], tier: 1, vid: "Ai4S1uzMP7A", cues: ["Pull the bar to your chest, not your chin", "Lead with your elbows, not your hands"] },
    { name: "Chin-Up (supinated)", eq: ["pullup_bar"], joints: ["v_pull_sup_bw"], tier: 1, vid: "qV7vOUcUfD4", cues: ["Drive elbows behind you into your back pockets", "Get your chin clearly over the bar"] },
    { name: "Meadows Row (landmine)", eq: ["landmine", "barbell"], joints: ["h_pull_uni_angle"], tier: 1, vid: "UtibbtC5sro", cues: ["Stagger stance, row toward your hip", "Let the shoulder blade glide — full range"] },
    { name: "Single-Arm High Cable Row", eq: ["cables"], joints: ["h_pull_uni_high"], tier: 2, vid: "WYCnIThgbB8", cues: ["Reach forward for a full lat stretch", "Pull your elbow past your ribcage"] },
    { name: "Kayak Row (cable)", eq: ["cables"], joints: ["h_pull_rotational"], tier: 2, vid: "-QzTAIvx5Dk", cues: ["Rotate like you're paddling a kayak", "Keep the pull tight to your body"] },
    { name: "Snatch-Grip Barbell Row", eq: ["barbell"], joints: ["h_pull_wide_bb"], tier: 1, vid: "OZ3gHXWSUkQ", cues: ["Wide grip — pull to your lower sternum", "Elbows flare out, squeeze upper back"] },
    { name: "Pendlay Row", eq: ["barbell"], joints: ["h_pull_explosive"], tier: 1, vid: "h4nkoayPFWw", cues: ["Dead stop on the floor each rep", "Explode up — row with violence"] },
  ],
  shoulders: [
    { name: "Half-Kneeling Landmine Press", eq: ["landmine", "barbell"], joints: ["v_push_arc"], tier: 1, vid: "bL87S-S4dKk", cues: ["Press along the arc — don't force it straight", "Squeeze your glute on the kneeling side"] },
    { name: "Arnold Press", eq: ["dumbbells"], joints: ["v_push_rotational"], tier: 1, vid: "6K_N9AGhItQ", cues: ["Start palms facing you, rotate as you press", "Smooth rotation — don't rush the twist"] },
    { name: "Seated DB Shoulder Press", eq: ["dumbbells", "bench"], joints: ["v_push_free"], tier: 1, vid: "rO_iEImwHyo", cues: ["Push the ceiling away from you", "Don't let your back arch off the bench"] },
    { name: "Smith Machine OHP", eq: ["smith_machine"], joints: ["v_push_fixed"], tier: 1, vid: "E7ngsffMPR0", cues: ["Sit slightly in front of the bar path", "Press through the top — full lockout"] },
    { name: "Cable Lateral Raise (behind back start)", eq: ["cables"], joints: ["sh_abd_cable"], tier: 2, vid: "1wq4AySe2gg", cues: ["Pour water out of a pitcher at the top", "Lead with your elbow, not your hand"] },
    { name: "Lean-Away DB Lateral Raise", eq: ["dumbbells"], joints: ["sh_abd_stretch"], tier: 2, vid: "eMzzqEdwd3s", cues: ["Hold a pole and lean away for extra stretch", "Lift to ear height — pinky slightly higher"] },
    { name: "Lu Raise (front raise → ext. rotation)", eq: ["dumbbells"], joints: ["sh_flex_rotation"], tier: 2, vid: "wXuiqpPVD2Q", cues: ["Raise to eye level, then rotate thumbs up", "Light weight — this is about the rotation"] },
    { name: "Cable Y-Raise", eq: ["cables"], joints: ["sh_abd_overhead"], tier: 2, vid: "6hiCJt6mcII", cues: ["Arms make a Y shape overhead", "Thumbs point to the ceiling"] },
  ],
  rear_delts: [
    { name: "Face Pull to External Rotation", eq: ["cables"], joints: ["h_pull_high_rot"], tier: 2, vid: "foNiffQNMO0", cues: ["Pull to your forehead, then rotate fists to ears", "Finish in a 'double bicep pose'"] },
    { name: "Reverse Pec Deck", eq: ["pec_deck"], joints: ["h_abd_machine"], tier: 2, vid: "-TKqxK7-ehc", cues: ["Open your arms like you're showing off your chest", "Hold the squeeze for 1 second"] },
    { name: "Prone Incline Y-Raise (DB)", eq: ["dumbbells", "bench"], joints: ["h_abd_prone"], tier: 2, vid: "BvxuWwQOj_E", cues: ["Thumbs up, raise into a Y shape", "Chest stays glued to the bench"] },
    { name: "Band Pull-Apart", eq: ["bands"], joints: ["h_abd_band"], tier: 3, vid: "stwYTTPXubo", cues: ["Rip the band in half at chest height", "Pinch shoulder blades — show your chest"] },
    { name: "Rear Delt Cable Fly (bent)", eq: ["cables"], joints: ["h_abd_cable"], tier: 2, vid: "FeERX9UwspY", cues: ["Spread the cables apart like opening curtains", "Keep a slight bend in elbows throughout"] },
    { name: "Prone DB Rear Fly", eq: ["dumbbells"], joints: ["h_abd_free"], tier: 2, vid: "CI4YSJjkHiI", cues: ["Chest on bench — no momentum", "Lead with your elbows, not your hands"] },
  ],
  quads: [
    { name: "Heel-Elevated Goblet Squat", eq: ["dumbbells"], joints: ["kn_ext_goblet"], tier: 1, vid: "8_6qdQ-TaNY", cues: ["Sit straight down between your knees", "Knees push forward over toes — that's okay"] },
    { name: "Barbell Front Squat", eq: ["barbell", "squat_rack"], joints: ["kn_ext_front_load"], tier: 1, vid: "_qv0m3tPd3s", cues: ["Elbows high — like you're a zombie", "Push the floor apart with your feet"] },
    { name: "Hack Squat", eq: ["hack_squat"], joints: ["kn_ext_machine"], tier: 1, vid: "g9i05umL5vc", cues: ["Feet low on platform for more quad", "Push the sled away — don't just stand up"] },
    { name: "Leg Press (feet low & narrow)", eq: ["leg_press"], joints: ["kn_ext_press"], tier: 1, vid: "Qk8ZgMfmV5Q", cues: ["Feet low = more quad, high = more glute", "Push through your whole foot — not just toes"] },
    { name: "Front Foot Elevated Split Squat", eq: ["dumbbells"], joints: ["kn_ext_uni_elevated"], tier: 1, vid: "cR6osuMgfTY", cues: ["Let your front knee travel forward", "Drop straight down — don't lunge forward"] },
    { name: "Bulgarian Split Squat", eq: ["dumbbells", "bench"], joints: ["kn_ext_uni_deep"], tier: 1, vid: "uODWo4YqbT8", cues: ["Shin stays vertical-ish — lean slightly forward", "Stand far enough away from the bench"] },
    { name: "Walking Lunge (short step, upright)", eq: ["dumbbells"], joints: ["kn_ext_dynamic"], tier: 2, vid: "FvMaEKXuito", cues: ["Short steps and stay tall = more quads", "Push off your front foot to step forward"] },
    { name: "Leg Extension (pause at top)", eq: ["leg_curl_ext"], joints: ["kn_ext_iso"], tier: 2, vid: "HCK-v_WQ7Lc", cues: ["Hold the top for a full second — feel the burn", "Toes pointed slightly out hits more vastus medialis"] },
    { name: "Sissy Squat", eq: [], joints: ["kn_ext_bw"], tier: 3, vid: "AYN-U5nZieY", cues: ["Lean way back — knees forward, hips open", "Hold onto something for balance at first"] },
  ],
  hamstrings: [
    { name: "Seated Leg Curl (toes pointed)", eq: ["leg_curl_ext"], joints: ["kn_flex_seated"], tier: 2, vid: "NxPR7G_YNHI", cues: ["Point toes away — takes calves out of it", "Squeeze hard at the bottom — don't just swing"] },
    { name: "Lying Leg Curl", eq: ["leg_curl_ext"], joints: ["kn_flex_prone"], tier: 2, vid: "-X2Oz6h-1WI", cues: ["Curl your heels to your butt", "Hips stay pressed into the pad — don't lift up"] },
    { name: "Nordic Curl (eccentric focus)", eq: [], joints: ["kn_flex_eccentric"], tier: 1, vid: "h5S6KNwATsI", cues: ["Lower as slowly as you possibly can", "Stay straight from knee to head — don't hinge at hips"] },
    { name: "Glute-Ham Raise", eq: ["ghd"], joints: ["kn_flex_hip_ext"], tier: 1, vid: "blX1If7ScxY", cues: ["Squeeze glutes first, then pull with hamstrings", "Body stays rigid — move at the knee"] },
    { name: "Deficit Barbell RDL (1\" platform)", eq: ["barbell"], joints: ["hip_hinge_deficit"], tier: 1, vid: "9CtGuT4QQAc", cues: ["Push your butt to the wall behind you", "Bar slides down your legs like a razor on skin"] },
    { name: "Single-Leg DB RDL", eq: ["dumbbells"], joints: ["hip_hinge_uni"], tier: 1, vid: "R_fJ6H3FlVw", cues: ["Back leg and torso move as one piece", "Reach the DB toward the floor, not forward"] },
    { name: "KB Swing (hip snap)", eq: ["kettlebell"], joints: ["hip_hinge_ballistic"], tier: 2, vid: "aSYap2yhW8s", cues: ["Snap your hips — arms are just ropes", "It's a hinge, not a squat"] },
    { name: "Cable Pull-Through", eq: ["cables"], joints: ["hip_ext_cable_through"], tier: 2, vid: "DbSF7ipBh5Y", cues: ["Push hips back until you feel hamstrings stretch", "Squeeze glutes to stand tall — thrust forward"] },
    { name: "45° Back Extension (DB held)", eq: ["dumbbells"], joints: ["hip_hinge_bw_loaded"], tier: 2, vid: "V3wWqlpQuxA", cues: ["Round over the pad, then squeeze up to flat", "Hold DB at your chest — don't extend past neutral"] },
  ],
  glutes: [
    { name: "Barbell Hip Thrust", eq: ["barbell", "bench"], joints: ["hip_ext_horiz"], tier: 1, vid: "W86oVlnLqY4", cues: ["Drive through your heels — chin stays tucked", "Full lockout — squeeze glutes like you're cracking a walnut"] },
    { name: "Single-Leg Hip Thrust (foot on bench)", eq: ["bench"], joints: ["hip_ext_uni"], tier: 1, vid: "GqVK-IKtZaU", cues: ["Push through your heel into the bench", "Hips level — don't tilt to one side"] },
    { name: "Cable Kickback (ankle strap)", eq: ["cables"], joints: ["hip_ext_cable_kick"], tier: 2, vid: "n-cgsNePyFo", cues: ["Kick back and slightly out — not straight behind", "Squeeze your glute at the top, pause 1 sec"] },
    { name: "High Box Step-Up", eq: ["dumbbells", "bench"], joints: ["hip_ext_step"], tier: 1, vid: "sejk5iTrcRE", cues: ["Don't push off your back foot — dead weight", "Drive through the heel of your top foot"] },
    { name: "Frog Pump", eq: [], joints: ["hip_ext_short"], tier: 3, vid: "5b4TonBLVgM", cues: ["Soles of feet together, knees out wide", "Thrust hips to ceiling — max squeeze at top"] },
    { name: "Sumo Squat (DB)", eq: ["dumbbells"], joints: ["hip_ext_wide"], tier: 2, vid: "7BqURseCGSU", cues: ["Wide stance, toes pointed 45° out", "Drop straight down — push knees over toes"] },
    { name: "Banded Clamshell", eq: ["bands"], joints: ["hip_abd_band"], tier: 3, vid: "Hj-2r7OlXuE", cues: ["Open your knees like a book — keep feet together", "Slow and controlled — don't let the band snap back"] },
  ],
  biceps: [
    { name: "Incline DB Curl (45°)", eq: ["dumbbells", "bench"], joints: ["el_flex_stretched"], tier: 1, vid: "XhIsIcjIbCw", cues: ["Let arms hang fully at the bottom — big stretch", "Don't swing — only your forearms move"] },
    { name: "Preacher Curl (EZ bar)", eq: ["ez_bar"], joints: ["el_flex_shortened"], tier: 1, vid: "P13VQDU1q9c", cues: ["Armpits glued to the top of the pad", "Don't let the weight drop fast — control the negative"] },
    { name: "Bayesian Cable Curl (arm behind)", eq: ["cables"], joints: ["el_flex_cable_behind"], tier: 1, vid: "BaSd7C58L3o", cues: ["Arm starts behind your body — max stretch", "Curl without moving your elbow forward"] },
    { name: "Cross-Body Hammer Curl", eq: ["dumbbells"], joints: ["el_flex_neutral_cross"], tier: 2, vid: "qmQkt1Y-FX8", cues: ["Curl the DB across to your opposite shoulder", "Thumb stays on top the entire rep"] },
    { name: "Spider Curl (prone incline)", eq: ["dumbbells", "bench"], joints: ["el_flex_peak"], tier: 2, vid: "Dj9gKePX9Cc", cues: ["Arms hang straight down — no swing possible", "Squeeze at the top until it cramps"] },
    { name: "Concentration Curl", eq: ["dumbbells"], joints: ["el_flex_iso"], tier: 2, vid: "EjUnEEfTSEY", cues: ["Elbow braced on inner thigh — it's locked in", "Rotate your pinky up at the top"] },
    { name: "Cable Curl (straight bar)", eq: ["cables"], joints: ["el_flex_cable"], tier: 2, vid: "a5dGx8szsLY", cues: ["Elbows pinned at your sides — they don't move", "Squeeze at the top, 2-second lower"] },
  ],
  triceps: [
    { name: "Overhead Cable Extension (rope)", eq: ["cables"], joints: ["el_ext_oh_cable"], tier: 1, vid: "8z2Ha0wLlsQ", cues: ["Spread the rope apart at the bottom — rip it in half", "Elbows stay pointed at the ceiling"] },
    { name: "Single-Arm OH DB Extension", eq: ["dumbbells"], joints: ["el_ext_oh_uni"], tier: 2, vid: "_w3ggqafzqU", cues: ["Lower the DB behind your head — deep stretch", "Only your forearm moves — elbow is a hinge"] },
    { name: "EZ Skull Crusher", eq: ["ez_bar", "bench"], joints: ["el_ext_oh_free"], tier: 1, vid: "S0fmDR60X-o", cues: ["Lower to your forehead — not your nose", "Elbows point to ceiling, don't flare"] },
    { name: "Cable Pushdown (V-bar)", eq: ["cables"], joints: ["el_ext_pushdown"], tier: 1, vid: "8xT4OwwiACQ", cues: ["Pin elbows to your ribs — they don't move", "Spread the V apart at the bottom for peak squeeze"] },
    { name: "JM Press", eq: ["barbell", "bench"], joints: ["el_ext_compound"], tier: 1, vid: "TQZsq8j2Lmo", cues: ["Lower bar to your chin/throat area — not chest", "Halfway between a close-grip bench and skull crusher"] },
    { name: "Cable Kickback", eq: ["cables"], joints: ["el_ext_peak"], tier: 2, vid: "lcj_g59eBzE", cues: ["Lock your upper arm — only forearm extends", "Squeeze the tricep hard at full extension"] },
    { name: "Diamond Push-Up", eq: [], joints: ["el_ext_bw"], tier: 3, vid: "PPTj-MW2tcs", cues: ["Hands make a diamond under your chest", "Elbows stay tight to your body"] },
  ],
  calves: [
    { name: "Standing Calf Raise (machine)", eq: ["smith_machine"], joints: ["ank_plantar_straight"], tier: 1, vid: "95itLfMBG40", cues: ["3 seconds up, 3 seconds down — no bouncing", "Get as high on your toes as physically possible"] },
    { name: "Seated Calf Raise", eq: ["leg_press"], joints: ["ank_plantar_bent"], tier: 1, vid: "FsqE-g1C5fk", cues: ["Bent knees = targets the soleus underneath", "Full stretch at bottom — don't cut range short"] },
    { name: "Single-Leg DB Calf Raise", eq: ["dumbbells"], joints: ["ank_plantar_uni"], tier: 2, vid: "E1mG5L9rpFc", cues: ["Stand on a step for extra stretch at bottom", "Pause at the top for 2 seconds"] },
    { name: "Leg Press Calf Raise", eq: ["leg_press"], joints: ["ank_plantar_press"], tier: 2, vid: "1cvpm--Y-4I", cues: ["Balls of feet on the bottom edge of platform", "Full range — all the way down, all the way up"] },
    { name: "Tibialis Raise (band)", eq: ["bands"], joints: ["ank_dorsi"], tier: 3, vid: "HNa-n4xq8ro", cues: ["Pull your toes toward your shin", "This prevents shin splints — do it"] },
  ],
};

/* ═══════════════════════════════════════════════════════════════
   SPLITS — 3 unique rotations
   ═══════════════════════════════════════════════════════════════ */
const SPLITS = [
  { id: "upper_lower", name: "Upper / Lower", freq: "4×/wk · 6-day rotation",
    note: "U1→L1→off→U2→L2→off→off, then U3→L3. Every session unique.",
    days: [
      { name: "Upper A — Push Focus", groups: ["chest", "chest", "shoulders", "back", "triceps"] },
      { name: "Lower A — Squat Pattern", groups: ["quads", "quads", "hamstrings", "glutes", "calves"] },
      { name: "Upper B — Pull Focus", groups: ["back", "back", "shoulders", "chest", "biceps"] },
      { name: "Lower B — Hinge Pattern", groups: ["hamstrings", "hamstrings", "quads", "glutes", "calves"] },
      { name: "Upper C — Arms & Angles", groups: ["chest", "back", "rear_delts", "biceps", "triceps"] },
      { name: "Lower C — Unilateral", groups: ["quads", "hamstrings", "glutes", "glutes", "calves"] },
    ],
  },
  { id: "torso_limb", name: "Torso / Limb", freq: "4×/wk · 6-day rotation",
    note: "T1→Li1→off→T2→Li2→off→off, then T3→Li3. All days different.",
    days: [
      { name: "Torso A — Horizontal", groups: ["chest", "back", "chest", "back", "shoulders"] },
      { name: "Limb A — Quads & Bis", groups: ["quads", "quads", "hamstrings", "biceps", "biceps"] },
      { name: "Torso B — Vertical", groups: ["shoulders", "back", "back", "chest", "rear_delts"] },
      { name: "Limb B — Hams & Tris", groups: ["hamstrings", "hamstrings", "quads", "triceps", "triceps"] },
      { name: "Torso C — Angles & Cable", groups: ["chest", "back", "shoulders", "rear_delts", "chest"] },
      { name: "Limb C — Glutes & Arms", groups: ["glutes", "glutes", "calves", "biceps", "triceps"] },
    ],
  },
  { id: "anterior_posterior", name: "Anterior / Posterior", freq: "4×/wk · 6-day rotation",
    note: "A1→P1→off→A2→P2→off→off, then A3→P3. Push/pull with legs.",
    days: [
      { name: "Anterior A — Compounds", groups: ["chest", "quads", "shoulders", "quads", "triceps"] },
      { name: "Posterior A — Compounds", groups: ["back", "hamstrings", "rear_delts", "hamstrings", "biceps"] },
      { name: "Anterior B — Moderate", groups: ["quads", "chest", "shoulders", "chest", "triceps"] },
      { name: "Posterior B — Moderate", groups: ["hamstrings", "back", "back", "biceps", "rear_delts"] },
      { name: "Anterior C — Unilateral", groups: ["chest", "quads", "shoulders", "quads", "triceps"] },
      { name: "Posterior C — Detail", groups: ["back", "hamstrings", "glutes", "biceps", "rear_delts"] },
    ],
  },
  { id: "full_body", name: "Full Body", freq: "3×/wk · 3-day rotation",
    note: "A→off→B→off→C→off→off. Each session hits everything differently.",
    days: [
      { name: "Full Body A — Squat + Press", groups: ["quads", "chest", "back", "shoulders", "biceps"] },
      { name: "Full Body B — Hinge + Pull", groups: ["hamstrings", "back", "chest", "triceps", "rear_delts"] },
      { name: "Full Body C — Unilateral Mix", groups: ["quads", "hamstrings", "chest", "back", "glutes"] },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   PROGRAM GENERATION + EXERCISE SWAP
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
    let best = null, bestScore = -1;
    for (const ex of pool) {
      const newJ = ex.joints.filter((j) => !coveredJoints.has(j)).length;
      const score = newJ * 10 + (4 - ex.tier);
      if (score > bestScore) { best = ex; bestScore = score; }
    }
    if (best) { picked.push({ ...best, muscle: g }); pickedNames.add(best.name); best.joints.forEach((j) => coveredJoints.add(j)); }
  }
  if (picked.length < target) {
    for (const g of groups) {
      if (picked.length >= target) break;
      const pool = (EX_DB[g] || []).filter((ex) => !usedNames.has(ex.name) && !pickedNames.has(ex.name)).filter((ex) => ex.eq.length === 0 || ex.eq.every((e) => equipSet.has(e)));
      for (const ex of pool) { if (ex.joints.filter((j) => !coveredJoints.has(j)).length > 0 && picked.length < target) { picked.push({ ...ex, muscle: g }); pickedNames.add(ex.name); ex.joints.forEach((j) => coveredJoints.add(j)); } }
    }
  }
  return picked;
}

function getSwapOptions(currentEx, programExNames, equipSet) {
  return (EX_DB[currentEx.muscle] || [])
    .filter((ex) => ex.name !== currentEx.name && !programExNames.has(ex.name))
    .filter((ex) => ex.eq.length === 0 || ex.eq.every((e) => equipSet.has(e)))
    .sort((a, b) => { const sA = a.joints.filter((j) => currentEx.joints.some((cj) => cj.split("_")[0] === j.split("_")[0])).length; const sB = b.joints.filter((j) => currentEx.joints.some((cj) => cj.split("_")[0] === j.split("_")[0])).length; return sB - sA; })
    .slice(0, 3);
}

/* ═══════════════════════════════════════════════════════════════
   WEEK PROTOCOL
   ═══════════════════════════════════════════════════════════════ */
const WEEK_PROTOCOL = [
  { wk: 1, label: "Wk 1 — Intro", sets: 1, note: "Find your 10RM. One working set." },
  { wk: 2, label: "Wk 2 — Volume", sets: 2, note: "2 sets × 8 reps at 10RM load." },
  { wk: 3, label: "Wk 3 — Load", sets: 2, note: "Add load → 6 reps @2 RIR. Set 2 same." },
  { wk: 4, label: "Wk 4 — Push", sets: 2, note: "7 reps Wk3 load. Set 2 -10% × 7." },
  { wk: 5, label: "Wk 5 — Intensity", sets: 2, note: "Add load → 5 reps @1 RIR. -10% × 5." },
  { wk: 6, label: "Wk 6 — Hold", sets: 2, note: "Same Wk5 load. 5+5 reps." },
  { wk: 7, label: "Wk 7 — Bump", sets: 2, note: "Add load → 6 @1 RIR. -10% × 6." },
  { wk: 8, label: "Wk 8 — Push", sets: 2, note: "Add load → 5 @1 RIR. -10% × 5." },
  { wk: 9, label: "Wk 9 — Hold", sets: 2, note: "Same Wk8 load. 5+5." },
  { wk: 10, label: "Wk 10 — Peak", sets: 2, note: "Add load → 4 @1 RIR. -10% × 5." },
  { wk: 11, label: "Wk 11 — Hold", sets: 2, note: "Same Wk10 load. 4+5." },
  { wk: 12, label: "Wk 12 — PR", sets: 2, note: "5 reps with Wk11 4-rep load!" },
];
const PROTOCOL_DETAIL = [
  [{ reps: 10, rir: null, pct: "10RM" }],
  [{ reps: 8, rir: "~2", pct: "10RM" }, { reps: 8, rir: "~2", pct: "10RM" }],
  [{ reps: 6, rir: "2", pct: "UP" }, { reps: 6, rir: null, pct: "SAME" }],
  [{ reps: 7, rir: null, pct: "SAME" }, { reps: 7, rir: null, pct: "-10%" }],
  [{ reps: 5, rir: "1", pct: "UP" }, { reps: 5, rir: null, pct: "-10%" }],
  [{ reps: 5, rir: "2+", pct: "SAME" }, { reps: 5, rir: null, pct: "-10%" }],
  [{ reps: 6, rir: "1", pct: "UP" }, { reps: 6, rir: null, pct: "-10%" }],
  [{ reps: 5, rir: "1", pct: "UP" }, { reps: 5, rir: null, pct: "-10%" }],
  [{ reps: 5, rir: null, pct: "SAME" }, { reps: 5, rir: null, pct: "-10%" }],
  [{ reps: 4, rir: "1", pct: "UP" }, { reps: 5, rir: null, pct: "-10%" }],
  [{ reps: 4, rir: null, pct: "SAME" }, { reps: 5, rir: null, pct: "SAME" }],
  [{ reps: 5, rir: null, pct: "SAME" }, { reps: 5, rir: null, pct: "-10%" }],
];

/* ═══════════════════════════════════════════════════════════════
   LOAD PREDICTION ENGINE

   Builds predictions from the user's ACTUAL logged weights.
   - Week 1: no prediction (user enters their 10RM)
   - "SAME" weeks: pull exact weight from the prior week's logs
   - "UP" weeks: take prior week's S1 + ~5% bump (rounded to 5 lbs)
   - "-10%" sets: 90% of that week's S1 prediction
   - Week 12 PR: same load as Week 11 S1 (attempting more reps)

   Falls back to Epley formula from Week 1 10RM if no prior data.
   Users override by simply typing a different number.
   ═══════════════════════════════════════════════════════════════ */
function predictLoad(weekIdx, setIdx, dayIdx, exIdx, logs) {
  if (weekIdx === 0) return null; // Week 1: user enters 10RM, no prediction

  // Helper: get the actual logged weight for a specific week/day/exercise/set
  const getLogged = (wk, si) => {
    const v = logs[`${wk}-${dayIdx}-${exIdx}-${si}`];
    return v ? Number(v) : null;
  };

  // Try to find the best reference weight by walking backward through logs
  // For S1: find the most recent S1 logged weight
  const findPriorS1 = (beforeWeek) => {
    for (let w = beforeWeek - 1; w >= 0; w--) {
      const v = getLogged(w, 0);
      if (v) return { weight: v, fromWeek: w };
    }
    return null;
  };

  // Protocol logic per week (what S1 and S2 should do relative to prior)
  // "same" = same as prior week's S1
  // "up" = prior week's S1 + ~5%
  // "backoff" = this week's S1 × 0.9
  const rules = [
    null,                                           // Wk0 (1): enter 10RM
    [{ ref: "same" }, { ref: "same" }],             // Wk1 (2): same 10RM load
    [{ ref: "up" }, { ref: "s1same" }],             // Wk2 (3): UP, S2 = S1
    [{ ref: "same" }, { ref: "backoff" }],          // Wk3 (4): same, S2 -10%
    [{ ref: "up" }, { ref: "backoff" }],            // Wk4 (5): UP, S2 -10%
    [{ ref: "same" }, { ref: "backoff" }],          // Wk5 (6): SAME, S2 -10%
    [{ ref: "up" }, { ref: "backoff" }],            // Wk6 (7): UP, S2 -10%
    [{ ref: "up" }, { ref: "backoff" }],            // Wk7 (8): UP, S2 -10%
    [{ ref: "same" }, { ref: "backoff" }],          // Wk8 (9): SAME, S2 -10%
    [{ ref: "up" }, { ref: "backoff" }],            // Wk9 (10): UP, S2 -10%
    [{ ref: "same" }, { ref: "backoff" }],          // Wk10 (11): SAME
    [{ ref: "same" }, { ref: "backoff" }],          // Wk11 (12): PR — same load, more reps
  ];

  const weekRules = rules[weekIdx];
  if (!weekRules || setIdx >= weekRules.length) return null;

  const rule = weekRules[setIdx];
  const prior = findPriorS1(weekIdx);

  if (!prior) {
    // Fallback: use Week 1 10RM + Epley formula
    const tenRM = getLogged(0, 0);
    if (!tenRM) return null;
    const oneRM = tenRM * (1 + 10 / 30);
    const fallbackPcts = [null, [0.75, 0.75], [0.83, 0.83], [0.83, 0.747], [0.87, 0.783], [0.87, 0.783], [0.89, 0.801], [0.91, 0.819], [0.91, 0.819], [0.93, 0.837], [0.93, 0.837], [0.93, 0.837]];
    const pcts = fallbackPcts[weekIdx];
    if (!pcts || setIdx >= pcts.length) return null;
    return Math.round((oneRM * pcts[setIdx]) / 5) * 5;
  }

  const priorWeight = prior.weight;

  if (rule.ref === "same") {
    return Math.round(priorWeight / 5) * 5;
  }
  if (rule.ref === "up") {
    return Math.round((priorWeight * 1.05) / 5) * 5;
  }
  if (rule.ref === "s1same") {
    // S2 same as S1 this week
    const s1pred = predictLoad(weekIdx, 0, dayIdx, exIdx, logs);
    return s1pred;
  }
  if (rule.ref === "backoff") {
    // 90% of this week's S1
    const s1 = getLogged(weekIdx, 0) || predictLoad(weekIdx, 0, dayIdx, exIdx, logs);
    if (!s1) return null;
    return Math.round((Number(s1) * 0.9) / 5) * 5;
  }

  return null;
}

/* ═══════════════════════════════════════════════════════════════
   NUTRITION
   ═══════════════════════════════════════════════════════════════ */
function calcNutrition(weight, height, goal, weekData) {
  const bmr = 10 * weight * 0.453592 + 6.25 * height * 2.54 - 5 * 28 + 5;
  const tdee = Math.round(bmr * 1.55);
  let cals = goal === "bulk" ? tdee + 300 : tdee - 500;
  if (weekData?.length > 0) { const l = weekData[weekData.length - 1]; if (goal === "bulk" && l.delta < 0.3) cals += 100; if (goal === "bulk" && l.delta > 1.0) cals -= 100; if (goal === "cut" && l.delta > -0.5) cals -= 100; if (goal === "cut" && l.delta < -1.5) cals += 100; }
  cals = Math.max(1200, cals);
  const protein = Math.round(weight * 1.0), fat = Math.round((cals * 0.25) / 9), carbs = Math.round((cals - protein * 4 - fat * 9) / 4);
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
  { name: "Peanut Butter (16 oz)", price: 4.99, protein: 28, cals: 1344, cat: "Fats" },
  { name: "Olive Oil (16 oz)", price: 6.99, protein: 0, cals: 3600, cat: "Fats" },
  { name: "Avocados (4 ct)", price: 4.49, protein: 4, cals: 640, cat: "Fats" },
  { name: "Mixed Veggies frozen (2 lb)", price: 3.29, protein: 8, cals: 200, cat: "Produce" },
  { name: "Broccoli (2 lb)", price: 2.99, protein: 10, cals: 120, cat: "Produce" },
  { name: "Spinach (10 oz)", price: 3.49, protein: 8, cals: 65, cat: "Produce" },
];
const CUT_FOODS = [
  { name: "Chicken Breast (5 lb)", price: 12.99, protein: 165, cals: 825, cat: "Protein" },
  { name: "Turkey Breast Deli (1 lb)", price: 7.99, protein: 60, cals: 360, cat: "Protein" },
  { name: "Tilapia Fillets (2 lb)", price: 9.99, protein: 90, cals: 432, cat: "Protein" },
  { name: "Egg Whites (32 oz)", price: 5.49, protein: 80, cals: 400, cat: "Protein" },
  { name: "Greek Yogurt 0% (32 oz)", price: 5.49, protein: 68, cals: 380, cat: "Protein" },
  { name: "Brown Rice (2 lb)", price: 3.49, protein: 15, cals: 1440, cat: "Carbs" },
  { name: "Sweet Potatoes (3 lb)", price: 3.99, protein: 12, cals: 540, cat: "Carbs" },
  { name: "Broccoli (2 lb)", price: 2.99, protein: 10, cals: 120, cat: "Produce" },
  { name: "Spinach (10 oz)", price: 3.49, protein: 8, cals: 65, cat: "Produce" },
  { name: "Mixed Greens (5 oz)", price: 3.99, protein: 3, cals: 30, cat: "Produce" },
  { name: "Cauliflower Rice (frozen)", price: 2.99, protein: 4, cals: 100, cat: "Produce" },
  { name: "Almond Butter (12 oz)", price: 7.99, protein: 21, cals: 1176, cat: "Fats" },
  { name: "Olive Oil (16 oz)", price: 6.99, protein: 0, cals: 3600, cat: "Fats" },
];

/* ═══════════════════════════════════════════════════════════════
   STORE FINDER + FOOD SEARCH + PHOTO AI
   ═══════════════════════════════════════════════════════════════ */
function haversine(a1, o1, a2, o2) { const R = 3959, dL = ((a2-a1)*Math.PI)/180, dO = ((o2-o1)*Math.PI)/180; const x = Math.sin(dL/2)**2 + Math.cos(a1*Math.PI/180)*Math.cos(a2*Math.PI/180)*Math.sin(dO/2)**2; return R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x)); }
async function geocodeLocation(q) { const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=us`, { headers: { "User-Agent": "IronProtocol/1.0" } }); const d = await r.json(); return d.length ? { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), display: d[0].display_name } : null; }
async function findRealStores(lat, lon) { const q = `[out:json][timeout:12];(node["shop"="supermarket"](around:8000,${lat},${lon});node["shop"="grocery"](around:8000,${lat},${lon}););out body;`; const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: `data=${encodeURIComponent(q)}` }); const d = await r.json(); return d.elements.filter(e => e.tags?.name).map(e => ({ name: e.tags.name, brand: e.tags.brand || "", dist: haversine(lat, lon, e.lat, e.lon) })).sort((a, b) => a.dist - b.dist).slice(0, 10); }
/* ═══════════════════════════════════════════════════════════════
   FOOD SEARCH — instant local search, 800+ items in foodDb.js
   ═══════════════════════════════════════════════════════════════ */

function searchFood(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  // Score each food by how well it matches the query
  const scored = FOOD_DB_LOCAL.map(f => {
    const name = f.name.toLowerCase();
    let score = 0;

    // Exact substring match is best
    if (name.includes(q)) score += 100;

    // All words present
    const allWords = words.every(w => name.includes(w));
    if (allWords) score += 50;

    // Individual word matches
    for (const w of words) {
      if (name.includes(w)) score += 10;
    }

    // Starts with query
    if (name.startsWith(q)) score += 20;

    return { ...f, score };
  })
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return scored;
}
async function analyzePhoto(b64, key) { const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: 'Identify this food. Estimate macros. Return ONLY JSON: {"name":"food","cals":0,"protein":0,"carbs":0,"fat":0}' }, { inlineData: { mimeType: "image/jpeg", data: b64.split(",")[1] } }] }] }) }); const d = await r.json(); const m = d?.candidates?.[0]?.content?.parts?.[0]?.text?.match(/\{[\s\S]*?\}/); return m ? JSON.parse(m[0]) : null; }

/* ═══════════════════════════════════════════════════════════════
   STORE PRICE INDEX — real chain-level pricing data
   Based on USDA grocery price studies + consumer reports data.
   Multiplier is relative to national average (1.0).
   ═══════════════════════════════════════════════════════════════ */
const CHAIN_PRICE_INDEX = {
  "aldi": 0.83, "lidl": 0.85, "costco": 0.80, "sam's club": 0.82,
  "walmart": 0.88, "walmart supercenter": 0.88, "walmart neighborhood": 0.90,
  "target": 0.95, "meijer": 0.93, "winco": 0.84, "food4less": 0.86,
  "kroger": 0.95, "ralphs": 0.97, "fred meyer": 0.94, "fry's": 0.94,
  "king soopers": 0.95, "harris teeter": 1.02, "pick 'n save": 0.96,
  "safeway": 1.03, "albertsons": 1.04, "vons": 1.05, "jewel-osco": 1.02,
  "publix": 1.05, "h-e-b": 0.90, "wegmans": 1.02, "giant": 0.98,
  "giant eagle": 0.99, "stop & shop": 1.02, "shoprite": 0.94,
  "food lion": 0.91, "winn-dixie": 0.98, "piggly wiggly": 0.96,
  "trader joe's": 0.92, "sprouts": 1.05, "natural grocers": 1.10,
  "whole foods": 1.18, "whole foods market": 1.18, "fresh market": 1.15,
  "market basket": 0.87, "hy-vee": 0.97, "fareway": 0.92,
  "save-a-lot": 0.82, "dollar general": 0.95, "dollar tree": 0.88,
  "grocery outlet": 0.80, "big lots": 0.90, "99 ranch": 1.00,
  "h mart": 1.02, "food bazaar": 0.93, "stater bros": 0.96,
};

function getStoreMultiplier(storeName, brand) {
  const check = (s) => {
    const lower = s.toLowerCase();
    for (const [chain, mult] of Object.entries(CHAIN_PRICE_INDEX)) {
      if (lower.includes(chain)) return mult;
    }
    return null;
  };
  return check(brand || "") || check(storeName || "") || 1.0;
}

function calcStoreTotal(baseList, multiplier) {
  return baseList.reduce((sum, item) => sum + item.price * multiplier, 0);
}

/* ═══════════════════════════════════════════════════════════════
   BARBELL SVG LOGO
   ═══════════════════════════════════════════════════════════════ */
const BarbellLogo = () => (
  <svg width="36" height="16" viewBox="0 0 40 16" fill="currentColor" style={{ opacity: 0.9 }}>
    <rect x="0" y="3" width="5" height="10" rx="1.5" />
    <rect x="6" y="1" width="4" height="14" rx="1.5" />
    <rect x="11" y="6.5" width="18" height="3" rx="1.5" />
    <rect x="30" y="1" width="4" height="14" rx="1.5" />
    <rect x="35" y="3" width="5" height="10" rx="1.5" />
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN APP — Apple-inspired monochrome design
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  // Auth / Profile
  const [profileId, setProfileId] = useState(() => localStorage.getItem("ip_active") || null);
  const [profileName, setProfileName] = useState("");
  const [newName, setNewName] = useState("");

  // Core state
  const [page, setPage] = useState("training");
  const [step, setStep] = useState(0);
  const [equip, setEquip] = useState(new Set());
  const [splitId, setSplitId] = useState(null);
  const [program, setProgram] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [activeWeek, setActiveWeek] = useState(0);
  const [checked, setChecked] = useState(new Set());
  const [logs, setLogs] = useState({});
  const [swapIdx, setSwapIdx] = useState(null);
  const [vidIdx, setVidIdx] = useState(null);

  // Nutrition
  const [nGoal, setNGoal] = useState(null);
  const [nWeight, setNWeight] = useState("");
  const [nHeight, setNHeight] = useState("");
  const [nSetup, setNSetup] = useState(false);
  const [weekCheckins, setWeekCheckins] = useState([]);
  const [checkinWt, setCheckinWt] = useState("");

  // Food tracker
  const [foodLog, setFoodLog] = useState([]);
  const [foodSearch, setFoodSearch] = useState("");
  const [foodResults, setFoodResults] = useState([]);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [qName, setQName] = useState(""); const [qCals, setQCals] = useState(""); const [qP, setQP] = useState(""); const [qC, setQC] = useState(""); const [qF, setQF] = useState("");
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoAnalyzing, setPhotoAnalyzing] = useState(false);
  const [photoResult, setPhotoResult] = useState(null);
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("ip_gemini") || "");
  const [showApiSetup, setShowApiSetup] = useState(false);
  const photoRef = useRef(null);

  // Grocery
  const [groLoc, setGroLoc] = useState("");
  const [stores, setStores] = useState(null);
  const [groList, setGroList] = useState(null);
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeError, setStoreError] = useState("");
  const [geoDisplay, setGeoDisplay] = useState("");

  // ─── Load profile on mount ───
  useEffect(() => {
    if (!profileId) return;
    const p = loadProfile(profileId);
    if (p) {
      setProfileName(p.name);
      const d = p.data || {};
      if (d.equip) setEquip(new Set(d.equip));
      if (d.splitId) setSplitId(d.splitId);
      if (d.program) setProgram(d.program);
      if (d.step !== undefined) setStep(d.step);
      if (d.logs) setLogs(d.logs);
      if (d.checked) setChecked(new Set(d.checked));
      if (d.nGoal) setNGoal(d.nGoal);
      if (d.nWeight) setNWeight(d.nWeight);
      if (d.nHeight) setNHeight(d.nHeight);
      if (d.nSetup) setNSetup(d.nSetup);
      if (d.weekCheckins) setWeekCheckins(d.weekCheckins);
      if (d.foodLog) setFoodLog(d.foodLog);
    }
  }, [profileId]);

  // ─── Auto-save profile data ───
  const saveTimer = useRef(null);
  useEffect(() => {
    if (!profileId) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProfileData(profileId, { equip: [...equip], splitId, program, step, logs, checked: [...checked], nGoal, nWeight, nHeight, nSetup, weekCheckins, foodLog });
    }, 500);
  }, [profileId, equip, splitId, program, step, logs, checked, nGoal, nWeight, nHeight, nSetup, weekCheckins, foodLog]);

  // ─── Derived ───
  const split = SPLITS.find((s) => s.id === splitId);
  const proto = WEEK_PROTOCOL[activeWeek];
  const detail = PROTOCOL_DETAIL[activeWeek];
  const nutrition = useMemo(() => nWeight && nHeight && nGoal ? calcNutrition(Number(nWeight), Number(nHeight), nGoal, weekCheckins) : null, [nWeight, nHeight, nGoal, weekCheckins]);
  const totals = useMemo(() => foodLog.reduce((t, f) => ({ cals: t.cals + (f.cals || 0), protein: t.protein + (f.protein || 0), carbs: t.carbs + (f.carbs || 0), fat: t.fat + (f.fat || 0) }), { cals: 0, protein: 0, carbs: 0, fat: 0 }), [foodLog]);
  const allProgramExNames = useMemo(() => { const s = new Set(); program?.forEach(d => d.exercises?.forEach(e => s.add(e.name))); return s; }, [program]);

  // ─── Handlers ───
  const handleGen = () => { if (!split) return; setProgram(generateProgram(split, equip)); setActiveDay(0); setStep(2); };
  const logW = (ei, si, v) => setLogs((p) => ({ ...p, [`${activeWeek}-${activeDay}-${ei}-${si}`]: v }));
  const getW = (ei, si) => logs[`${activeWeek}-${activeDay}-${ei}-${si}`] || "";
  const togChk = (i) => { const k = `${activeWeek}-${activeDay}-${i}`; setChecked((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; }); };
  const doCheckin = () => { if (!checkinWt) return; const prev = weekCheckins.length > 0 ? weekCheckins[weekCheckins.length - 1].weight : Number(nWeight); setWeekCheckins(p => [...p, { weight: Number(checkinWt), delta: Number(checkinWt) - prev }]); setCheckinWt(""); };
  const addFood = (entry) => setFoodLog(p => [...p, { ...entry, id: Date.now(), time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) }]);
  const removeFood = (id) => setFoodLog(p => p.filter(f => f.id !== id));
  const handleQuickAdd = () => { if (!qCals && !qP && !qC && !qF) return; addFood({ name: qName || "Quick Add", cals: Number(qCals) || 0, protein: Number(qP) || 0, carbs: Number(qC) || 0, fat: Number(qF) || 0, source: "quick" }); setQName(""); setQCals(""); setQP(""); setQC(""); setQF(""); setShowQuickAdd(false); };

  const doSwap = (dayIdx, exIdx, newEx) => {
    setProgram(p => p.map((d, di) => di === dayIdx ? { ...d, exercises: d.exercises.map((e, ei) => ei === exIdx ? { ...newEx, muscle: e.muscle } : e) } : d));
    setSwapIdx(null);
  };

  // Food search (debounced)
  useEffect(() => { if (foodSearch.length >= 2) { setFoodResults(searchFood(foodSearch)); } else { setFoodResults([]); } }, [foodSearch]);

  // Photo
  const handlePhoto = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { setPhotoPreview(ev.target.result); setPhotoResult(null); }; r.readAsDataURL(f); };
  const doAnalyze = async () => { if (!photoPreview || !geminiKey) return; setPhotoAnalyzing(true); try { setPhotoResult(await analyzePhoto(photoPreview, geminiKey)); } catch { setPhotoResult({ error: true }); } setPhotoAnalyzing(false); };

  // Stores
  const findStores = useCallback(async () => { if (!groLoc) return; setStoreLoading(true); setStoreError(""); setStores(null); try { const g = await geocodeLocation(groLoc); if (!g) { setStoreError("Location not found."); setStoreLoading(false); return; } setGeoDisplay(g.display); const r = await findRealStores(g.lat, g.lon); if (!r.length) { setStoreError("No stores nearby."); setStoreLoading(false); return; } setStores(r); setGroList(nGoal === "cut" ? CUT_FOODS : BULK_FOODS); } catch { setStoreError("Network error."); } setStoreLoading(false); }, [groLoc, nGoal]);
  const groTotal = groList ? groList.reduce((s, f) => s + f.price, 0).toFixed(2) : "0.00";

  // ─── Create / Sign In ───
  const createProfile = () => {
    if (!newName.trim()) return;
    const id = Date.now().toString(36);
    const all = loadProfiles();
    all.push({ id, name: newName.trim(), createdAt: Date.now(), data: {} });
    saveProfiles(all);
    localStorage.setItem("ip_active", id);
    setProfileId(id);
    setProfileName(newName.trim());
    setNewName("");
  };

  const signIn = (id) => { localStorage.setItem("ip_active", id); setProfileId(id); };
  const signOut = () => { localStorage.removeItem("ip_active"); setProfileId(null); setProfileName(""); setStep(0); setProgram(null); setNSetup(false); setFoodLog([]); };

  const profiles = loadProfiles();

  // ─── Theme ───
  const bg = "#000", sf = "rgba(255,255,255,.03)", sf2 = "rgba(255,255,255,.06)", bd = "rgba(255,255,255,.1)", t1 = "#fff", t2 = "rgba(255,255,255,.55)", t3 = "rgba(255,255,255,.3)";

  // ═══════════ SIGN IN / CREATE PROFILE ═══════════
  if (!profileId) {
    return (
      <div style={{ minHeight: "100vh", background: bg, color: t1, fontFamily: "'Inter','SF Pro Display',-apple-system,sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <div style={{ width: "100%", maxWidth: 400, padding: 24 }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 12 }}>
              <BarbellLogo />
              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-.04em" }}>Iron Protocol</h1>
            </div>
            <p style={{ fontSize: 14, color: t2, fontWeight: 300 }}>12-week periodized training system</p>
          </div>

          {profiles.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>Welcome back</div>
              {profiles.map((p) => (
                <div key={p.id} onClick={() => signIn(p.id)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", background: sf, border: `1px solid ${bd}`, borderRadius: 14, cursor: "pointer", marginBottom: 8, transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.background = sf2; e.currentTarget.style.borderColor = "rgba(255,255,255,.2)"; }} onMouseLeave={e => { e.currentTarget.style.background = sf; e.currentTarget.style.borderColor = bd; }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>{p.name[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: t3 }}>{p.data?.splitId ? SPLITS.find(s => s.id === p.data.splitId)?.name || "" : "No program yet"}</div>
                  </div>
                  <span style={{ fontSize: 18, color: t3 }}>→</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 12 }}>New profile</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createProfile()} placeholder="Your name" style={{ flex: 1, background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: "14px 16px", color: t1, fontSize: 15, fontFamily: "inherit", outline: "none" }} />
              <button onClick={createProfile} disabled={!newName.trim()} style={{ background: t1, color: "#000", border: "none", borderRadius: 12, padding: "14px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: newName.trim() ? 1 : 0.2, transition: "opacity .2s" }}>Start</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ MAIN APP ═══════════
  return (
    <div style={{ minHeight: "100vh", background: bg, color: t1, fontFamily: "'Inter','SF Pro Display',-apple-system,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes fi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .ani{animation:fi .35s ease-out both}
        .ip{background:${sf};border:1px solid ${bd};border-radius:12px;padding:12px 14px;color:${t1};font-size:14px;font-family:inherit;outline:none;width:100%;transition:border .2s}
        .ip:focus{border-color:rgba(255,255,255,.3)}
        .ip::placeholder{color:${t3}}
        .spinner{width:16px;height:16px;border:2px solid rgba(255,255,255,.1);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block}
        ::-webkit-scrollbar{width:2px;height:2px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:2px}
      `}</style>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 20px 100px" }}>
        {/* ═══ HEADER ═══ */}
        <div className="ani" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarbellLogo />
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-.03em" }}>Iron Protocol</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: t2 }}>Hey, <span style={{ color: t1, fontWeight: 600 }}>{profileName}</span></span>
            <div onClick={signOut} style={{ width: 32, height: 32, borderRadius: "50%", background: sf, border: `1px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>{profileName[0]?.toUpperCase()}</div>
          </div>
        </div>

        {/* ═══ NAV ═══ */}
        <div style={{ display: "flex", gap: 4, padding: "12px 0 28px" }}>
          {["training", "nutrition", "grocery"].map((n) => (
            <button key={n} onClick={() => setPage(n)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", fontFamily: "inherit", transition: "all .2s", background: page === n ? t1 : sf, color: page === n ? "#000" : t3 }}>{n}</button>
          ))}
        </div>

        {/* ═══ TRAINING — Equipment ═══ */}
        {page === "training" && step === 0 && (
          <div className="ani">
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>Equipment</h2>
            <p style={{ fontSize: 13, color: t2, marginBottom: 20 }}>Select everything you have access to.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 6, marginBottom: 28 }}>
              {EQUIPMENT.map((e) => (
                <div key={e.id} onClick={() => { const n = new Set(equip); n.has(e.id) ? n.delete(e.id) : n.add(e.id); setEquip(n); }} style={{ padding: "14px 8px", borderRadius: 12, border: `1px solid ${equip.has(e.id) ? "rgba(255,255,255,.3)" : bd}`, background: equip.has(e.id) ? sf2 : sf, cursor: "pointer", textAlign: "center", transition: "all .2s", fontSize: 12, fontWeight: 500, color: equip.has(e.id) ? t1 : t2 }}>
                  {e.label}
                  {equip.has(e.id) && <div style={{ fontSize: 9, color: t2, marginTop: 3 }}>✓</div>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => setStep(1)} style={{ background: t1, color: "#000", border: "none", borderRadius: 12, padding: "14px 40px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Continue</button>
            </div>
          </div>
        )}

        {/* ═══ TRAINING — Split Selection ═══ */}
        {page === "training" && step === 1 && (
          <div className="ani">
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>Split</h2>
            <p style={{ fontSize: 13, color: t2, marginBottom: 20 }}>Every session is unique. 5 exercises per session, overlap minimized.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {SPLITS.map((s) => (
                <div key={s.id} onClick={() => setSplitId(s.id)} style={{ padding: 18, borderRadius: 14, border: `1px solid ${splitId === s.id ? "rgba(255,255,255,.3)" : bd}`, background: splitId === s.id ? sf2 : sf, cursor: "pointer", transition: "all .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: t3, fontFamily: "'JetBrains Mono'" }}>{s.freq}</span>
                  </div>
                  <p style={{ fontSize: 12, color: t3, marginTop: 6 }}>{s.note}</p>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <button onClick={() => setStep(0)} style={{ background: sf, color: t2, border: `1px solid ${bd}`, borderRadius: 12, padding: "12px 24px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Back</button>
              <button onClick={handleGen} disabled={!splitId} style={{ background: t1, color: "#000", border: "none", borderRadius: 12, padding: "12px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: splitId ? 1 : 0.2 }}>Generate</button>
            </div>
          </div>
        )}

        {/* ═══ TRAINING — Program ═══ */}
        {page === "training" && step === 2 && program && (
          <div className="ani">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>{split?.name}</h2>
                <p style={{ fontSize: 12, color: t3 }}>{program.length} sessions · {equip.size} equipment</p>
              </div>
              <button onClick={() => { setStep(1); setProgram(null); }} style={{ background: sf, color: t2, border: `1px solid ${bd}`, borderRadius: 10, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
            </div>

            {/* Weeks */}
            <div style={{ display: "flex", gap: 3, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
              {WEEK_PROTOCOL.map((_, i) => (
                <button key={i} onClick={() => { setActiveWeek(i); setChecked(new Set()); }} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${activeWeek === i ? "rgba(255,255,255,.3)" : "transparent"}`, background: activeWeek === i ? sf2 : sf, color: activeWeek === i ? t1 : t3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'JetBrains Mono'", whiteSpace: "nowrap" }}>{i + 1}</button>
              ))}
            </div>

            {/* Protocol */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{proto.label}</div>
              <p style={{ fontSize: 12, color: t2, marginTop: 4 }}>{proto.note}</p>
            </div>

            {/* Day tabs */}
            <div style={{ display: "flex", gap: 4, overflowX: "auto", marginBottom: 12, paddingBottom: 4 }}>
              {program.map((d, i) => (
                <button key={i} onClick={() => { setActiveDay(i); setSwapIdx(null); setVidIdx(null); }} style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: activeDay === i ? t1 : sf, color: activeDay === i ? "#000" : t3, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", transition: "all .15s" }}>
                  <div>{d.name.split(" — ")[0]}</div>
                  <div style={{ fontSize: 9, opacity: 0.6, marginTop: 1 }}>{d.name.split(" — ")[1] || ""}</div>
                </button>
              ))}
            </div>

            {/* Exercises */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 14, padding: "4px 16px 8px" }}>
              {program[activeDay]?.exercises.map((ex, i) => {
                const k = `${activeWeek}-${activeDay}-${i}`;
                const done = checked.has(k);
                const showSwap = swapIdx === i;
                const showVid = vidIdx === i;
                return (
                  <div key={i} style={{ padding: "14px 0", borderBottom: `1px solid rgba(255,255,255,.05)`, opacity: done ? 0.3 : 1, transition: "opacity .2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* Check */}
                      <div onClick={() => togChk(i)} style={{ width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${done ? t1 : "rgba(255,255,255,.15)"}`, background: done ? t1 : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, color: "#000", flexShrink: 0, transition: "all .2s" }}>{done && "✓"}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14, fontWeight: 500, textDecoration: done ? "line-through" : "none" }}>{ex.name}</span>
                          <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: sf2, color: t3, fontWeight: 600, textTransform: "uppercase" }}>{ex.muscle.replace(/_/g, " ")}</span>
                        </div>
                        {ex.cues && (
                          <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
                            {ex.cues.map((cue, ci) => (
                              <span key={ci} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 8, background: "rgba(255,255,255,.03)", border: `1px solid rgba(255,255,255,.06)`, color: t2, fontStyle: "italic", lineHeight: 1.3 }}>💡 {cue}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Video button */}
                      {ex.vid && <button onClick={() => setVidIdx(showVid ? null : i)} style={{ background: showVid ? t1 : sf, color: showVid ? "#000" : t3, border: `1px solid ${bd}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>▶</button>}
                      {/* Swap button */}
                      <button onClick={() => setSwapIdx(showSwap ? null : i)} style={{ background: showSwap ? t1 : sf, color: showSwap ? "#000" : t3, border: `1px solid ${bd}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>⟳</button>
                    </div>

                    {/* Inline Video */}
                    {showVid && ex.vid && (
                      <div style={{ marginTop: 10, borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: "#111" }}>
                        <iframe src={`https://www.youtube.com/embed/${ex.vid}?rel=0`} style={{ width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={ex.name} />
                      </div>
                    )}

                    {/* Swap Options */}
                    {showSwap && (
                      <div style={{ marginTop: 10, background: sf2, borderRadius: 10, padding: 12 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Swap — same muscle, different movement</div>
                        {getSwapOptions(ex, allProgramExNames, equip).map((opt, oi) => (
                          <div key={oi} onClick={() => doSwap(activeDay, i, opt)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, transition: "background .15s", background: "transparent" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <span style={{ fontSize: 13, fontWeight: 500 }}>{opt.name}</span>
                            <span style={{ fontSize: 11, color: t3 }}>→</span>
                          </div>
                        ))}
                        {getSwapOptions(ex, allProgramExNames, equip).length === 0 && <p style={{ fontSize: 12, color: t3 }}>No alternatives match your equipment.</p>}
                      </div>
                    )}

                    {/* Weight logging with predicted loads */}
                    <div style={{ marginTop: 8, paddingLeft: 32 }}>
                      {Array.from({ length: proto.sets }).map((_, si) => {
                        const predicted = predictLoad(activeWeek, si, activeDay, i, logs);
                        const current = getW(i, si);
                        const isOverride = current && predicted && Number(current) !== predicted;
                        return (
                          <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: si > 0 ? 4 : 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: t3, width: 24, fontFamily: "'JetBrains Mono'" }}>S{si + 1}</span>
                            <span style={{ fontSize: 11, color: t2, fontFamily: "'JetBrains Mono'", minWidth: 80 }}>
                              {detail[si]?.reps}r{detail[si]?.rir && <span style={{ color: t1 }}> @{detail[si].rir}</span>}{detail[si]?.pct === "-10%" && <span style={{ color: t3 }}> -10%</span>}
                            </span>
                            <div style={{ position: "relative" }}>
                              <input className="ip" style={{ width: 80, padding: "6px 10px", fontSize: 12, fontFamily: "'JetBrains Mono'", borderRadius: 8, borderColor: isOverride ? "rgba(255,255,255,.25)" : undefined }} placeholder={predicted ? `${predicted}` : "lbs"} value={current} onChange={(e) => logW(i, si, e.target.value)} />
                            </div>
                            {predicted && !current && (
                              <button onClick={() => logW(i, si, String(predicted))} style={{ background: sf2, border: `1px solid ${bd}`, borderRadius: 6, padding: "4px 8px", fontSize: 9, fontWeight: 600, color: t2, cursor: "pointer", fontFamily: "'JetBrains Mono'", whiteSpace: "nowrap" }}>Use {predicted}</button>
                            )}
                            {isOverride && (
                              <span style={{ fontSize: 9, color: t3, fontStyle: "italic" }}>({predicted} suggested)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ NUTRITION — Setup ═══ */}
        {page === "nutrition" && !nSetup && (
          <div className="ani">
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>Nutrition</h2>
            <p style={{ fontSize: 13, color: t2, marginBottom: 24 }}>Auto-calculated macros with weekly adjustments.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 380 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Goal</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["bulk", "cut"].map((g) => (
                    <div key={g} onClick={() => setNGoal(g)} style={{ flex: 1, padding: "14px 0", textAlign: "center", borderRadius: 12, cursor: "pointer", border: `1px solid ${nGoal === g ? "rgba(255,255,255,.3)" : bd}`, background: nGoal === g ? sf2 : sf, fontSize: 14, fontWeight: 600, color: nGoal === g ? t1 : t2, transition: "all .2s" }}>
                      {g === "bulk" ? "↑ Bulk" : "↓ Cut"}
                    </div>
                  ))}
                </div>
              </div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Weight (lbs)</div><input className="ip" type="number" placeholder="180" value={nWeight} onChange={e => setNWeight(e.target.value)} /></div>
              <div><div style={{ fontSize: 11, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Height (inches)</div><input className="ip" type="number" placeholder="70" value={nHeight} onChange={e => setNHeight(e.target.value)} /></div>
              <button onClick={() => setNSetup(true)} disabled={!nGoal || !nWeight || !nHeight} style={{ background: t1, color: "#000", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginTop: 8, opacity: nGoal && nWeight && nHeight ? 1 : 0.2 }}>Calculate</button>
            </div>
          </div>
        )}

        {/* ═══ NUTRITION — Dashboard ═══ */}
        {page === "nutrition" && nSetup && nutrition && (
          <div className="ani">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>{nGoal === "bulk" ? "Bulk" : "Cut"}</h2>
              <button onClick={() => setNSetup(false)} style={{ background: sf, color: t2, border: `1px solid ${bd}`, borderRadius: 10, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
            </div>

            {/* Macro cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 16 }}>
              {[{ l: "Cal", v: nutrition.cals, u: "kcal" }, { l: "Protein", v: nutrition.protein, u: "g" }, { l: "Carbs", v: nutrition.carbs, u: "g" }, { l: "Fat", v: nutrition.fat, u: "g" }].map(m => (
                <div key={m.l} style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 14, padding: "16px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>{m.l}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'JetBrains Mono'" }}>{m.v}</div>
                  <div style={{ fontSize: 10, color: t3 }}>{m.u}/day</div>
                </div>
              ))}
            </div>

            {/* ═══ FOOD TRACKER ═══ */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Daily Tracker</span>
                {!geminiKey && <button onClick={() => setShowApiSetup(!showApiSetup)} style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, color: t3, cursor: "pointer", fontFamily: "inherit" }}>📷 Setup</button>}
                {geminiKey && <button onClick={() => setShowApiSetup(!showApiSetup)} style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 8, padding: "4px 10px", fontSize: 10, color: t2, cursor: "pointer", fontFamily: "inherit" }}>📷 ✓</button>}
              </div>

              {/* Gemini API Key (only needed for photo AI) */}
              {showApiSetup && (
                <div style={{ background: sf2, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Photo AI — Gemini (optional)</div>
                  <p style={{ fontSize: 11, color: t3, marginBottom: 6 }}>Free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: t1, textDecoration: "underline" }}>aistudio.google.com/apikey</a> — only needed if you want to snap food photos</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input className="ip" type="password" placeholder="Gemini API key..." value={geminiKey} onChange={e => { setGeminiKey(e.target.value); localStorage.setItem("ip_gemini", e.target.value); }} style={{ fontSize: 12 }} />
                    <button onClick={() => setShowApiSetup(false)} style={{ background: t1, color: "#000", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Done</button>
                  </div>
                  <p style={{ fontSize: 10, color: t3, marginTop: 6 }}>Food search works automatically — no key needed.</p>
                </div>
              )}

              {/* Search + buttons */}
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input className="ip" style={{ paddingLeft: 32 }} placeholder="Search any food... (ice cream, chicken breast, pizza)" value={foodSearch} onChange={e => setFoodSearch(e.target.value)} />
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, opacity: 0.3 }}>🔍</span>
                  {foodResults.length > 0 && (
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, background: "#111", border: `1px solid ${bd}`, borderRadius: 12, maxHeight: 240, overflowY: "auto", marginTop: 4, boxShadow: "0 12px 40px rgba(0,0,0,.6)" }}>
                      {foodResults.map((f, i) => (
                        <div key={i} onClick={() => { addFood({ ...f, source: "search" }); setFoodSearch(""); setFoodResults([]); }} style={{ padding: "10px 14px", cursor: "pointer", borderBottom: `1px solid rgba(255,255,255,.04)`, transition: "background .1s" }} onMouseEnter={e => e.currentTarget.style.background = sf2} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: t3, marginTop: 2 }}>{f.cals} cal · {f.protein}P · {f.carbs}C · {f.fat}F <span style={{ opacity: 0.4 }}>per {f.serving}</span></div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" capture="environment" ref={photoRef} style={{ display: "none" }} onChange={handlePhoto} />
                <button onClick={() => photoRef.current?.click()} style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 12, padding: "0 14px", fontSize: 16, cursor: "pointer", color: t2 }}>📷</button>
                <button onClick={() => setShowQuickAdd(!showQuickAdd)} style={{ background: showQuickAdd ? t1 : sf, color: showQuickAdd ? "#000" : t2, border: `1px solid ${bd}`, borderRadius: 12, padding: "0 14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⚡</button>
              </div>

              {/* Quick Add */}
              {showQuickAdd && (
                <div style={{ background: sf2, borderRadius: 10, padding: 14, marginBottom: 8 }}>
                  <input className="ip" style={{ marginBottom: 6 }} placeholder="Name (optional)" value={qName} onChange={e => setQName(e.target.value)} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                    {[{ l: "Cal", s: qCals, f: setQCals }, { l: "Protein", s: qP, f: setQP }, { l: "Carbs", s: qC, f: setQC }, { l: "Fat", s: qF, f: setQF }].map(x => (
                      <div key={x.l}><div style={{ fontSize: 9, fontWeight: 600, color: t3, textTransform: "uppercase", marginBottom: 3 }}>{x.l}</div><input className="ip" type="number" placeholder="0" value={x.s} onChange={e => x.f(e.target.value)} style={{ fontSize: 12, padding: "8px" }} /></div>
                    ))}
                  </div>
                  <button onClick={handleQuickAdd} disabled={!qCals && !qP && !qC && !qF} style={{ width: "100%", background: t1, color: "#000", border: "none", borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: qCals || qP || qC || qF ? 1 : 0.2 }}>Add</button>
                </div>
              )}

              {/* Photo */}
              {photoPreview && (
                <div style={{ background: sf2, borderRadius: 10, padding: 14, marginBottom: 8, display: "flex", gap: 12, alignItems: "start" }}>
                  <img src={photoPreview} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
                  <div style={{ flex: 1 }}>
                    {!photoResult && !photoAnalyzing && (geminiKey ? <button onClick={doAnalyze} style={{ background: t1, color: "#000", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Analyze</button> : <p style={{ fontSize: 12, color: t3 }}>Set up API key first.</p>)}
                    {photoAnalyzing && <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span className="spinner" /><span style={{ fontSize: 13, color: t2 }}>Analyzing...</span></div>}
                    {photoResult && !photoResult.error && (
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{photoResult.name}</div>
                        <div style={{ fontSize: 12, color: t2, margin: "4px 0 8px" }}>{photoResult.cals} cal · {photoResult.protein}P · {photoResult.carbs}C · {photoResult.fat}F</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { addFood({ ...photoResult, source: "photo" }); setPhotoPreview(null); setPhotoResult(null); }} style={{ background: t1, color: "#000", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Add</button>
                          <button onClick={() => { setPhotoPreview(null); setPhotoResult(null); }} style={{ background: sf, color: t2, border: `1px solid ${bd}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Discard</button>
                        </div>
                      </div>
                    )}
                    {photoResult?.error && <p style={{ fontSize: 12, color: t2 }}>Could not analyze. <span onClick={() => { setPhotoPreview(null); setPhotoResult(null); }} style={{ cursor: "pointer", textDecoration: "underline" }}>Try again</span></p>}
                  </div>
                </div>
              )}

              {/* Progress */}
              {[{ l: "Calories", c: totals.cals, t: nutrition.cals, u: "kcal" }, { l: "Protein", c: totals.protein, t: nutrition.protein, u: "g" }, { l: "Carbs", c: totals.carbs, t: nutrition.carbs, u: "g" }, { l: "Fat", c: totals.fat, t: nutrition.fat, u: "g" }].map(b => (
                <div key={b.l} style={{ marginBottom: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: t2 }}>{b.l}</span>
                    <span style={{ fontFamily: "'JetBrains Mono'", color: b.c > b.t ? t1 : t3, fontSize: 10 }}>{b.c} / {b.t} {b.u}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.04)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min((b.c / b.t) * 100, 100)}%`, background: t1, borderRadius: 3, transition: "width .3s" }} />
                  </div>
                </div>
              ))}

              {/* Log */}
              {foodLog.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid rgba(255,255,255,.06)` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Today</div>
                  {foodLog.map(f => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                      <span style={{ fontSize: 12, width: 18, textAlign: "center", opacity: 0.5 }}>{f.source === "photo" ? "📷" : f.source === "quick" ? "⚡" : "🔍"}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: t3, marginTop: 1 }}>{f.cals} · {f.protein}P · {f.carbs}C · {f.fat}F</div>
                      </div>
                      <span style={{ fontSize: 10, color: t3 }}>{f.time}</span>
                      <div onClick={() => removeFood(f.id)} style={{ width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, color: t3, border: "1px solid rgba(255,255,255,.06)" }}>✕</div>
                    </div>
                  ))}
                </div>
              )}
              {!foodLog.length && !showQuickAdd && !photoPreview && <p style={{ textAlign: "center", padding: "14px 0 4px", color: t3, fontSize: 12 }}>Search, snap, or quick-add to start tracking.</p>}
            </div>

            {/* Check-in */}
            <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Weekly Check-In</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="ip" style={{ flex: 1, maxWidth: 160 }} type="number" placeholder="Current lbs" value={checkinWt} onChange={e => setCheckinWt(e.target.value)} />
                <button onClick={doCheckin} disabled={!checkinWt} style={{ background: t1, color: "#000", border: "none", borderRadius: 10, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: checkinWt ? 1 : 0.2 }}>Log</button>
              </div>
              {weekCheckins.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {weekCheckins.map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 12, borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                      <span style={{ fontFamily: "'JetBrains Mono'", color: t3 }}>Wk {i + 1}</span>
                      <span style={{ fontFamily: "'JetBrains Mono'" }}>{c.weight} lbs</span>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, color: t1 }}>{c.delta >= 0 ? "+" : ""}{c.delta.toFixed(1)}</span>
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
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 6 }}>Grocery</h2>
            <p style={{ fontSize: 13, color: t2, marginBottom: 20 }}>{nGoal ? `${nGoal === "bulk" ? "Bulk" : "Cut"} list with real stores near you.` : "Set up nutrition first."}</p>
            {!nGoal ? (
              <div style={{ background: sf, border: `1px solid ${bd}`, borderRadius: 14, padding: 24, textAlign: "center" }}>
                <button onClick={() => setPage("nutrition")} style={{ background: t1, color: "#000", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Go to Nutrition →</button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  <input className="ip" style={{ flex: 1 }} placeholder="Zip, city, or address..." value={groLoc} onChange={e => setGroLoc(e.target.value)} onKeyDown={e => e.key === "Enter" && findStores()} />
                  <button onClick={findStores} disabled={!groLoc || storeLoading} style={{ background: t1, color: "#000", border: "none", borderRadius: 12, padding: "0 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, opacity: groLoc && !storeLoading ? 1 : 0.3 }}>
                    {storeLoading ? <span className="spinner" style={{ borderTopColor: "#000" }} /> : "Find"}
                  </button>
                </div>
                {geoDisplay && <p style={{ fontSize: 11, color: t3, marginBottom: 14 }}>📍 {geoDisplay}</p>}
                {storeError && <p style={{ fontSize: 12, color: t2, marginBottom: 14 }}>{storeError}</p>}

                {stores && groList && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Estimated weekly total by store</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {stores.map((s, i) => {
                        const mult = getStoreMultiplier(s.name, s.brand);
                        const total = calcStoreTotal(groList, mult);
                        const avgTotal = groList.reduce((sum, f) => sum + f.price, 0);
                        const savings = total - avgTotal;
                        const isCheapest = stores.every(other => calcStoreTotal(groList, getStoreMultiplier(other.name, other.brand)) >= total - 0.01);
                        return (
                          <div key={i} style={{ background: isCheapest ? sf2 : sf, border: `1px solid ${isCheapest ? "rgba(255,255,255,.2)" : bd}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>
                                {isCheapest && <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,.1)", color: t1, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Best Price</span>}
                              </div>
                              <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: t3 }}>
                                <span>{s.dist.toFixed(1)} mi</span>
                                {mult !== 1.0 && <span>{mult < 1 ? `${Math.round((1 - mult) * 100)}% below avg` : `${Math.round((mult - 1) * 100)}% above avg`}</span>}
                                {mult === 1.0 && <span>Avg pricing</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, fontWeight: 800 }}>${total.toFixed(2)}</div>
                              {savings !== 0 && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: savings < 0 ? t1 : t3, fontWeight: 600 }}>{savings < 0 ? `Save $${Math.abs(savings).toFixed(2)}` : `+$${savings.toFixed(2)}`}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ fontSize: 10, color: t3, marginTop: 8 }}>Prices estimated from USDA chain-level pricing data. Actual prices may vary.</p>
                  </div>
                )}

                {groList && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: t3, textTransform: "uppercase", letterSpacing: ".08em" }}>{nGoal} list</span>
                      <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 16, fontWeight: 700 }}>${groTotal}</span>
                    </div>
                    {["Protein", "Carbs", "Fats", "Produce", "Dairy"].map(cat => {
                      const items = groList.filter(f => f.cat === cat);
                      if (!items.length) return null;
                      return (
                        <div key={cat} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: t2, padding: "6px 0", borderBottom: `1px solid ${bd}` }}>{cat}</div>
                          {items.map((f, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                              <div><div style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</div><div style={{ fontSize: 11, color: t3 }}>{f.protein}g P · {f.cals} cal</div></div>
                              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 13, fontWeight: 600, color: t2 }}>${f.price.toFixed(2)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
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

/**
 * EduAshram Science Diagram Library Engine
 * Curriculum-aligned NCERT / CBSE Science Diagrams (Grades 6 to 10)
 * Features:
 *  - High-res crisp vector rendering on Canvas (Whiteboard & Blackboard adaptive)
 *  - Interactive Label Modes: Study Mode (all labels), Quiz Mode (interactive numbered badges [1], [2] with tap-to-reveal), Blind Mode (no labels)
 *  - Quick Filtering by Subject (Biology, Chemistry, Physics) & Grade (Middle School 6-8, Secondary 9-10)
 *  - Full integration with Whiteboard Shape selection, dragging, resizing, and rotation
 */

(function () {
  "use strict";

  // Helper color palettes
  const PALETTE = {
    deoxBlood: "#2563eb",   // deoxygenated blue
    oxBlood: "#dc2626",     // oxygenated red
    tissuePink: "#fda4af",
    tissueRed: "#e11d48",
    muscleBrown: "#b45309",
    leafGreen: "#16a34a",
    chloroplastGreen: "#22c55e",
    plantLightGreen: "#dcfce7",
    nerveYellow: "#eab308",
    glassCyan: "rgba(56, 189, 248, 0.2)",
    glassBorder: "#0284c7",
    liquidWater: "rgba(14, 165, 233, 0.35)",
    wireCopper: "#ea580c",
    goldYellow: "#f59e0b",
    magnetNorth: "#ef4444",
    magnetSouth: "#3b82f6",
    ironGrey: "#64748b",
  };

  // ---------------------------------------------------------------------------
  // 1. DIAGRAM DEFINITIONS
  // ---------------------------------------------------------------------------
  const DIAGRAMS = {};

  // 1. HUMAN HEART (Cross-Section) - Class 10 Biology
  DIAGRAMS["human_heart"] = {
    id: "human_heart",
    title: "Human Heart (Cross-Section)",
    subject: "biology",
    grade: "Class 10",
    chapter: "Life Processes",
    icon: "🫀",
    aspectRatio: 1.2,
    labels: [
      { id: 1, text: "Aorta", target: { x: 0.52, y: 0.12 }, pin: { x: 0.88, y: 0.10 } },
      { id: 2, text: "Superior Vena Cava", target: { x: 0.30, y: 0.22 }, pin: { x: 0.08, y: 0.16 } },
      { id: 3, text: "Pulmonary Artery", target: { x: 0.44, y: 0.24 }, pin: { x: 0.10, y: 0.30 } },
      { id: 4, text: "Pulmonary Veins", target: { x: 0.68, y: 0.32 }, pin: { x: 0.88, y: 0.28 } },
      { id: 5, text: "Right Atrium", target: { x: 0.32, y: 0.42 }, pin: { x: 0.08, y: 0.46 } },
      { id: 6, text: "Left Atrium", target: { x: 0.64, y: 0.42 }, pin: { x: 0.88, y: 0.46 } },
      { id: 7, text: "Right Ventricle", target: { x: 0.38, y: 0.72 }, pin: { x: 0.08, y: 0.72 } },
      { id: 8, text: "Left Ventricle", target: { x: 0.62, y: 0.75 }, pin: { x: 0.88, y: 0.72 } },
      { id: 9, text: "Interventricular Septum", target: { x: 0.50, y: 0.74 }, pin: { x: 0.50, y: 0.94 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // Heart Muscle Wall (Myocardium)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#450a0a" : "#ffe4e6";
      ctx.strokeStyle = stroke;
      ctx.moveTo(x + w * 0.5, y + h * 0.92);
      ctx.bezierCurveTo(x + w * 0.18, y + h * 0.82, x + w * 0.18, y + h * 0.35, x + w * 0.5, y + h * 0.35);
      ctx.bezierCurveTo(x + w * 0.82, y + h * 0.35, x + w * 0.82, y + h * 0.82, x + w * 0.5, y + h * 0.92);
      ctx.fill();
      ctx.stroke();

      // Right Ventricle & Atrium Cavity (Deoxygenated - Blue)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "rgba(30, 58, 138, 0.7)" : "#bfdbfe";
      ctx.moveTo(x + w * 0.32, y + h * 0.38);
      ctx.bezierCurveTo(x + w * 0.24, y + h * 0.45, x + w * 0.25, y + h * 0.75, x + w * 0.46, y + h * 0.80);
      ctx.bezierCurveTo(x + w * 0.46, y + h * 0.55, x + w * 0.42, y + h * 0.42, x + w * 0.32, y + h * 0.38);
      ctx.fill();
      ctx.stroke();

      // Left Ventricle & Atrium Cavity (Oxygenated - Red/Crimson)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "rgba(153, 27, 27, 0.7)" : "#fecdd3";
      ctx.moveTo(x + w * 0.68, y + h * 0.38);
      ctx.bezierCurveTo(x + w * 0.75, y + h * 0.45, x + w * 0.74, y + h * 0.78, x + w * 0.54, y + h * 0.84);
      ctx.bezierCurveTo(x + w * 0.54, y + h * 0.55, x + w * 0.58, y + h * 0.42, x + w * 0.68, y + h * 0.38);
      ctx.fill();
      ctx.stroke();

      // Septum (central dividing muscular wall)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#881337" : "#fda4af";
      ctx.rect(x + w * 0.47, y + h * 0.50, w * 0.06, h * 0.34);
      ctx.fill();
      ctx.stroke();

      // Superior Vena Cava (Top Left tube - Blue)
      ctx.beginPath();
      ctx.fillStyle = PALETTE.deoxBlood;
      ctx.rect(x + w * 0.26, y + h * 0.16, w * 0.08, h * 0.22);
      ctx.fill();
      ctx.stroke();

      // Aorta (Central Arch - Red)
      ctx.beginPath();
      ctx.fillStyle = PALETTE.oxBlood;
      ctx.moveTo(x + w * 0.46, y + h * 0.35);
      ctx.bezierCurveTo(x + w * 0.46, y + h * 0.12, x + w * 0.62, y + h * 0.10, x + w * 0.64, y + h * 0.35);
      ctx.lineTo(x + w * 0.58, y + h * 0.35);
      ctx.bezierCurveTo(x + w * 0.56, y + h * 0.18, x + w * 0.50, y + h * 0.18, x + w * 0.50, y + h * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3 Aortic Branch Vessels
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.fillStyle = PALETTE.oxBlood;
        ctx.rect(x + w * (0.50 + i * 0.05), y + h * 0.08, w * 0.035, h * 0.08);
        ctx.fill();
        ctx.stroke();
      }

      // Pulmonary Artery (Blue Crossing behind Aorta)
      ctx.beginPath();
      ctx.fillStyle = PALETTE.deoxBlood;
      ctx.moveTo(x + w * 0.38, y + h * 0.35);
      ctx.lineTo(x + w * 0.46, y + h * 0.22);
      ctx.lineTo(x + w * 0.52, y + h * 0.22);
      ctx.lineTo(x + w * 0.44, y + h * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Valves
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      // Tricuspid
      ctx.beginPath();
      ctx.moveTo(x + w * 0.30, y + h * 0.52);
      ctx.lineTo(x + w * 0.36, y + h * 0.56);
      ctx.stroke();
      // Bicuspid / Mitral
      ctx.beginPath();
      ctx.moveTo(x + w * 0.64, y + h * 0.52);
      ctx.lineTo(x + w * 0.70, y + h * 0.56);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 2. HUMAN EYE ANATOMY - Class 10 Physics / Biology
  DIAGRAMS["human_eye"] = {
    id: "human_eye",
    title: "Human Eye Anatomy",
    subject: "biology",
    grade: "Class 10",
    chapter: "The Human Eye",
    icon: "👁️",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "Cornea", target: { x: 0.20, y: 0.50 }, pin: { x: 0.08, y: 0.26 } },
      { id: 2, text: "Iris", target: { x: 0.28, y: 0.34 }, pin: { x: 0.08, y: 0.12 } },
      { id: 3, text: "Pupil", target: { x: 0.26, y: 0.50 }, pin: { x: 0.08, y: 0.50 } },
      { id: 4, text: "Crystalline Lens", target: { x: 0.34, y: 0.50 }, pin: { x: 0.34, y: 0.12 } },
      { id: 5, text: "Ciliary Muscles", target: { x: 0.34, y: 0.28 }, pin: { x: 0.55, y: 0.12 } },
      { id: 6, text: "Retina (Inner Layer)", target: { x: 0.76, y: 0.50 }, pin: { x: 0.90, y: 0.30 } },
      { id: 7, text: "Optic Nerve", target: { x: 0.82, y: 0.60 }, pin: { x: 0.90, y: 0.72 } },
      { id: 8, text: "Sclera (Outer Coat)", target: { x: 0.60, y: 0.80 }, pin: { x: 0.60, y: 0.92 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      const cx = x + w * 0.52;
      const cy = y + h * 0.50;
      const r = Math.min(w, h) * 0.35;

      // Eyeball Outer Sphere (Sclera)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.strokeStyle = stroke;
      ctx.arc(cx, cy, r, 0.45 * Math.PI, 1.55 * Math.PI, true);
      // Cornea Bulge
      ctx.bezierCurveTo(cx - r * 1.5, cy - r * 0.6, cx - r * 1.5, cy + r * 0.6, cx + r * Math.cos(0.45 * Math.PI), cy + r * Math.sin(0.45 * Math.PI));
      ctx.fill();
      ctx.stroke();

      // Retina Layer (Golden/Yellow lining at back)
      ctx.beginPath();
      ctx.strokeStyle = PALETTE.goldYellow;
      ctx.lineWidth = 4;
      ctx.arc(cx, cy, r - 5, -0.4 * Math.PI, 0.32 * Math.PI);
      ctx.stroke();

      // Vitreous Humor fill
      ctx.fillStyle = isDark ? "rgba(56, 189, 248, 0.08)" : "rgba(224, 242, 254, 0.45)";
      ctx.fill();

      // Optic Nerve exit
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#334155" : "#fde68a";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.moveTo(cx + r * 0.92, cy + r * 0.15);
      ctx.bezierCurveTo(cx + r * 1.4, cy + r * 0.20, cx + r * 1.4, cy + r * 0.45, cx + r * 0.82, cy + r * 0.40);
      ctx.fill();
      ctx.stroke();

      // Crystalline Biconvex Lens
      const lx = cx - r * 0.55;
      ctx.beginPath();
      ctx.fillStyle = "rgba(125, 211, 252, 0.6)";
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 2.5;
      ctx.ellipse(lx, cy, r * 0.18, r * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ciliary Muscles & Suspensory Ligaments
      ctx.fillStyle = PALETTE.tissueRed;
      // Top muscle
      ctx.beginPath();
      ctx.arc(lx, cy - r * 0.52, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Bottom muscle
      ctx.beginPath();
      ctx.arc(lx, cy + r * 0.52, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Iris Diaphragms (Dark flaps in front of lens)
      ctx.fillStyle = "#92400e";
      // Top Iris
      ctx.beginPath();
      ctx.rect(lx - r * 0.15, cy - r * 0.40, r * 0.08, r * 0.22);
      ctx.fill();
      // Bottom Iris
      ctx.beginPath();
      ctx.rect(lx - r * 0.15, cy + r * 0.18, r * 0.08, r * 0.22);
      ctx.fill();

      // Pupil Aperture (gap between iris)
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(lx - r * 0.12, cy, r * 0.06, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };

  // 3. HUMAN DIGESTIVE SYSTEM - Class 10 Biology
  DIAGRAMS["human_digestive"] = {
    id: "human_digestive",
    title: "Human Digestive System",
    subject: "biology",
    grade: "Class 10",
    chapter: "Life Processes",
    icon: "🥣",
    aspectRatio: 1.15,
    labels: [
      { id: 1, text: "Buccal Cavity (Mouth)", target: { x: 0.46, y: 0.08 }, pin: { x: 0.12, y: 0.08 } },
      { id: 2, text: "Oesophagus", target: { x: 0.48, y: 0.22 }, pin: { x: 0.12, y: 0.22 } },
      { id: 3, text: "Stomach", target: { x: 0.56, y: 0.38 }, pin: { x: 0.88, y: 0.32 } },
      { id: 4, text: "Liver", target: { x: 0.38, y: 0.36 }, pin: { x: 0.12, y: 0.36 } },
      { id: 5, text: "Pancreas", target: { x: 0.52, y: 0.46 }, pin: { x: 0.88, y: 0.46 } },
      { id: 6, text: "Small Intestine", target: { x: 0.50, y: 0.62 }, pin: { x: 0.88, y: 0.62 } },
      { id: 7, text: "Large Intestine", target: { x: 0.62, y: 0.58 }, pin: { x: 0.88, y: 0.74 } },
      { id: 8, text: "Rectum & Anus", target: { x: 0.50, y: 0.88 }, pin: { x: 0.50, y: 0.96 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Mouth / Pharynx
      ctx.beginPath();
      ctx.strokeStyle = stroke;
      ctx.fillStyle = isDark ? "#334155" : "#fee2e2";
      ctx.arc(x + w * 0.46, y + h * 0.08, w * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Oesophagus Tube
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#475569" : "#ffedd5";
      ctx.rect(x + w * 0.45, y + h * 0.12, w * 0.04, h * 0.20);
      ctx.fill();
      ctx.stroke();

      // J-Shaped Stomach
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#991b1b" : "#fda4af";
      ctx.moveTo(x + w * 0.46, y + h * 0.32);
      ctx.bezierCurveTo(x + w * 0.66, y + h * 0.30, x + w * 0.68, y + h * 0.46, x + w * 0.52, y + h * 0.44);
      ctx.bezierCurveTo(x + w * 0.44, y + h * 0.44, x + w * 0.44, y + h * 0.34, x + w * 0.46, y + h * 0.32);
      ctx.fill();
      ctx.stroke();

      // Liver (Large triangle on right anatomical / left visual)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#78350f" : "#d97706";
      ctx.moveTo(x + w * 0.30, y + h * 0.30);
      ctx.lineTo(x + w * 0.44, y + h * 0.30);
      ctx.lineTo(x + w * 0.42, y + h * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Pancreas (feather-shaped under stomach)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#854d0e" : "#fef08a";
      ctx.ellipse(x + w * 0.52, y + h * 0.46, w * 0.07, h * 0.025, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Large Intestine (Framing Outer Colon)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#1e3a8a" : "#cbd5e1";
      ctx.lineWidth = w * 0.04;
      ctx.strokeStyle = isDark ? "#3b82f6" : "#94a3b8";
      ctx.moveTo(x + w * 0.36, y + h * 0.74);
      ctx.lineTo(x + w * 0.36, y + h * 0.52);
      ctx.lineTo(x + w * 0.64, y + h * 0.52);
      ctx.lineTo(x + w * 0.64, y + h * 0.74);
      ctx.lineTo(x + w * 0.50, y + h * 0.88);
      ctx.stroke();

      // Small Intestine (Coiled Loops inside)
      ctx.beginPath();
      ctx.strokeStyle = isDark ? "#f43f5e" : "#f472b6";
      ctx.lineWidth = w * 0.022;
      for (let i = 0; i < 6; i++) {
        const sy = y + h * (0.58 + i * 0.035);
        ctx.moveTo(x + w * 0.40, sy);
        ctx.bezierCurveTo(x + w * 0.46, sy - 8, x + w * 0.54, sy + 8, x + w * 0.60, sy);
      }
      ctx.stroke();

      ctx.restore();
    }
  };

  // 4. HUMAN RESPIRATORY SYSTEM & ALVEOLI - Class 10 Biology
  DIAGRAMS["human_respiratory"] = {
    id: "human_respiratory",
    title: "Human Respiratory System & Alveoli",
    subject: "biology",
    grade: "Class 10",
    chapter: "Life Processes",
    icon: "🫁",
    aspectRatio: 1.2,
    labels: [
      { id: 1, text: "Trachea (Windpipe)", target: { x: 0.50, y: 0.16 }, pin: { x: 0.86, y: 0.12 } },
      { id: 2, text: "Rings of Cartilage", target: { x: 0.50, y: 0.24 }, pin: { x: 0.14, y: 0.20 } },
      { id: 3, text: "Bronchus", target: { x: 0.44, y: 0.35 }, pin: { x: 0.14, y: 0.34 } },
      { id: 4, text: "Right Lung", target: { x: 0.34, y: 0.52 }, pin: { x: 0.14, y: 0.52 } },
      { id: 5, text: "Left Lung", target: { x: 0.66, y: 0.52 }, pin: { x: 0.86, y: 0.52 } },
      { id: 6, text: "Bronchioles", target: { x: 0.68, y: 0.44 }, pin: { x: 0.86, y: 0.36 } },
      { id: 7, text: "Alveoli (Air Sacs)", target: { x: 0.70, y: 0.65 }, pin: { x: 0.86, y: 0.70 } },
      { id: 8, text: "Diaphragm", target: { x: 0.50, y: 0.78 }, pin: { x: 0.50, y: 0.92 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Trachea vertical tube
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#334155" : "#e0f2fe";
      ctx.strokeStyle = stroke;
      ctx.rect(x + w * 0.47, y + h * 0.10, w * 0.06, h * 0.22);
      ctx.fill();
      ctx.stroke();

      // C-shaped cartilage rings
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2.5;
        const ry = y + h * (0.13 + i * 0.038);
        ctx.arc(x + w * 0.50, ry, w * 0.028, 0, Math.PI);
        ctx.stroke();
      }

      // Two Lungs (Lobes)
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      // Right Lung
      ctx.beginPath();
      ctx.fillStyle = isDark ? "rgba(244, 63, 94, 0.3)" : "#fecdd3";
      ctx.strokeStyle = stroke;
      ctx.moveTo(x + w * 0.45, y + h * 0.32);
      ctx.bezierCurveTo(x + w * 0.20, y + h * 0.32, x + w * 0.18, y + h * 0.72, x + w * 0.44, y + h * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left Lung (with cardiac notch)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "rgba(244, 63, 94, 0.3)" : "#fecdd3";
      ctx.moveTo(x + w * 0.55, y + h * 0.32);
      ctx.bezierCurveTo(x + w * 0.80, y + h * 0.32, x + w * 0.82, y + h * 0.72, x + w * 0.56, y + h * 0.72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bronchial Branches
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      // Right branch
      ctx.beginPath();
      ctx.moveTo(x + w * 0.50, y + h * 0.32);
      ctx.lineTo(x + w * 0.38, y + h * 0.44);
      ctx.lineTo(x + w * 0.30, y + h * 0.56);
      ctx.stroke();
      // Left branch
      ctx.beginPath();
      ctx.moveTo(x + w * 0.50, y + h * 0.32);
      ctx.lineTo(x + w * 0.62, y + h * 0.44);
      ctx.lineTo(x + w * 0.70, y + h * 0.56);
      ctx.stroke();

      // Alveoli Cluster Detail on Left Lung
      ctx.fillStyle = "#fb7185";
      for (let a = 0; a < 6; a++) {
        const ax = x + w * (0.68 + (a % 3) * 0.03);
        const ay = y + h * (0.62 + Math.floor(a / 3) * 0.04);
        ctx.beginPath();
        ctx.arc(ax, ay, w * 0.016, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Diaphragm (Curved muscle base)
      ctx.beginPath();
      ctx.strokeStyle = PALETTE.muscleBrown;
      ctx.lineWidth = 4;
      ctx.moveTo(x + w * 0.16, y + h * 0.80);
      ctx.quadraticCurveTo(x + w * 0.50, y + h * 0.74, x + w * 0.84, y + h * 0.80);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 5. HUMAN EXCRETORY SYSTEM & NEPHRON - Class 10 Biology
  DIAGRAMS["human_nephron"] = {
    id: "human_nephron",
    title: "Excretory System & Nephron",
    subject: "biology",
    grade: "Class 10",
    chapter: "Life Processes",
    icon: "🫘",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "Left Kidney", target: { x: 0.32, y: 0.30 }, pin: { x: 0.10, y: 0.25 } },
      { id: 2, text: "Renal Artery", target: { x: 0.28, y: 0.36 }, pin: { x: 0.10, y: 0.40 } },
      { id: 3, text: "Ureter", target: { x: 0.29, y: 0.52 }, pin: { x: 0.10, y: 0.56 } },
      { id: 4, text: "Urinary Bladder", target: { x: 0.26, y: 0.76 }, pin: { x: 0.10, y: 0.76 } },
      { id: 5, text: "Bowman's Capsule & Glomerulus", target: { x: 0.62, y: 0.22 }, pin: { x: 0.88, y: 0.16 } },
      { id: 6, text: "Renal Tubule", target: { x: 0.70, y: 0.42 }, pin: { x: 0.88, y: 0.40 } },
      { id: 7, text: "Henle's Loop", target: { x: 0.68, y: 0.74 }, pin: { x: 0.88, y: 0.72 } },
      { id: 8, text: "Collecting Duct", target: { x: 0.78, y: 0.50 }, pin: { x: 0.88, y: 0.90 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Left Panel: Human Excretory System
      const kx = x + w * 0.26;
      // Pair of Kidneys (Bean shape)
      ctx.fillStyle = "#991b1b";
      ctx.strokeStyle = stroke;
      // Right kidney (viewer left)
      ctx.beginPath();
      ctx.ellipse(kx - w * 0.08, y + h * 0.32, w * 0.04, h * 0.07, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Left kidney (viewer right)
      ctx.beginPath();
      ctx.ellipse(kx + w * 0.06, y + h * 0.30, w * 0.04, h * 0.07, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Aorta & Vena Cava vessels between kidneys
      ctx.fillStyle = PALETTE.oxBlood;
      ctx.fillRect(kx - w * 0.015, y + h * 0.20, w * 0.015, h * 0.32);
      ctx.fillStyle = PALETTE.deoxBlood;
      ctx.fillRect(kx, y + h * 0.20, w * 0.015, h * 0.32);

      // Ureters leading to bladder
      ctx.beginPath();
      ctx.strokeStyle = PALETTE.goldYellow;
      ctx.lineWidth = 2.5;
      ctx.moveTo(kx - w * 0.06, y + h * 0.35);
      ctx.quadraticCurveTo(kx - w * 0.04, y + h * 0.58, kx - w * 0.02, y + h * 0.72);
      ctx.moveTo(kx + w * 0.04, y + h * 0.34);
      ctx.quadraticCurveTo(kx + w * 0.02, y + h * 0.58, kx + w * 0.01, y + h * 0.72);
      ctx.stroke();

      // Urinary Bladder
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#713f12" : "#fef08a";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.ellipse(kx, y + h * 0.78, w * 0.05, h * 0.055, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Divider line between Gross Anatomy and Nephron Microscopic Detail
      ctx.beginPath();
      ctx.strokeStyle = isDark ? "#475569" : "#cbd5e1";
      ctx.setLineDash([4, 4]);
      ctx.moveTo(x + w * 0.44, y + h * 0.08);
      ctx.lineTo(x + w * 0.44, y + h * 0.92);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right Panel: Nephron Functional Unit
      const nx = x + w * 0.60;
      // Bowman's Capsule (Cup shape)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#1e293b" : "#e0f2fe";
      ctx.strokeStyle = stroke;
      ctx.arc(nx, y + h * 0.22, w * 0.04, 0.25 * Math.PI, 1.75 * Math.PI, true);
      ctx.stroke();
      // Glomerulus capillary tuft inside cup
      ctx.fillStyle = PALETTE.oxBlood;
      ctx.beginPath();
      ctx.arc(nx - w * 0.01, y + h * 0.22, w * 0.02, 0, Math.PI * 2);
      ctx.fill();

      // Convoluted Tubule & Henle's U-Loop
      ctx.beginPath();
      ctx.strokeStyle = PALETTE.goldYellow;
      ctx.lineWidth = 3;
      ctx.moveTo(nx + w * 0.04, y + h * 0.22);
      ctx.bezierCurveTo(nx + w * 0.08, y + h * 0.16, nx + w * 0.10, y + h * 0.32, nx + w * 0.07, y + h * 0.38);
      // Henle's U-turn descending and ascending
      ctx.lineTo(nx + w * 0.07, y + h * 0.76);
      ctx.arc(nx + w * 0.085, y + h * 0.76, w * 0.015, Math.PI, 0, true);
      ctx.lineTo(nx + w * 0.10, y + h * 0.38);
      ctx.bezierCurveTo(nx + w * 0.12, y + h * 0.30, nx + w * 0.16, y + h * 0.32, nx + w * 0.18, y + h * 0.38);
      ctx.stroke();

      // Collecting Duct vertical pipe
      ctx.beginPath();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 4;
      ctx.moveTo(nx + w * 0.18, y + h * 0.18);
      ctx.lineTo(nx + w * 0.18, y + h * 0.84);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 6. HUMAN BRAIN & REFLEX ARC - Class 10 Biology
  DIAGRAMS["human_brain"] = {
    id: "human_brain",
    title: "Human Brain & Reflex Arc",
    subject: "biology",
    grade: "Class 10",
    chapter: "Control and Coordination",
    icon: "🧠",
    aspectRatio: 1.2,
    labels: [
      { id: 1, text: "Cerebrum (Forebrain)", target: { x: 0.44, y: 0.20 }, pin: { x: 0.12, y: 0.12 } },
      { id: 2, text: "Corpus Callosum", target: { x: 0.48, y: 0.38 }, pin: { x: 0.12, y: 0.36 } },
      { id: 3, text: "Hypothalamus", target: { x: 0.46, y: 0.50 }, pin: { x: 0.12, y: 0.52 } },
      { id: 4, text: "Cerebellum (Hindbrain)", target: { x: 0.68, y: 0.62 }, pin: { x: 0.88, y: 0.62 } },
      { id: 5, text: "Pons", target: { x: 0.52, y: 0.62 }, pin: { x: 0.88, y: 0.46 } },
      { id: 6, text: "Medulla", target: { x: 0.52, y: 0.74 }, pin: { x: 0.88, y: 0.76 } },
      { id: 7, text: "Spinal Cord", target: { x: 0.52, y: 0.88 }, pin: { x: 0.52, y: 0.96 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Cerebrum (Convoluted Forebrain)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#831843" : "#fbcfe8";
      ctx.strokeStyle = stroke;
      ctx.moveTo(x + w * 0.30, y + h * 0.60);
      ctx.bezierCurveTo(x + w * 0.16, y + h * 0.40, x + w * 0.24, y + h * 0.14, x + w * 0.52, y + h * 0.14);
      ctx.bezierCurveTo(x + w * 0.82, y + h * 0.14, x + w * 0.82, y + h * 0.45, x + w * 0.74, y + h * 0.55);
      ctx.bezierCurveTo(x + w * 0.60, y + h * 0.55, x + w * 0.45, y + h * 0.60, x + w * 0.30, y + h * 0.60);
      ctx.fill();
      ctx.stroke();

      // Cerebrum Gyri & Sulci folds
      ctx.strokeStyle = isDark ? "#db2777" : "#f472b6";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const fy = y + h * (0.24 + i * 0.07);
        ctx.moveTo(x + w * 0.32, fy);
        ctx.quadraticCurveTo(x + w * 0.48, fy + 8, x + w * 0.68, fy - 6);
        ctx.stroke();
      }

      // Corpus Callosum (C-shaped band)
      ctx.beginPath();
      ctx.strokeStyle = stroke;
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.lineWidth = 2;
      ctx.arc(x + w * 0.50, y + h * 0.44, w * 0.08, 1.1 * Math.PI, 1.9 * Math.PI);
      ctx.stroke();

      // Cerebellum (Hindbrain cauliflower tree shape)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#854d0e" : "#fde68a";
      ctx.arc(x + w * 0.66, y + h * 0.64, w * 0.09, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Internal arbor vitae leaf patterns
      ctx.beginPath();
      ctx.strokeStyle = "#b45309";
      ctx.moveTo(x + w * 0.66, y + h * 0.68);
      ctx.lineTo(x + w * 0.62, y + h * 0.62);
      ctx.moveTo(x + w * 0.66, y + h * 0.68);
      ctx.lineTo(x + w * 0.70, y + h * 0.62);
      ctx.stroke();

      // Brainstem: Pons & Medulla leading down into Spinal Cord
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#334155" : "#e2e8f0";
      ctx.strokeStyle = stroke;
      // Pons bulge
      ctx.arc(x + w * 0.50, y + h * 0.60, w * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Medulla & Spinal Cord column
      ctx.fillRect(x + w * 0.48, y + h * 0.64, w * 0.05, h * 0.24);
      ctx.strokeRect(x + w * 0.48, y + h * 0.64, w * 0.05, h * 0.24);

      ctx.restore();
    }
  };

  // 7. PARTS OF A FLOWER (L.S.) - Class 10 Biology
  DIAGRAMS["flower_parts"] = {
    id: "flower_parts",
    title: "Parts of a Flower (L.S.)",
    subject: "biology",
    grade: "Class 10",
    chapter: "How Do Organisms Reproduce",
    icon: "🌺",
    aspectRatio: 1.2,
    labels: [
      { id: 1, text: "Petal (Corolla)", target: { x: 0.28, y: 0.22 }, pin: { x: 0.10, y: 0.16 } },
      { id: 2, text: "Sepal (Calyx)", target: { x: 0.32, y: 0.72 }, pin: { x: 0.10, y: 0.74 } },
      { id: 3, text: "Anther (Stamen)", target: { x: 0.36, y: 0.24 }, pin: { x: 0.10, y: 0.34 } },
      { id: 4, text: "Filament (Stamen)", target: { x: 0.38, y: 0.44 }, pin: { x: 0.10, y: 0.48 } },
      { id: 5, text: "Stigma (Carpel)", target: { x: 0.50, y: 0.14 }, pin: { x: 0.50, y: 0.06 } },
      { id: 6, text: "Style (Carpel)", target: { x: 0.50, y: 0.38 }, pin: { x: 0.88, y: 0.38 } },
      { id: 7, text: "Ovary (Carpel)", target: { x: 0.50, y: 0.62 }, pin: { x: 0.88, y: 0.62 } },
      { id: 8, text: "Ovule", target: { x: 0.50, y: 0.64 }, pin: { x: 0.88, y: 0.76 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      const fx = x + w * 0.50;
      const fy = y + h * 0.64;

      // Stem (Pedicel) & Receptacle
      ctx.beginPath();
      ctx.fillStyle = PALETTE.leafGreen;
      ctx.strokeStyle = stroke;
      ctx.rect(fx - w * 0.02, y + h * 0.76, w * 0.04, h * 0.16);
      ctx.fill();
      ctx.stroke();

      // Swollen Receptacle
      ctx.beginPath();
      ctx.ellipse(fx, y + h * 0.74, w * 0.08, h * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Green Sepals
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.06, y + h * 0.74);
      ctx.quadraticCurveTo(fx - w * 0.18, y + h * 0.68, fx - w * 0.20, y + h * 0.76);
      ctx.quadraticCurveTo(fx - w * 0.12, y + h * 0.78, fx - w * 0.04, y + h * 0.76);
      ctx.moveTo(fx + w * 0.06, y + h * 0.74);
      ctx.quadraticCurveTo(fx + w * 0.18, y + h * 0.68, fx + w * 0.20, y + h * 0.76);
      ctx.quadraticCurveTo(fx + w * 0.12, y + h * 0.78, fx + w * 0.04, y + h * 0.76);
      ctx.fill();
      ctx.stroke();

      // Pink Petals
      ctx.fillStyle = isDark ? "#9d174d" : "#f472b6";
      // Left Petal
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.06, y + h * 0.70);
      ctx.bezierCurveTo(fx - w * 0.35, y + h * 0.60, fx - w * 0.35, y + h * 0.15, fx - w * 0.15, y + h * 0.18);
      ctx.bezierCurveTo(fx - w * 0.06, y + h * 0.25, fx - w * 0.04, y + h * 0.50, fx - w * 0.04, y + h * 0.70);
      ctx.fill();
      ctx.stroke();
      // Right Petal
      ctx.beginPath();
      ctx.moveTo(fx + w * 0.06, y + h * 0.70);
      ctx.bezierCurveTo(fx + w * 0.35, y + h * 0.60, fx + w * 0.35, y + h * 0.15, fx + w * 0.15, y + h * 0.18);
      ctx.bezierCurveTo(fx + w * 0.06, y + h * 0.25, fx + w * 0.04, y + h * 0.50, fx + w * 0.04, y + h * 0.70);
      ctx.fill();
      ctx.stroke();

      // Stamens (Filaments + Bilobed Anther)
      ctx.strokeStyle = PALETTE.goldYellow;
      ctx.lineWidth = 2.5;
      // Left Stamen
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.04, y + h * 0.68);
      ctx.quadraticCurveTo(fx - w * 0.14, y + h * 0.44, fx - w * 0.14, y + h * 0.24);
      ctx.stroke();
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.ellipse(fx - w * 0.14, y + h * 0.24, w * 0.025, h * 0.015, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Right Stamen
      ctx.beginPath();
      ctx.moveTo(fx + w * 0.04, y + h * 0.68);
      ctx.quadraticCurveTo(fx + w * 0.14, y + h * 0.44, fx + w * 0.14, y + h * 0.24);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(fx + w * 0.14, y + h * 0.24, w * 0.025, h * 0.015, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pistil / Carpel: Ovary, Style, Stigma (Center)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#065f46" : "#bbf7d0";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      // Basal Ovary
      ctx.ellipse(fx, fy, w * 0.07, h * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Ovule inside ovary
      ctx.beginPath();
      ctx.fillStyle = "#fef08a";
      ctx.arc(fx, fy, w * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Style neck
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#065f46" : "#bbf7d0";
      ctx.rect(fx - w * 0.015, y + h * 0.16, w * 0.03, h * 0.39);
      ctx.fill();
      ctx.stroke();

      // Sticky Stigma head
      ctx.beginPath();
      ctx.fillStyle = "#22c55e";
      ctx.ellipse(fx, y + h * 0.14, w * 0.035, h * 0.018, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    }
  };

  // 8. LEAF ANATOMY & STOMATA - Class 10 Biology
  DIAGRAMS["stomata_leaf"] = {
    id: "stomata_leaf",
    title: "Leaf Anatomy & Stomata (Open)",
    subject: "biology",
    grade: "Class 10",
    chapter: "Life Processes",
    icon: "🍃",
    aspectRatio: 1.2,
    labels: [
      { id: 1, text: "Upper Cuticle & Epidermis", target: { x: 0.50, y: 0.12 }, pin: { x: 0.10, y: 0.10 } },
      { id: 2, text: "Palisade Cells (Chloroplasts)", target: { x: 0.35, y: 0.25 }, pin: { x: 0.10, y: 0.26 } },
      { id: 3, text: "Spongy Mesophyll (Air Spaces)", target: { x: 0.35, y: 0.44 }, pin: { x: 0.10, y: 0.44 } },
      { id: 4, text: "Lower Epidermis", target: { x: 0.35, y: 0.58 }, pin: { x: 0.10, y: 0.60 } },
      { id: 5, text: "Kidney Guard Cells", target: { x: 0.70, y: 0.72 }, pin: { x: 0.88, y: 0.65 } },
      { id: 6, text: "Stomatal Pore (Open)", target: { x: 0.70, y: 0.78 }, pin: { x: 0.88, y: 0.80 } },
      { id: 7, text: "Chloroplast Granules", target: { x: 0.64, y: 0.74 }, pin: { x: 0.88, y: 0.92 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Top Half: Leaf Cross-Section
      const ly = y + h * 0.08;
      // Upper Epidermis bar
      ctx.fillStyle = isDark ? "#064e3b" : "#dcfce7";
      ctx.strokeStyle = stroke;
      ctx.fillRect(x + w * 0.08, ly, w * 0.42, h * 0.06);
      ctx.strokeRect(x + w * 0.08, ly, w * 0.42, h * 0.06);

      // Palisade columnar cells with green dots
      ctx.fillStyle = isDark ? "#047857" : "#86efac";
      for (let c = 0; c < 7; c++) {
        const cx = x + w * (0.08 + c * 0.06);
        ctx.fillRect(cx, ly + h * 0.06, w * 0.055, h * 0.16);
        ctx.strokeRect(cx, ly + h * 0.06, w * 0.055, h * 0.16);
      }

      // Spongy cells with air spaces
      ctx.fillStyle = isDark ? "#065f46" : "#bbf7d0";
      for (let sc = 0; sc < 6; sc++) {
        ctx.beginPath();
        ctx.arc(x + w * (0.12 + (sc % 3) * 0.12), ly + h * (0.28 + Math.floor(sc / 3) * 0.09), w * 0.035, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Lower Epidermis
      ctx.fillStyle = isDark ? "#064e3b" : "#dcfce7";
      ctx.fillRect(x + w * 0.08, ly + h * 0.44, w * 0.42, h * 0.05);
      ctx.strokeRect(x + w * 0.08, ly + h * 0.44, w * 0.42, h * 0.05);

      // Right Half: Stoma Inset Detail (Zoomed Guard Cells)
      const gx = x + w * 0.70;
      const gy = y + h * 0.74;
      const gr = Math.min(w, h) * 0.14;

      // Left Guard Cell (Crescent Bean)
      ctx.fillStyle = isDark ? "#15803d" : "#4ade80";
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.arc(gx - gr * 0.35, gy, gr * 0.7, 0.45 * Math.PI, 1.55 * Math.PI, false);
      ctx.bezierCurveTo(gx - gr * 0.1, gy - gr * 0.4, gx - gr * 0.1, gy + gr * 0.4, gx - gr * 0.35 + gr * 0.7 * Math.cos(0.45 * Math.PI), gy + gr * 0.7 * Math.sin(0.45 * Math.PI));
      ctx.fill();
      ctx.stroke();

      // Right Guard Cell (Crescent Bean)
      ctx.beginPath();
      ctx.arc(gx + gr * 0.35, gy, gr * 0.7, -0.55 * Math.PI, 0.55 * Math.PI, false);
      ctx.bezierCurveTo(gx + gr * 0.1, gy + gr * 0.4, gx + gr * 0.1, gy - gr * 0.4, gx + gr * 0.35 + gr * 0.7 * Math.cos(-0.55 * Math.PI), gy + gr * 0.7 * Math.sin(-0.55 * Math.PI));
      ctx.fill();
      ctx.stroke();

      // Open Pore Aperture (Black central gap)
      ctx.fillStyle = isDark ? "#020617" : "#0f172a";
      ctx.beginPath();
      ctx.ellipse(gx, gy, gr * 0.15, gr * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chloroplast green dots on guard cells
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(gx - gr * 0.4, gy - gr * 0.25, 3.5, 0, Math.PI * 2);
      ctx.arc(gx - gr * 0.4, gy + gr * 0.25, 3.5, 0, Math.PI * 2);
      ctx.arc(gx + gr * 0.4, gy - gr * 0.25, 3.5, 0, Math.PI * 2);
      ctx.arc(gx + gr * 0.4, gy + gr * 0.25, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };

  // 9. NEURON (NERVE CELL) - Class 9 & 10 Biology
  DIAGRAMS["neuron_cell"] = {
    id: "neuron_cell",
    title: "Neuron (Nerve Cell)",
    subject: "biology",
    grade: "Class 9 & 10",
    chapter: "Control and Coordination / Tissues",
    icon: "⚡",
    aspectRatio: 1.35,
    labels: [
      { id: 1, text: "Dendrite", target: { x: 0.18, y: 0.22 }, pin: { x: 0.08, y: 0.14 } },
      { id: 2, text: "Cyton (Cell Body)", target: { x: 0.25, y: 0.50 }, pin: { x: 0.08, y: 0.72 } },
      { id: 3, text: "Nucleus", target: { x: 0.25, y: 0.50 }, pin: { x: 0.25, y: 0.22 } },
      { id: 4, text: "Axon", target: { x: 0.52, y: 0.50 }, pin: { x: 0.52, y: 0.24 } },
      { id: 5, text: "Myelin Sheath", target: { x: 0.58, y: 0.46 }, pin: { x: 0.58, y: 0.76 } },
      { id: 6, text: "Node of Ranvier", target: { x: 0.65, y: 0.50 }, pin: { x: 0.72, y: 0.24 } },
      { id: 7, text: "Nerve Endings", target: { x: 0.88, y: 0.50 }, pin: { x: 0.90, y: 0.74 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      const cyx = x + w * 0.25;
      const cyy = y + h * 0.50;

      // Cyton (Star-shaped Cell Body)
      ctx.beginPath();
      ctx.fillStyle = isDark ? "#854d0e" : "#fef08a";
      ctx.strokeStyle = stroke;
      ctx.moveTo(cyx - 20, cyy);
      ctx.lineTo(cyx - 45, cyy - 30); // dendrite branch
      ctx.lineTo(cyx - 15, cyy - 20);
      ctx.lineTo(cyx - 25, cyy - 55); // dendrite branch
      ctx.lineTo(cyx, cyy - 20);
      ctx.lineTo(cyx + 15, cyy - 45); // dendrite branch
      ctx.lineTo(cyx + 20, cyy - 15);
      ctx.lineTo(cyx + 40, cyy); // axon connection
      ctx.lineTo(cyx + 20, cyy + 15);
      ctx.lineTo(cyx + 25, cyy + 45); // dendrite branch
      ctx.lineTo(cyx, cyy + 20);
      ctx.lineTo(cyx - 25, cyy + 50); // dendrite branch
      ctx.lineTo(cyx - 15, cyy + 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Nucleus
      ctx.beginPath();
      ctx.fillStyle = "#dc2626";
      ctx.arc(cyx, cyy, w * 0.022, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Axon Long Wire
      ctx.beginPath();
      ctx.strokeStyle = PALETTE.nerveYellow;
      ctx.lineWidth = 5;
      ctx.moveTo(cyx + 35, cyy);
      ctx.lineTo(x + w * 0.82, cyy);
      ctx.stroke();

      // Myelin Sheath Sausages (Schwann cells)
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const sx = cyx + 55 + i * (w * 0.11);
        ctx.beginPath();
        ctx.fillStyle = isDark ? "#0369a1" : "#bae6fd";
        ctx.strokeStyle = stroke;
        ctx.roundRect(sx, cyy - h * 0.05, w * 0.085, h * 0.10, [6]);
        ctx.fill();
        ctx.stroke();
        // Schwann nucleus dot
        ctx.fillStyle = "#0284c7";
        ctx.beginPath();
        ctx.arc(sx + w * 0.042, cyy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nerve Endings (Terminal arborization branches)
      const ex = x + w * 0.82;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      const branches = [-28, -12, 12, 28];
      branches.forEach((by) => {
        ctx.beginPath();
        ctx.moveTo(ex, cyy);
        ctx.lineTo(ex + w * 0.08, cyy + by);
        ctx.stroke();
        // Synaptic knob dot
        ctx.fillStyle = PALETTE.oxBlood;
        ctx.beginPath();
        ctx.arc(ex + w * 0.08, cyy + by, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }
  };

  // 10. ELECTROLYSIS OF WATER - Class 10 Chemistry
  DIAGRAMS["electrolysis_water"] = {
    id: "electrolysis_water",
    title: "Electrolysis of Water Setup",
    subject: "chemistry",
    grade: "Class 10",
    chapter: "Chemical Reactions & Equations",
    icon: "🔋",
    aspectRatio: 1.15,
    labels: [
      { id: 1, text: "Oxygen Gas (Anode)", target: { x: 0.38, y: 0.22 }, pin: { x: 0.12, y: 0.18 } },
      { id: 2, text: "Hydrogen Gas (Cathode - 2x)", target: { x: 0.62, y: 0.18 }, pin: { x: 0.88, y: 0.18 } },
      { id: 3, text: "Inverted Test Tubes", target: { x: 0.38, y: 0.34 }, pin: { x: 0.12, y: 0.34 } },
      { id: 4, text: "Graphite Electrodes", target: { x: 0.38, y: 0.52 }, pin: { x: 0.12, y: 0.52 } },
      { id: 5, text: "Anode (+ Terminal)", target: { x: 0.38, y: 0.70 }, pin: { x: 0.12, y: 0.70 } },
      { id: 6, text: "Cathode (- Terminal)", target: { x: 0.62, y: 0.70 }, pin: { x: 0.88, y: 0.70 } },
      { id: 7, text: "6V Battery & Switch", target: { x: 0.50, y: 0.88 }, pin: { x: 0.50, y: 0.96 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Plastic Mug / Beaker
      ctx.fillStyle = PALETTE.glassCyan;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.rect(x + w * 0.24, y + h * 0.28, w * 0.52, h * 0.45);
      ctx.fill();
      ctx.stroke();

      // Water Liquid fill inside mug
      ctx.fillStyle = PALETTE.liquidWater;
      ctx.fillRect(x + w * 0.24, y + h * 0.38, w * 0.52, h * 0.35);

      // Rubber Stoppers at bottom
      ctx.fillStyle = "#475569";
      ctx.fillRect(x + w * 0.35, y + h * 0.71, w * 0.06, h * 0.035);
      ctx.fillRect(x + w * 0.59, y + h * 0.71, w * 0.06, h * 0.035);

      // Graphite Electrodes
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(x + w * 0.365, y + h * 0.44, w * 0.03, h * 0.28);
      ctx.fillRect(x + w * 0.605, y + h * 0.44, w * 0.03, h * 0.28);

      // Inverted Test Tubes
      ctx.fillStyle = PALETTE.glassCyan;
      ctx.strokeRect(x + w * 0.34, y + h * 0.16, w * 0.08, h * 0.45);
      ctx.fillRect(x + w * 0.34, y + h * 0.16, w * 0.08, h * 0.45);
      ctx.strokeRect(x + w * 0.58, y + h * 0.16, w * 0.08, h * 0.45);
      ctx.fillRect(x + w * 0.58, y + h * 0.16, w * 0.08, h * 0.45);

      // Gas collected at top (White air space): Hydrogen has double the volume of Oxygen
      ctx.fillStyle = isDark ? "#0f172a" : "#ffffff";
      // Oxygen (less space)
      ctx.fillRect(x + w * 0.34, y + h * 0.16, w * 0.08, h * 0.10);
      // Hydrogen (more space - double volume)
      ctx.fillRect(x + w * 0.58, y + h * 0.16, w * 0.08, h * 0.20);

      // Tiny bubbles rising up
      ctx.fillStyle = "#38bdf8";
      for (let b = 0; b < 6; b++) {
        ctx.beginPath();
        ctx.arc(x + w * 0.38, y + h * (0.32 + b * 0.04), 2.5, 0, Math.PI * 2);
        ctx.arc(x + w * 0.62, y + h * (0.38 + b * 0.03), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connecting Wires to 6V Battery
      ctx.strokeStyle = PALETTE.wireCopper;
      ctx.lineWidth = 2.5;
      // Anode (+) Wire to Battery
      ctx.beginPath();
      ctx.moveTo(x + w * 0.38, y + h * 0.74);
      ctx.lineTo(x + w * 0.38, y + h * 0.88);
      ctx.lineTo(x + w * 0.46, y + h * 0.88);
      ctx.stroke();
      // Cathode (-) Wire to Battery
      ctx.beginPath();
      ctx.moveTo(x + w * 0.62, y + h * 0.74);
      ctx.lineTo(x + w * 0.62, y + h * 0.88);
      ctx.lineTo(x + w * 0.54, y + h * 0.88);
      ctx.stroke();

      // Battery Symbol
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.46, y + h * 0.85);
      ctx.lineTo(x + w * 0.46, y + h * 0.91);
      ctx.moveTo(x + w * 0.50, y + h * 0.82); // Long line (+)
      ctx.lineTo(x + w * 0.50, y + h * 0.94);
      ctx.moveTo(x + w * 0.54, y + h * 0.86); // Short line (-)
      ctx.lineTo(x + w * 0.54, y + h * 0.90);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 11. ZINC + ACID REACTION & POP TEST - Class 10 Chemistry
  DIAGRAMS["zinc_acid_reaction"] = {
    id: "zinc_acid_reaction",
    title: "Zinc with Dilute Acid & Pop Test",
    subject: "chemistry",
    grade: "Class 10",
    chapter: "Acids, Bases & Salts",
    icon: "🧪",
    aspectRatio: 1.3,
    labels: [
      { id: 1, text: "Delivery Tube", target: { x: 0.38, y: 0.22 }, pin: { x: 0.38, y: 0.10 } },
      { id: 2, text: "Dilute Sulphuric Acid", target: { x: 0.20, y: 0.60 }, pin: { x: 0.08, y: 0.52 } },
      { id: 3, text: "Zinc Granules", target: { x: 0.20, y: 0.75 }, pin: { x: 0.08, y: 0.78 } },
      { id: 4, text: "Soap Solution Trough", target: { x: 0.62, y: 0.72 }, pin: { x: 0.62, y: 0.90 } },
      { id: 5, text: "Hydrogen Bubbles", target: { x: 0.62, y: 0.44 }, pin: { x: 0.88, y: 0.44 } },
      { id: 6, text: "Candle & 'POP' Sound", target: { x: 0.76, y: 0.30 }, pin: { x: 0.88, y: 0.20 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Conical Flask on left
      const fx = x + w * 0.20;
      const fy = y + h * 0.75;
      ctx.fillStyle = PALETTE.glassCyan;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.03, y + h * 0.42);
      ctx.lineTo(fx - w * 0.03, y + h * 0.48);
      ctx.lineTo(fx - w * 0.12, fy);
      ctx.lineTo(fx + w * 0.12, fy);
      ctx.lineTo(fx + w * 0.03, y + h * 0.48);
      ctx.lineTo(fx + w * 0.03, y + h * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Liquid in flask (Dilute acid)
      ctx.fillStyle = PALETTE.liquidWater;
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.08, y + h * 0.62);
      ctx.lineTo(fx - w * 0.12, fy);
      ctx.lineTo(fx + w * 0.12, fy);
      ctx.lineTo(fx + w * 0.08, y + h * 0.62);
      ctx.closePath();
      ctx.fill();

      // Zinc Granules (grey nuggets at base)
      ctx.fillStyle = "#64748b";
      for (let z = 0; z < 6; z++) {
        ctx.beginPath();
        ctx.arc(fx - w * 0.06 + z * (w * 0.024), fy - 6, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cork at neck
      ctx.fillStyle = "#b45309";
      ctx.fillRect(fx - w * 0.035, y + h * 0.40, w * 0.07, h * 0.03);

      // Delivery Tube (glass bent path to soap trough)
      ctx.strokeStyle = PALETTE.glassBorder;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(fx, y + h * 0.45);
      ctx.lineTo(fx, y + h * 0.22);
      ctx.lineTo(x + w * 0.60, y + h * 0.22);
      ctx.lineTo(x + w * 0.60, y + h * 0.70);
      ctx.stroke();

      // Soap Solution Trough on right
      const tx = x + w * 0.62;
      ctx.fillStyle = PALETTE.glassCyan;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(tx - w * 0.10, y + h * 0.62, w * 0.20, h * 0.14);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(147, 197, 253, 0.45)";
      ctx.fillRect(tx - w * 0.10, y + h * 0.66, w * 0.20, h * 0.10);

      // Rising Hydrogen Bubbles
      ctx.fillStyle = "rgba(56, 189, 248, 0.7)";
      for (let b = 0; b < 4; b++) {
        ctx.beginPath();
        ctx.arc(tx + (b % 2 === 0 ? -12 : 12), y + h * (0.55 - b * 0.08), 8 + b * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Burning Candle near top bubble
      const cx = x + w * 0.78;
      const cy = y + h * 0.35;
      ctx.fillStyle = isDark ? "#f8fafc" : "#fed7aa";
      ctx.fillRect(cx, cy, 14, 35);
      // Flame
      ctx.fillStyle = "#ea580c";
      ctx.beginPath();
      ctx.ellipse(cx + 7, cy - 8, 5, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.ellipse(cx + 7, cy - 6, 3, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // "POP!" sound explosion starburst
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx - 24, cy - 8, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 12. STANDARD LABORATORY GLASSWARE - Grades 6 to 10 Chemistry
  DIAGRAMS["lab_glassware_set"] = {
    id: "lab_glassware_set",
    title: "Standard Laboratory Apparatus Set",
    subject: "chemistry",
    grade: "Classes 6–10",
    chapter: "Laboratory Practical Skills",
    icon: "🔬",
    aspectRatio: 1.3,
    labels: [
      { id: 1, text: "Graduated Beaker (250ml)", target: { x: 0.18, y: 0.45 }, pin: { x: 0.18, y: 0.15 } },
      { id: 2, text: "Conical Flask (Erlenmeyer)", target: { x: 0.38, y: 0.50 }, pin: { x: 0.38, y: 0.15 } },
      { id: 3, text: "Test Tube with Stand", target: { x: 0.56, y: 0.45 }, pin: { x: 0.56, y: 0.15 } },
      { id: 4, text: "Bunsen Burner & Wire Gauze", target: { x: 0.78, y: 0.48 }, pin: { x: 0.78, y: 0.15 } },
      { id: 5, text: "Tripod Stand", target: { x: 0.78, y: 0.72 }, pin: { x: 0.78, y: 0.88 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      const baseLine = y + h * 0.80;
      // Lab Bench surface line
      ctx.strokeStyle = isDark ? "#475569" : "#94a3b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.05, baseLine);
      ctx.lineTo(x + w * 0.95, baseLine);
      ctx.stroke();

      // 1. Beaker on left
      const bx = x + w * 0.18;
      ctx.fillStyle = PALETTE.glassCyan;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(bx - w * 0.07, baseLine - h * 0.36, w * 0.14, h * 0.36);
      ctx.fill();
      ctx.stroke();
      // Liquid
      ctx.fillStyle = "rgba(59, 130, 246, 0.4)";
      ctx.fillRect(bx - w * 0.07, baseLine - h * 0.22, w * 0.14, h * 0.22);
      // Graduations
      ctx.strokeStyle = isDark ? "#93c5fd" : "#1d4ed8";
      for (let g = 1; g <= 4; g++) {
        ctx.beginPath();
        ctx.moveTo(bx - w * 0.07, baseLine - g * (h * 0.065));
        ctx.lineTo(bx - w * 0.04, baseLine - g * (h * 0.065));
        ctx.stroke();
      }

      // 2. Conical Flask
      const fx = x + w * 0.38;
      ctx.fillStyle = PALETTE.glassCyan;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.025, baseLine - h * 0.42);
      ctx.lineTo(fx - w * 0.025, baseLine - h * 0.32);
      ctx.lineTo(fx - w * 0.08, baseLine);
      ctx.lineTo(fx + w * 0.08, baseLine);
      ctx.lineTo(fx + w * 0.025, baseLine - h * 0.32);
      ctx.lineTo(fx + w * 0.025, baseLine - h * 0.42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Liquid in flask
      ctx.fillStyle = "rgba(16, 185, 129, 0.45)";
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.05, baseLine - h * 0.18);
      ctx.lineTo(fx - w * 0.08, baseLine);
      ctx.lineTo(fx + w * 0.08, baseLine);
      ctx.lineTo(fx + w * 0.05, baseLine - h * 0.18);
      ctx.closePath();
      ctx.fill();

      // 3. Test Tube with Wooden Rack
      const tx = x + w * 0.56;
      // Wooden rack frame
      ctx.fillStyle = "#b45309";
      ctx.fillRect(tx - w * 0.05, baseLine - h * 0.28, w * 0.10, 8);
      ctx.fillRect(tx - w * 0.05, baseLine - 8, w * 0.10, 8);
      ctx.fillRect(tx - w * 0.05, baseLine - h * 0.28, 8, h * 0.28);
      ctx.fillRect(tx + w * 0.05 - 8, baseLine - h * 0.28, 8, h * 0.28);
      // Test Tube inserted
      ctx.fillStyle = PALETTE.glassCyan;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.roundRect(tx - w * 0.015, baseLine - h * 0.40, w * 0.03, h * 0.38, [0, 0, 10, 10]);
      ctx.fill();
      ctx.stroke();
      // Test tube liquid
      ctx.fillStyle = "rgba(239, 68, 68, 0.45)";
      ctx.beginPath();
      ctx.roundRect(tx - w * 0.015, baseLine - h * 0.16, w * 0.03, h * 0.14, [0, 0, 10, 10]);
      ctx.fill();

      // 4 & 5. Tripod Stand, Wire Gauze & Bunsen Burner
      const bx2 = x + w * 0.78;
      // Tripod legs
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(bx2 - w * 0.06, baseLine - h * 0.28);
      ctx.lineTo(bx2 - w * 0.09, baseLine);
      ctx.moveTo(bx2 + w * 0.06, baseLine - h * 0.28);
      ctx.lineTo(bx2 + w * 0.09, baseLine);
      ctx.moveTo(bx2, baseLine - h * 0.28);
      ctx.lineTo(bx2, baseLine);
      ctx.stroke();
      // Top triangular plate
      ctx.fillStyle = "#334155";
      ctx.fillRect(bx2 - w * 0.07, baseLine - h * 0.28, w * 0.14, 6);

      // Wire Gauze mesh with ceramic center
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(bx2 - w * 0.06, baseLine - h * 0.30, w * 0.12, 4);

      // Bunsen Burner below gauze
      ctx.fillStyle = "#64748b";
      ctx.fillRect(bx2 - w * 0.015, baseLine - h * 0.18, w * 0.03, h * 0.16);
      ctx.fillRect(bx2 - w * 0.03, baseLine - 4, w * 0.06, 4);
      // Flame
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.ellipse(bx2, baseLine - h * 0.22, 6, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.ellipse(bx2, baseLine - h * 0.21, 3, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  };

  // 13. SIMPLE ELECTRIC CIRCUIT - Grade 6 Physics
  DIAGRAMS["simple_electric_circuit"] = {
    id: "simple_electric_circuit",
    title: "Simple Electric Circuit",
    subject: "physics",
    grade: "Class 6",
    chapter: "Electricity and Circuits",
    icon: "💡",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "Electric Cell (+ / -)", target: { x: 0.50, y: 0.78 }, pin: { x: 0.50, y: 0.94 } },
      { id: 2, text: "Switch / Plug Key (Closed)", target: { x: 0.22, y: 0.50 }, pin: { x: 0.08, y: 0.50 } },
      { id: 3, text: "Glowing Torch Bulb", target: { x: 0.50, y: 0.22 }, pin: { x: 0.50, y: 0.08 } },
      { id: 4, text: "Connecting Copper Wire", target: { x: 0.78, y: 0.50 }, pin: { x: 0.88, y: 0.50 } },
      { id: 5, text: "Direction of Current (I)", target: { x: 0.65, y: 0.78 }, pin: { x: 0.88, y: 0.82 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      const x1 = x + w * 0.22;
      const x2 = x + w * 0.78;
      const y1 = y + h * 0.22;
      const y2 = y + h * 0.78;

      // Closed Wire Loop (Copper)
      ctx.strokeStyle = PALETTE.wireCopper;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      // Top line
      ctx.moveTo(x1, y1);
      ctx.lineTo(x + w * 0.44, y1);
      ctx.moveTo(x + w * 0.56, y1);
      ctx.lineTo(x2, y1);
      // Right line
      ctx.lineTo(x2, y2);
      // Bottom line
      ctx.lineTo(x + w * 0.56, y2);
      ctx.moveTo(x + w * 0.44, y2);
      ctx.lineTo(x1, y2);
      // Left line
      ctx.lineTo(x1, y + h * 0.56);
      ctx.moveTo(x1, y + h * 0.44);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Top: Torch Bulb & Filament
      const bx = x + w * 0.50;
      // Glass bulb dome
      ctx.fillStyle = "rgba(254, 240, 138, 0.4)";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx, y1 - 10, w * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Filament glowing
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx - 8, y1 - 4);
      ctx.lineTo(bx, y1 - 18);
      ctx.lineTo(bx + 8, y1 - 4);
      ctx.stroke();
      // Glow Rays
      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 6; r++) {
        const ang = -Math.PI * 0.8 + r * 0.32;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(ang) * (w * 0.06), y1 - 10 + Math.sin(ang) * (w * 0.06));
        ctx.lineTo(bx + Math.cos(ang) * (w * 0.09), y1 - 10 + Math.sin(ang) * (w * 0.09));
        ctx.stroke();
      }

      // Bottom: Battery Cell (AA/D type pictorial)
      const cx = x + w * 0.50;
      ctx.fillStyle = "#334155";
      ctx.fillRect(cx - w * 0.05, y2 - h * 0.035, w * 0.10, h * 0.07);
      ctx.strokeRect(cx - w * 0.05, y2 - h * 0.035, w * 0.10, h * 0.07);
      // Metal cap (+)
      ctx.fillStyle = PALETTE.goldYellow;
      ctx.fillRect(cx - w * 0.06, y2 - h * 0.015, w * 0.012, h * 0.03);
      // (+) and (-) markings
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("+", cx - w * 0.035, y2 + 4);
      ctx.fillText("−", cx + w * 0.02, y2 + 4);

      // Left: Closed Switch / Plug Key
      const sy = y + h * 0.50;
      ctx.fillStyle = PALETTE.goldYellow;
      ctx.beginPath();
      ctx.arc(x1, sy - 14, 5, 0, Math.PI * 2);
      ctx.arc(x1, sy + 14, 5, 0, Math.PI * 2);
      ctx.fill();
      // Contact arm closed
      ctx.strokeStyle = "#b45309";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x1, sy - 14);
      ctx.lineTo(x1, sy + 14);
      ctx.stroke();

      // Current Arrows
      ctx.fillStyle = "#ef4444";
      // Arrow going right on top
      ctx.beginPath();
      ctx.moveTo(x + w * 0.65, y1 - 5);
      ctx.lineTo(x + w * 0.68, y1);
      ctx.lineTo(x + w * 0.65, y1 + 5);
      ctx.fill();

      ctx.restore();
    }
  };

  // 14. ELECTRIC BELL & ELECTROMAGNET - Grade 7 Physics
  DIAGRAMS["electric_bell"] = {
    id: "electric_bell",
    title: "Electric Bell & Electromagnet",
    subject: "physics",
    grade: "Class 7",
    chapter: "Electric Current and its Effects",
    icon: "🔔",
    aspectRatio: 1.2,
    labels: [
      { id: 1, text: "U-shaped Electromagnet", target: { x: 0.35, y: 0.40 }, pin: { x: 0.10, y: 0.20 } },
      { id: 2, text: "Soft Iron Armature", target: { x: 0.50, y: 0.44 }, pin: { x: 0.10, y: 0.50 } },
      { id: 3, text: "Contact Adjusting Screw", target: { x: 0.55, y: 0.35 }, pin: { x: 0.10, y: 0.74 } },
      { id: 4, text: "Striker / Hammer", target: { x: 0.68, y: 0.52 }, pin: { x: 0.88, y: 0.38 } },
      { id: 5, text: "Metallic Gong", target: { x: 0.75, y: 0.65 }, pin: { x: 0.88, y: 0.72 } },
      { id: 6, text: "Battery & Switch", target: { x: 0.35, y: 0.84 }, pin: { x: 0.35, y: 0.94 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // U-Shaped Electromagnet core
      const ex = x + w * 0.32;
      const ey = y + h * 0.38;
      ctx.fillStyle = PALETTE.ironGrey;
      ctx.strokeStyle = stroke;
      ctx.fillRect(ex, ey - h * 0.12, w * 0.12, h * 0.06); // top coil pole
      ctx.fillRect(ex, ey + h * 0.06, w * 0.12, h * 0.06); // bottom coil pole
      ctx.fillRect(ex, ey - h * 0.12, w * 0.04, h * 0.24); // back connector
      ctx.strokeRect(ex, ey - h * 0.12, w * 0.12, h * 0.06);
      ctx.strokeRect(ex, ey + h * 0.06, w * 0.12, h * 0.06);

      // Coils of copper wire wound around poles
      ctx.strokeStyle = PALETTE.wireCopper;
      ctx.lineWidth = 3;
      for (let c = 0; c < 4; c++) {
        const wx = ex + w * 0.04 + c * (w * 0.018);
        ctx.beginPath();
        ctx.moveTo(wx, ey - h * 0.13);
        ctx.lineTo(wx, ey - h * 0.05);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(wx, ey + h * 0.05);
        ctx.lineTo(wx, ey + h * 0.13);
        ctx.stroke();
      }

      // Soft Iron Armature (flat vertical strip)
      const ax = ex + w * 0.16;
      ctx.fillStyle = "#94a3b8";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.fillRect(ax, ey - h * 0.15, w * 0.02, h * 0.30);
      ctx.strokeRect(ax, ey - h * 0.15, w * 0.02, h * 0.30);

      // Contact Screw touching armature spring
      ctx.fillStyle = PALETTE.goldYellow;
      ctx.fillRect(ax + w * 0.04, ey - h * 0.08, w * 0.04, h * 0.03);
      ctx.strokeRect(ax + w * 0.04, ey - h * 0.08, w * 0.04, h * 0.03);

      // Hammer / Striker rod attached to armature
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ax + w * 0.01, ey + h * 0.12);
      ctx.lineTo(x + w * 0.68, ey + h * 0.20);
      ctx.stroke();
      // Striker ball head
      ctx.fillStyle = PALETTE.ironGrey;
      ctx.beginPath();
      ctx.arc(x + w * 0.68, ey + h * 0.20, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Brass Gong (Hemisphere cup)
      const gx = x + w * 0.74;
      const gy = ey + h * 0.24;
      ctx.fillStyle = PALETTE.goldYellow;
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.arc(gx, gy, w * 0.09, -0.4 * Math.PI, 0.4 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Battery & Switch loop at bottom
      ctx.strokeStyle = PALETTE.wireCopper;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ex + w * 0.02, ey + h * 0.12);
      ctx.lineTo(ex + w * 0.02, y + h * 0.82);
      ctx.lineTo(x + w * 0.50, y + h * 0.82);
      ctx.lineTo(ax + w * 0.06, y + h * 0.82);
      ctx.lineTo(ax + w * 0.06, ey - h * 0.05);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 15. HUMAN EAR (HEARING MECHANISM) - Grade 8 Physics / Biology
  DIAGRAMS["human_ear"] = {
    id: "human_ear",
    title: "Structure of Human Ear",
    subject: "physics",
    grade: "Class 8",
    chapter: "Sound",
    icon: "👂",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "Pinna (Outer Ear)", target: { x: 0.18, y: 0.38 }, pin: { x: 0.08, y: 0.18 } },
      { id: 2, text: "Auditory Canal", target: { x: 0.32, y: 0.50 }, pin: { x: 0.10, y: 0.70 } },
      { id: 3, text: "Eardrum (Tympanic Membrane)", target: { x: 0.44, y: 0.50 }, pin: { x: 0.34, y: 0.18 } },
      { id: 4, text: "Hammer, Anvil & Stirrup (Ossicles)", target: { x: 0.52, y: 0.45 }, pin: { x: 0.58, y: 0.18 } },
      { id: 5, text: "Cochlea (Snail Shell)", target: { x: 0.68, y: 0.52 }, pin: { x: 0.88, y: 0.42 } },
      { id: 6, text: "Auditory Nerve", target: { x: 0.76, y: 0.45 }, pin: { x: 0.88, y: 0.22 } },
      { id: 7, text: "Eustachian Tube", target: { x: 0.58, y: 0.72 }, pin: { x: 0.88, y: 0.80 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // 1. Pinna (Outer Ear Funnel)
      ctx.fillStyle = isDark ? "#831843" : "#fecdd3";
      ctx.strokeStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.22, y + h * 0.20);
      ctx.bezierCurveTo(x + w * 0.10, y + h * 0.12, x + w * 0.10, y + h * 0.62, x + w * 0.22, y + h * 0.58);
      ctx.bezierCurveTo(x + w * 0.16, y + h * 0.46, x + w * 0.18, y + h * 0.30, x + w * 0.22, y + h * 0.20);
      ctx.fill();
      ctx.stroke();

      // 2. Auditory Canal (Tube)
      ctx.fillStyle = isDark ? "#1e293b" : "#ffedd5";
      ctx.beginPath();
      ctx.moveTo(x + w * 0.22, y + h * 0.46);
      ctx.lineTo(x + w * 0.42, y + h * 0.46);
      ctx.lineTo(x + w * 0.42, y + h * 0.54);
      ctx.lineTo(x + w * 0.22, y + h * 0.54);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Eardrum Membrane (Tympanum - slanted diaphragm)
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.42, y + h * 0.44);
      ctx.lineTo(x + w * 0.44, y + h * 0.56);
      ctx.stroke();

      // 4. Middle Ear Cavity & 3 Ossicles (Hammer, Anvil, Stirrup)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = PALETTE.goldYellow;
      // Hammer (Malleus)
      ctx.beginPath();
      ctx.moveTo(x + w * 0.44, y + h * 0.48);
      ctx.lineTo(x + w * 0.48, y + h * 0.42);
      ctx.stroke();
      // Anvil (Incus)
      ctx.beginPath();
      ctx.moveTo(x + w * 0.48, y + h * 0.42);
      ctx.lineTo(x + w * 0.52, y + h * 0.46);
      ctx.stroke();
      // Stirrup (Stapes)
      ctx.beginPath();
      ctx.moveTo(x + w * 0.52, y + h * 0.46);
      ctx.lineTo(x + w * 0.56, y + h * 0.48);
      ctx.stroke();

      // 5. Cochlea (Spiral Snail Shell)
      const cx = x + w * 0.68;
      const cy = y + h * 0.52;
      ctx.fillStyle = isDark ? "#065f46" : "#bbf7d0";
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Spiral internal rings
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.05, 0, 1.5 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.025, 0, Math.PI);
      ctx.stroke();

      // 6. Auditory Nerve to Brain
      ctx.strokeStyle = PALETTE.nerveYellow;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.06, cy - h * 0.04);
      ctx.lineTo(x + w * 0.84, y + h * 0.32);
      ctx.stroke();

      // 7. Eustachian Tube leading down to throat
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.52, y + h * 0.56);
      ctx.lineTo(x + w * 0.62, y + h * 0.82);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 16. REFRACTION THROUGH GLASS SLAB - Class 10 Physics
  DIAGRAMS["refraction_glass_slab"] = {
    id: "refraction_glass_slab",
    title: "Refraction through Glass Slab",
    subject: "physics",
    grade: "Class 10",
    chapter: "Light — Refraction",
    icon: "🪟",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "Incident Ray", target: { x: 0.28, y: 0.18 }, pin: { x: 0.10, y: 0.12 } },
      { id: 2, text: "Normal (N N')", target: { x: 0.40, y: 0.32 }, pin: { x: 0.10, y: 0.32 } },
      { id: 3, text: "Angle of Incidence (i)", target: { x: 0.38, y: 0.26 }, pin: { x: 0.52, y: 0.22 } },
      { id: 4, text: "Refracted Ray", target: { x: 0.46, y: 0.50 }, pin: { x: 0.10, y: 0.52 } },
      { id: 5, text: "Angle of Refraction (r)", target: { x: 0.42, y: 0.38 }, pin: { x: 0.52, y: 0.42 } },
      { id: 6, text: "Emergent Ray (i = e)", target: { x: 0.60, y: 0.80 }, pin: { x: 0.88, y: 0.82 } },
      { id: 7, text: "Lateral Shift (d)", target: { x: 0.68, y: 0.72 }, pin: { x: 0.88, y: 0.60 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Rectangular Glass Slab
      const gx = x + w * 0.20;
      const gy = y + h * 0.32;
      const gw = w * 0.60;
      const gh = h * 0.36;

      ctx.fillStyle = isDark ? "rgba(30, 58, 138, 0.35)" : "rgba(186, 230, 253, 0.45)";
      ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
      ctx.lineWidth = 2.5;
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeRect(gx, gy, gw, gh);

      // Point of Incidence P1 and Point of Emergence P2
      const p1 = { x: x + w * 0.40, y: gy };
      const p2 = { x: x + w * 0.52, y: gy + gh };

      // Normal 1 at P1
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, gy - h * 0.16);
      ctx.lineTo(p1.x, gy + h * 0.16);
      ctx.stroke();

      // Normal 2 at P2
      ctx.beginPath();
      ctx.moveTo(p2.x, gy + gh - h * 0.16);
      ctx.lineTo(p2.x, gy + gh + h * 0.16);
      ctx.stroke();

      // Incident Ray (Air -> Glass)
      ctx.setLineDash([]);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.20, y + h * 0.12);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
      // Arrow on incident ray
      drawRayArrow(ctx, x + w * 0.20, y + h * 0.12, p1.x, p1.y, "#dc2626");

      // Refracted Ray (Inside Glass - bends towards normal)
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      drawRayArrow(ctx, p1.x, p1.y, p2.x, p2.y, "#dc2626");

      // Emergent Ray (Glass -> Air - bends away from normal, parallel to incident)
      const p3 = { x: p2.x + (p1.x - (x + w * 0.20)), y: p2.y + (p1.y - (y + h * 0.12)) };
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.stroke();
      drawRayArrow(ctx, p2.x, p2.y, p3.x, p3.y, "#dc2626");

      // Original un-deviated path (Dotted)
      ctx.strokeStyle = "#94a3b8";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p1.x + (p1.x - (x + w * 0.20)) * 2.2, p1.y + (p1.y - (y + h * 0.12)) * 2.2);
      ctx.stroke();

      // Lateral Displacement Line (d)
      ctx.strokeStyle = "#16a34a";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(p2.x + 35, p2.y + 35);
      ctx.lineTo(p2.x + 52, p2.y + 18);
      ctx.stroke();

      // Angle Arcs
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.5;
      // Angle i
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 22, -Math.PI * 0.5, -Math.PI * 0.72, true);
      ctx.stroke();
      // Angle r
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 20, Math.PI * 0.5, Math.PI * 0.40, true);
      ctx.stroke();

      ctx.restore();
    }
  };

  // 17. REFRACTION & DISPERSION THROUGH PRISM - Class 10 Physics
  DIAGRAMS["refraction_prism"] = {
    id: "refraction_prism",
    title: "Refraction & Dispersion through Prism",
    subject: "physics",
    grade: "Class 10",
    chapter: "The Human Eye & Colorful World",
    icon: "🌈",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "Angle of Prism (A)", target: { x: 0.50, y: 0.18 }, pin: { x: 0.50, y: 0.08 } },
      { id: 2, text: "Incident White Light", target: { x: 0.24, y: 0.46 }, pin: { x: 0.08, y: 0.42 } },
      { id: 3, text: "Refraction & Deviation", target: { x: 0.50, y: 0.52 }, pin: { x: 0.50, y: 0.74 } },
      { id: 4, text: "Red Light (Least Bent)", target: { x: 0.78, y: 0.46 }, pin: { x: 0.88, y: 0.38 } },
      { id: 5, text: "Violet Light (Most Bent)", target: { x: 0.78, y: 0.60 }, pin: { x: 0.88, y: 0.62 } },
      { id: 6, text: "VIBGYOR Spectrum Band", target: { x: 0.84, y: 0.54 }, pin: { x: 0.88, y: 0.82 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      // Triangular Glass Prism
      const pTop = { x: x + w * 0.50, y: y + h * 0.18 };
      const pLeft = { x: x + w * 0.30, y: y + h * 0.74 };
      const pRight = { x: x + w * 0.70, y: y + h * 0.74 };

      ctx.fillStyle = isDark ? "rgba(30, 58, 138, 0.35)" : "rgba(186, 230, 253, 0.45)";
      ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Incident White Light Beam
      const inPoint = { x: x + w * 0.38, y: y + h * 0.52 };
      ctx.strokeStyle = isDark ? "#f8fafc" : "#0f172a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.12, y + h * 0.40);
      ctx.lineTo(inPoint.x, inPoint.y);
      ctx.stroke();
      drawRayArrow(ctx, x + w * 0.12, y + h * 0.40, inPoint.x, inPoint.y, stroke);

      // Spectrum Colors inside and emerging from prism
      const SPECTRUM = [
        { name: "Red", color: "#dc2626", dy: -14 },
        { name: "Orange", color: "#ea580c", dy: -9 },
        { name: "Yellow", color: "#eab308", dy: -4 },
        { name: "Green", color: "#16a34a", dy: 1 },
        { name: "Blue", color: "#0284c7", dy: 6 },
        { name: "Indigo", color: "#4f46e5", dy: 11 },
        { name: "Violet", color: "#7c3aed", dy: 16 }
      ];

      SPECTRUM.forEach((c) => {
        ctx.strokeStyle = c.color;
        ctx.lineWidth = 2;
        // Inside prism
        const outPoint = { x: x + w * 0.62, y: y + h * 0.52 + c.dy * 0.4 };
        ctx.beginPath();
        ctx.moveTo(inPoint.x, inPoint.y);
        ctx.lineTo(outPoint.x, outPoint.y);
        ctx.stroke();

        // Emerging ray onto screen
        const screenPoint = { x: x + w * 0.84, y: y + h * 0.52 + c.dy * 1.5 };
        ctx.beginPath();
        ctx.moveTo(outPoint.x, outPoint.y);
        ctx.lineTo(screenPoint.x, screenPoint.y);
        ctx.stroke();
      });

      // White Screen on right
      ctx.fillStyle = isDark ? "#334155" : "#e2e8f0";
      ctx.fillRect(x + w * 0.84, y + h * 0.28, 6, h * 0.48);

      ctx.restore();
    }
  };

  // 18. OHM'S LAW VERIFICATION CIRCUIT - Class 10 Physics
  DIAGRAMS["ohms_law_circuit"] = {
    id: "ohms_law_circuit",
    title: "Ohm's Law Verification Circuit",
    subject: "physics",
    grade: "Class 10",
    chapter: "Electricity",
    icon: "🔌",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "Resistor Wire (R)", target: { x: 0.50, y: 0.28 }, pin: { x: 0.50, y: 0.14 } },
      { id: 2, text: "Voltmeter (Parallel)", target: { x: 0.50, y: 0.44 }, pin: { x: 0.86, y: 0.44 } },
      { id: 3, text: "Ammeter (Series)", target: { x: 0.76, y: 0.28 }, pin: { x: 0.86, y: 0.24 } },
      { id: 4, text: "Rheostat (Variable R)", target: { x: 0.66, y: 0.72 }, pin: { x: 0.86, y: 0.72 } },
      { id: 5, text: "Plug Key", target: { x: 0.36, y: 0.72 }, pin: { x: 0.12, y: 0.72 } },
      { id: 6, text: "Battery Pack", target: { x: 0.24, y: 0.50 }, pin: { x: 0.12, y: 0.50 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      const x1 = x + w * 0.24;
      const x2 = x + w * 0.76;
      const y1 = y + h * 0.28;
      const y2 = y + h * 0.72;

      // Main Loop Wires
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      // Top line
      ctx.moveTo(x1, y1);
      ctx.lineTo(x + w * 0.42, y1);
      ctx.moveTo(x + w * 0.58, y1);
      ctx.lineTo(x + w * 0.70, y1);
      ctx.moveTo(x + w * 0.82, y1);
      ctx.lineTo(x2, y1);
      // Right line
      ctx.lineTo(x2, y2);
      // Bottom line
      ctx.lineTo(x1, y2);
      // Left line
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Top Center: Resistor R (Zig-Zag)
      const rx = x + w * 0.42;
      ctx.beginPath();
      ctx.moveTo(rx, y1);
      ctx.lineTo(rx + 6, y1 - 8);
      ctx.lineTo(rx + 12, y1 + 8);
      ctx.lineTo(rx + 18, y1 - 8);
      ctx.lineTo(rx + 24, y1 + 8);
      ctx.lineTo(rx + 30, y1);
      ctx.stroke();

      // Parallel Voltmeter (V) circle below Resistor
      const vx = x + w * 0.50;
      const vy = y + h * 0.44;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.40, y1);
      ctx.lineTo(x + w * 0.40, vy);
      ctx.lineTo(vx - 16, vy);
      ctx.moveTo(vx + 16, vy);
      ctx.lineTo(x + w * 0.60, vy);
      ctx.lineTo(x + w * 0.60, y1);
      ctx.stroke();
      // Voltmeter dial
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.beginPath();
      ctx.arc(vx, vy, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("V", vx - 5, vy + 5);

      // Ammeter (A) circle on top right
      const ax = x + w * 0.76;
      ctx.fillStyle = isDark ? "#1e293b" : "#ffffff";
      ctx.beginPath();
      ctx.arc(ax, y1, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#dc2626";
      ctx.font = "bold 13px sans-serif";
      ctx.fillText("A", ax - 5, y1 + 5);

      // Bottom Right: Rheostat (Variable Resistor)
      const rhx = x + w * 0.64;
      ctx.fillStyle = isDark ? "#334155" : "#e2e8f0";
      ctx.fillRect(rhx - 20, y2 - 7, 40, 14);
      ctx.strokeRect(rhx - 20, y2 - 7, 40, 14);
      // Arrow across rheostat
      ctx.beginPath();
      ctx.moveTo(rhx - 16, y2 + 15);
      ctx.lineTo(rhx + 16, y2 - 15);
      ctx.stroke();

      // Bottom Left: Plug Key
      const kx = x + w * 0.36;
      ctx.fillStyle = stroke;
      ctx.beginPath();
      ctx.arc(kx - 10, y2, 4, 0, Math.PI * 2);
      ctx.arc(kx + 10, y2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Left: Battery
      const by = y + h * 0.50;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1 - 14, by - 8);
      ctx.lineTo(x1 + 14, by - 8); // long line (+)
      ctx.moveTo(x1 - 8, by + 8);
      ctx.lineTo(x1 + 8, by + 8);  // short line (-)
      ctx.stroke();

      ctx.restore();
    }
  };

  // 19. MAGNETIC FIELD LINES (SOLENOID & BAR MAGNET) - Class 10 Physics
  DIAGRAMS["magnetic_field_solenoid"] = {
    id: "magnetic_field_solenoid",
    title: "Magnetic Field Lines (Bar Magnet)",
    subject: "physics",
    grade: "Class 10",
    chapter: "Magnetic Effects of Electric Current",
    icon: "🧲",
    aspectRatio: 1.25,
    labels: [
      { id: 1, text: "North Pole (N)", target: { x: 0.34, y: 0.50 }, pin: { x: 0.12, y: 0.34 } },
      { id: 2, text: "South Pole (S)", target: { x: 0.66, y: 0.50 }, pin: { x: 0.88, y: 0.34 } },
      { id: 3, text: "Magnetic Field Loops", target: { x: 0.50, y: 0.22 }, pin: { x: 0.50, y: 0.10 } },
      { id: 4, text: "Direction: North to South (outside)", target: { x: 0.50, y: 0.34 }, pin: { x: 0.12, y: 0.68 } },
      { id: 5, text: "Direction: South to North (inside)", target: { x: 0.50, y: 0.50 }, pin: { x: 0.88, y: 0.68 } }
    ],
    draw(ctx, x, y, w, h, isDark) {
      const stroke = isDark ? "#f8fafc" : "#1e293b";
      ctx.save();
      ctx.lineWidth = Math.max(1.8, w * 0.005);
      ctx.lineJoin = "round";

      const mx = x + w * 0.50;
      const my = y + h * 0.50;
      const mw = w * 0.36;
      const mh = h * 0.14;

      // Magnetic Field Loops (Concentric Ellipses outside)
      ctx.strokeStyle = isDark ? "#38bdf8" : "#0284c7";
      ctx.lineWidth = 1.8;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.ellipse(mx, my, mw * 0.6 + r * 30, mh * 0.6 + r * 26, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Direction Arrows (North -> South outside, pointing towards right on top and bottom)
        const topAy = my - (mh * 0.6 + r * 26);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(mx + 6, topAy - 4);
        ctx.lineTo(mx + 12, topAy);
        ctx.lineTo(mx + 6, topAy + 4);
        ctx.fill();

        const botAy = my + (mh * 0.6 + r * 26);
        ctx.beginPath();
        ctx.moveTo(mx - 6, botAy - 4);
        ctx.lineTo(mx - 12, botAy);
        ctx.lineTo(mx - 6, botAy + 4);
        ctx.fill();
      }

      // Bar Magnet Body
      // North half (Red)
      ctx.fillStyle = PALETTE.magnetNorth;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2.5;
      ctx.fillRect(mx - mw / 2, my - mh / 2, mw / 2, mh);
      ctx.strokeRect(mx - mw / 2, my - mh / 2, mw / 2, mh);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("N", mx - mw * 0.32, my + 5);

      // South half (Blue)
      ctx.fillStyle = PALETTE.magnetSouth;
      ctx.fillRect(mx, my - mh / 2, mw / 2, mh);
      ctx.strokeRect(mx, my - mh / 2, mw / 2, mh);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("S", mx + mw * 0.22, my + 5);

      ctx.restore();
    }
  };

  // Helper to draw clean directional ray arrow
  function drawRayArrow(ctx, x1, y1, x2, y2, color) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(mx, my);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-6, -5);
    ctx.lineTo(6, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 2. MAIN SHAPE DRAWING FUNCTION
  // ---------------------------------------------------------------------------
  function drawScienceDiagramShape(ctx, shape, isPreview) {
    const diag = DIAGRAMS[shape.diagramId || "human_heart"];
    if (!diag) return;

    const { start, end } = shape;
    if (!start || !end) return;

    const x1 = Math.min(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const x2 = Math.max(start.x, end.x);
    const y2 = Math.max(start.y, end.y);
    const w = Math.max(80, x2 - x1);
    const h = Math.max(80, y2 - y1);
    const cx = x1 + w / 2;
    const cy = y1 + h / 2;

    ctx.save();

    // Check board darkness
    const isDark = (typeof getBoardBackgroundColor === "function" && getBoardBackgroundColor() === "#020617") ||
      (document.body && document.body.classList.contains("board-theme-black"));

    // Handle rotation
    if (shape.rotation && typeof shape.rotation === "number" && shape.rotation !== 0) {
      ctx.translate(cx, cy);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    if (isPreview) {
      ctx.setLineDash([6, 4]);
    }

    // 1. Draw the vector illustration
    diag.draw(ctx, x1, y1, w, h, isDark);

    // 2. Draw Interactive Labels (if not blind mode)
    const labelMode = shape.labelMode || "study"; // "study" | "quiz" | "blind"
    if (labelMode !== "blind" && Array.isArray(diag.labels)) {
      drawDiagramLabels(ctx, shape, diag, x1, y1, w, h, isDark);
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 3. INTERACTIVE LABELS RENDERING (QUIZ MODE & STUDY MODE)
  // ---------------------------------------------------------------------------
  function drawDiagramLabels(ctx, shape, diag, x, y, w, h, isDark) {
    const labelMode = shape.labelMode || "study";
    const revealedMap = shape.revealedLabels || {};

    diag.labels.forEach((lbl, idx) => {
      const targetX = x + lbl.target.x * w;
      const targetY = y + lbl.target.y * h;
      const pinX = x + lbl.pin.x * w;
      const pinY = y + lbl.pin.y * h;

      const isRevealed = labelMode === "study" || !!revealedMap[lbl.id];

      // Draw leader pointer line
      ctx.save();
      ctx.strokeStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(pinX, pinY);
      ctx.stroke();

      // Dot on target point
      ctx.fillStyle = isDark ? "#38bdf8" : "#0284c7";
      ctx.beginPath();
      ctx.arc(targetX, targetY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Draw Label Badge
      ctx.font = "600 11px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (isRevealed) {
        // Revealed Pill (White/Slate or Green confirm if quizzed)
        const text = labelMode === "quiz" ? `${lbl.id}. ${lbl.text}` : lbl.text;
        const textW = ctx.measureText(text).width;
        const badgeW = textW + 14;
        const badgeH = 22;

        ctx.fillStyle = labelMode === "quiz" ? "#f0fdf4" : (isDark ? "#1e293b" : "#ffffff");
        ctx.strokeStyle = labelMode === "quiz" ? "#16a34a" : (isDark ? "#475569" : "#cbd5e1");
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.roundRect(pinX - badgeW / 2, pinY - badgeH / 2, badgeW, badgeH, [5]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = labelMode === "quiz" ? "#15803d" : (isDark ? "#f8fafc" : "#0f172a");
        ctx.fillText(text, pinX, pinY);
      } else {
        // Quiz Mode Hidden Badge: [ 1 ], [ 2 ]...
        const badgeR = 12;
        ctx.fillStyle = isDark ? "#0c4a6e" : "#e0f2fe";
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 1.6;

        ctx.beginPath();
        ctx.arc(pinX, pinY, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDark ? "#bae6fd" : "#0369a1";
        ctx.font = "700 11px system-ui, sans-serif";
        ctx.fillText(String(lbl.id), pinX, pinY);
      }

      ctx.restore();
    });
  }

  // ---------------------------------------------------------------------------
  // 4. HIT TEST FOR INTERACTIVE QUIZ BADGE TAPPING
  // ---------------------------------------------------------------------------
  function hitTestScienceDiagramBadge(shape, point) {
    if (!shape || shape.type !== "scienceDiagram" || shape.labelMode !== "quiz") return null;
    const diag = DIAGRAMS[shape.diagramId || "human_heart"];
    if (!diag || !Array.isArray(diag.labels)) return null;

    const { start, end } = shape;
    const x1 = Math.min(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const w = Math.max(80, Math.abs(end.x - start.x));
    const h = Math.max(80, Math.abs(end.y - start.y));

    for (let i = 0; i < diag.labels.length; i++) {
      const lbl = diag.labels[i];
      const pinX = x1 + lbl.pin.x * w;
      const pinY = y1 + lbl.pin.y * h;
      const dist = Math.hypot(point.x - pinX, point.y - pinY);
      if (dist <= 22) {
        return lbl.id;
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // 5. PUBLIC API EXPORTS TO WINDOW
  // ---------------------------------------------------------------------------
  window.SCIENCE_DIAGRAMS_CATALOG = DIAGRAMS;
  window.drawScienceDiagramShape = drawScienceDiagramShape;
  window.hitTestScienceDiagramBadge = hitTestScienceDiagramBadge;

  console.log("EduAshram Science Diagram Library Engine loaded (Grades 6–10 NCERT Catalog ready).");
})();

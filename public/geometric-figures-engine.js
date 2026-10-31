/**
 * EduAshram Geometric Figures Engine
 * Comprehensive educational mathematics diagrams aligned with NCERT Class 6-10:
 * 1. Types of Angles (Acute, Right, Obtuse, Straight, Reflex, Overview)
 * 2. Types of Triangles by Sides (Equilateral, Isosceles, Scalene, Overview)
 * 3. Triangle Classification by Angles (Acute-angled, Right-angled, Obtuse-angled, Overview)
 * 4. Types of Quadrilaterals (Square, Rectangle, Rhombus, Parallelogram, Trapezium, Overview)
 * 5. Types of Polygons (Regular Pentagon/Hexagon, Irregular Polygon, Comparison)
 * 6. Circle Components (Radius, Diameter, Chord, Tangent, Secant, Master Diagram)
 * 7. Lines and Angles (Parallel Lines & Transversal with Angle Pairs)
 * 8. Congruent Triangles (SSS, SAS, ASA, RHS, Overview)
 * 9. Similar Triangles (Corresponding sides & angles, Scale Ratio)
 * 10. Trigonometric Unit Circle
 */

(function () {
  "use strict";

  // Preset Catalog with NCERT metadata
  const GEO_PRESETS = [
    // --- 1. Types of Angles ---
    {
      group: "angles",
      chip: "∠ <90°",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Acute Angle",
      subtitle: "Angle measure between 0° and 90° (θ < 90°)",
      type: "angleAcute",
      w: 110,
      h: 80
    },
    {
      group: "angles",
      chip: "∠ 90°",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Right Angle",
      subtitle: "Exact 90° perpendicular angle with square marker",
      type: "angleRight",
      w: 100,
      h: 85
    },
    {
      group: "angles",
      chip: "∠ >90°",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Obtuse Angle",
      subtitle: "Angle measure between 90° and 180° (90° < θ < 180°)",
      type: "angleObtuse",
      w: 120,
      h: 85
    },
    {
      group: "angles",
      chip: "∠ 180°",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Straight Angle",
      subtitle: "Exact 180° collinear angle forming a straight line",
      type: "angleStraight",
      w: 130,
      h: 65
    },
    {
      group: "angles",
      chip: "∠ >180°",
      chipTheme: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
      title: "Reflex Angle",
      subtitle: "Angle measure between 180° and 360° (outer arc)",
      type: "angleReflex",
      w: 120,
      h: 90
    },
    {
      group: "angles",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Angles (Overview)",
      subtitle: "Side-by-side comparison: Acute, Right, Obtuse, Straight & Reflex",
      type: "typesOfAngles",
      w: 240,
      h: 110
    },

    // --- 2. Types of Triangles (by Sides) ---
    {
      group: "triangles_sides",
      chip: "△ a=b=c",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Equilateral Triangle",
      subtitle: "All 3 sides equal (ticks) and all 3 angles = 60°",
      type: "triangleEquilateral",
      w: 110,
      h: 95
    },
    {
      group: "triangles_sides",
      chip: "△ a=b",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Isosceles Triangle",
      subtitle: "2 equal sides with equal opposite base angles",
      type: "triangleIsosceles",
      w: 105,
      h: 95
    },
    {
      group: "triangles_sides",
      chip: "△ a≠b≠c",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Scalene Triangle",
      subtitle: "All 3 sides and all 3 angles are unequal",
      type: "triangleScalene",
      w: 120,
      h: 85
    },
    {
      group: "triangles_sides",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Triangles by Sides",
      subtitle: "Comparison: Equilateral, Isosceles & Scalene",
      type: "typesOfTrianglesSides",
      w: 230,
      h: 100
    },

    // --- 3. Triangle Classification (Based on Angles) ---
    {
      group: "triangles_angles",
      chip: "△ <90°",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Acute-Angled Triangle",
      subtitle: "All three interior angles are less than 90°",
      type: "triangleAcuteAngled",
      w: 110,
      h: 90
    },
    {
      group: "triangles_angles",
      chip: "△ 90°",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Right-Angled Triangle",
      subtitle: "One 90° angle, legs a, b & hypotenuse c (c² = a² + b²)",
      type: "rightTriangle",
      w: 115,
      h: 85
    },
    {
      group: "triangles_angles",
      chip: "△ >90°",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Obtuse-Angled Triangle",
      subtitle: "One interior angle is greater than 90°",
      type: "triangleObtuseAngled",
      w: 125,
      h: 80
    },
    {
      group: "triangles_angles",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Triangles by Angles (Overview)",
      subtitle: "Comparison: Acute-angled, Right-angled & Obtuse-angled",
      type: "trianglesByAngles",
      w: 230,
      h: 100
    },

    // --- 4. Types of Quadrilaterals ---
    {
      group: "quadrilaterals",
      chip: "Square",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Square",
      subtitle: "4 equal sides, 4 right angles (90°), opposite sides parallel",
      type: "quadSquare",
      w: 100,
      h: 100
    },
    {
      group: "quadrilaterals",
      chip: "Rectangle",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Rectangle",
      subtitle: "Opposite sides equal & parallel, 4 right angles (90°)",
      type: "quadRectangle",
      w: 130,
      h: 85
    },
    {
      group: "quadrilaterals",
      chip: "Rhombus",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Rhombus",
      subtitle: "4 equal sides, opposite sides parallel, perpendicular diagonals",
      type: "quadRhombus",
      w: 120,
      h: 95
    },
    {
      group: "quadrilaterals",
      chip: "Parallelogram",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "Parallelogram",
      subtitle: "Opposite sides parallel & equal, opposite angles equal",
      type: "quadParallelogram",
      w: 135,
      h: 85
    },
    {
      group: "quadrilaterals",
      chip: "Trapezium",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Trapezium (Trapezoid)",
      subtitle: "One pair of parallel bases (a || b), height h & non-parallel legs",
      type: "quadTrapezium",
      w: 130,
      h: 85
    },
    {
      group: "quadrilaterals",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Quadrilaterals (Overview)",
      subtitle: "Square, Rectangle, Rhombus, Parallelogram & Trapezium",
      type: "typesOfQuadrilaterals",
      w: 250,
      h: 110
    },

    // --- 5. Types of Polygons ---
    {
      group: "polygons",
      chip: "Regular",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Regular Polygon (Hexagon)",
      subtitle: "All sides equal and all interior angles equal (120°)",
      type: "polygonRegular",
      w: 110,
      h: 105
    },
    {
      group: "polygons",
      chip: "Irregular",
      chipTheme: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
      title: "Irregular Polygon",
      subtitle: "Sides of different lengths and unequal interior angles",
      type: "polygonIrregular",
      w: 120,
      h: 100
    },
    {
      group: "polygons",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Polygons (Overview)",
      subtitle: "Regular vs Irregular Polygons comparison",
      type: "typesOfPolygons",
      w: 220,
      h: 100
    },

    // --- 6. Circle Components ---
    {
      group: "circle",
      chip: "○ Master",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Circle Components (Master)",
      subtitle: "Radius, Diameter, Chord, Tangent & Secant with labels",
      type: "circleComponents",
      w: 140,
      h: 140
    },
    {
      group: "circle",
      chip: "Radius r",
      chipTheme: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
      title: "Circle with Radius",
      subtitle: "Center point O, radius r and circumference (2πr)",
      type: "circleRadius",
      w: 100,
      h: 100
    },
    {
      group: "circle",
      chip: "Diameter d",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Circle with Diameter",
      subtitle: "Segment through center O connecting opposite points (d = 2r)",
      type: "circleDiameter",
      w: 105,
      h: 105
    },
    {
      group: "circle",
      chip: "Chord AB",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Circle with Chord",
      subtitle: "Segment joining two points on circumference & circular segment",
      type: "circleChord",
      w: 105,
      h: 105
    },
    {
      group: "circle",
      chip: "Tangent ⊥",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Circle with Tangent",
      subtitle: "Line touching circle at 1 point P, perpendicular to radius (OP ⊥ T)",
      type: "circleTangent",
      w: 120,
      h: 110
    },
    {
      group: "circle",
      chip: "Secant Line",
      chipTheme: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
      title: "Circle with Secant",
      subtitle: "Straight line intersecting circle at two distinct points",
      type: "circleSecant",
      w: 120,
      h: 110
    },
    {
      group: "circle",
      chip: "⭕ Unit Circle",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Trigonometric Unit Circle",
      subtitle: "Angles (0°-360°), radians (π) & (cos, sin) coordinates",
      type: "unitCircle",
      w: 130,
      h: 130
    },

    // --- 7. Lines and Angles ---
    {
      group: "lines_angles",
      chip: "l || m & t",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Parallel Lines & Transversal",
      subtitle: "Angles 1-8: Alternate interior, corresponding & consecutive interior",
      type: "linesTransversal",
      w: 160,
      h: 120
    },

    // --- 8. Congruent Triangles ---
    {
      group: "congruent",
      chip: "≅ SSS",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "SSS Congruence Criteria",
      subtitle: "Three pairs of corresponding equal sides (1, 2, 3 ticks)",
      type: "congruentSSS",
      w: 170,
      h: 95
    },
    {
      group: "congruent",
      chip: "≅ SAS",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "SAS Congruence Criteria",
      subtitle: "Two sides and the included angle equal",
      type: "congruentSAS",
      w: 170,
      h: 95
    },
    {
      group: "congruent",
      chip: "≅ ASA",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "ASA Congruence Criteria",
      subtitle: "Two angles and the included side equal",
      type: "congruentASA",
      w: 170,
      h: 95
    },
    {
      group: "congruent",
      chip: "≅ RHS",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "RHS Congruence Criteria",
      subtitle: "Right angle, equal Hypotenuse & one corresponding Side",
      type: "congruentRHS",
      w: 170,
      h: 95
    },
    {
      group: "congruent",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Congruent Triangles (Overview)",
      subtitle: "Complete comparison of SSS, SAS, ASA & RHS criteria",
      type: "congruentTrianglesOverview",
      w: 240,
      h: 110
    },

    // --- 9. Similar Triangles ---
    {
      group: "similar",
      chip: "∼ ABC ~ DEF",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Similar Triangles",
      subtitle: "Equal corresponding angles & proportional sides (AB/DE = BC/EF = AC/DF)",
      type: "similarTriangles",
      w: 180,
      h: 105
    }
  ];

  // Helper drawing functions
  function drawArrowHead(ctx, fromX, fromY, toX, toY, size) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = size || 8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
  }

  function drawTickMark(ctx, mx, my, angle, len) {
    const tLen = len || 6;
    ctx.beginPath();
    ctx.moveTo(mx - tLen * Math.cos(angle), my - tLen * Math.sin(angle));
    ctx.lineTo(mx + tLen * Math.cos(angle), my + tLen * Math.sin(angle));
    ctx.stroke();
  }

  function drawParallelArrow(ctx, mx, my, angle, size) {
    const s = size || 6;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-s, -s);
    ctx.lineTo(0, 0);
    ctx.lineTo(-s, s);
    ctx.stroke();
    ctx.restore();
  }

  // Master Canvas Drawing Function
  function drawGeometricDiagramShape(ctx, shape, isDark) {
    if (!shape || !shape.start || !shape.end) return;

    const x1 = Math.min(shape.start.x, shape.end.x);
    const x2 = Math.max(shape.start.x, shape.end.x);
    const y1 = Math.min(shape.start.y, shape.end.y);
    const y2 = Math.max(shape.start.y, shape.end.y);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const w = x2 - x1;
    const h = y2 - y1;

    const isActuallyDark = !!isDark;
    const defaultStroke = isActuallyDark ? "#f8fafc" : "#0f172a";
    const color = (isActuallyDark && (!shape.color || shape.color === "#0f172a")) ? "#f8fafc" : (shape.color || defaultStroke);
    const primary = isActuallyDark ? "#38bdf8" : "#0284c7";
    const accent = isActuallyDark ? "#34d399" : "#10b981";
    const warn = isActuallyDark ? "#fbbf24" : "#f59e0b";
    const danger = isActuallyDark ? "#f87171" : "#ef4444";
    const width = shape.width || 2;
    const geo = shape.geoType || "rightTriangle";

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.font = '12px "Plus Jakarta Sans", system-ui, sans-serif';

    // =========================================================================
    // 1. TYPES OF ANGLES
    // =========================================================================
    if (geo === "angleAcute") {
      const vx = x1 + 20, vy = y2 - 20;
      const rayLen = Math.min(w, h) * 0.85;
      const ang = -Math.PI / 4; // 45 deg

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLen, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLen, vy);

      // Angled ray OB
      const bx = vx + rayLen * Math.cos(ang), by = vy + rayLen * Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      // Angle arc
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(vx, vy, 30, ang, 0); ctx.stroke();
      ctx.strokeStyle = color;

      // Labels
      ctx.fillStyle = primary; ctx.fillText("θ < 90°", vx + 38, vy - 14);
      ctx.fillStyle = color;
      ctx.fillText("O", vx - 14, vy + 4);
      ctx.fillText("A", vx + rayLen + 6, vy + 4);
      ctx.fillText("B", bx + 4, by - 4);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Acute Angle", cx, y1 + 14);
    } else if (geo === "angleRight") {
      const vx = x1 + 25, vy = y2 - 20;
      const rayLen = Math.min(w, h) * 0.82;

      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLen, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLen, vy);

      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx, vy - rayLen); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx, vy - rayLen);

      // Square 90 deg marker
      const sq = 16;
      ctx.strokeStyle = primary;
      ctx.strokeRect(vx, vy - sq, sq, sq);
      ctx.strokeStyle = color;

      ctx.fillStyle = primary; ctx.fillText("90°", vx + 22, vy - 20);
      ctx.fillStyle = color;
      ctx.fillText("O", vx - 14, vy + 4);
      ctx.fillText("A", vx + rayLen + 6, vy + 4);
      ctx.fillText("B", vx - 4, vy - rayLen - 6);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Right Angle", cx, y1 + 14);
    } else if (geo === "angleObtuse") {
      const vx = cx + 10, vy = y2 - 20;
      const rayLen = Math.min(w, h) * 0.8;
      const ang = -3 * Math.PI / 4; // 135 deg

      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLen, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLen, vy);

      const bx = vx + rayLen * Math.cos(ang), by = vy + rayLen * Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.arc(vx, vy, 28, ang, 0); ctx.stroke();
      ctx.strokeStyle = color;

      ctx.fillStyle = warn; ctx.fillText("90° < θ < 180°", vx - 45, vy - 35);
      ctx.fillStyle = color;
      ctx.fillText("O", vx - 4, vy + 14);
      ctx.fillText("A", vx + rayLen + 6, vy + 4);
      ctx.fillText("B", bx - 14, by);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Obtuse Angle", cx, y1 + 14);
    } else if (geo === "angleStraight") {
      const vx = cx, vy = cy + 6;
      const rayLen = w * 0.44;

      ctx.beginPath(); ctx.moveTo(vx - rayLen, vy); ctx.lineTo(vx + rayLen, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLen, vy);
      drawArrowHead(ctx, vx, vy, vx - rayLen, vy);

      // Center point
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(vx, vy, 3.5, 0, Math.PI * 2); ctx.fill();

      // Semicircle arc
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(vx, vy, 24, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = color;

      ctx.fillStyle = primary; ctx.textAlign = "center"; ctx.fillText("180°", vx, vy - 30);
      ctx.fillStyle = color;
      ctx.fillText("O", vx, vy + 16);
      ctx.textAlign = "left"; ctx.fillText("A", vx + rayLen + 6, vy + 4);
      ctx.textAlign = "right"; ctx.fillText("B", vx - rayLen - 6, vy + 4);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Straight Angle (180°)", cx, y1 + 14);
    } else if (geo === "angleReflex") {
      const vx = cx, vy = cy - 4;
      const rayLen = Math.min(w, h) * 0.65;
      const ang = 5 * Math.PI / 6; // 150 deg downwards

      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLen, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLen, vy);

      const bx = vx + rayLen * Math.cos(ang), by = vy + rayLen * Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      // Outer reflex arc (from 0 to ang clockwise = reflex)
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.arc(vx, vy, 26, 0, ang); ctx.stroke();
      ctx.strokeStyle = color;

      ctx.fillStyle = danger; ctx.textAlign = "center"; ctx.fillText("180° < θ < 360°", vx - 20, vy + 46);
      ctx.fillStyle = color;
      ctx.fillText("O", vx - 12, vy - 6);
      ctx.textAlign = "left"; ctx.fillText("A", vx + rayLen + 6, vy + 4);
      ctx.fillText("B", bx - 14, by + 12);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText("Reflex Angle", cx, y1 + 14);
    } else if (geo === "typesOfAngles") {
      // 5-in-1 comparison diagram card
      const step = w / 5;
      const baseY = y2 - 24;
      const angles = [
        { name: "Acute", deg: "θ < 90°", ang: -Math.PI / 4, color: primary },
        { name: "Right", deg: "90°", ang: -Math.PI / 2, color: accent, isSq: true },
        { name: "Obtuse", deg: "θ > 90°", ang: -3 * Math.PI / 4, color: warn },
        { name: "Straight", deg: "180°", ang: Math.PI, color: "#8b5cf6", isLine: true },
        { name: "Reflex", deg: "> 180°", ang: 3 * Math.PI / 4, color: danger, isReflex: true }
      ];

      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText("Types of Angles (Classification by Measure)", cx, y1 + 16);

      angles.forEach((item, idx) => {
        const ox = x1 + step * idx + step / 2;
        const oy = baseY;
        const arm = step * 0.38;

        ctx.strokeStyle = color; ctx.lineWidth = 1.6;
        if (item.isLine) {
          ctx.beginPath(); ctx.moveTo(ox - arm, oy); ctx.lineTo(ox + arm, oy); ctx.stroke();
          ctx.strokeStyle = item.color; ctx.beginPath(); ctx.arc(ox, oy, 12, Math.PI, 0); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + arm, oy); ctx.stroke();
          const ex = ox + arm * Math.cos(item.ang), ey = oy + arm * Math.sin(item.ang);
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ex, ey); ctx.stroke();

          ctx.strokeStyle = item.color;
          if (item.isSq) {
            ctx.strokeRect(ox, oy - 10, 10, 10);
          } else if (item.isReflex) {
            ctx.beginPath(); ctx.arc(ox, oy, 14, 0, item.ang); ctx.stroke();
          } else {
            ctx.beginPath(); ctx.arc(ox, oy, 14, item.ang, 0); ctx.stroke();
          }
        }

        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = item.color;
        ctx.textAlign = "center";
        ctx.fillText(item.name, ox, oy - arm - 14);
        ctx.font = '10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
        ctx.fillText(item.deg, ox, oy + 15);
      });
    }

    // =========================================================================
    // 2. TYPES OF TRIANGLES (BY SIDES)
    // =========================================================================
    else if (geo === "triangleEquilateral" || geo === "equilateralTriangle") {
      const topX = cx, topY = y1 + 18;
      const bLeftX = cx - w * 0.42, bLeftY = y2 - 16;
      const bRightX = cx + w * 0.42, bRightY = y2 - 16;

      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(bLeftX, bLeftY);
      ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Tick on each side
      drawTickMark(ctx, (topX + bLeftX) / 2, (topY + bLeftY) / 2, Math.atan2(bLeftY - topY, bLeftX - topX) + Math.PI / 2, 6);
      drawTickMark(ctx, (topX + bRightX) / 2, (topY + bRightY) / 2, Math.atan2(bRightY - topY, bRightX - topX) + Math.PI / 2, 6);
      drawTickMark(ctx, cx, bLeftY, Math.PI / 2, 6);

      // 60 deg angle arcs
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(topX, topY, 18, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, 18, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, 18, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      ctx.fillStyle = primary; ctx.textAlign = "center";
      ctx.font = '10.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillText("60°", topX, topY + 30);
      ctx.fillText("60°", bLeftX + 26, bLeftY - 6);
      ctx.fillText("60°", bRightX - 26, bRightY - 6);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText("A", topX, topY - 6);
      ctx.fillText("B", bLeftX - 10, bLeftY + 8);
      ctx.fillText("C", bRightX + 10, bLeftY + 8);
      ctx.fillText("Equilateral (a = b = c, all 60°)", cx, y2 + 2);
    } else if (geo === "triangleIsosceles") {
      const topX = cx, topY = y1 + 18;
      const bLeftX = cx - w * 0.32, bLeftY = y2 - 16;
      const bRightX = cx + w * 0.32, bRightY = y2 - 16;

      ctx.beginPath();
      ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Double ticks on equal legs
      const ang1 = Math.atan2(bLeftY - topY, bLeftX - topX) + Math.PI / 2;
      const m1x = (topX + bLeftX) / 2, m1y = (topY + bLeftY) / 2;
      drawTickMark(ctx, m1x - 3, m1y, ang1, 6);
      drawTickMark(ctx, m1x + 3, m1y, ang1, 6);

      const ang2 = Math.atan2(bRightY - topY, bRightX - topX) + Math.PI / 2;
      const m2x = (topX + bRightX) / 2, m2y = (topY + bRightY) / 2;
      drawTickMark(ctx, m2x - 3, m2y, ang2, 6);
      drawTickMark(ctx, m2x + 3, m2y, ang2, 6);

      // Base equal angles
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, 18, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, 18, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      ctx.fillStyle = accent; ctx.textAlign = "center";
      ctx.fillText("θ", bLeftX + 22, bLeftY - 6);
      ctx.fillText("θ", bRightX - 22, bRightY - 6);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText("A", topX, topY - 6);
      ctx.fillText("B", bLeftX - 10, bLeftY + 8);
      ctx.fillText("C", bRightX + 10, bLeftY + 8);
      ctx.fillText("Isosceles (AB = AC, ∠B = ∠C)", cx, y2 + 2);
    } else if (geo === "triangleScalene") {
      const topX = x1 + w * 0.35, topY = y1 + 18;
      const bLeftX = x1 + 16, bLeftY = y2 - 16;
      const bRightX = x2 - 16, bRightY = y2 - 16;

      ctx.beginPath();
      ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Unequal tick marks (1, 2, 3)
      drawTickMark(ctx, (topX + bLeftX) / 2, (topY + bLeftY) / 2, 0.6, 6);
      const m2x = (topX + bRightX) / 2, m2y = (topY + bRightY) / 2;
      drawTickMark(ctx, m2x - 3, m2y, -0.6, 6);
      drawTickMark(ctx, m2x + 3, m2y, -0.6, 6);
      drawTickMark(ctx, cx - 6, bLeftY, Math.PI / 2, 6);
      drawTickMark(ctx, cx, bLeftY, Math.PI / 2, 6);
      drawTickMark(ctx, cx + 6, bLeftY, Math.PI / 2, 6);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("A", topX, topY - 6);
      ctx.fillText("B", bLeftX - 10, bLeftY + 8);
      ctx.fillText("C", bRightX + 10, bLeftY + 8);
      ctx.fillText("Scalene (All sides unequal: a ≠ b ≠ c)", cx, y2 + 2);
    } else if (geo === "typesOfTrianglesSides") {
      // 3-in-1 comparison of triangles by sides
      const step = w / 3;
      const baseY = y2 - 20;

      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText("Types of Triangles (Classified by Sides)", cx, y1 + 16);

      // 1. Equilateral
      const eqCx = x1 + step * 0.5;
      const eqTopX = eqCx, eqTopY = y1 + 36;
      const eqLx = eqCx - step * 0.38, eqRx = eqCx + step * 0.38;
      ctx.beginPath(); ctx.moveTo(eqTopX, eqTopY); ctx.lineTo(eqLx, baseY); ctx.lineTo(eqRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (eqTopX + eqLx) / 2, (eqTopY + baseY) / 2, 0.5, 5);
      drawTickMark(ctx, (eqTopX + eqRx) / 2, (eqTopY + baseY) / 2, -0.5, 5);
      drawTickMark(ctx, eqCx, baseY, Math.PI / 2, 5);
      ctx.fillStyle = primary; ctx.fillText("Equilateral", eqCx, baseY + 14);

      // 2. Isosceles
      const isoCx = x1 + step * 1.5;
      const isoTopX = isoCx, isoTopY = y1 + 36;
      const isoLx = isoCx - step * 0.30, isoRx = isoCx + step * 0.30;
      ctx.beginPath(); ctx.moveTo(isoTopX, isoTopY); ctx.lineTo(isoLx, baseY); ctx.lineTo(isoRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (isoTopX + isoLx) / 2, (isoTopY + baseY) / 2, 0.6, 5);
      drawTickMark(ctx, (isoTopX + isoRx) / 2, (isoTopY + baseY) / 2, -0.6, 5);
      ctx.fillStyle = accent; ctx.fillText("Isosceles", isoCx, baseY + 14);

      // 3. Scalene
      const scaCx = x1 + step * 2.5;
      const scaTopX = scaCx - 10, scaTopY = y1 + 36;
      const scaLx = scaCx - step * 0.40, scaRx = scaCx + step * 0.40;
      ctx.beginPath(); ctx.moveTo(scaTopX, scaTopY); ctx.lineTo(scaLx, baseY); ctx.lineTo(scaRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (scaTopX + scaLx) / 2, (scaTopY + baseY) / 2, 0.7, 5);
      drawTickMark(ctx, scaCx, baseY, Math.PI / 2, 5);
      ctx.fillStyle = warn; ctx.fillText("Scalene", scaCx, baseY + 14);
    }

    // =========================================================================
    // 3. TRIANGLE CLASSIFICATION (BASED ON ANGLES)
    // =========================================================================
    else if (geo === "triangleAcuteAngled") {
      const topX = cx + 8, topY = y1 + 18;
      const bLeftX = x1 + 18, bLeftY = y2 - 16;
      const bRightX = x2 - 18, bRightY = y2 - 16;

      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY); ctx.closePath(); ctx.stroke();

      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(topX, topY, 18, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, 18, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, 18, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Acute-Angled Triangle (All angles < 90°)", cx, y2 + 2);
    } else if (geo === "rightTriangle") {
      // Right-angled triangle with square marker, a, b, c & theorem
      const bLeftX = x1 + 20, bLeftY = y2 - 18;
      const topX = x1 + 20, topY = y1 + 18;
      const bRightX = x2 - 18, bRightY = y2 - 18;

      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY); ctx.closePath(); ctx.stroke();

      // Right angle square
      const sq = 14;
      ctx.strokeStyle = primary;
      ctx.strokeRect(bLeftX, bLeftY - sq, sq, sq);
      ctx.strokeStyle = color;

      ctx.font = 'italic 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = "right"; ctx.fillText("a", bLeftX - 8, (topY + bLeftY) / 2);
      ctx.textAlign = "center"; ctx.fillText("b", (bLeftX + bRightX) / 2, bLeftY + 14);
      ctx.textAlign = "left"; ctx.fillText("c (hypotenuse)", (topX + bRightX) / 2 + 8, (topY + bRightY) / 2 - 4);

      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Right Triangle (c² = a² + b²)", cx, y2 + 4);
    } else if (geo === "triangleObtuseAngled") {
      const topX = x1 + w * 0.15, topY = y1 + 20;
      const bMidX = x1 + w * 0.45, bMidY = y2 - 18; // obtuse vertex
      const bRightX = x2 - 16, bRightY = y2 - 18;

      ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(bMidX, bMidY); ctx.lineTo(bRightX, bRightY); ctx.closePath(); ctx.stroke();

      // Obtuse angle arc
      const ang = Math.atan2(topY - bMidY, topX - bMidX);
      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.arc(bMidX, bMidY, 20, ang, 0); ctx.stroke();

      ctx.fillStyle = warn;
      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("θ > 90°", bMidX + 22, bMidY - 24);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText("Obtuse-Angled Triangle (One angle > 90°)", cx, y2 + 2);
    } else if (geo === "trianglesByAngles") {
      const step = w / 3;
      const baseY = y2 - 20;

      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText("Triangle Classification (Based on Angles)", cx, y1 + 16);

      // Acute
      const acCx = x1 + step * 0.5;
      ctx.beginPath(); ctx.moveTo(acCx, y1 + 36); ctx.lineTo(acCx - step * 0.38, baseY); ctx.lineTo(acCx + step * 0.38, baseY); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = primary; ctx.fillText("Acute-Angled", acCx, baseY + 14);

      // Right
      const rtCx = x1 + step * 1.5;
      const rLx = rtCx - step * 0.34, rRx = rtCx + step * 0.34;
      ctx.beginPath(); ctx.moveTo(rLx, y1 + 36); ctx.lineTo(rLx, baseY); ctx.lineTo(rRx, baseY); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = accent; ctx.strokeRect(rLx, baseY - 10, 10, 10); ctx.strokeStyle = color;
      ctx.fillStyle = accent; ctx.fillText("Right-Angled", rtCx, baseY + 14);

      // Obtuse
      const obCx = x1 + step * 2.5;
      const oLx = obCx - step * 0.40, oMid = obCx - step * 0.10, oRx = obCx + step * 0.40;
      ctx.beginPath(); ctx.moveTo(oLx, y1 + 36); ctx.lineTo(oMid, baseY); ctx.lineTo(oRx, baseY); ctx.closePath(); ctx.stroke();
      ctx.fillStyle = warn; ctx.fillText("Obtuse-Angled", obCx, baseY + 14);
    }

    // =========================================================================
    // 4. TYPES OF QUADRILATERALS
    // =========================================================================
    else if (geo === "quadSquare") {
      const side = Math.min(w, h) * 0.72;
      const sx = cx - side / 2, sy = cy - side / 2 - 4;

      ctx.strokeRect(sx, sy, side, side);

      // Ticks on all 4 sides
      drawTickMark(ctx, cx, sy, Math.PI / 2, 5);
      drawTickMark(ctx, cx, sy + side, Math.PI / 2, 5);
      drawTickMark(ctx, sx, cy - 4, 0, 5);
      drawTickMark(ctx, sx + side, cy - 4, 0, 5);

      // 4 right angle squares
      const sq = 12;
      ctx.strokeStyle = primary;
      ctx.strokeRect(sx, sy, sq, sq);
      ctx.strokeRect(sx + side - sq, sy, sq, sq);
      ctx.strokeRect(sx, sy + side - sq, sq, sq);
      ctx.strokeRect(sx + side - sq, sy + side - sq, sq, sq);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Square (4 equal sides & 4 right angles)", cx, y2 + 2);
    } else if (geo === "quadRectangle") {
      const rw = w * 0.78, rh = h * 0.60;
      const rx = cx - rw / 2, ry = cy - rh / 2 - 4;

      ctx.strokeRect(rx, ry, rw, rh);

      // Double ticks on length, single ticks on width
      drawTickMark(ctx, cx - 3, ry, Math.PI / 2, 5); drawTickMark(ctx, cx + 3, ry, Math.PI / 2, 5);
      drawTickMark(ctx, cx - 3, ry + rh, Math.PI / 2, 5); drawTickMark(ctx, cx + 3, ry + rh, Math.PI / 2, 5);
      drawTickMark(ctx, rx, cy - 4, 0, 5);
      drawTickMark(ctx, rx + rw, cy - 4, 0, 5);

      const sq = 12;
      ctx.strokeStyle = primary;
      ctx.strokeRect(rx, ry, sq, sq);
      ctx.strokeRect(rx + rw - sq, ry, sq, sq);
      ctx.strokeRect(rx, ry + rh - sq, sq, sq);
      ctx.strokeRect(rx + rw - sq, ry + rh - sq, sq, sq);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Rectangle (Opposite sides equal & 4 right angles)", cx, y2 + 2);
    } else if (geo === "quadRhombus") {
      const rw = w * 0.76, rh = h * 0.65;
      const p1 = { x: cx, y: cy - rh / 2 - 4 };
      const p2 = { x: cx + rw / 2, y: cy - 4 };
      const p3 = { x: cx, y: cy + rh / 2 - 4 };
      const p4 = { x: cx - rw / 2, y: cy - 4 };

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.stroke();

      // Perpendicular diagonals (dashed)
      ctx.strokeStyle = isDark ? "#64748b" : "#94a3b8";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p3.x, p3.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p4.x, p4.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
      ctx.setLineDash([]);

      // 90 deg marker at diagonal intersection
      ctx.strokeRect(cx, cy - 4, 10, 10);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Rhombus (4 equal sides & ⊥ diagonals)", cx, y2 + 2);
    } else if (geo === "quadParallelogram") {
      const pw = w * 0.68, ph = h * 0.58;
      const shift = 26;
      const topY = cy - ph / 2 - 4, botY = cy + ph / 2 - 4;
      const p1 = { x: cx - pw / 2 + shift, y: topY };
      const p2 = { x: cx + pw / 2 + shift, y: topY };
      const p3 = { x: cx + pw / 2 - shift, y: botY };
      const p4 = { x: cx - pw / 2 - shift, y: botY };

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.stroke();

      // Parallel arrow markers
      drawParallelArrow(ctx, (p1.x + p2.x) / 2, topY, 0, 5);
      drawParallelArrow(ctx, (p4.x + p3.x) / 2, botY, 0, 5);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Parallelogram (Opposite sides equal & parallel)", cx, y2 + 2);
    } else if (geo === "quadTrapezium") {
      const topW = w * 0.40, botW = w * 0.78, th = h * 0.58;
      const topY = cy - th / 2 - 4, botY = cy + th / 2 - 4;
      const p1 = { x: cx - topW / 2, y: topY };
      const p2 = { x: cx + topW / 2, y: topY };
      const p3 = { x: cx + botW / 2, y: botY };
      const p4 = { x: cx - botW / 2, y: botY };

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.stroke();

      // Parallel arrows on top and bottom bases
      drawParallelArrow(ctx, cx, topY, 0, 5);
      drawParallelArrow(ctx, cx, botY, 0, 5);

      // Dashed height line
      ctx.strokeStyle = primary;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(p1.x, topY); ctx.lineTo(p1.x, botY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeRect(p1.x, botY - 10, 10, 10);

      ctx.fillStyle = primary; ctx.fillText("h", p1.x - 10, (topY + botY) / 2);
      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Trapezium (One pair of parallel sides: a || b)", cx, y2 + 2);
    } else if (geo === "typesOfQuadrilaterals") {
      const step = w / 5;
      const baseY = y2 - 20;

      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText("Types of Quadrilaterals", cx, y1 + 16);

      const quads = [
        { name: "Square", fn: (ox, oy, sz) => { ctx.strokeRect(ox - sz / 2, oy - sz, sz, sz); } },
        { name: "Rectangle", fn: (ox, oy, sz) => { ctx.strokeRect(ox - sz * 0.6, oy - sz * 0.8, sz * 1.2, sz * 0.8); } },
        { name: "Rhombus", fn: (ox, oy, sz) => { ctx.beginPath(); ctx.moveTo(ox, oy - sz); ctx.lineTo(ox + sz * 0.6, oy - sz / 2); ctx.lineTo(ox, oy); ctx.lineTo(ox - sz * 0.6, oy - sz / 2); ctx.closePath(); ctx.stroke(); } },
        { name: "Parallelogram", fn: (ox, oy, sz) => { ctx.beginPath(); ctx.moveTo(ox - sz * 0.4 + 10, oy - sz * 0.8); ctx.lineTo(ox + sz * 0.6 + 10, oy - sz * 0.8); ctx.lineTo(ox + sz * 0.6 - 10, oy); ctx.lineTo(ox - sz * 0.4 - 10, oy); ctx.closePath(); ctx.stroke(); } },
        { name: "Trapezium", fn: (ox, oy, sz) => { ctx.beginPath(); ctx.moveTo(ox - sz * 0.3, oy - sz * 0.8); ctx.lineTo(ox + sz * 0.3, oy - sz * 0.8); ctx.lineTo(ox + sz * 0.6, oy); ctx.lineTo(ox - sz * 0.6, oy); ctx.closePath(); ctx.stroke(); } }
      ];

      quads.forEach((q, idx) => {
        const ox = x1 + step * idx + step / 2;
        ctx.strokeStyle = color; ctx.lineWidth = 1.6;
        q.fn(ox, baseY, step * 0.45);
        ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = primary; ctx.textAlign = "center";
        ctx.fillText(q.name, ox, baseY + 14);
      });
    }

    // =========================================================================
    // 5. TYPES OF POLYGONS
    // =========================================================================
    else if (geo === "polygonRegular") {
      const r = Math.min(w, h) * 0.38;
      const sides = 6; // Regular hexagon

      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const ang = (i * 2 * Math.PI / sides) - Math.PI / 2;
        const px = cx + r * Math.cos(ang), py = cy - 4 + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Equal ticks on sides
      for (let i = 0; i < sides; i++) {
        const a1 = (i * 2 * Math.PI / sides) - Math.PI / 2;
        const a2 = ((i + 1) * 2 * Math.PI / sides) - Math.PI / 2;
        const mx = cx + r * Math.cos((a1 + a2) / 2) * Math.cos(Math.PI / sides);
        const my = cy - 4 + r * Math.sin((a1 + a2) / 2) * Math.cos(Math.PI / sides);
        drawTickMark(ctx, mx, my, (a1 + a2) / 2, 4);
      }

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Regular Polygon (Hexagon: Equal sides & angles)", cx, y2 + 2);
    } else if (geo === "polygonIrregular") {
      // Irregular pentagon
      const pts = [
        { x: cx - w * 0.35, y: cy + h * 0.28 },
        { x: cx + w * 0.40, y: cy + h * 0.32 },
        { x: cx + w * 0.32, y: cy - h * 0.15 },
        { x: cx - w * 0.05, y: cy - h * 0.40 },
        { x: cx - w * 0.38, y: cy - h * 0.20 }
      ];

      ctx.beginPath();
      pts.forEach((p, idx) => { if (idx === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Irregular Polygon (Unequal sides & angles)", cx, y2 + 2);
    } else if (geo === "typesOfPolygons") {
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText("Types of Polygons (Regular vs Irregular)", cx, y1 + 16);

      // Left: Regular Pentagon
      const lx = cx - w * 0.25, ly = cy + 4;
      const lr = Math.min(w, h) * 0.30;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const px = lx + lr * Math.cos(a), py = ly + lr * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = primary; ctx.fillText("Regular Polygon", lx, y2 - 4);
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText("(Equal sides & angles)", lx, y2 + 10);

      // Right: Irregular
      const rx = cx + w * 0.25, ry = cy + 4;
      ctx.beginPath();
      ctx.moveTo(rx - 30, ry + 25);
      ctx.lineTo(rx + 35, ry + 20);
      ctx.lineTo(rx + 25, ry - 15);
      ctx.lineTo(rx - 5, ry - 32);
      ctx.lineTo(rx - 35, ry - 10);
      ctx.closePath(); ctx.stroke();
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = warn; ctx.fillText("Irregular Polygon", rx, y2 - 4);
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText("(Unequal sides & angles)", rx, y2 + 10);
    }

    // =========================================================================
    // 6. CIRCLE COMPONENTS
    // =========================================================================
    else if (geo === "circleComponents") {
      // Master diagram showing: Center O, Radius, Diameter, Chord, Tangent & Secant
      const r = Math.min(w, h) * 0.36;
      const oy = cy - 4;

      // 1. Circle body
      ctx.beginPath(); ctx.arc(cx, oy, r, 0, Math.PI * 2); ctx.stroke();

      // Center O
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, oy, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color; ctx.font = 'bold 11px sans-serif'; ctx.fillText("O", cx - 12, oy - 6);

      // Radius (O to top-right)
      const rAng = -Math.PI / 4;
      const rx = cx + r * Math.cos(rAng), ry = oy + r * Math.sin(rAng);
      ctx.strokeStyle = primary; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(rx, ry); ctx.stroke();
      ctx.fillStyle = primary; ctx.fillText("Radius (r)", (cx + rx) / 2 + 6, (oy + ry) / 2 - 4);

      // Diameter (horizontal)
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(cx - r, oy); ctx.lineTo(cx + r, oy); ctx.stroke();
      ctx.fillStyle = accent; ctx.fillText("Diameter (d = 2r)", cx - 25, oy + 14);

      // Chord (lower segment)
      const chY = oy + r * 0.65;
      const chW = Math.sqrt(r * r - Math.pow(r * 0.65, 2));
      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.moveTo(cx - chW, chY); ctx.lineTo(cx + chW, chY); ctx.stroke();
      ctx.fillStyle = warn; ctx.fillText("Chord", cx, chY - 4);

      // Tangent (bottom vertical touching at (cx, oy + r))
      const tanY = oy + r;
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.moveTo(cx - r * 0.8, tanY); ctx.lineTo(cx + r * 0.8, tanY); ctx.stroke();
      drawArrowHead(ctx, cx, tanY, cx + r * 0.8, tanY);
      drawArrowHead(ctx, cx, tanY, cx - r * 0.8, tanY);
      // Tangent point P
      ctx.fillStyle = danger; ctx.beginPath(); ctx.arc(cx, tanY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillText("Point of Contact (P)", cx + 6, tanY + 12);
      ctx.fillText("Tangent Line", cx - r * 0.75, tanY - 5);

      // Secant (cutting line near top)
      const secY = oy - r * 0.60;
      ctx.strokeStyle = "#8b5cf6";
      ctx.beginPath(); ctx.moveTo(cx - r * 1.1, secY - 10); ctx.lineTo(cx + r * 1.1, secY + 10); ctx.stroke();
      drawArrowHead(ctx, cx, secY, cx + r * 1.1, secY + 10);
      drawArrowHead(ctx, cx, secY, cx - r * 1.1, secY - 10);
      ctx.fillStyle = "#8b5cf6"; ctx.fillText("Secant Line", cx - r * 1.05, secY - 14);

      ctx.fillStyle = color;
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Circle Components (Radius, Diameter, Chord, Tangent & Secant)", cx, y2 + 4);
    } else if (geo === "circleRadius") {
      const r = Math.min(w, h) * 0.40;
      ctx.beginPath(); ctx.arc(cx, cy - 4, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = primary; ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx + r, cy - 4); ctx.stroke();
      ctx.fillStyle = primary; ctx.fillText("r", cx + r / 2, cy - 8);
      ctx.fillStyle = color; ctx.fillText("O", cx - 12, cy - 4); ctx.fillText("P", cx + r + 6, cy - 4);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("Radius (OP = r, Circumference = 2πr)", cx, y2 + 2);
    } else if (geo === "circleDiameter") {
      const r = Math.min(w, h) * 0.40;
      ctx.beginPath(); ctx.arc(cx, cy - 4, r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx, cy - 4, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = accent; ctx.beginPath(); ctx.moveTo(cx - r, cy - 4); ctx.lineTo(cx + r, cy - 4); ctx.stroke();
      ctx.fillStyle = accent; ctx.fillText("d = 2r", cx, cy - 10);
      ctx.fillStyle = color; ctx.fillText("A", cx - r - 12, cy - 4); ctx.fillText("B", cx + r + 6, cy - 4);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("Diameter (Longest chord passing through center)", cx, y2 + 2);
    } else if (geo === "circleChord") {
      const r = Math.min(w, h) * 0.40;
      ctx.beginPath(); ctx.arc(cx, cy - 4, r, 0, Math.PI * 2); ctx.stroke();
      const chY = cy + r * 0.40;
      const chHalf = Math.sqrt(r * r - Math.pow(r * 0.40, 2));
      ctx.strokeStyle = warn; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(cx - chHalf, chY); ctx.lineTo(cx + chHalf, chY); ctx.stroke();
      ctx.fillStyle = warn; ctx.fillText("Chord AB", cx - 20, chY - 6);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.fillText("Chord (Segment connecting two points on circle)", cx, y2 + 2);
    } else if (geo === "circleTangent") {
      const r = Math.min(w, h) * 0.38;
      const oy = cy - 10;
      ctx.beginPath(); ctx.arc(cx, oy, r, 0, Math.PI * 2); ctx.stroke();

      // Radius to bottom point of tangency P
      ctx.strokeStyle = primary; ctx.beginPath(); ctx.moveTo(cx, oy); ctx.lineTo(cx, oy + r); ctx.stroke();
      ctx.fillStyle = primary; ctx.fillText("r", cx + 6, oy + r / 2);

      // Tangent line perpendicular to radius
      ctx.strokeStyle = danger; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - r * 0.9, oy + r); ctx.lineTo(cx + r * 0.9, oy + r); ctx.stroke();
      drawArrowHead(ctx, cx, oy + r, cx + r * 0.9, oy + r);
      drawArrowHead(ctx, cx, oy + r, cx - r * 0.9, oy + r);

      // 90 deg marker
      ctx.strokeRect(cx, oy + r - 12, 12, 12);
      ctx.fillStyle = danger; ctx.fillText("Tangent ⊥ Radius (OP ⊥ T)", cx - 60, oy + r + 18);

      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center"; ctx.fillStyle = color;
      ctx.fillText("Tangent Line (Touches circle at exactly 1 point)", cx, y2 + 4);
    } else if (geo === "circleSecant") {
      const r = Math.min(w, h) * 0.40;
      ctx.beginPath(); ctx.arc(cx, cy - 4, r, 0, Math.PI * 2); ctx.stroke();

      // Secant line cutting through circle
      ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2;
      const sx1 = cx - r * 1.1, sy1 = cy + r * 0.4;
      const sx2 = cx + r * 1.1, sy2 = cy - r * 0.5;
      ctx.beginPath(); ctx.moveTo(sx1, sy1); ctx.lineTo(sx2, sy2); ctx.stroke();
      drawArrowHead(ctx, sx1, sy1, sx2, sy2);
      drawArrowHead(ctx, sx2, sy2, sx1, sy1);

      ctx.fillStyle = "#8b5cf6"; ctx.fillText("Secant Line", cx - 25, cy - r * 0.5 - 6);
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center"; ctx.fillStyle = color;
      ctx.fillText("Secant (Line intersecting circle at two points)", cx, y2 + 2);
    } else if (geo === "unitCircle") {
      const r = Math.min(w, h) * 0.42;

      // X and Y Axes
      ctx.strokeStyle = isDark ? "#64748b" : "#94a3b8";
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x1 + 6, cy); ctx.lineTo(x2 - 6, cy); ctx.stroke();
      drawArrowHead(ctx, x1, cy, x2 - 6, cy);
      ctx.beginPath(); ctx.moveTo(cx, y2 - 6); ctx.lineTo(cx, y1 + 6); ctx.stroke();
      drawArrowHead(ctx, cx, y2, cx, y1 + 6);

      ctx.font = 'italic 11px sans-serif'; ctx.fillStyle = isDark ? "#94a3b8" : "#64748b";
      ctx.fillText("x", x2 - 14, cy - 6);
      ctx.fillText("y", cx + 6, y1 + 16);
      ctx.fillText("O", cx - 12, cy + 12);

      // Circle
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      const keyAngles = [
        { deg: 0, rad: "0" }, { deg: 30, rad: "π/6" }, { deg: 45, rad: "π/4" }, { deg: 60, rad: "π/3" },
        { deg: 90, rad: "π/2" }, { deg: 180, rad: "π" }, { deg: 270, rad: "3π/2" }
      ];

      keyAngles.forEach((ka) => {
        const radAng = -ka.deg * (Math.PI / 180);
        const px = cx + r * Math.cos(radAng), py = cy + r * Math.sin(radAng);
        ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
        ctx.font = '9px "Plus Jakarta Sans", sans-serif';
        const lx = cx + (r + 14) * Math.cos(radAng), ly = cy + (r + 14) * Math.sin(radAng);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(ka.rad, lx, ly);
      });

      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center"; ctx.fillStyle = color;
      ctx.fillText("Trigonometric Unit Circle (r = 1)", cx, y2 + 2);
    }

    // =========================================================================
    // 7. LINES AND ANGLES (PARALLEL & TRANSVERSAL)
    // =========================================================================
    else if (geo === "linesTransversal") {
      const lineLen = w * 0.85;
      const l1y = cy - h * 0.22;
      const l2y = cy + h * 0.22;
      const lx1 = cx - lineLen / 2, lx2 = cx + lineLen / 2;

      // Parallel line l
      ctx.beginPath(); ctx.moveTo(lx1, l1y); ctx.lineTo(lx2, l1y); ctx.stroke();
      drawArrowHead(ctx, lx1, l1y, lx2, l1y); drawArrowHead(ctx, lx2, l1y, lx1, l1y);
      drawParallelArrow(ctx, cx + lineLen * 0.35, l1y, 0, 5);

      // Parallel line m
      ctx.beginPath(); ctx.moveTo(lx1, l2y); ctx.lineTo(lx2, l2y); ctx.stroke();
      drawArrowHead(ctx, lx1, l2y, lx2, l2y); drawArrowHead(ctx, lx2, l2y, lx1, l2y);
      drawParallelArrow(ctx, cx + lineLen * 0.35, l2y, 0, 5);

      // Transversal line t (slanted)
      const tx1 = cx - w * 0.24, ty1 = y1 + 18;
      const tx2 = cx + w * 0.24, ty2 = y2 - 14;
      ctx.strokeStyle = primary; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke();
      drawArrowHead(ctx, tx1, ty1, tx2, ty2); drawArrowHead(ctx, tx2, ty2, tx1, ty1);
      ctx.strokeStyle = color;

      // Labels l, m, t
      ctx.font = 'italic bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = "left"; ctx.fillText("l", lx2 + 4, l1y + 4);
      ctx.fillText("m (l || m)", lx2 + 4, l2y + 4);
      ctx.fillStyle = primary; ctx.fillText("t (transversal)", tx2 + 4, ty2);

      // Angle pair markers 1 to 8
      ctx.font = 'bold 10px "Plus Jakarta Sans", sans-serif';
      // Intersection 1
      const i1x = cx - w * 0.24 + ((l1y - ty1) / (ty2 - ty1)) * (w * 0.48);
      ctx.fillStyle = primary; ctx.fillText("1", i1x - 14, l1y - 6);
      ctx.fillStyle = accent; ctx.fillText("2", i1x + 8, l1y - 6);
      ctx.fillStyle = warn; ctx.fillText("3", i1x - 14, l1y + 12);
      ctx.fillStyle = danger; ctx.fillText("4", i1x + 8, l1y + 12);

      // Intersection 2
      const i2x = cx - w * 0.24 + ((l2y - ty1) / (ty2 - ty1)) * (w * 0.48);
      ctx.fillStyle = primary; ctx.fillText("5", i2x - 14, l2y - 6);
      ctx.fillStyle = accent; ctx.fillText("6", i2x + 8, l2y - 6);
      ctx.fillStyle = warn; ctx.fillText("7", i2x - 14, l2y + 12);
      ctx.fillStyle = danger; ctx.fillText("8", i2x + 8, l2y + 12);

      ctx.fillStyle = color; ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("Alt. Interior: ∠3=∠5, ∠4=∠6  |  Corresponding: ∠1=∠5, ∠2=∠6", cx, y2 + 4);
    }

    // =========================================================================
    // 8. CONGRUENT TRIANGLES (SSS, SAS, ASA, RHS)
    // =========================================================================
    else if (geo === "congruentSSS") {
      const step = w / 2;
      const baseY = y2 - 18;

      // Triangle 1: ABC
      const t1x = x1 + step * 0.5;
      const aX = t1x - 8, aY = y1 + 22;
      const bX = t1x - step * 0.38, bY = baseY;
      const cX = t1x + step * 0.38, cY = baseY;
      ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (aX + bX) / 2, (aY + bY) / 2, 0.7, 5);
      drawTickMark(ctx, (aX + cX) / 2 - 2, (aY + cY) / 2, -0.7, 5);
      drawTickMark(ctx, (aX + cX) / 2 + 2, (aY + cY) / 2, -0.7, 5);
      drawTickMark(ctx, t1x - 4, baseY, Math.PI / 2, 5);
      drawTickMark(ctx, t1x, baseY, Math.PI / 2, 5);
      drawTickMark(ctx, t1x + 4, baseY, Math.PI / 2, 5);

      // Triangle 2: DEF
      const t2x = x1 + step * 1.5;
      const dX = t2x - 8, dY = y1 + 22;
      const eX = t2x - step * 0.38, eY = baseY;
      const fX = t2x + step * 0.38, fY = baseY;
      ctx.beginPath(); ctx.moveTo(dX, dY); ctx.lineTo(eX, eY); ctx.lineTo(fX, fY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (dX + eX) / 2, (dY + eY) / 2, 0.7, 5);
      drawTickMark(ctx, (dX + fX) / 2 - 2, (dY + fY) / 2, -0.7, 5);
      drawTickMark(ctx, (dX + fX) / 2 + 2, (dY + fY) / 2, -0.7, 5);
      drawTickMark(ctx, t2x - 4, baseY, Math.PI / 2, 5);
      drawTickMark(ctx, t2x, baseY, Math.PI / 2, 5);
      drawTickMark(ctx, t2x + 4, baseY, Math.PI / 2, 5);

      ctx.fillStyle = primary; ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("△ABC", t1x, aY - 6);
      ctx.fillText("△DEF", t2x, dY - 6);
      ctx.fillText("≅", cx, (aY + baseY) / 2);
      ctx.fillStyle = color;
      ctx.fillText("SSS Criterion: AB=DE, AC=DF, BC=EF  ⇒  △ABC ≅ △DEF", cx, y2 + 2);
    } else if (geo === "congruentSAS") {
      const step = w / 2;
      const baseY = y2 - 18;

      // Triangle 1: ABC
      const t1x = x1 + step * 0.5;
      const aX = t1x - 6, aY = y1 + 22;
      const bX = t1x - step * 0.36, bY = baseY;
      const cX = t1x + step * 0.36, cY = baseY;
      ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (aX + bX) / 2, (aY + bY) / 2, 0.7, 5);
      drawTickMark(ctx, (bX + cX) / 2 - 2, baseY, Math.PI / 2, 5);
      drawTickMark(ctx, (bX + cX) / 2 + 2, baseY, Math.PI / 2, 5);
      ctx.strokeStyle = primary; ctx.beginPath(); ctx.arc(bX, bY, 16, -Math.PI / 3, 0); ctx.stroke(); ctx.strokeStyle = color;

      // Triangle 2: DEF
      const t2x = x1 + step * 1.5;
      const dX = t2x - 6, dY = y1 + 22;
      const eX = t2x - step * 0.36, eY = baseY;
      const fX = t2x + step * 0.36, fY = baseY;
      ctx.beginPath(); ctx.moveTo(dX, dY); ctx.lineTo(eX, eY); ctx.lineTo(fX, fY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (dX + eX) / 2, (dY + eY) / 2, 0.7, 5);
      drawTickMark(ctx, (eX + fX) / 2 - 2, baseY, Math.PI / 2, 5);
      drawTickMark(ctx, (eX + fX) / 2 + 2, baseY, Math.PI / 2, 5);
      ctx.strokeStyle = primary; ctx.beginPath(); ctx.arc(eX, eY, 16, -Math.PI / 3, 0); ctx.stroke(); ctx.strokeStyle = color;

      ctx.fillStyle = primary; ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("△ABC", t1x, aY - 6); ctx.fillText("△DEF", t2x, dY - 6); ctx.fillText("≅", cx, (aY + baseY) / 2);
      ctx.fillStyle = color; ctx.fillText("SAS Criterion: AB=DE, ∠B=∠E, BC=EF  ⇒  △ABC ≅ △DEF", cx, y2 + 2);
    } else if (geo === "congruentASA") {
      const step = w / 2;
      const baseY = y2 - 18;

      // Triangle 1
      const t1x = x1 + step * 0.5;
      const aX = t1x, aY = y1 + 22;
      const bX = t1x - step * 0.36, bY = baseY;
      const cX = t1x + step * 0.36, cY = baseY;
      ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, t1x, baseY, Math.PI / 2, 5);
      ctx.strokeStyle = primary; ctx.beginPath(); ctx.arc(bX, bY, 15, -Math.PI / 3, 0); ctx.stroke();
      ctx.strokeStyle = accent; ctx.beginPath(); ctx.arc(cX, cY, 15, Math.PI, 4 * Math.PI / 3); ctx.stroke(); ctx.strokeStyle = color;

      // Triangle 2
      const t2x = x1 + step * 1.5;
      const dX = t2x, dY = y1 + 22;
      const eX = t2x - step * 0.36, eY = baseY;
      const fX = t2x + step * 0.36, fY = baseY;
      ctx.beginPath(); ctx.moveTo(dX, dY); ctx.lineTo(eX, eY); ctx.lineTo(fX, fY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, t2x, baseY, Math.PI / 2, 5);
      ctx.strokeStyle = primary; ctx.beginPath(); ctx.arc(eX, eY, 15, -Math.PI / 3, 0); ctx.stroke();
      ctx.strokeStyle = accent; ctx.beginPath(); ctx.arc(fX, fY, 15, Math.PI, 4 * Math.PI / 3); ctx.stroke(); ctx.strokeStyle = color;

      ctx.fillStyle = primary; ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("△ABC", t1x, aY - 6); ctx.fillText("△DEF", t2x, dY - 6); ctx.fillText("≅", cx, (aY + baseY) / 2);
      ctx.fillStyle = color; ctx.fillText("ASA Criterion: ∠B=∠E, BC=EF, ∠C=∠F  ⇒  △ABC ≅ △DEF", cx, y2 + 2);
    } else if (geo === "congruentRHS") {
      const step = w / 2;
      const baseY = y2 - 18;

      // Triangle 1
      const t1x = x1 + step * 0.5;
      const bX = t1x - step * 0.30, bY = baseY;
      const aX = bX, aY = y1 + 22;
      const cX = t1x + step * 0.34, cY = baseY;
      ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath(); ctx.stroke();
      ctx.strokeRect(bX, bY - 10, 10, 10);
      drawTickMark(ctx, (aX + cX) / 2, (aY + cY) / 2, -0.6, 6); // Hypotenuse
      drawTickMark(ctx, bX, (aY + bY) / 2, 0, 5); // Side

      // Triangle 2
      const t2x = x1 + step * 1.5;
      const eX = t2x - step * 0.30, eY = baseY;
      const dX = eX, dY = y1 + 22;
      const fX = t2x + step * 0.34, fY = baseY;
      ctx.beginPath(); ctx.moveTo(dX, dY); ctx.lineTo(eX, eY); ctx.lineTo(fX, fY); ctx.closePath(); ctx.stroke();
      ctx.strokeRect(eX, eY - 10, 10, 10);
      drawTickMark(ctx, (dX + fX) / 2, (dY + fY) / 2, -0.6, 6);
      drawTickMark(ctx, eX, (dY + eY) / 2, 0, 5);

      ctx.fillStyle = primary; ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif'; ctx.textAlign = "center";
      ctx.fillText("△ABC", t1x, aY - 6); ctx.fillText("△DEF", t2x, dY - 6); ctx.fillText("≅", cx, (aY + baseY) / 2);
      ctx.fillStyle = color; ctx.fillText("RHS Criterion: Right Angle, Hypotenuse AC=DF, Leg AB=DE", cx, y2 + 2);
    } else if (geo === "congruentTrianglesOverview") {
      const step = w / 4;
      const baseY = y2 - 20;

      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center"; ctx.fillStyle = color;
      ctx.fillText("Congruent Triangles Criteria (SSS, SAS, ASA, RHS)", cx, y1 + 16);

      const criteria = ["SSS", "SAS", "ASA", "RHS"];
      criteria.forEach((name, idx) => {
        const ox = x1 + step * idx + step / 2;
        const topY = y1 + 36;
        ctx.beginPath(); ctx.moveTo(ox, topY); ctx.lineTo(ox - step * 0.32, baseY); ctx.lineTo(ox + step * 0.32, baseY); ctx.closePath(); ctx.stroke();
        ctx.fillStyle = primary; ctx.font = 'bold 11.5px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(name, ox, baseY + 14);
      });
    }

    // =========================================================================
    // 9. SIMILAR TRIANGLES (CORRESPONDING SIDES & ANGLES)
    // =========================================================================
    else if (geo === "similarTriangles") {
      const baseY = y2 - 18;

      // Small Triangle ABC
      const sLx = x1 + 16, sRx = x1 + w * 0.34;
      const sTx = (sLx + sRx) / 2 - 8, sTy = cy - 2;
      ctx.beginPath(); ctx.moveTo(sTx, sTy); ctx.lineTo(sLx, baseY); ctx.lineTo(sRx, baseY); ctx.closePath(); ctx.stroke();

      // Large Triangle DEF (scale factor ~ 1.7)
      const bLx = cx + 8, bRx = x2 - 14;
      const bTx = (bLx + bRx) / 2 - 12, bTy = y1 + 22;
      ctx.beginPath(); ctx.moveTo(bTx, bTy); ctx.lineTo(bLx, baseY); ctx.lineTo(bRx, baseY); ctx.closePath(); ctx.stroke();

      // Angles marked equal
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(sTx, sTy, 12, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bTx, bTy, 16, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();

      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.arc(sLx, baseY, 12, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bLx, baseY, 16, -Math.PI / 3, 0); ctx.stroke();

      ctx.fillStyle = primary; ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("△ABC", (sLx + sRx) / 2, sTy - 8);
      ctx.fillText("△DEF", (bLx + bRx) / 2, bTy - 8);
      ctx.fillText("∼", cx, cy);

      ctx.fillStyle = color;
      ctx.fillText("Similar Triangles: ∠A=∠D, ∠B=∠E, ∠C=∠F  &  AB/DE = BC/EF = AC/DF = k", cx, y2 + 2);
    }

    ctx.restore();
  }

  // Global Export
  window.EduAshramGeometry = {
    GEO_PRESETS,
    drawGeometricDiagramShape
  };

  console.log("EduAshram Geometric Figures Engine loaded successfully (" + GEO_PRESETS.length + " figures ready).");
})();


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

  // Preset Catalog with NCERT metadata and comfortable default sizes
  const GEO_PRESETS = [
    // --- 1. Types of Angles ---
    {
      group: "angles",
      chip: "∠ <90°",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Acute Angle",
      subtitle: "Angle measure between 0° and 90° (θ < 90°)",
      type: "angleAcute",
      w: 120,
      h: 90
    },
    {
      group: "angles",
      chip: "∠ 90°",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Right Angle",
      subtitle: "Exact 90° perpendicular angle with square marker",
      type: "angleRight",
      w: 110,
      h: 95
    },
    {
      group: "angles",
      chip: "∠ >90°",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Obtuse Angle",
      subtitle: "Angle measure between 90° and 180° (90° < θ < 180°)",
      type: "angleObtuse",
      w: 130,
      h: 95
    },
    {
      group: "angles",
      chip: "∠ 180°",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Straight Angle",
      subtitle: "Exact 180° collinear angle forming a straight line",
      type: "angleStraight",
      w: 140,
      h: 75
    },
    {
      group: "angles",
      chip: "∠ >180°",
      chipTheme: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
      title: "Reflex Angle",
      subtitle: "Angle measure between 180° and 360° (outer arc)",
      type: "angleReflex",
      w: 130,
      h: 100
    },
    {
      group: "angles",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Angles (Overview)",
      subtitle: "Side-by-side comparison: Acute, Right, Obtuse, Straight & Reflex",
      type: "typesOfAngles",
      w: 260,
      h: 120
    },

    // --- 2. Types of Triangles (by Sides) ---
    {
      group: "triangles_sides",
      chip: "△ a=b=c",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Equilateral Triangle",
      subtitle: "All 3 sides equal (ticks) and all 3 angles = 60°",
      type: "triangleEquilateral",
      w: 120,
      h: 105
    },
    {
      group: "triangles_sides",
      chip: "△ a=b",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Isosceles Triangle",
      subtitle: "2 equal sides with equal opposite base angles",
      type: "triangleIsosceles",
      w: 115,
      h: 105
    },
    {
      group: "triangles_sides",
      chip: "△ a≠b≠c",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Scalene Triangle",
      subtitle: "All 3 sides and all 3 angles are unequal",
      type: "triangleScalene",
      w: 130,
      h: 95
    },
    {
      group: "triangles_sides",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Triangles by Sides",
      subtitle: "Comparison: Equilateral, Isosceles & Scalene",
      type: "typesOfTrianglesSides",
      w: 250,
      h: 110
    },

    // --- 3. Triangle Classification (Based on Angles) ---
    {
      group: "triangles_angles",
      chip: "△ <90°",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Acute-Angled Triangle",
      subtitle: "All three interior angles are less than 90°",
      type: "triangleAcuteAngled",
      w: 120,
      h: 100
    },
    {
      group: "triangles_angles",
      chip: "△ 90°",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Right-Angled Triangle",
      subtitle: "One 90° angle, legs a, b & hypotenuse c (c² = a² + b²)",
      type: "rightTriangle",
      w: 125,
      h: 95
    },
    {
      group: "triangles_angles",
      chip: "△ >90°",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Obtuse-Angled Triangle",
      subtitle: "One interior angle is greater than 90°",
      type: "triangleObtuseAngled",
      w: 135,
      h: 90
    },
    {
      group: "triangles_angles",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Triangles by Angles (Overview)",
      subtitle: "Comparison: Acute-angled, Right-angled & Obtuse-angled",
      type: "trianglesByAngles",
      w: 250,
      h: 110
    },

    // --- 4. Types of Quadrilaterals ---
    {
      group: "quadrilaterals",
      chip: "Square",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Square",
      subtitle: "4 equal sides, 4 right angles (90°), opposite sides parallel",
      type: "quadSquare",
      w: 110,
      h: 110
    },
    {
      group: "quadrilaterals",
      chip: "Rectangle",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Rectangle",
      subtitle: "Opposite sides equal & parallel, 4 right angles (90°)",
      type: "quadRectangle",
      w: 140,
      h: 95
    },
    {
      group: "quadrilaterals",
      chip: "Rhombus",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Rhombus",
      subtitle: "4 equal sides, opposite sides parallel, perpendicular diagonals",
      type: "quadRhombus",
      w: 130,
      h: 105
    },
    {
      group: "quadrilaterals",
      chip: "Parallelogram",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "Parallelogram",
      subtitle: "Opposite sides parallel & equal, opposite angles equal",
      type: "quadParallelogram",
      w: 145,
      h: 95
    },
    {
      group: "quadrilaterals",
      chip: "Trapezium",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Trapezium (Trapezoid)",
      subtitle: "One pair of parallel bases (a || b), height h & non-parallel legs",
      type: "quadTrapezium",
      w: 140,
      h: 95
    },
    {
      group: "quadrilaterals",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Quadrilaterals (Overview)",
      subtitle: "Square, Rectangle, Rhombus, Parallelogram & Trapezium",
      type: "typesOfQuadrilaterals",
      w: 270,
      h: 120
    },

    // --- 5. Types of Polygons ---
    {
      group: "polygons",
      chip: "Regular",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Regular Polygon (Hexagon)",
      subtitle: "All sides equal and all interior angles equal (120°)",
      type: "polygonRegular",
      w: 120,
      h: 115
    },
    {
      group: "polygons",
      chip: "Irregular",
      chipTheme: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
      title: "Irregular Polygon",
      subtitle: "Sides of different lengths and unequal interior angles",
      type: "polygonIrregular",
      w: 130,
      h: 110
    },
    {
      group: "polygons",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Polygons (Overview)",
      subtitle: "Regular vs Irregular Polygons comparison",
      type: "typesOfPolygons",
      w: 240,
      h: 110
    },

    // --- 6. Circle Components ---
    {
      group: "circle",
      chip: "○ Master",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Circle Components (Master)",
      subtitle: "Radius, Diameter, Chord, Tangent & Secant with labels",
      type: "circleComponents",
      w: 150,
      h: 150
    },
    {
      group: "circle",
      chip: "Radius r",
      chipTheme: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
      title: "Circle with Radius",
      subtitle: "Center point O, radius r and circumference (2πr)",
      type: "circleRadius",
      w: 110,
      h: 110
    },
    {
      group: "circle",
      chip: "Diameter d",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Circle with Diameter",
      subtitle: "Segment through center O connecting opposite points (d = 2r)",
      type: "circleDiameter",
      w: 115,
      h: 115
    },
    {
      group: "circle",
      chip: "Chord AB",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Circle with Chord",
      subtitle: "Segment joining two points on circumference & circular segment",
      type: "circleChord",
      w: 115,
      h: 115
    },
    {
      group: "circle",
      chip: "Tangent ⊥",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Circle with Tangent",
      subtitle: "Line touching circle at 1 point P, perpendicular to radius (OP ⊥ T)",
      type: "circleTangent",
      w: 130,
      h: 120
    },
    {
      group: "circle",
      chip: "Secant Line",
      chipTheme: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
      title: "Circle with Secant",
      subtitle: "Straight line intersecting circle at two distinct points",
      type: "circleSecant",
      w: 130,
      h: 120
    },
    {
      group: "circle",
      chip: "⭕ Unit Circle",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Trigonometric Unit Circle",
      subtitle: "Angles (0°-360°), radians (π) & (cos, sin) coordinates",
      type: "unitCircle",
      w: 140,
      h: 140
    },

    // --- 7. Lines and Angles ---
    {
      group: "lines_angles",
      chip: "l || m & t",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Parallel Lines & Transversal",
      subtitle: "Angles 1-8: Alternate interior, corresponding & consecutive interior",
      type: "linesTransversal",
      w: 170,
      h: 130
    },

    // --- 8. Congruent Triangles ---
    {
      group: "congruent",
      chip: "≅ SSS",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "SSS Congruence Criteria",
      subtitle: "Three pairs of corresponding equal sides (1, 2, 3 ticks)",
      type: "congruentSSS",
      w: 180,
      h: 105
    },
    {
      group: "congruent",
      chip: "≅ SAS",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "SAS Congruence Criteria",
      subtitle: "Two sides and the included angle equal",
      type: "congruentSAS",
      w: 180,
      h: 105
    },
    {
      group: "congruent",
      chip: "≅ ASA",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "ASA Congruence Criteria",
      subtitle: "Two angles and the included side equal",
      type: "congruentASA",
      w: 180,
      h: 105
    },
    {
      group: "congruent",
      chip: "≅ RHS",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "RHS Congruence Criteria",
      subtitle: "Right angle, equal Hypotenuse & one corresponding Side",
      type: "congruentRHS",
      w: 180,
      h: 105
    },
    {
      group: "congruent",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Congruent Triangles (Overview)",
      subtitle: "Complete comparison of SSS, SAS, ASA & RHS criteria",
      type: "congruentTrianglesOverview",
      w: 260,
      h: 120
    },

    // --- 9. Similar Triangles ---
    {
      group: "similar",
      chip: "∼ ABC ~ DEF",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Similar Triangles",
      subtitle: "Equal corresponding angles & proportional sides (AB/DE = BC/EF = AC/DF)",
      type: "similarTriangles",
      w: 190,
      h: 115
    }
  ];

  // Helper drawing functions
  function drawArrowHead(ctx, fromX, fromY, toX, toY, size) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = size || 9;
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
    const tLen = len || 7;
    ctx.beginPath();
    ctx.moveTo(mx - tLen * Math.cos(angle), my - tLen * Math.sin(angle));
    ctx.lineTo(mx + tLen * Math.cos(angle), my + tLen * Math.sin(angle));
    ctx.stroke();
  }

  function drawParallelArrow(ctx, mx, my, angle, size) {
    const s = size || 7;
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
    const w = Math.max(40, x2 - x1);
    const h = Math.max(30, y2 - y1);

    const isActuallyDark = !!isDark;
    const defaultStroke = isActuallyDark ? "#f8fafc" : "#0f172a";
    const color = (isActuallyDark && (!shape.color || shape.color === "#0f172a")) ? "#f8fafc" : (shape.color || defaultStroke);
    const primary = isActuallyDark ? "#38bdf8" : "#0284c7";
    const accent = isActuallyDark ? "#34d399" : "#10b981";
    const warn = isActuallyDark ? "#fbbf24" : "#f59e0b";
    const danger = isActuallyDark ? "#f87171" : "#ef4444";
    const bgFill = isActuallyDark ? "rgba(15, 23, 42, 0.88)" : "rgba(255, 255, 255, 0.88)";
    const width = shape.width || 2;
    const geo = shape.geoType || "rightTriangle";

    // Dynamic padding & responsive bounding box for geometry elements
    const padX = Math.max(16, Math.min(w * 0.08, 38));
    const padY = Math.max(22, Math.min(h * 0.12, 42));
    const gx1 = x1 + padX;
    const gx2 = x2 - padX;
    const gy1 = y1 + padY;
    const gy2 = y2 - padY;
    const gw = Math.max(20, gx2 - gx1);
    const gh = Math.max(20, gy2 - gy1);

    // Responsive, high-contrast typography scaling
    const sFactor = Math.min(Math.max(Math.min(w / 240, h / 180), 0.95), 2.2);
    const fontTitle = `bold ${Math.round(15 * sFactor)}px "Plus Jakarta Sans", sans-serif`;
    const fontLabel = `bold ${Math.round(14 * sFactor)}px "Plus Jakarta Sans", sans-serif`;
    const fontMath  = `bold ${Math.round(13 * sFactor)}px "Plus Jakarta Sans", sans-serif`;
    const fontSmall = `${Math.round(12 * sFactor)}px "Plus Jakarta Sans", sans-serif`;

    // Labeled text with subtle backdrop badge for pristine legibility over geometry lines
    function drawLabel(text, tx, ty, font, txtColor, align, baseline, useBackdrop) {
      ctx.save();
      ctx.font = font || fontLabel;
      ctx.textAlign = align || "center";
      ctx.textBaseline = baseline || "middle";
      if (useBackdrop !== false) {
        const m = ctx.measureText(text);
        const tw = m.width;
        const th = parseInt((font || fontLabel).replace(/\D/g, ""), 10) || 14;
        let bx = tx;
        if (align === "center" || !align) bx = tx - tw / 2;
        else if (align === "right") bx = tx - tw;
        let by = ty - th / 2;
        if (baseline === "top") by = ty;
        else if (baseline === "bottom") by = ty - th;
        ctx.fillStyle = bgFill;
        const bp = 3;
        if (ctx.roundRect) ctx.roundRect(bx - bp, by - bp, tw + bp * 2, th + bp * 2, 4);
        else ctx.fillRect(bx - bp, by - bp, tw + bp * 2, th + bp * 2);
        ctx.fill();
      }
      ctx.fillStyle = txtColor || color;
      ctx.fillText(text, tx, ty);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // =========================================================================
    // 1. TYPES OF ANGLES
    // =========================================================================
    if (geo === "angleAcute") {
      const vx = gx1 + 10, vy = gy2;
      const rayLenX = gw - 15;
      const rayLenY = gh - 10;
      const bx = vx + rayLenX * 0.75, by = vy - rayLenY;

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      // Angled ray OB
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      // Angle arc
      const arcR = Math.min(45, Math.min(rayLenX, rayLenY) * 0.38);
      const angleRad = Math.atan2(by - vy, bx - vx);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, angleRad, 0); ctx.stroke();

      drawLabel("θ < 90°", vx + arcR * 1.35, vy - arcR * 0.65, fontMath, primary);
      drawLabel("O", vx - 14, vy + 4, fontLabel, color, "right");
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", bx + 4, by - 10, fontLabel, color, "left");
      drawLabel("Acute Angle (θ < 90°)", cx, y1 + 14, fontTitle, color);
    } else if (geo === "angleRight") {
      const vx = gx1 + 15, vy = gy2;
      const rayLenX = gw - 20;
      const rayLenY = gh - 10;

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      // Vertical ray OB
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx, vy - rayLenY); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx, vy - rayLenY);

      // Square 90 deg marker
      const sq = Math.min(24, Math.min(rayLenX, rayLenY) * 0.22);
      ctx.strokeStyle = primary;
      ctx.strokeRect(vx, vy - sq, sq, sq);

      drawLabel("90°", vx + sq + 14, vy - sq - 4, fontMath, primary);
      drawLabel("O", vx - 14, vy + 4, fontLabel, color, "right");
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", vx, vy - rayLenY - 12, fontLabel, color, "center");
      drawLabel("Right Angle (90°)", cx, y1 + 14, fontTitle, color);
    } else if (geo === "angleObtuse") {
      const vx = gx1 + gw * 0.42, vy = gy2;
      const rayLenX = gw * 0.52;
      const rayLenY = gh - 10;
      const bx = gx1 + 5, by = vy - rayLenY;

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      // Obtuse ray OB
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      const angleRad = Math.atan2(by - vy, bx - vx);
      const arcR = Math.min(42, Math.min(rayLenX, rayLenY) * 0.35);
      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, angleRad, 0); ctx.stroke();

      drawLabel("90° < θ < 180°", vx - arcR * 0.8, vy - arcR * 1.3, fontMath, warn);
      drawLabel("O", vx, vy + 16, fontLabel, color, "center");
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", bx - 6, by - 6, fontLabel, color, "right");
      drawLabel("Obtuse Angle", cx, y1 + 14, fontTitle, color);
    } else if (geo === "angleStraight") {
      const vx = cx, vy = cy + 6;
      const rayLen = gw / 2;

      ctx.beginPath(); ctx.moveTo(vx - rayLen, vy); ctx.lineTo(vx + rayLen, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLen, vy);
      drawArrowHead(ctx, vx, vy, vx - rayLen, vy);

      // Center point
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(vx, vy, 4, 0, Math.PI * 2); ctx.fill();

      // Semicircle arc
      const arcR = Math.min(36, Math.min(rayLen * 0.45, gh * 0.5));
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, Math.PI, 0); ctx.stroke();

      drawLabel("180°", vx, vy - arcR - 10, fontMath, primary);
      drawLabel("O", vx, vy + 16, fontLabel, color);
      drawLabel("A", vx + rayLen + 10, vy, fontLabel, color, "left");
      drawLabel("B", vx - rayLen - 10, vy, fontLabel, color, "right");
      drawLabel("Straight Angle (180°)", cx, y1 + 14, fontTitle, color);
    } else if (geo === "angleReflex") {
      const vx = cx - gw * 0.08, vy = cy;
      const rayLenX = gw * 0.5;
      const rayLenY = gh * 0.55;
      const bx = vx - rayLenX * 0.7, by = vy + rayLenY;

      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      const angleRad = Math.atan2(by - vy, bx - vx);
      const arcR = Math.min(38, Math.min(rayLenX, rayLenY) * 0.45);
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, 0, angleRad); ctx.stroke();

      drawLabel("180° < θ < 360°", vx + arcR * 0.2, vy + arcR + 16, fontMath, danger);
      drawLabel("O", vx - 12, vy - 10, fontLabel, color);
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", bx - 10, by + 6, fontLabel, color, "right");
      drawLabel("Reflex Angle", cx, y1 + 14, fontTitle, color);
    } else if (geo === "typesOfAngles") {
      // 5-in-1 comparison diagram card across gw and gh
      const step = gw / 5;
      const titles = [
        { name: "Acute", deg: "< 90°", c: primary },
        { name: "Right", deg: "90°", c: accent },
        { name: "Obtuse", deg: "> 90°", c: warn },
        { name: "Straight", deg: "180°", c: "#8b5cf6" },
        { name: "Reflex", deg: "> 180°", c: danger }
      ];

      drawLabel("Types of Angles (NCERT Classification)", cx, y1 + 15, fontTitle, color);

      titles.forEach((item, idx) => {
        const ox = gx1 + step * (idx + 0.5);
        const oy = gy2 - 14;
        const subRay = Math.min(step * 0.38, gh * 0.42);

        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + subRay, oy); ctx.stroke();
        drawArrowHead(ctx, ox, oy, ox + subRay, oy, 6);

        if (idx === 0) {
          const bx = ox + subRay * 0.7, by = oy - subRay * 0.7;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
          drawArrowHead(ctx, ox, oy, bx, by, 6);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 12, -Math.PI / 4, 0); ctx.stroke();
        } else if (idx === 1) {
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - subRay); ctx.stroke();
          drawArrowHead(ctx, ox, oy, ox, oy - subRay, 6);
          ctx.strokeStyle = item.c; ctx.strokeRect(ox, oy - 10, 10, 10);
        } else if (idx === 2) {
          const bx = ox - subRay * 0.65, by = oy - subRay * 0.7;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
          drawArrowHead(ctx, ox, oy, bx, by, 6);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 14, -3 * Math.PI / 4, 0); ctx.stroke();
        } else if (idx === 3) {
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - subRay, oy); ctx.stroke();
          drawArrowHead(ctx, ox, oy, ox - subRay, oy, 6);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 12, Math.PI, 0); ctx.stroke();
        } else {
          const bx = ox - subRay * 0.65, by = oy + subRay * 0.55;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
          drawArrowHead(ctx, ox, oy, bx, by, 6);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 12, 0, 2.5); ctx.stroke();
        }

        drawLabel(item.name, ox, oy - subRay - 12, fontLabel, item.c);
        drawLabel(item.deg, ox, oy + 18, fontSmall, color);
      });
    }

    // =========================================================================
    // 2. TYPES OF TRIANGLES (BY SIDES)
    // =========================================================================
    else if (geo === "triangleEquilateral" || geo === "equilateralTriangle") {
      const topX = cx, topY = gy1 + 6;
      const bLeftX = gx1, bLeftY = gy2;
      const bRightX = gx2, bRightY = gy2;

      ctx.beginPath();
      ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Tick on each side
      drawTickMark(ctx, (topX + bLeftX) / 2, (topY + bLeftY) / 2, Math.atan2(bLeftY - topY, bLeftX - topX) + Math.PI / 2, 7);
      drawTickMark(ctx, (topX + bRightX) / 2, (topY + bRightY) / 2, Math.atan2(bRightY - topY, bRightX - topX) + Math.PI / 2, 7);
      drawTickMark(ctx, cx, bLeftY, Math.PI / 2, 7);

      // 60 deg angle arcs
      const arcR = Math.min(22, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(topX, topY, arcR, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, arcR, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, arcR, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      drawLabel("60°", topX, topY + arcR + 12, fontMath, primary);
      drawLabel("60°", bLeftX + arcR + 10, bLeftY - 8, fontMath, primary);
      drawLabel("60°", bRightX - arcR - 10, bRightY - 8, fontMath, primary);

      drawLabel("A", topX, topY - 12, fontLabel, color);
      drawLabel("B", bLeftX - 10, bLeftY + 8, fontLabel, color, "right");
      drawLabel("C", bRightX + 10, bLeftY + 8, fontLabel, color, "left");
      drawLabel("Equilateral (a = b = c, all angles = 60°)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "triangleIsosceles") {
      const topX = cx, topY = gy1 + 6;
      const bLeftX = gx1 + gw * 0.08, bLeftY = gy2;
      const bRightX = gx2 - gw * 0.08, bRightY = gy2;

      ctx.beginPath();
      ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Double ticks on equal legs
      const ang1 = Math.atan2(bLeftY - topY, bLeftX - topX) + Math.PI / 2;
      const m1x = (topX + bLeftX) / 2, m1y = (topY + bLeftY) / 2;
      drawTickMark(ctx, m1x - 3, m1y, ang1, 7);
      drawTickMark(ctx, m1x + 3, m1y, ang1, 7);

      const ang2 = Math.atan2(bRightY - topY, bRightX - topX) + Math.PI / 2;
      const m2x = (topX + bRightX) / 2, m2y = (topY + bRightY) / 2;
      drawTickMark(ctx, m2x - 3, m2y, ang2, 7);
      drawTickMark(ctx, m2x + 3, m2y, ang2, 7);

      // Base equal angles
      const arcR = Math.min(22, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, arcR, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, arcR, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      drawLabel("θ", bLeftX + arcR + 8, bLeftY - 8, fontMath, accent);
      drawLabel("θ", bRightX - arcR - 8, bRightY - 8, fontMath, accent);

      drawLabel("A", topX, topY - 12, fontLabel, color);
      drawLabel("B", bLeftX - 10, bLeftY + 8, fontLabel, color, "right");
      drawLabel("C", bRightX + 10, bLeftY + 8, fontLabel, color, "left");
      drawLabel("Isosceles (AB = AC, ∠B = ∠C)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "triangleScalene") {
      const topX = gx1 + gw * 0.35, topY = gy1 + 6;
      const bLeftX = gx1, bLeftY = gy2;
      const bRightX = gx2, bRightY = gy2;

      ctx.beginPath();
      ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Unequal tick marks (1, 2, 3)
      drawTickMark(ctx, (topX + bLeftX) / 2, (topY + bLeftY) / 2, 0.6, 7);
      const m2x = (topX + bRightX) / 2, m2y = (topY + bRightY) / 2;
      drawTickMark(ctx, m2x - 3, m2y, -0.6, 7);
      drawTickMark(ctx, m2x + 3, m2y, -0.6, 7);
      drawTickMark(ctx, cx - 6, bLeftY, Math.PI / 2, 7);
      drawTickMark(ctx, cx, bLeftY, Math.PI / 2, 7);
      drawTickMark(ctx, cx + 6, bLeftY, Math.PI / 2, 7);

      drawLabel("A", topX, topY - 12, fontLabel, color);
      drawLabel("B", bLeftX - 10, bLeftY + 8, fontLabel, color, "right");
      drawLabel("C", bRightX + 10, bLeftY + 8, fontLabel, color, "left");
      drawLabel("Scalene (All sides unequal: a ≠ b ≠ c)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "typesOfTrianglesSides") {
      const step = gw / 3;
      const baseY = gy2 - 8;

      drawLabel("Types of Triangles (Classified by Sides)", cx, y1 + 16, fontTitle, color);

      // 1. Equilateral
      const eqCx = gx1 + step * 0.5;
      const eqTopX = eqCx, eqTopY = gy1 + 24;
      const eqLx = eqCx - step * 0.38, eqRx = eqCx + step * 0.38;
      ctx.beginPath(); ctx.moveTo(eqTopX, eqTopY); ctx.lineTo(eqLx, baseY); ctx.lineTo(eqRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (eqTopX + eqLx) / 2, (eqTopY + baseY) / 2, 0.5, 6);
      drawTickMark(ctx, (eqTopX + eqRx) / 2, (eqTopY + baseY) / 2, -0.5, 6);
      drawTickMark(ctx, eqCx, baseY, Math.PI / 2, 6);
      drawLabel("Equilateral (3 equal sides)", eqCx, baseY + 18, fontLabel, primary);

      // 2. Isosceles
      const isoCx = gx1 + step * 1.5;
      const isoTopX = isoCx, isoTopY = gy1 + 24;
      const isoLx = isoCx - step * 0.30, isoRx = isoCx + step * 0.30;
      ctx.beginPath(); ctx.moveTo(isoTopX, isoTopY); ctx.lineTo(isoLx, baseY); ctx.lineTo(isoRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (isoTopX + isoLx) / 2 - 2, (isoTopY + baseY) / 2, 0.6, 6);
      drawTickMark(ctx, (isoTopX + isoLx) / 2 + 2, (isoTopY + baseY) / 2, 0.6, 6);
      drawTickMark(ctx, (isoTopX + isoRx) / 2 - 2, (isoTopY + baseY) / 2, -0.6, 6);
      drawTickMark(ctx, (isoTopX + isoRx) / 2 + 2, (isoTopY + baseY) / 2, -0.6, 6);
      drawLabel("Isosceles (2 equal sides)", isoCx, baseY + 18, fontLabel, accent);

      // 3. Scalene
      const scaCx = gx1 + step * 2.5;
      const scaTopX = scaCx - 8, scaTopY = gy1 + 24;
      const scaLx = scaCx - step * 0.40, scaRx = scaCx + step * 0.40;
      ctx.beginPath(); ctx.moveTo(scaTopX, scaTopY); ctx.lineTo(scaLx, baseY); ctx.lineTo(scaRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (scaTopX + scaLx) / 2, (scaTopY + baseY) / 2, 0.7, 6);
      drawTickMark(ctx, scaCx, baseY, Math.PI / 2, 6);
      drawLabel("Scalene (no equal sides)", scaCx, baseY + 18, fontLabel, warn);
    }

    // =========================================================================
    // 3. TRIANGLE CLASSIFICATION (BASED ON ANGLES)
    // =========================================================================
    else if (geo === "triangleAcuteAngled") {
      const topX = gx1 + gw * 0.42, topY = gy1 + 6;
      const bLeftX = gx1, bLeftY = gy2;
      const bRightX = gx2, bRightY = gy2;

      ctx.beginPath();
      ctx.moveTo(topX, topY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      const arcR = Math.min(22, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(topX, topY, arcR, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, arcR, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, arcR, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      drawLabel("A", topX, topY - 12, fontLabel, color);
      drawLabel("B", bLeftX - 10, bLeftY + 8, fontLabel, color, "right");
      drawLabel("C", bRightX + 10, bLeftY + 8, fontLabel, color, "left");
      drawLabel("Acute-Angled Triangle (All angles < 90°)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "rightTriangle") {
      const apexX = gx1, apexY = gy1 + 6;
      const cornerX = gx1, cornerY = gy2;
      const rightX = gx2, rightY = gy2;

      ctx.beginPath();
      ctx.moveTo(apexX, apexY); ctx.lineTo(cornerX, cornerY); ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.stroke();

      // Right angle marker
      const sq = Math.min(22, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = primary;
      ctx.strokeRect(cornerX, cornerY - sq, sq, sq);

      drawLabel("a", apexX - 14, (apexY + cornerY) / 2, fontMath, color, "right");
      drawLabel("b", (cornerX + rightX) / 2, cornerY + 14, fontMath, color, "center");
      drawLabel("c (hypotenuse)", (apexX + rightX) / 2 + 10, (apexY + rightY) / 2 - 12, fontMath, primary, "left");

      drawLabel("A", apexX - 6, apexY - 10, fontLabel, color);
      drawLabel("B", cornerX - 12, cornerY + 8, fontLabel, color, "right");
      drawLabel("C", rightX + 10, rightY + 8, fontLabel, color, "left");
      drawLabel("Right-Angled Triangle (c² = a² + b²)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "triangleObtuseAngled") {
      const apexX = gx1 + gw * 0.22, apexY = gy1 + 6;
      const obtX = gx1 + gw * 0.45, obtY = gy2;
      const rightX = gx2, rightY = gy2;

      ctx.beginPath();
      ctx.moveTo(apexX, apexY); ctx.lineTo(obtX, obtY); ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.stroke();

      const arcR = Math.min(24, Math.min(gw, gh) * 0.2);
      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.arc(obtX, obtY, arcR, -Math.PI * 0.8, 0); ctx.stroke();

      drawLabel("> 90°", obtX - arcR * 0.4, obtY - arcR - 8, fontMath, warn);
      drawLabel("A", apexX, apexY - 12, fontLabel, color);
      drawLabel("B", obtX, obtY + 16, fontLabel, color);
      drawLabel("C", rightX + 10, rightY + 8, fontLabel, color, "left");
      drawLabel("Obtuse-Angled Triangle (One angle > 90°)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "trianglesByAngles") {
      const step = gw / 3;
      const baseY = gy2 - 8;

      drawLabel("Triangles Classified by Angles", cx, y1 + 16, fontTitle, color);

      // 1. Acute
      const acCx = gx1 + step * 0.5;
      ctx.beginPath(); ctx.moveTo(acCx, gy1 + 24); ctx.lineTo(acCx - step * 0.38, baseY); ctx.lineTo(acCx + step * 0.38, baseY); ctx.closePath(); ctx.stroke();
      drawLabel("Acute (<90°)", acCx, baseY + 18, fontLabel, primary);

      // 2. Right
      const rtCx = gx1 + step * 1.5;
      const rx1 = rtCx - step * 0.35, rx2 = rtCx + step * 0.35;
      ctx.beginPath(); ctx.moveTo(rx1, gy1 + 24); ctx.lineTo(rx1, baseY); ctx.lineTo(rx2, baseY); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = accent; ctx.strokeRect(rx1, baseY - 12, 12, 12);
      drawLabel("Right (90°)", rtCx, baseY + 18, fontLabel, accent);

      // 3. Obtuse
      const obCx = gx1 + step * 2.5;
      ctx.beginPath(); ctx.moveTo(obCx - step * 0.25, gy1 + 24); ctx.lineTo(obCx - step * 0.05, baseY); ctx.lineTo(obCx + step * 0.42, baseY); ctx.closePath(); ctx.stroke();
      drawLabel("Obtuse (>90°)", obCx + step * 0.1, baseY + 18, fontLabel, warn);
    }

    // =========================================================================
    // 4. TYPES OF QUADRILATERALS
    // =========================================================================
    else if (geo === "quadSquare") {
      ctx.strokeRect(gx1, gy1, gw, gh);

      // Right angle square in all 4 corners
      const sq = Math.min(18, Math.min(gw, gh) * 0.15);
      ctx.strokeStyle = primary;
      ctx.strokeRect(gx1, gy1, sq, sq);
      ctx.strokeRect(gx2 - sq, gy1, sq, sq);
      ctx.strokeRect(gx2 - sq, gy2 - sq, sq, sq);
      ctx.strokeRect(gx1, gy2 - sq, sq, sq);

      // 4 equal side ticks
      drawTickMark(ctx, cx, gy1, 0, 7);
      drawTickMark(ctx, cx, gy2, 0, 7);
      drawTickMark(ctx, gx1, cy, Math.PI / 2, 7);
      drawTickMark(ctx, gx2, cy, Math.PI / 2, 7);

      drawLabel("s", cx, gy1 - 10, fontMath, color);
      drawLabel("s", cx, gy2 + 10, fontMath, color);
      drawLabel("s", gx1 - 10, cy, fontMath, color, "right");
      drawLabel("s", gx2 + 10, cy, fontMath, color, "left");

      drawLabel("A", gx1 - 6, gy1 - 10, fontLabel, color);
      drawLabel("B", gx2 + 6, gy1 - 10, fontLabel, color);
      drawLabel("C", gx2 + 6, gy2 + 14, fontLabel, color);
      drawLabel("D", gx1 - 6, gy2 + 14, fontLabel, color);
      drawLabel("Square (All sides equal, 4 right angles)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "quadRectangle") {
      ctx.strokeRect(gx1, gy1, gw, gh);

      const sq = Math.min(18, Math.min(gw, gh) * 0.15);
      ctx.strokeStyle = primary;
      ctx.strokeRect(gx1, gy1, sq, sq);
      ctx.strokeRect(gx2 - sq, gy1, sq, sq);
      ctx.strokeRect(gx2 - sq, gy2 - sq, sq, sq);
      ctx.strokeRect(gx1, gy2 - sq, sq, sq);

      // Opposite side ticks (1 on top/bottom, 2 on left/right)
      drawTickMark(ctx, cx, gy1, 0, 7);
      drawTickMark(ctx, cx, gy2, 0, 7);
      drawTickMark(ctx, gx1, cy - 3, Math.PI / 2, 7);
      drawTickMark(ctx, gx1, cy + 3, Math.PI / 2, 7);
      drawTickMark(ctx, gx2, cy - 3, Math.PI / 2, 7);
      drawTickMark(ctx, gx2, cy + 3, Math.PI / 2, 7);

      drawLabel("length (l)", cx, gy1 - 10, fontMath, color);
      drawLabel("width (w)", gx2 + 12, cy, fontMath, color, "left");

      drawLabel("A", gx1 - 6, gy1 - 10, fontLabel, color);
      drawLabel("B", gx2 + 6, gy1 - 10, fontLabel, color);
      drawLabel("C", gx2 + 6, gy2 + 14, fontLabel, color);
      drawLabel("D", gx1 - 6, gy2 + 14, fontLabel, color);
      drawLabel("Rectangle (Opposite sides equal & parallel, 90° angles)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "quadRhombus") {
      const topP = { x: cx, y: gy1 };
      const rightP = { x: gx2, y: cy };
      const bottomP = { x: cx, y: gy2 };
      const leftP = { x: gx1, y: cy };

      ctx.beginPath();
      ctx.moveTo(topP.x, topP.y); ctx.lineTo(rightP.x, rightP.y);
      ctx.lineTo(bottomP.x, bottomP.y); ctx.lineTo(leftP.x, leftP.y);
      ctx.closePath();
      ctx.stroke();

      // Perpendicular diagonals
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(leftP.x, leftP.y); ctx.lineTo(rightP.x, rightP.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(topP.x, topP.y); ctx.lineTo(bottomP.x, bottomP.y); ctx.stroke();
      ctx.restore();

      // Center perpendicular square
      const sq = 10;
      ctx.strokeStyle = primary;
      ctx.strokeRect(cx, cy - sq, sq, sq);

      // 4 equal ticks
      drawTickMark(ctx, (topP.x + rightP.x) / 2, (topP.y + rightP.y) / 2, Math.atan2(rightP.y - topP.y, rightP.x - topP.x) + Math.PI / 2, 6);
      drawTickMark(ctx, (rightP.x + bottomP.x) / 2, (rightP.y + bottomP.y) / 2, Math.atan2(bottomP.y - rightP.y, bottomP.x - rightP.x) + Math.PI / 2, 6);
      drawTickMark(ctx, (bottomP.x + leftP.x) / 2, (bottomP.y + leftP.y) / 2, Math.atan2(leftP.y - bottomP.y, leftP.x - bottomP.x) + Math.PI / 2, 6);
      drawTickMark(ctx, (leftP.x + topP.x) / 2, (leftP.y + topP.y) / 2, Math.atan2(topP.y - leftP.y, topP.x - leftP.x) + Math.PI / 2, 6);

      drawLabel("d₁", cx + gw * 0.2, cy - 8, fontMath, primary);
      drawLabel("d₂", cx - 8, cy - gh * 0.2, fontMath, primary);

      drawLabel("A", topP.x, topP.y - 12, fontLabel, color);
      drawLabel("B", rightP.x + 10, rightP.y, fontLabel, color, "left");
      drawLabel("C", bottomP.x, bottomP.y + 14, fontLabel, color);
      drawLabel("D", leftP.x - 10, leftP.y, fontLabel, color, "right");
      drawLabel("Rhombus (4 equal sides, diagonals ⊥ bisect)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "quadParallelogram") {
      const shift = gw * 0.22;
      const ax = gx1 + shift, ay = gy1;
      const bx = gx2, by = gy1;
      const cxP = gx2 - shift, cyP = gy2;
      const dx = gx1, dy = gy2;

      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cxP, cyP); ctx.lineTo(dx, dy);
      ctx.closePath();
      ctx.stroke();

      // Parallel arrows
      drawParallelArrow(ctx, (ax + bx) / 2, ay, 0, 7);
      drawParallelArrow(ctx, (dx + cxP) / 2, dy, 0, 7);
      drawParallelArrow(ctx, (ax + dx) / 2 - 3, (ay + dy) / 2, Math.atan2(dy - ay, dx - ax), 6);
      drawParallelArrow(ctx, (ax + dx) / 2 + 3, (ay + dy) / 2, Math.atan2(dy - ay, dx - ax), 6);
      drawParallelArrow(ctx, (bx + cxP) / 2 - 3, (by + cyP) / 2, Math.atan2(cyP - by, cxP - bx), 6);
      drawParallelArrow(ctx, (bx + cxP) / 2 + 3, (by + cyP) / 2, Math.atan2(cyP - by, cxP - bx), 6);

      // Altitude h
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, dy); ctx.stroke();
      ctx.strokeRect(ax, dy - 12, 12, 12);
      ctx.restore();

      drawLabel("h", ax - 10, (ay + dy) / 2, fontMath, primary, "right");
      drawLabel("base (b)", (dx + cxP) / 2, dy + 14, fontMath, color);

      drawLabel("A", ax - 6, ay - 10, fontLabel, color);
      drawLabel("B", bx + 6, by - 10, fontLabel, color);
      drawLabel("C", cxP + 10, cyP + 10, fontLabel, color, "left");
      drawLabel("D", dx - 10, dy + 10, fontLabel, color, "right");
      drawLabel("Parallelogram (Opposite sides equal & parallel)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "quadTrapezium") {
      const topOffset = gw * 0.22;
      const ax = gx1 + topOffset, ay = gy1;
      const bx = gx2 - topOffset, by = gy1;
      const cxP = gx2, cyP = gy2;
      const dx = gx1, dy = gy2;

      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cxP, cyP); ctx.lineTo(dx, dy);
      ctx.closePath();
      ctx.stroke();

      // Parallel arrows on bases AB and DC
      drawParallelArrow(ctx, (ax + bx) / 2, ay, 0, 8);
      drawParallelArrow(ctx, (dx + cxP) / 2, dy, 0, 8);

      // Altitude h
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, dy); ctx.stroke();
      ctx.strokeRect(ax, dy - 12, 12, 12);
      ctx.restore();

      drawLabel("a (top base)", (ax + bx) / 2, ay - 10, fontMath, color);
      drawLabel("b (bottom base)", (dx + cxP) / 2, dy + 14, fontMath, color);
      drawLabel("h", ax - 10, (ay + dy) / 2, fontMath, primary, "right");

      drawLabel("A", ax - 6, ay - 10, fontLabel, color);
      drawLabel("B", bx + 6, by - 10, fontLabel, color);
      drawLabel("C", cxP + 10, cyP + 10, fontLabel, color, "left");
      drawLabel("D", dx - 10, dy + 10, fontLabel, color, "right");
      drawLabel("Trapezium (One pair of parallel sides: a || b)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "typesOfQuadrilaterals") {
      const step = gw / 5;
      const quads = [
        { name: "Square", c: primary },
        { name: "Rectangle", c: accent },
        { name: "Rhombus", c: "#8b5cf6" },
        { name: "Parallelogram", c: "#059669" },
        { name: "Trapezium", c: warn }
      ];

      drawLabel("Classification of Quadrilaterals", cx, y1 + 16, fontTitle, color);

      quads.forEach((q, idx) => {
        const qx = gx1 + step * (idx + 0.5);
        const qy = gy1 + gh * 0.5;
        const qw = step * 0.72;
        const qh = gh * 0.44;

        ctx.strokeStyle = q.c;
        if (idx === 0) {
          ctx.strokeRect(qx - qw / 2, qy - qh / 2, qw, qw * 0.85);
        } else if (idx === 1) {
          ctx.strokeRect(qx - qw / 2, qy - qh / 2, qw, qh);
        } else if (idx === 2) {
          ctx.beginPath();
          ctx.moveTo(qx, qy - qh / 2); ctx.lineTo(qx + qw / 2, qy);
          ctx.lineTo(qx, qy + qh / 2); ctx.lineTo(qx - qw / 2, qy);
          ctx.closePath(); ctx.stroke();
        } else if (idx === 3) {
          const s = qw * 0.25;
          ctx.beginPath();
          ctx.moveTo(qx - qw / 2 + s, qy - qh / 2); ctx.lineTo(qx + qw / 2, qy - qh / 2);
          ctx.lineTo(qx + qw / 2 - s, qy + qh / 2); ctx.lineTo(qx - qw / 2, qy + qh / 2);
          ctx.closePath(); ctx.stroke();
        } else {
          const s = qw * 0.22;
          ctx.beginPath();
          ctx.moveTo(qx - qw / 2 + s, qy - qh / 2); ctx.lineTo(qx + qw / 2 - s, qy - qh / 2);
          ctx.lineTo(qx + qw / 2, qy + qh / 2); ctx.lineTo(qx - qw / 2, qy + qh / 2);
          ctx.closePath(); ctx.stroke();
        }

        drawLabel(q.name, qx, gy2 + 4, fontLabel, q.c);
      });
    }

    // =========================================================================
    // 5. TYPES OF POLYGONS
    // =========================================================================
    else if (geo === "polygonRegular") {
      // Regular hexagon inscribed responsively inside gw and gh
      const sides = 6;
      const rx = gw / 2 - 10;
      const ry = gh / 2 - 10;

      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const ang = (i * 2 * Math.PI) / sides - Math.PI / 6;
        const px = cx + rx * Math.cos(ang);
        const py = cy + ry * Math.sin(ang);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Equal side ticks on all sides
      for (let i = 0; i < sides; i++) {
        const ang1 = (i * 2 * Math.PI) / sides - Math.PI / 6;
        const ang2 = ((i + 1) * 2 * Math.PI) / sides - Math.PI / 6;
        const mx = cx + rx * (Math.cos(ang1) + Math.cos(ang2)) / 2;
        const my = cy + ry * (Math.sin(ang1) + Math.sin(ang2)) / 2;
        drawTickMark(ctx, mx, my, Math.atan2(Math.sin(ang2) - Math.sin(ang1), Math.cos(ang2) - Math.cos(ang1)) + Math.PI / 2, 6);
      }

      // Center point
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();

      drawLabel("O", cx - 8, cy - 8, fontLabel, primary);
      drawLabel("120°", cx + rx * 0.55, cy, fontMath, primary);
      drawLabel("Regular Hexagon (Equal sides, interior angles = 120°)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "polygonIrregular") {
      // 5-vertex irregular polygon scaled across gw and gh
      const pts = [
        { x: gx1 + gw * 0.2, y: gy1 + 6 },
        { x: gx2 - gw * 0.1, y: gy1 + gh * 0.15 },
        { x: gx2, y: gy2 - gh * 0.1 },
        { x: gx1 + gw * 0.35, y: gy2 },
        { x: gx1, y: gy1 + gh * 0.55 }
      ];

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.stroke();

      pts.forEach((p, idx) => {
        drawLabel(String.fromCharCode(65 + idx), p.x + (idx === 1 || idx === 2 ? 10 : -10), p.y, fontLabel, color);
      });

      drawLabel("Irregular Polygon (Unequal sides & angles)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "typesOfPolygons") {
      const halfW = gw / 2;
      const c1x = gx1 + halfW * 0.5;
      const c2x = gx1 + halfW * 1.5;

      drawLabel("Polygons: Regular vs Irregular", cx, y1 + 16, fontTitle, color);

      // Regular Hexagon
      const r = Math.min(halfW * 0.36, gh * 0.38);
      ctx.strokeStyle = primary;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * 2 * Math.PI) / 6;
        const px = c1x + r * Math.cos(ang);
        const py = cy + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      drawLabel("Regular (All sides equal)", c1x, gy2 + 6, fontLabel, primary);

      // Irregular Polygon
      ctx.strokeStyle = warn;
      const ipts = [
        { x: c2x - r * 0.9, y: cy - r * 0.6 },
        { x: c2x + r * 0.3, y: cy - r },
        { x: c2x + r * 0.95, y: cy + r * 0.2 },
        { x: c2x + r * 0.2, y: cy + r * 0.9 },
        { x: c2x - r * 0.8, y: cy + r * 0.4 }
      ];
      ctx.beginPath();
      ctx.moveTo(ipts[0].x, ipts[0].y);
      for (let i = 1; i < ipts.length; i++) ctx.lineTo(ipts[i].x, ipts[i].y);
      ctx.closePath(); ctx.stroke();
      drawLabel("Irregular (Unequal sides)", c2x, gy2 + 6, fontLabel, warn);
    }

    // =========================================================================
    // 6. CIRCLE COMPONENTS
    // =========================================================================
    else if (geo === "circleComponents") {
      const r = Math.min(gw * 0.38, gh * 0.44);

      // Master Circle
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      // Center O
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      drawLabel("O", cx - 10, cy - 10, fontLabel, primary);

      // Radius
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * Math.cos(-Math.PI / 4), cy + r * Math.sin(-Math.PI / 4)); ctx.stroke();
      drawLabel("Radius (r)", cx + r * 0.45, cy - r * 0.45, fontMath, accent);

      // Diameter
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      drawLabel("Diameter (d = 2r)", cx, cy + 14, fontMath, primary);

      // Chord AB
      ctx.strokeStyle = warn;
      const c1 = { x: cx - r * 0.7, y: cy - r * 0.7 };
      const c2 = { x: cx - r * 0.9, y: cy + r * 0.4 };
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
      drawLabel("Chord", (c1.x + c2.x) / 2 - 14, (c1.y + c2.y) / 2, fontMath, warn, "right");

      // Tangent Line stretching across full width
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.moveTo(gx1, cy + r); ctx.lineTo(gx2, cy + r); ctx.stroke();
      drawArrowHead(ctx, cx, cy + r, gx2, cy + r, 7);
      drawArrowHead(ctx, cx, cy + r, gx1, cy + r, 7);
      drawLabel("Tangent (OP ⊥ T)", cx + r * 0.4, cy + r + 14, fontMath, danger);

      // Secant Line stretching through circle
      ctx.strokeStyle = "#8b5cf6";
      const sY = cy - r * 0.55;
      ctx.beginPath(); ctx.moveTo(gx1 + 10, sY + 20); ctx.lineTo(gx2 - 10, sY - 20); ctx.stroke();
      drawArrowHead(ctx, cx, sY, gx2 - 10, sY - 20, 7);
      drawArrowHead(ctx, cx, sY, gx1 + 10, sY + 20, 7);
      drawLabel("Secant", gx2 - 40, sY - 24, fontMath, "#8b5cf6");

      drawLabel("Circle Components (Master NCERT Guide)", cx, y1 + 14, fontTitle, color);
    } else if (geo === "circleRadius") {
      const r = Math.min(gw, gh) / 2 - 8;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r, cy); ctx.stroke();

      drawLabel("O", cx - 12, cy, fontLabel, color, "right");
      drawLabel("P", cx + r + 10, cy, fontLabel, color, "left");
      drawLabel("Radius (r)", cx + r / 2, cy - 12, fontMath, accent);
      drawLabel("Circle with Radius (Circumference = 2πr)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "circleDiameter") {
      const r = Math.min(gw, gh) / 2 - 8;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();

      drawLabel("A", cx - r - 10, cy, fontLabel, color, "right");
      drawLabel("O", cx, cy - 12, fontLabel, color);
      drawLabel("B", cx + r + 10, cy, fontLabel, color, "left");
      drawLabel("Diameter d = 2r", cx, cy + 16, fontMath, primary);
      drawLabel("Circle with Diameter (Passes through Center O)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "circleChord") {
      const r = Math.min(gw, gh) / 2 - 8;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
      drawLabel("O", cx, cy + 14, fontLabel, color);

      const ax = cx - r * Math.cos(Math.PI / 4), ay = cy - r * Math.sin(Math.PI / 4);
      const bx = cx + r * Math.cos(Math.PI / 6), by = cy - r * Math.sin(Math.PI / 6);

      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();

      drawLabel("A", ax - 8, ay - 8, fontLabel, color, "right");
      drawLabel("B", bx + 8, by - 8, fontLabel, color, "left");
      drawLabel("Chord AB", (ax + bx) / 2, (ay + by) / 2 - 12, fontMath, warn);
      drawLabel("Circle with Chord & Circular Segment", cx, y2 - 4, fontTitle, color);
    } else if (geo === "circleTangent") {
      const r = Math.min(gw * 0.4, gh * 0.44);
      const cY = cy - 10;
      ctx.beginPath(); ctx.arc(cx, cY, r, 0, Math.PI * 2); ctx.stroke();

      const pX = cx, pY = cY + r;
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cY, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pX, pY, 4, 0, Math.PI * 2); ctx.fill();

      // Radius OP
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(cx, cY); ctx.lineTo(pX, pY); ctx.stroke();

      // Tangent line stretching full width
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.moveTo(gx1, pY); ctx.lineTo(gx2, pY); ctx.stroke();
      drawArrowHead(ctx, cx, pY, gx2, pY, 8);
      drawArrowHead(ctx, cx, pY, gx1, pY, 8);

      // Perpendicular square marker
      const sq = 12;
      ctx.strokeStyle = danger;
      ctx.strokeRect(pX, pY - sq, sq, sq);

      drawLabel("O", cx - 12, cY, fontLabel, color, "right");
      drawLabel("P (Point of Tangency)", pX, pY + 16, fontMath, danger);
      drawLabel("Radius r", cx - 12, (cY + pY) / 2, fontMath, accent, "right");
      drawLabel("Tangent line T (OP ⊥ T)", cx + r * 0.5, pY - 14, fontMath, danger);
      drawLabel("Circle with Tangent (Radius ⊥ Tangent at Point of Contact)", cx, y1 + 14, fontTitle, color);
    } else if (geo === "circleSecant") {
      const r = Math.min(gw * 0.4, gh * 0.44);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      drawLabel("O", cx, cy + 14, fontLabel, color);

      // Secant line stretching across gx1 to gx2
      const sy1 = cy - r * 0.7;
      const sy2 = cy + r * 0.5;
      ctx.strokeStyle = "#8b5cf6";
      ctx.beginPath(); ctx.moveTo(gx1, sy1); ctx.lineTo(gx2, sy2); ctx.stroke();
      drawArrowHead(ctx, cx, cy, gx2, sy2, 8);
      drawArrowHead(ctx, cx, cy, gx1, sy1, 8);

      drawLabel("Secant Line (intersects circle at 2 points)", cx, y2 - 4, fontTitle, color);
    } else if (geo === "unitCircle") {
      const r = Math.min(gw, gh) / 2 - 12;

      // Coordinate axes
      ctx.strokeStyle = isActuallyDark ? "#64748b" : "#cbd5e1";
      ctx.beginPath(); ctx.moveTo(gx1, cy); ctx.lineTo(gx2, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, gy1); ctx.lineTo(cx, gy2); ctx.stroke();
      drawArrowHead(ctx, cx, cy, gx2, cy, 7);
      drawArrowHead(ctx, cx, cy, cx, gy1, 7);

      // Circle
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

      drawLabel("(1, 0) · 0°", cx + r + 24, cy, fontSmall, primary, "left");
      drawLabel("(0, 1) · 90°", cx, cy - r - 12, fontSmall, primary);
      drawLabel("(-1, 0) · 180°", cx - r - 24, cy, fontSmall, primary, "right");
      drawLabel("(0, -1) · 270°", cx, cy + r + 14, fontSmall, primary);

      drawLabel("Trigonometric Unit Circle (r = 1)", cx, y1 + 14, fontTitle, color);
    }

    // =========================================================================
    // 7. LINES AND ANGLES
    // =========================================================================
    else if (geo === "linesTransversal") {
      const line1Y = gy1 + gh * 0.32;
      const line2Y = gy1 + gh * 0.70;

      // Parallel lines l and m stretching across full width
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(gx1, line1Y); ctx.lineTo(gx2, line1Y); ctx.stroke();
      drawArrowHead(ctx, cx, line1Y, gx2, line1Y, 8);
      drawArrowHead(ctx, cx, line1Y, gx1, line1Y, 8);

      ctx.beginPath(); ctx.moveTo(gx1, line2Y); ctx.lineTo(gx2, line2Y); ctx.stroke();
      drawArrowHead(ctx, cx, line2Y, gx2, line2Y, 8);
      drawArrowHead(ctx, cx, line2Y, gx1, line2Y, 8);

      // Transversal line t
      const tx1 = gx1 + gw * 0.22, ty1 = gy1 + 4;
      const tx2 = gx2 - gw * 0.22, ty2 = gy2 - 4;
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke();
      drawArrowHead(ctx, cx, cy, tx2, ty2, 8);
      drawArrowHead(ctx, cx, cy, tx1, ty1, 8);

      // Line labels
      drawLabel("Line l", gx2 + 8, line1Y, fontLabel, color, "left");
      drawLabel("Line m", gx2 + 8, line2Y, fontLabel, color, "left");
      drawLabel("Transversal t", tx1 - 10, ty1, fontLabel, primary, "right");

      // Intersections
      const int1X = tx1 + (tx2 - tx1) * ((line1Y - ty1) / (ty2 - ty1));
      const int2X = tx1 + (tx2 - tx1) * ((line2Y - ty1) / (ty2 - ty1));

      // 8 Angles in pill badges
      drawLabel("1", int1X - 16, line1Y - 14, fontMath, primary);
      drawLabel("2", int1X + 16, line1Y - 14, fontMath, primary);
      drawLabel("3", int1X - 16, line1Y + 14, fontMath, primary);
      drawLabel("4", int1X + 16, line1Y + 14, fontMath, primary);

      drawLabel("5", int2X - 16, line2Y - 14, fontMath, accent);
      drawLabel("6", int2X + 16, line2Y - 14, fontMath, accent);
      drawLabel("7", int2X - 16, line2Y + 14, fontMath, accent);
      drawLabel("8", int2X + 16, line2Y + 14, fontMath, accent);

      drawLabel("Parallel Lines (l || m) & Transversal (∠3=∠6 alt int, ∠1=∠5 corr)", cx, y2 - 4, fontTitle, color);
    }

    // =========================================================================
    // 8. CONGRUENT TRIANGLES
    // =========================================================================
    else if (geo === "congruentSSS" || geo === "congruentSAS" || geo === "congruentASA" || geo === "congruentRHS" || geo === "congruentTrianglesOverview") {
      const halfW = gw / 2 - 25;
      const t1x = gx1 + halfW / 2, t2x = gx2 - halfW / 2;
      const baseY = gy2 - 8;
      const topY = gy1 + 22;

      // Triangle 1: ABC
      const aX = t1x, aY = topY;
      const bX = t1x - halfW * 0.44, bY = baseY;
      const cX = t1x + halfW * 0.44, cY = baseY;

      // Triangle 2: DEF
      const dX = t2x, dY = topY;
      const eX = t2x - halfW * 0.44, eY = baseY;
      const fX = t2x + halfW * 0.44, fY = baseY;

      ctx.beginPath();
      ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath();
      ctx.moveTo(dX, dY); ctx.lineTo(eX, eY); ctx.lineTo(fX, fY); ctx.closePath();
      ctx.stroke();

      drawLabel("A", aX, aY - 10, fontLabel, color);
      drawLabel("B", bX - 10, bY + 6, fontLabel, color, "right");
      drawLabel("C", cX + 10, cY + 6, fontLabel, color, "left");

      drawLabel("D", dX, dY - 10, fontLabel, color);
      drawLabel("E", eX - 10, eY + 6, fontLabel, color, "right");
      drawLabel("F", fX + 10, fY + 6, fontLabel, color, "left");

      // Congruence symbol in center
      drawLabel("≅", cx, cy, `bold ${Math.round(26 * sFactor)}px sans-serif`, primary);

      if (geo === "congruentSSS") {
        drawTickMark(ctx, (aX + bX) / 2, (aY + bY) / 2, 0.6, 6);
        drawTickMark(ctx, (dX + eX) / 2, (dY + eY) / 2, 0.6, 6);
        drawTickMark(ctx, (aX + cX) / 2 - 3, (aY + cY) / 2, -0.6, 6);
        drawTickMark(ctx, (aX + cX) / 2 + 3, (aY + cY) / 2, -0.6, 6);
        drawTickMark(ctx, (dX + fX) / 2 - 3, (dY + fY) / 2, -0.6, 6);
        drawTickMark(ctx, (dX + fX) / 2 + 3, (dY + fY) / 2, -0.6, 6);
        drawTickMark(ctx, t1x, baseY, Math.PI / 2, 6);
        drawTickMark(ctx, t2x, baseY, Math.PI / 2, 6);
        drawLabel("SSS Congruence (All 3 pairs of corresponding sides equal)", cx, y1 + 14, fontTitle, color);
      } else if (geo === "congruentSAS") {
        drawTickMark(ctx, (aX + bX) / 2, (aY + bY) / 2, 0.6, 6);
        drawTickMark(ctx, (dX + eX) / 2, (dY + eY) / 2, 0.6, 6);
        drawTickMark(ctx, t1x, baseY, Math.PI / 2, 6);
        drawTickMark(ctx, t2x, baseY, Math.PI / 2, 6);
        ctx.strokeStyle = primary;
        ctx.beginPath(); ctx.arc(bX, bY, 16, -Math.PI / 3, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(eX, eY, 16, -Math.PI / 3, 0); ctx.stroke();
        drawLabel("SAS Congruence (2 sides and included angle equal)", cx, y1 + 14, fontTitle, color);
      } else if (geo === "congruentASA") {
        ctx.strokeStyle = primary;
        ctx.beginPath(); ctx.arc(bX, bY, 16, -Math.PI / 3, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(eX, eY, 16, -Math.PI / 3, 0); ctx.stroke();
        ctx.strokeStyle = accent;
        ctx.beginPath(); ctx.arc(cX, cY, 16, Math.PI, 4 * Math.PI / 3); ctx.stroke();
        ctx.beginPath(); ctx.arc(fX, fY, 16, Math.PI, 4 * Math.PI / 3); ctx.stroke();
        drawTickMark(ctx, t1x, baseY, Math.PI / 2, 6);
        drawTickMark(ctx, t2x, baseY, Math.PI / 2, 6);
        drawLabel("ASA Congruence (2 angles and included side equal)", cx, y1 + 14, fontTitle, color);
      } else if (geo === "congruentRHS") {
        ctx.strokeStyle = primary;
        ctx.strokeRect(bX, bY - 14, 14, 14);
        ctx.strokeRect(eX, eY - 14, 14, 14);
        drawTickMark(ctx, (aX + cX) / 2, (aY + cY) / 2, -0.6, 6);
        drawTickMark(ctx, (dX + fX) / 2, (dY + fY) / 2, -0.6, 6);
        drawTickMark(ctx, (aX + bX) / 2, (aY + bY) / 2, 0.6, 6);
        drawTickMark(ctx, (dX + eX) / 2, (dY + eY) / 2, 0.6, 6);
        drawLabel("RHS Congruence (Right angle, Hypotenuse & Side equal)", cx, y1 + 14, fontTitle, color);
      } else {
        drawLabel("Congruent Triangles Overview (SSS, SAS, ASA, RHS)", cx, y1 + 14, fontTitle, color);
      }
    }

    // =========================================================================
    // 9. SIMILAR TRIANGLES
    // =========================================================================
    else if (geo === "similarTriangles") {
      const baseY = gy2 - 8;
      const sW = gw * 0.32;
      const bW = gw * 0.48;

      // Small triangle ABC
      const sLx = gx1 + 5, sRx = sLx + sW;
      const sTx = sLx + sW * 0.45, sTy = baseY - gh * 0.55;

      // Big triangle DEF
      const bRx = gx2 - 5, bLx = bRx - bW;
      const bTx = bLx + bW * 0.45, bTy = gy1 + 18;

      ctx.beginPath();
      ctx.moveTo(sTx, sTy); ctx.lineTo(sLx, baseY); ctx.lineTo(sRx, baseY); ctx.closePath();
      ctx.moveTo(bTx, bTy); ctx.lineTo(bLx, baseY); ctx.lineTo(bRx, baseY); ctx.closePath();
      ctx.stroke();

      drawLabel("A", sTx, sTy - 10, fontLabel, color);
      drawLabel("B", sLx - 8, baseY, fontLabel, color, "right");
      drawLabel("C", sRx + 8, baseY, fontLabel, color, "left");

      drawLabel("D", bTx, bTy - 10, fontLabel, color);
      drawLabel("E", bLx - 8, baseY, fontLabel, color, "right");
      drawLabel("F", bRx + 8, baseY, fontLabel, color, "left");

      drawLabel("∼", cx, cy, `bold ${Math.round(28 * sFactor)}px sans-serif`, primary);

      drawLabel("Similar Triangles: ∠A=∠D, ∠B=∠E, ∠C=∠F & AB/DE = BC/EF = AC/DF = k", cx, y2 - 4, fontTitle, color);
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

/**
 * EduAshram Geometric Figures Engine
 * Aligned with NCERT Mathematics Class 6-10:
 * 1. Types of Angles (Acute, Right, Obtuse, Straight, Reflex, Overview)
 * 2. Types of Triangles by Sides (Equilateral, Isosceles, Scalene, Overview)
 * 3. Triangle Classification by Angles (Acute-angled, Right-angled, Obtuse-angled, Overview)
 * 4. Types of Quadrilaterals (Square, Rectangle, Rhombus, Parallelogram, Trapezium, Overview)
 * 5. Types of Polygons (Regular Hexagon, Irregular Polygon, Comparison)
 * 6. Circle Components (Radius, Diameter, Chord, Tangent, Secant, Master Guide)
 * 7. Lines and Angles (Parallel Lines & Transversal with Angle Pairs)
 * 8. Congruent Triangles (SSS, SAS, ASA, RHS, Overview)
 * 9. Similar Triangles (Scale Ratio & Corresponding Angles)
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
      w: 120,
      h: 95
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
      h: 80
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
      h: 100
    },
    {
      group: "triangles_sides",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Triangles (by Sides)",
      subtitle: "Comparison: Equilateral (3 equal), Isosceles (2 equal), Scalene (none equal)",
      type: "typesOfTrianglesSides",
      w: 260,
      h: 120
    },

    // --- 3. Triangle Classification (by Angles) ---
    {
      group: "triangles_angles",
      chip: "△ <90°",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Acute-Angled Triangle",
      subtitle: "All three interior angles are strictly acute (< 90°)",
      type: "triangleAcuteAngled",
      w: 120,
      h: 105
    },
    {
      group: "triangles_angles",
      chip: "△ 90°",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Right-Angled Triangle",
      subtitle: "One right angle (90°) with hypotenuse and legs (c² = a² + b²)",
      type: "rightTriangle",
      w: 120,
      h: 105
    },
    {
      group: "triangles_angles",
      chip: "△ >90°",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Obtuse-Angled Triangle",
      subtitle: "One interior angle is strictly obtuse (> 90°)",
      type: "triangleObtuseAngled",
      w: 135,
      h: 100
    },
    {
      group: "triangles_angles",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Triangles by Angles (Overview)",
      subtitle: "Side-by-side: Acute-angled, Right-angled, and Obtuse-angled",
      type: "trianglesByAngles",
      w: 260,
      h: 120
    },

    // --- 4. Types of Quadrilaterals ---
    {
      group: "quadrilaterals",
      chip: "Square",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
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
      w: 135,
      h: 95
    },
    {
      group: "quadrilaterals",
      chip: "Rhombus",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Rhombus",
      subtitle: "All 4 sides equal, opposite sides parallel, perpendicular diagonals",
      type: "quadRhombus",
      w: 125,
      h: 110
    },
    {
      group: "quadrilaterals",
      chip: "Parallelogram",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Parallelogram",
      subtitle: "Opposite sides equal & parallel, opposite angles equal",
      type: "quadParallelogram",
      w: 135,
      h: 95
    },
    {
      group: "quadrilaterals",
      chip: "Trapezium",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Trapezium",
      subtitle: "One pair of opposite sides parallel (bases a || b)",
      type: "quadTrapezium",
      w: 130,
      h: 95
    },
    {
      group: "quadrilaterals",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Quadrilaterals (Overview)",
      subtitle: "Overview: Square, Rectangle, Rhombus, Parallelogram & Trapezium",
      type: "typesOfQuadrilaterals",
      w: 270,
      h: 125
    },

    // --- 5. Types of Polygons ---
    {
      group: "polygons",
      chip: "Regular",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Regular Hexagon",
      subtitle: "All 6 sides and all 6 interior angles equal (120°)",
      type: "polygonRegular",
      w: 120,
      h: 115
    },
    {
      group: "polygons",
      chip: "Irregular",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Irregular Polygon",
      subtitle: "Sides and interior angles have different measures",
      type: "polygonIrregular",
      w: 125,
      h: 110
    },
    {
      group: "polygons",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Types of Polygons (Regular vs Irregular)",
      subtitle: "Comparison showing equal vs unequal sides & angles",
      type: "typesOfPolygons",
      w: 240,
      h: 120
    },

    // --- 6. Circle Components ---
    {
      group: "circles",
      chip: "Radius r",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Circle with Radius",
      subtitle: "Line segment from center O to circle boundary (r)",
      type: "circleRadius",
      w: 115,
      h: 115
    },
    {
      group: "circles",
      chip: "Diameter d",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Circle with Diameter",
      subtitle: "Longest chord passing through center O (d = 2r)",
      type: "circleDiameter",
      w: 120,
      h: 115
    },
    {
      group: "circles",
      chip: "Chord AB",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Circle with Chord",
      subtitle: "Line segment joining any two points on the circle",
      type: "circleChord",
      w: 115,
      h: 115
    },
    {
      group: "circles",
      chip: "Tangent",
      chipTheme: { bg: "#fff1f2", color: "#be123c", border: "#fecdd3" },
      title: "Circle with Tangent",
      subtitle: "Line touching circle at exactly 1 point; radius ⊥ tangent",
      type: "circleTangent",
      w: 130,
      h: 115
    },
    {
      group: "circles",
      chip: "Secant",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Secant Line",
      subtitle: "Line that intersects the circle at two distinct points",
      type: "circleSecant",
      w: 130,
      h: 115
    },
    {
      group: "circles",
      chip: "📐 Master Guide",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Circle Components (All-in-One)",
      subtitle: "Radius, Diameter, Chord, Tangent & Secant together",
      type: "circleComponents",
      w: 220,
      h: 155
    },
    {
      group: "circles",
      chip: "Trig Unit Circle",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Unit Circle (r = 1)",
      subtitle: "Standard coordinate circle for angle ratios & radian quadrants",
      type: "unitCircle",
      w: 140,
      h: 135
    },

    // --- 7. Lines and Angles ---
    {
      group: "lines_angles",
      chip: "Parallel & Transversal",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Parallel Lines & Transversal",
      subtitle: "Two parallel lines intersected by transversal with 8 angles",
      type: "linesTransversal",
      w: 190,
      h: 135
    },

    // --- 8. Congruent Triangles ---
    {
      group: "congruent_triangles",
      chip: "SSS",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "SSS Congruence Criterion",
      subtitle: "All three pairs of corresponding sides are equal",
      type: "congruentSSS",
      w: 190,
      h: 115
    },
    {
      group: "congruent_triangles",
      chip: "SAS",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "SAS Congruence Criterion",
      subtitle: "Two sides and the included angle are equal",
      type: "congruentSAS",
      w: 190,
      h: 115
    },
    {
      group: "congruent_triangles",
      chip: "ASA",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "ASA Congruence Criterion",
      subtitle: "Two angles and the included side are equal",
      type: "congruentASA",
      w: 190,
      h: 115
    },
    {
      group: "congruent_triangles",
      chip: "RHS",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "RHS Congruence Criterion",
      subtitle: "Right angle, hypotenuse and one side are equal",
      type: "congruentRHS",
      w: 190,
      h: 115
    },
    {
      group: "congruent_triangles",
      chip: "📊 Overview",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Congruence Criteria (Overview)",
      subtitle: "SSS, SAS, ASA, and RHS criteria comparison",
      type: "congruentTrianglesOverview",
      w: 190,
      h: 115
    },

    // --- 9. Similar Triangles ---
    {
      group: "similar_triangles",
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
    const w = Math.max(40, x2 - x1);
    const h = Math.max(30, y2 - y1);

    const isActuallyDark = !!isDark;
    let color = shape.color;
    if (isActuallyDark) {
      if (!color || color === "#0f172a" || color === "#000000") color = "#f8fafc";
    } else {
      if (!color || color === "#ffffff" || color === "#f8fafc" || color === "#f1f5f9") color = "#0f172a";
    }
    const primary = isActuallyDark ? "#38bdf8" : "#0284c7";
    const accent = isActuallyDark ? "#34d399" : "#10b981";
    const warn = isActuallyDark ? "#fbbf24" : "#f59e0b";
    const danger = isActuallyDark ? "#f87171" : "#ef4444";
    const width = shape.width || 2;
    const geo = shape.geoType || "rightTriangle";

    // Responsive typography reduced by 20% for refined, elegant proportions
    const sFactor = Math.min(Math.max(Math.min(w / 240, h / 180), 0.90), 2.0);
    const fontTitle = `bold ${Math.max(11, Math.round(12 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontLabel = `bold ${Math.max(10, Math.round(11 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontMath  = `bold ${Math.max(10, Math.round(10.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontSmall = `${Math.max(9, Math.round(9.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;

    // Protective halo label renderer - 100% visible, zero path corruption, zero occlusion
    function drawLabel(text, tx, ty, font, txtColor, align, baseline) {
      if (text === undefined || text === null || text === "") return;
      const str = String(text);
      ctx.save();
      ctx.font = font || fontLabel;
      ctx.textAlign = align || "center";
      ctx.textBaseline = baseline || "middle";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Protective halo matching board type
      ctx.strokeStyle = isActuallyDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.96)";
      ctx.lineWidth = Math.max(2.5, Math.round(3 * sFactor));
      ctx.strokeText(str, tx, ty);

      // High-contrast foreground text
      ctx.fillStyle = txtColor || color;
      ctx.fillText(str, tx, ty);
      ctx.restore();
    }

    // Geometry layout zone:
    // Heading is placed at y1 + 12
    // Generous, breathable gap between heading and figure geometry:
    // topY begins at y1 + 50 (leaving 38px of clear vertical clearance below heading center)
    // bottomY is at y2 - 14
    const padX = Math.max(14, Math.min(w * 0.07, 32));
    const gx1 = x1 + padX;
    const gx2 = x2 - padX;
    const gw = Math.max(20, gx2 - gx1);

    const topY = y1 + 50;
    const bottomY = y2 - 14;
    const gh = Math.max(20, bottomY - topY);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // =========================================================================
    // 1. TYPES OF ANGLES
    // =========================================================================
    if (geo === "angleAcute") {
      drawLabel("Acute Angle", cx, y1 + 12, fontTitle, color);

      const vx = gx1 + 10, vy = bottomY - 6;
      const rayLenX = gw - 22;
      const bx = vx + rayLenX * 0.70, by = topY + 8;

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      // Angled ray OB
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      // Angle arc
      const arcR = Math.min(38, Math.min(rayLenX, vy - by) * 0.38);
      const angleRad = Math.atan2(by - vy, bx - vx);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, angleRad, 0); ctx.stroke();

      drawLabel("θ < 90°", vx + arcR * 1.35, vy - arcR * 0.65, fontMath, primary);
      drawLabel("O", vx - 10, vy + 4, fontLabel, color, "right");
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", bx + 4, by - 10, fontLabel, color, "left");
    } else if (geo === "angleRight") {
      drawLabel("Right Angle", cx, y1 + 12, fontTitle, color);

      const vx = gx1 + 16, vy = bottomY - 6;
      const rayLenX = gw - 28;
      const rayLenY = vy - (topY + 6);

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      // Vertical ray OB
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx, vy - rayLenY); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx, vy - rayLenY);

      // Square 90 deg marker
      const sq = Math.min(22, Math.min(rayLenX, rayLenY) * 0.22);
      ctx.strokeStyle = primary;
      ctx.strokeRect(vx, vy - sq, sq, sq);

      drawLabel("90°", vx + sq + 14, vy - sq - 4, fontMath, primary);
      drawLabel("O", vx - 10, vy + 4, fontLabel, color, "right");
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", vx, vy - rayLenY - 10, fontLabel, color, "center");
    } else if (geo === "angleObtuse") {
      drawLabel("Obtuse Angle", cx, y1 + 12, fontTitle, color);

      const vx = cx + gw * 0.12, vy = bottomY - 6;
      const rayLenX = gx2 - vx - 8;
      const bx = gx1 + 8, by = topY + 6;

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      // Obtuse ray OB
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      const angleRad = Math.atan2(by - vy, bx - vx);
      const arcR = Math.min(38, Math.min(rayLenX, vy - by) * 0.35);
      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, angleRad, 0); ctx.stroke();

      drawLabel("90° < θ < 180°", vx - arcR * 0.75, vy - arcR * 0.9, fontMath, warn);
      drawLabel("O", vx + 4, vy + 12, fontLabel, color, "center");
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", bx - 6, by - 8, fontLabel, color, "right");
    } else if (geo === "angleStraight") {
      drawLabel("Straight Angle", cx, y1 + 12, fontTitle, color);

      const vx = cx, vy = bottomY - 14;
      const rayLen = gw / 2 - 10;

      ctx.beginPath(); ctx.moveTo(vx - rayLen, vy); ctx.lineTo(vx + rayLen, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLen, vy);
      drawArrowHead(ctx, vx, vy, vx - rayLen, vy);

      // Center point
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(vx, vy, 3.5, 0, Math.PI * 2); ctx.fill();

      // Semicircle arc
      const arcR = Math.min(40, Math.min(rayLen * 0.45, vy - topY - 12));
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, Math.PI, 0); ctx.stroke();

      drawLabel("180°", vx, vy - arcR - 10, fontMath, primary);
      drawLabel("O", vx, vy + 12, fontLabel, color);
      drawLabel("A", vx + rayLen + 10, vy, fontLabel, color, "left");
      drawLabel("B", vx - rayLen - 10, vy, fontLabel, color, "right");
    } else if (geo === "angleReflex") {
      drawLabel("Reflex Angle", cx, y1 + 12, fontTitle, color);

      const vx = cx - 20, vy = topY + 12;
      const rayLenX = gx2 - vx - 8;
      const bx = gx1 + 10, by = bottomY - 10;

      // Horizontal ray OA
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx + rayLenX, vy); ctx.stroke();
      drawArrowHead(ctx, vx, vy, vx + rayLenX, vy);

      // Down-left ray OB
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, by); ctx.stroke();
      drawArrowHead(ctx, vx, vy, bx, by);

      const angleRad = Math.atan2(by - vy, bx - vx);
      const arcR = Math.min(38, Math.min(rayLenX, by - vy) * 0.45);
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.arc(vx, vy, arcR, 0, angleRad); ctx.stroke();

      drawLabel("180° < θ < 360°", cx + 12, vy + arcR * 0.70, fontMath, danger);
      drawLabel("O", vx - 10, vy - 8, fontLabel, color);
      drawLabel("A", vx + rayLenX + 10, vy, fontLabel, color, "left");
      drawLabel("B", bx - 10, by + 6, fontLabel, color, "right");
    } else if (geo === "typesOfAngles") {
      drawLabel("Types of Angles (Overview)", cx, y1 + 12, fontTitle, color);

      const step = gw / 5;
      const titles = [
        { name: "Acute", deg: "< 90°", c: primary },
        { name: "Right", deg: "90°", c: accent },
        { name: "Obtuse", deg: "> 90°", c: warn },
        { name: "Straight", deg: "180°", c: "#8b5cf6" },
        { name: "Reflex", deg: "> 180°", c: danger }
      ];

      titles.forEach((item, idx) => {
        const ox = gx1 + step * (idx + 0.5);
        const oy = bottomY - 16;
        const subRay = Math.min(step * 0.38, (oy - topY) * 0.58);

        ctx.strokeStyle = color;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + subRay, oy); ctx.stroke();
        drawArrowHead(ctx, ox, oy, ox + subRay, oy, 5);

        if (idx === 0) {
          const bx = ox + subRay * 0.7, by = oy - subRay * 0.7;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
          drawArrowHead(ctx, ox, oy, bx, by, 5);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 10, -Math.PI / 4, 0); ctx.stroke();
        } else if (idx === 1) {
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - subRay); ctx.stroke();
          drawArrowHead(ctx, ox, oy, ox, oy - subRay, 5);
          ctx.strokeStyle = item.c; ctx.strokeRect(ox, oy - 8, 8, 8);
        } else if (idx === 2) {
          const bx = ox - subRay * 0.65, by = oy - subRay * 0.7;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
          drawArrowHead(ctx, ox, oy, bx, by, 5);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 12, -3 * Math.PI / 4, 0); ctx.stroke();
        } else if (idx === 3) {
          const bx = ox - subRay * 0.65, by = oy + subRay * 0.55;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - subRay, oy); ctx.stroke();
          drawArrowHead(ctx, ox, oy, ox - subRay, oy, 5);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 10, Math.PI, 0); ctx.stroke();
        } else {
          const bx = ox - subRay * 0.65, by = oy + subRay * 0.55;
          ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
          drawArrowHead(ctx, ox, oy, bx, by, 5);
          ctx.strokeStyle = item.c; ctx.beginPath(); ctx.arc(ox, oy, 10, 0, 2.5); ctx.stroke();
        }

        drawLabel(item.name, ox, oy - subRay - 8, fontSmall, item.c);
        drawLabel(item.deg, ox, oy + 10, fontSmall, color);
      });
    }

    // =========================================================================
    // 2. TYPES OF TRIANGLES (BY SIDES)
    // =========================================================================
    else if (geo === "triangleEquilateral" || geo === "equilateralTriangle") {
      drawLabel("Equilateral Triangle", cx, y1 + 12, fontTitle, color);

      const topX = cx, apexY = topY + 6;
      const bLeftX = gx1, bLeftY = bottomY - 14;
      const bRightX = gx2, bRightY = bottomY - 14;

      ctx.beginPath();
      ctx.moveTo(topX, apexY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Tick on each side
      drawTickMark(ctx, (topX + bLeftX) / 2, (apexY + bLeftY) / 2, Math.atan2(bLeftY - apexY, bLeftX - topX) + Math.PI / 2, 6);
      drawTickMark(ctx, (topX + bRightX) / 2, (apexY + bRightY) / 2, Math.atan2(bRightY - apexY, bRightX - topX) + Math.PI / 2, 6);
      drawTickMark(ctx, cx, bLeftY, Math.PI / 2, 6);

      // 60 deg angle arcs
      const arcR = Math.min(20, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(topX, apexY, arcR, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, arcR, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, arcR, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      drawLabel("60°", topX, apexY + arcR + 10, fontMath, primary);
      drawLabel("60°", bLeftX + arcR + 8, bLeftY - 6, fontMath, primary);
      drawLabel("60°", bRightX - arcR - 8, bRightY - 6, fontMath, primary);

      drawLabel("A", topX, apexY - 9, fontLabel, color);
      drawLabel("B", bLeftX - 8, bLeftY + 4, fontLabel, color, "right");
      drawLabel("C", bRightX + 8, bLeftY + 4, fontLabel, color, "left");

      drawLabel("a = b = c, all angles = 60°", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "triangleIsosceles") {
      drawLabel("Isosceles Triangle", cx, y1 + 12, fontTitle, color);

      const topX = cx, apexY = topY + 6;
      const bLeftX = gx1 + gw * 0.08, bLeftY = bottomY - 14;
      const bRightX = gx2 - gw * 0.08, bRightY = bottomY - 14;

      ctx.beginPath();
      ctx.moveTo(topX, apexY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Double ticks on equal legs
      const ang1 = Math.atan2(bLeftY - apexY, bLeftX - topX) + Math.PI / 2;
      const m1x = (topX + bLeftX) / 2, m1y = (apexY + bLeftY) / 2;
      drawTickMark(ctx, m1x - 2.5, m1y, ang1, 6);
      drawTickMark(ctx, m1x + 2.5, m1y, ang1, 6);

      const ang2 = Math.atan2(bRightY - apexY, bRightX - topX) + Math.PI / 2;
      const m2x = (topX + bRightX) / 2, m2y = (apexY + bRightY) / 2;
      drawTickMark(ctx, m2x - 2.5, m2y, ang2, 6);
      drawTickMark(ctx, m2x + 2.5, m2y, ang2, 6);

      // Base equal angles
      const arcR = Math.min(20, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, arcR, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, arcR, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      drawLabel("θ", bLeftX + arcR + 6, bLeftY - 6, fontMath, accent);
      drawLabel("θ", bRightX - arcR - 6, bRightY - 6, fontMath, accent);

      drawLabel("A", topX, apexY - 9, fontLabel, color);
      drawLabel("B", bLeftX - 8, bLeftY + 4, fontLabel, color, "right");
      drawLabel("C", bRightX + 8, bLeftY + 4, fontLabel, color, "left");

      drawLabel("AB = AC, ∠B = ∠C", cx, y2 - 6, fontSmall, accent);
    } else if (geo === "triangleScalene") {
      drawLabel("Scalene Triangle", cx, y1 + 12, fontTitle, color);

      const topX = gx1 + gw * 0.35, apexY = topY + 6;
      const bLeftX = gx1, bLeftY = bottomY - 14;
      const bRightX = gx2, bRightY = bottomY - 14;

      ctx.beginPath();
      ctx.moveTo(topX, apexY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      // Unequal tick marks (1, 2, 3)
      drawTickMark(ctx, (topX + bLeftX) / 2, (apexY + bLeftY) / 2, 0.6, 6);
      const m2x = (topX + bRightX) / 2, m2y = (apexY + bRightY) / 2;
      drawTickMark(ctx, m2x - 2.5, m2y, -0.6, 6);
      drawTickMark(ctx, m2x + 2.5, m2y, -0.6, 6);
      drawTickMark(ctx, cx - 5, bLeftY, Math.PI / 2, 6);
      drawTickMark(ctx, cx, bLeftY, Math.PI / 2, 6);
      drawTickMark(ctx, cx + 5, bLeftY, Math.PI / 2, 6);

      drawLabel("A", topX, apexY - 9, fontLabel, color);
      drawLabel("B", bLeftX - 8, bLeftY + 4, fontLabel, color, "right");
      drawLabel("C", bRightX + 8, bLeftY + 4, fontLabel, color, "left");

      drawLabel("All sides unequal: a ≠ b ≠ c", cx, y2 - 6, fontSmall, warn);
    } else if (geo === "typesOfTrianglesSides") {
      drawLabel("Types of Triangles (by Sides)", cx, y1 + 12, fontTitle, color);

      const step = gw / 3;
      const baseY = bottomY - 14;
      const tTopY = topY + 10;

      // 1. Equilateral
      const eqCx = gx1 + step * 0.5;
      const eqLx = eqCx - step * 0.38, eqRx = eqCx + step * 0.38;
      ctx.beginPath(); ctx.moveTo(eqCx, tTopY); ctx.lineTo(eqLx, baseY); ctx.lineTo(eqRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (eqCx + eqLx) / 2, (tTopY + baseY) / 2, 0.5, 5);
      drawTickMark(ctx, (eqCx + eqRx) / 2, (tTopY + baseY) / 2, -0.5, 5);
      drawTickMark(ctx, eqCx, baseY, Math.PI / 2, 5);
      drawLabel("Equilateral (3 equal)", eqCx, baseY + 10, fontSmall, primary);

      // 2. Isosceles
      const isoCx = gx1 + step * 1.5;
      const isoLx = isoCx - step * 0.30, isoRx = isoCx + step * 0.30;
      ctx.beginPath(); ctx.moveTo(isoCx, tTopY); ctx.lineTo(isoLx, baseY); ctx.lineTo(isoRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (isoCx + isoLx) / 2 - 2, (tTopY + baseY) / 2, 0.6, 5);
      drawTickMark(ctx, (isoCx + isoLx) / 2 + 2, (tTopY + baseY) / 2, 0.6, 5);
      drawTickMark(ctx, (isoCx + isoRx) / 2 - 2, (tTopY + baseY) / 2, -0.6, 5);
      drawTickMark(ctx, (isoCx + isoRx) / 2 + 2, (tTopY + baseY) / 2, -0.6, 5);
      drawLabel("Isosceles (2 equal)", isoCx, baseY + 10, fontSmall, accent);

      // 3. Scalene
      const scaCx = gx1 + step * 2.5;
      const scaTopX = scaCx - 8;
      const scaLx = scaCx - step * 0.40, scaRx = scaCx + step * 0.40;
      ctx.beginPath(); ctx.moveTo(scaTopX, tTopY); ctx.lineTo(scaLx, baseY); ctx.lineTo(scaRx, baseY); ctx.closePath(); ctx.stroke();
      drawTickMark(ctx, (scaTopX + scaLx) / 2, (tTopY + baseY) / 2, 0.7, 5);
      drawTickMark(ctx, scaCx, baseY, Math.PI / 2, 5);
      drawLabel("Scalene (none equal)", scaCx, baseY + 10, fontSmall, warn);
    }

    // =========================================================================
    // 3. TRIANGLE CLASSIFICATION (BASED ON ANGLES)
    // =========================================================================
    else if (geo === "triangleAcuteAngled") {
      drawLabel("Acute-Angled Triangle", cx, y1 + 12, fontTitle, color);

      const topX = gx1 + gw * 0.42, apexY = topY + 6;
      const bLeftX = gx1, bLeftY = bottomY - 14;
      const bRightX = gx2, bRightY = bottomY - 14;

      ctx.beginPath();
      ctx.moveTo(topX, apexY); ctx.lineTo(bLeftX, bLeftY); ctx.lineTo(bRightX, bRightY);
      ctx.closePath();
      ctx.stroke();

      const arcR = Math.min(20, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(topX, apexY, arcR, Math.PI / 3, 2 * Math.PI / 3); ctx.stroke();
      ctx.beginPath(); ctx.arc(bLeftX, bLeftY, arcR, -Math.PI / 3, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(bRightX, bRightY, arcR, Math.PI, 4 * Math.PI / 3); ctx.stroke();

      drawLabel("A", topX, apexY - 9, fontLabel, color);
      drawLabel("B", bLeftX - 8, bLeftY + 4, fontLabel, color, "right");
      drawLabel("C", bRightX + 8, bLeftY + 4, fontLabel, color, "left");

      drawLabel("All angles < 90°", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "rightTriangle") {
      drawLabel("Right-Angled Triangle", cx, y1 + 12, fontTitle, color);

      const apexX = gx1 + 10, apexY = topY + 6;
      const cornerX = gx1 + 10, cornerY = bottomY - 14;
      const rightX = gx2 - 6, rightY = bottomY - 14;

      ctx.beginPath();
      ctx.moveTo(apexX, apexY); ctx.lineTo(cornerX, cornerY); ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.stroke();

      // Right angle marker
      const sq = Math.min(18, Math.min(gw, gh) * 0.18);
      ctx.strokeStyle = primary;
      ctx.strokeRect(cornerX, cornerY - sq, sq, sq);

      drawLabel("a", apexX - 10, (apexY + cornerY) / 2, fontMath, color, "right");
      drawLabel("b", (cornerX + rightX) / 2, cornerY + 10, fontMath, color, "center");
      drawLabel("c", (apexX + rightX) / 2 + 10, (apexY + rightY) / 2 - 8, fontMath, primary, "left");

      drawLabel("A", apexX - 6, apexY - 9, fontLabel, color);
      drawLabel("B", cornerX - 8, cornerY + 4, fontLabel, color, "right");
      drawLabel("C", rightX + 8, rightY + 4, fontLabel, color, "left");

      drawLabel("c² = a² + b² (Pythagoras)", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "triangleObtuseAngled") {
      drawLabel("Obtuse-Angled Triangle", cx, y1 + 12, fontTitle, color);

      const apexX = gx1 + gw * 0.20, apexY = topY + 6;
      const obtX = gx1 + gw * 0.44, obtY = bottomY - 14;
      const rightX = gx2, rightY = bottomY - 14;

      ctx.beginPath();
      ctx.moveTo(apexX, apexY); ctx.lineTo(obtX, obtY); ctx.lineTo(rightX, rightY);
      ctx.closePath();
      ctx.stroke();

      const arcR = Math.min(22, Math.min(gw, gh) * 0.2);
      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.arc(obtX, obtY, arcR, -Math.PI * 0.8, 0); ctx.stroke();

      drawLabel("> 90°", obtX - arcR * 0.4, obtY - arcR - 6, fontMath, warn);
      drawLabel("A", apexX, apexY - 9, fontLabel, color);
      drawLabel("B", obtX - 8, obtY + 4, fontLabel, color, "right");
      drawLabel("C", rightX + 8, rightY + 4, fontLabel, color, "left");

      drawLabel("One angle > 90°", cx, y2 - 6, fontSmall, warn);
    } else if (geo === "trianglesByAngles") {
      drawLabel("Triangles by Angles", cx, y1 + 12, fontTitle, color);

      const step = gw / 3;
      const baseY = bottomY - 14;
      const tTopY = topY + 10;

      // 1. Acute
      const acCx = gx1 + step * 0.5;
      ctx.beginPath(); ctx.moveTo(acCx, tTopY); ctx.lineTo(acCx - step * 0.38, baseY); ctx.lineTo(acCx + step * 0.38, baseY); ctx.closePath(); ctx.stroke();
      drawLabel("Acute (<90°)", acCx, baseY + 10, fontSmall, primary);

      // 2. Right
      const rtCx = gx1 + step * 1.5;
      const rx1 = rtCx - step * 0.35, rx2 = rtCx + step * 0.35;
      ctx.beginPath(); ctx.moveTo(rx1, tTopY); ctx.lineTo(rx1, baseY); ctx.lineTo(rx2, baseY); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = accent; ctx.strokeRect(rx1, baseY - 8, 8, 8);
      drawLabel("Right (90°)", rtCx, baseY + 10, fontSmall, accent);

      // 3. Obtuse
      const obCx = gx1 + step * 2.5;
      ctx.beginPath(); ctx.moveTo(obCx - step * 0.25, tTopY); ctx.lineTo(obCx - step * 0.05, baseY); ctx.lineTo(obCx + step * 0.42, baseY); ctx.closePath(); ctx.stroke();
      drawLabel("Obtuse (>90°)", obCx + step * 0.1, baseY + 10, fontSmall, warn);
    }

    // =========================================================================
    // 4. TYPES OF QUADRILATERALS
    // =========================================================================
    else if (geo === "quadSquare") {
      drawLabel("Square", cx, y1 + 12, fontTitle, color);

      const s = Math.min(gw, bottomY - topY - 14);
      const qx1 = cx - s / 2, qx2 = cx + s / 2;
      const qy1 = topY + 6, qy2 = qy1 + s;

      ctx.strokeRect(qx1, qy1, s, s);

      // Right angle square in all 4 corners
      const sq = Math.min(14, s * 0.15);
      ctx.strokeStyle = primary;
      ctx.strokeRect(qx1, qy1, sq, sq);
      ctx.strokeRect(qx2 - sq, qy1, sq, sq);
      ctx.strokeRect(qx2 - sq, qy2 - sq, sq, sq);
      ctx.strokeRect(qx1, qy2 - sq, sq, sq);

      // 4 equal side ticks
      drawTickMark(ctx, cx, qy1, 0, 6);
      drawTickMark(ctx, cx, qy2, 0, 6);
      drawTickMark(ctx, qx1, (qy1 + qy2) / 2, Math.PI / 2, 6);
      drawTickMark(ctx, qx2, (qy1 + qy2) / 2, Math.PI / 2, 6);

      drawLabel("s", cx, qy1 - 6, fontMath, color);
      drawLabel("s", qx1 - 8, (qy1 + qy2) / 2, fontMath, color, "right");

      drawLabel("A", qx1 - 6, qy1 - 6, fontLabel, color, "right");
      drawLabel("B", qx2 + 6, qy1 - 6, fontLabel, color, "left");
      drawLabel("C", qx2 + 6, qy2 + 6, fontLabel, color, "left");
      drawLabel("D", qx1 - 6, qy2 + 6, fontLabel, color, "right");

      drawLabel("4 equal sides, 4 right angles", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "quadRectangle") {
      drawLabel("Rectangle", cx, y1 + 12, fontTitle, color);

      const rw = gw - 16;
      const rh = bottomY - topY - 18;
      const rx1 = cx - rw / 2, rx2 = cx + rw / 2;
      const ry1 = topY + 6, ry2 = ry1 + rh;

      ctx.strokeRect(rx1, ry1, rw, rh);

      const sq = Math.min(14, Math.min(rw, rh) * 0.15);
      ctx.strokeStyle = primary;
      ctx.strokeRect(rx1, ry1, sq, sq);
      ctx.strokeRect(rx2 - sq, ry1, sq, sq);
      ctx.strokeRect(rx2 - sq, ry2 - sq, sq, sq);
      ctx.strokeRect(rx1, ry2 - sq, sq, sq);

      // Opposite side ticks
      drawTickMark(ctx, cx, ry1, 0, 6);
      drawTickMark(ctx, cx, ry2, 0, 6);
      drawTickMark(ctx, rx1, (ry1 + ry2) / 2 - 2.5, Math.PI / 2, 6);
      drawTickMark(ctx, rx1, (ry1 + ry2) / 2 + 2.5, Math.PI / 2, 6);
      drawTickMark(ctx, rx2, (ry1 + ry2) / 2 - 2.5, Math.PI / 2, 6);
      drawTickMark(ctx, rx2, (ry1 + ry2) / 2 + 2.5, Math.PI / 2, 6);

      drawLabel("length (l)", cx, ry1 - 6, fontMath, color);
      drawLabel("width (w)", rx2 + 8, (ry1 + ry2) / 2, fontMath, color, "left");

      drawLabel("A", rx1 - 6, ry1 - 6, fontLabel, color, "right");
      drawLabel("B", rx2 + 6, ry1 - 6, fontLabel, color, "left");
      drawLabel("C", rx2 + 6, ry2 + 6, fontLabel, color, "left");
      drawLabel("D", rx1 - 6, ry2 + 6, fontLabel, color, "right");

      drawLabel("Opposite sides equal & parallel", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "quadRhombus") {
      drawLabel("Rhombus", cx, y1 + 12, fontTitle, color);

      const rTop = topY + 6, rBottom = bottomY - 16;
      const topP = { x: cx, y: rTop };
      const rightP = { x: gx2 - 8, y: (rTop + rBottom) / 2 };
      const bottomP = { x: cx, y: rBottom };
      const leftP = { x: gx1 + 8, y: (rTop + rBottom) / 2 };

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
      const sq = 8;
      ctx.strokeStyle = primary;
      ctx.strokeRect(cx, (rTop + rBottom) / 2 - sq, sq, sq);

      // 4 equal ticks
      drawTickMark(ctx, (topP.x + rightP.x) / 2, (topP.y + rightP.y) / 2, Math.atan2(rightP.y - topP.y, rightP.x - topP.x) + Math.PI / 2, 5);
      drawTickMark(ctx, (rightP.x + bottomP.x) / 2, (rightP.y + bottomP.y) / 2, Math.atan2(bottomP.y - rightP.y, bottomP.x - rightP.x) + Math.PI / 2, 5);
      drawTickMark(ctx, (bottomP.x + leftP.x) / 2, (bottomP.y + leftP.y) / 2, Math.atan2(leftP.y - bottomP.y, leftP.x - bottomP.x) + Math.PI / 2, 5);
      drawTickMark(ctx, (leftP.x + topP.x) / 2, (leftP.y + topP.y) / 2, Math.atan2(topP.y - leftP.y, topP.x - leftP.x) + Math.PI / 2, 5);

      drawLabel("A", topP.x, topP.y - 8, fontLabel, color);
      drawLabel("B", rightP.x + 6, rightP.y, fontLabel, color, "left");
      drawLabel("C", bottomP.x, bottomP.y + 8, fontLabel, color);
      drawLabel("D", leftP.x - 6, leftP.y, fontLabel, color, "right");

      drawLabel("4 equal sides, diagonals ⊥ bisect", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "quadParallelogram") {
      drawLabel("Parallelogram", cx, y1 + 12, fontTitle, color);

      const shift = gw * 0.22;
      const pTop = topY + 6, pBottom = bottomY - 16;
      const ax = gx1 + shift, ay = pTop;
      const bx = gx2 - 6, by = pTop;
      const cxP = gx2 - shift - 6, cyP = pBottom;
      const dx = gx1, dy = pBottom;

      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cxP, cyP); ctx.lineTo(dx, dy);
      ctx.closePath();
      ctx.stroke();

      // Parallel arrows
      drawParallelArrow(ctx, (ax + bx) / 2, ay, 0, 6);
      drawParallelArrow(ctx, (dx + cxP) / 2, dy, 0, 6);
      drawParallelArrow(ctx, (ax + dx) / 2 - 2.5, (ay + dy) / 2, Math.atan2(dy - ay, dx - ax), 5);
      drawParallelArrow(ctx, (ax + dx) / 2 + 2.5, (ay + dy) / 2, Math.atan2(dy - ay, dx - ax), 5);
      drawParallelArrow(ctx, (bx + cxP) / 2 - 2.5, (by + cyP) / 2, Math.atan2(cyP - by, cxP - bx), 5);
      drawParallelArrow(ctx, (bx + cxP) / 2 + 2.5, (by + cyP) / 2, Math.atan2(cyP - by, cxP - bx), 5);

      // Altitude h
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, dy); ctx.stroke();
      ctx.strokeRect(ax, dy - 8, 8, 8);
      ctx.restore();

      drawLabel("h", ax - 6, (ay + dy) / 2, fontMath, primary, "right");
      drawLabel("b", (dx + cxP) / 2, dy + 8, fontMath, color);

      drawLabel("A", ax - 6, ay - 6, fontLabel, color);
      drawLabel("B", bx + 6, by - 6, fontLabel, color);
      drawLabel("C", cxP + 6, cyP + 4, fontLabel, color, "left");
      drawLabel("D", dx - 6, dy + 4, fontLabel, color, "right");

      drawLabel("Opposite sides equal & parallel", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "quadTrapezium") {
      drawLabel("Trapezium", cx, y1 + 12, fontTitle, color);

      const topOffset = gw * 0.22;
      const tTop = topY + 6, tBottom = bottomY - 16;
      const ax = gx1 + topOffset, ay = tTop;
      const bx = gx2 - topOffset, by = tTop;
      const cxP = gx2 - 6, cyP = tBottom;
      const dx = gx1 + 6, dy = tBottom;

      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cxP, cyP); ctx.lineTo(dx, dy);
      ctx.closePath();
      ctx.stroke();

      // Parallel arrows on bases AB and DC
      drawParallelArrow(ctx, (ax + bx) / 2, ay, 0, 7);
      drawParallelArrow(ctx, (dx + cxP) / 2, dy, 0, 7);

      // Altitude h
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, dy); ctx.stroke();
      ctx.strokeRect(ax, dy - 8, 8, 8);
      ctx.restore();

      drawLabel("a", (ax + bx) / 2, ay - 6, fontMath, color);
      drawLabel("b", (dx + cxP) / 2, dy + 8, fontMath, color);
      drawLabel("h", ax - 6, (ay + dy) / 2, fontMath, primary, "right");

      drawLabel("A", ax - 6, ay - 6, fontLabel, color);
      drawLabel("B", bx + 6, by - 6, fontLabel, color);
      drawLabel("C", cxP + 6, cyP + 4, fontLabel, color, "left");
      drawLabel("D", dx - 6, dy + 4, fontLabel, color, "right");

      drawLabel("One pair of parallel sides (a || b)", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "typesOfQuadrilaterals") {
      drawLabel("Types of Quadrilaterals", cx, y1 + 12, fontTitle, color);

      const step = gw / 5;
      const quads = [
        { name: "Square", c: primary },
        { name: "Rectangle", c: accent },
        { name: "Rhombus", c: "#8b5cf6" },
        { name: "Parallelogram", c: "#059669" },
        { name: "Trapezium", c: warn }
      ];

      quads.forEach((q, idx) => {
        const qx = gx1 + step * (idx + 0.5);
        const qy = topY + (bottomY - topY) * 0.45;
        const qw = step * 0.72;
        const qh = (bottomY - topY) * 0.42;

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

        drawLabel(q.name, qx, bottomY - 6, fontSmall, q.c);
      });
    }

    // =========================================================================
    // 5. TYPES OF POLYGONS
    // =========================================================================
    else if (geo === "polygonRegular") {
      drawLabel("Regular Hexagon", cx, y1 + 12, fontTitle, color);

      const pCenterY = topY + (bottomY - topY - 14) / 2;
      const sides = 6;
      const rx = gw / 2 - 12;
      const ry = (bottomY - topY - 18) / 2;

      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const ang = (i * 2 * Math.PI) / sides - Math.PI / 6;
        const px = cx + rx * Math.cos(ang);
        const py = pCenterY + ry * Math.sin(ang);
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
        const my = pCenterY + ry * (Math.sin(ang1) + Math.sin(ang2)) / 2;
        drawTickMark(ctx, mx, my, Math.atan2(Math.sin(ang2) - Math.sin(ang1), Math.cos(ang2) - Math.cos(ang1)) + Math.PI / 2, 5);
      }

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, pCenterY, 3, 0, Math.PI * 2); ctx.fill();

      drawLabel("O", cx - 8, pCenterY - 8, fontLabel, primary);
      drawLabel("120°", cx + rx * 0.45, pCenterY, fontMath, primary);

      drawLabel("6 equal sides, interior angles = 120°", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "polygonIrregular") {
      drawLabel("Irregular Polygon", cx, y1 + 12, fontTitle, color);

      const pTop = topY + 6, pBottom = bottomY - 14;
      const pts = [
        { x: gx1 + gw * 0.2, y: pTop },
        { x: gx2 - gw * 0.1, y: pTop + (pBottom - pTop) * 0.15 },
        { x: gx2 - 4, y: pBottom - (pBottom - pTop) * 0.1 },
        { x: gx1 + gw * 0.35, y: pBottom },
        { x: gx1 + 4, y: pTop + (pBottom - pTop) * 0.55 }
      ];

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      ctx.stroke();

      pts.forEach((p, idx) => {
        drawLabel(String.fromCharCode(65 + idx), p.x + (idx === 1 || idx === 2 ? 8 : -8), p.y, fontLabel, color);
      });

      drawLabel("Unequal sides & angles", cx, y2 - 6, fontSmall, warn);
    } else if (geo === "typesOfPolygons") {
      drawLabel("Polygons (Regular vs Irregular)", cx, y1 + 12, fontTitle, color);

      const halfW = gw / 2;
      const c1x = gx1 + halfW * 0.5;
      const c2x = gx1 + halfW * 1.5;
      const pCenterY = topY + (bottomY - topY - 14) / 2;
      const r = Math.min(halfW * 0.36, (bottomY - topY - 18) / 2);

      // Regular Hexagon
      ctx.strokeStyle = primary;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i * 2 * Math.PI) / 6;
        const px = c1x + r * Math.cos(ang);
        const py = pCenterY + r * Math.sin(ang);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
      drawLabel("Regular (All sides equal)", c1x, bottomY - 6, fontSmall, primary);

      // Irregular Polygon
      ctx.strokeStyle = warn;
      const ipts = [
        { x: c2x - r * 0.9, y: pCenterY - r * 0.6 },
        { x: c2x + r * 0.3, y: pCenterY - r },
        { x: c2x + r * 0.95, y: pCenterY + r * 0.2 },
        { x: c2x + r * 0.2, y: pCenterY + r * 0.9 },
        { x: c2x - r * 0.8, y: pCenterY + r * 0.4 }
      ];
      ctx.beginPath();
      ctx.moveTo(ipts[0].x, ipts[0].y);
      for (let i = 1; i < ipts.length; i++) ctx.lineTo(ipts[i].x, ipts[i].y);
      ctx.closePath(); ctx.stroke();
      drawLabel("Irregular (Unequal sides)", c2x, bottomY - 6, fontSmall, warn);
    }

    // =========================================================================
    // 6. CIRCLE COMPONENTS
    // =========================================================================
    else if (geo === "circleComponents") {
      drawLabel("Circle Components", cx, y1 + 12, fontTitle, color);

      const cCenterY = topY + (bottomY - topY - 14) / 2;
      const r = Math.min(gw * 0.36, (bottomY - topY - 22) / 2);

      // Master Circle
      ctx.beginPath(); ctx.arc(cx, cCenterY, r, 0, Math.PI * 2); ctx.stroke();

      // Center O
      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cCenterY, 3, 0, Math.PI * 2); ctx.fill();
      drawLabel("O", cx - 8, cCenterY - 8, fontLabel, primary);

      // Radius
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(cx, cCenterY); ctx.lineTo(cx + r * Math.cos(-Math.PI / 4), cCenterY + r * Math.sin(-Math.PI / 4)); ctx.stroke();
      drawLabel("Radius (r)", cx + r * 0.45, cCenterY - r * 0.45, fontSmall, accent);

      // Diameter
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(cx - r, cCenterY); ctx.lineTo(cx + r, cCenterY); ctx.stroke();
      drawLabel("Diameter (d)", cx, cCenterY + 10, fontSmall, primary);

      // Chord AB
      ctx.strokeStyle = warn;
      const c1 = { x: cx - r * 0.7, y: cCenterY - r * 0.7 };
      const c2 = { x: cx - r * 0.9, y: cCenterY + r * 0.4 };
      ctx.beginPath(); ctx.moveTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.stroke();
      drawLabel("Chord", (c1.x + c2.x) / 2 - 10, (c1.y + c2.y) / 2, fontSmall, warn, "right");

      // Tangent Line
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.moveTo(gx1, cCenterY + r); ctx.lineTo(gx2, cCenterY + r); ctx.stroke();
      drawArrowHead(ctx, cx, cCenterY + r, gx2, cCenterY + r, 6);
      drawArrowHead(ctx, cx, cCenterY + r, gx1, cCenterY + r, 6);
      drawLabel("Tangent", cx + r * 0.5, cCenterY + r + 8, fontSmall, danger);

      // Secant Line
      ctx.strokeStyle = "#8b5cf6";
      const sY = cCenterY - r * 0.55;
      ctx.beginPath(); ctx.moveTo(gx1 + 10, sY + 16); ctx.lineTo(gx2 - 10, sY - 16); ctx.stroke();
      drawArrowHead(ctx, cx, sY, gx2 - 10, sY - 16, 6);
      drawArrowHead(ctx, cx, sY, gx1 + 10, sY + 16, 6);
      drawLabel("Secant", gx2 - 32, sY - 14, fontSmall, "#8b5cf6");
    } else if (geo === "circleRadius") {
      drawLabel("Circle with Radius", cx, y1 + 12, fontTitle, color);

      const cCenterY = topY + (bottomY - topY - 14) / 2;
      const r = Math.min(gw / 2 - 10, (bottomY - topY - 20) / 2);

      ctx.beginPath(); ctx.arc(cx, cCenterY, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cCenterY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(cx, cCenterY); ctx.lineTo(cx + r, cCenterY); ctx.stroke();

      drawLabel("O", cx - 8, cCenterY, fontLabel, color, "right");
      drawLabel("P", cx + r + 8, cCenterY, fontLabel, color, "left");
      drawLabel("Radius (r)", cx + r / 2, cCenterY - 8, fontMath, accent);

      drawLabel("Circumference = 2πr, Area = πr²", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "circleDiameter") {
      drawLabel("Circle with Diameter", cx, y1 + 12, fontTitle, color);

      const cCenterY = topY + (bottomY - topY - 14) / 2;
      const r = Math.min(gw / 2 - 10, (bottomY - topY - 20) / 2);

      ctx.beginPath(); ctx.arc(cx, cCenterY, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cCenterY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(cx - r, cCenterY); ctx.lineTo(cx + r, cCenterY); ctx.stroke();

      drawLabel("A", cx - r - 6, cCenterY, fontLabel, color, "right");
      drawLabel("O", cx, cCenterY - 8, fontLabel, color);
      drawLabel("B", cx + r + 6, cCenterY, fontLabel, color, "left");
      drawLabel("d = 2r", cx, cCenterY + 10, fontMath, primary);

      drawLabel("Passes through Center O, d = 2r", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "circleChord") {
      drawLabel("Circle with Chord", cx, y1 + 12, fontTitle, color);

      const cCenterY = topY + (bottomY - topY - 14) / 2;
      const r = Math.min(gw / 2 - 10, (bottomY - topY - 20) / 2);

      ctx.beginPath(); ctx.arc(cx, cCenterY, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cCenterY, 3, 0, Math.PI * 2); ctx.fill();
      drawLabel("O", cx, cCenterY + 10, fontLabel, color);

      const ax = cx - r * Math.cos(Math.PI / 4), ay = cCenterY - r * Math.sin(Math.PI / 4);
      const bx = cx + r * Math.cos(Math.PI / 6), by = cCenterY - r * Math.sin(Math.PI / 6);

      ctx.strokeStyle = warn;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();

      drawLabel("A", ax - 6, ay - 6, fontLabel, color, "right");
      drawLabel("B", bx + 6, by - 6, fontLabel, color, "left");
      drawLabel("Chord AB", (ax + bx) / 2, (ay + by) / 2 - 8, fontMath, warn);

      drawLabel("Line segment joining 2 points on circle", cx, y2 - 6, fontSmall, warn);
    } else if (geo === "circleTangent") {
      drawLabel("Circle with Tangent", cx, y1 + 12, fontTitle, color);

      const r = Math.min(gw * 0.38, (bottomY - topY - 24) / 2);
      const cCenterY = topY + r + 4;
      const pX = cx, pY = cCenterY + r;

      ctx.beginPath(); ctx.arc(cx, cCenterY, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cCenterY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pX, pY, 3, 0, Math.PI * 2); ctx.fill();

      // Radius OP
      ctx.strokeStyle = accent;
      ctx.beginPath(); ctx.moveTo(cx, cCenterY); ctx.lineTo(pX, pY); ctx.stroke();

      // Tangent line
      ctx.strokeStyle = danger;
      ctx.beginPath(); ctx.moveTo(gx1, pY); ctx.lineTo(gx2, pY); ctx.stroke();
      drawArrowHead(ctx, cx, pY, gx2, pY, 7);
      drawArrowHead(ctx, cx, pY, gx1, pY, 7);

      // Perpendicular square marker
      const sq = 10;
      ctx.strokeStyle = danger;
      ctx.strokeRect(pX, pY - sq, sq, sq);

      drawLabel("O", cx - 8, cCenterY, fontLabel, color, "right");
      drawLabel("P", pX, pY + 10, fontMath, danger);
      drawLabel("Radius r", cx - 8, (cCenterY + pY) / 2, fontMath, accent, "right");
      drawLabel("Tangent T", gx2 - 28, pY - 8, fontMath, danger);

      drawLabel("Radius ⊥ Tangent (OP ⊥ T)", cx, y2 - 6, fontSmall, danger);
    } else if (geo === "circleSecant") {
      drawLabel("Secant Line", cx, y1 + 12, fontTitle, color);

      const cCenterY = topY + (bottomY - topY - 14) / 2;
      const r = Math.min(gw * 0.38, (bottomY - topY - 20) / 2);

      ctx.beginPath(); ctx.arc(cx, cCenterY, r, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cCenterY, 3, 0, Math.PI * 2); ctx.fill();
      drawLabel("O", cx, cCenterY + 10, fontLabel, color);

      // Secant line
      const sy1 = cCenterY - r * 0.7;
      const sy2 = cCenterY + r * 0.5;
      ctx.strokeStyle = "#8b5cf6";
      ctx.beginPath(); ctx.moveTo(gx1, sy1); ctx.lineTo(gx2, sy2); ctx.stroke();
      drawArrowHead(ctx, cx, cCenterY, gx2, sy2, 7);
      drawArrowHead(ctx, cx, cCenterY, gx1, sy1, 7);

      drawLabel("Intersects circle at two points", cx, y2 - 6, fontSmall, primary);
    } else if (geo === "unitCircle") {
      drawLabel("Trigonometric Unit Circle", cx, y1 + 12, fontTitle, color);

      const cCenterY = topY + (bottomY - topY - 14) / 2;
      const r = Math.min(gw / 2 - 24, (bottomY - topY - 24) / 2);

      // Coordinate axes
      ctx.strokeStyle = isActuallyDark ? "#64748b" : "#cbd5e1";
      ctx.beginPath(); ctx.moveTo(gx1, cCenterY); ctx.lineTo(gx2, cCenterY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, topY + 4); ctx.lineTo(cx, bottomY - 6); ctx.stroke();
      drawArrowHead(ctx, cx, cCenterY, gx2, cCenterY, 6);
      drawArrowHead(ctx, cx, cCenterY, cx, topY + 4, 6);

      // Circle
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.arc(cx, cCenterY, r, 0, Math.PI * 2); ctx.stroke();

      drawLabel("(1, 0)", cx + r + 16, cCenterY, fontSmall, primary, "left");
      drawLabel("(0, 1)", cx, cCenterY - r - 6, fontSmall, primary);
      drawLabel("(-1, 0)", cx - r - 16, cCenterY, fontSmall, primary, "right");
      drawLabel("(0, -1)", cx, cCenterY + r + 6, fontSmall, primary);

      drawLabel("x = cos θ, y = sin θ, r = 1", cx, y2 - 6, fontSmall, primary);
    }

    // =========================================================================
    // 7. LINES AND ANGLES
    // =========================================================================
    else if (geo === "linesTransversal") {
      drawLabel("Parallel Lines & Transversal", cx, y1 + 12, fontTitle, color);

      const line1Y = topY + (bottomY - topY) * 0.28;
      const line2Y = topY + (bottomY - topY) * 0.68;

      // Parallel lines l and m
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.moveTo(gx1, line1Y); ctx.lineTo(gx2, line1Y); ctx.stroke();
      drawArrowHead(ctx, cx, line1Y, gx2, line1Y, 7);
      drawArrowHead(ctx, cx, line1Y, gx1, line1Y, 7);

      ctx.beginPath(); ctx.moveTo(gx1, line2Y); ctx.lineTo(gx2, line2Y); ctx.stroke();
      drawArrowHead(ctx, cx, line2Y, gx2, line2Y, 7);
      drawArrowHead(ctx, cx, line2Y, gx1, line2Y, 7);

      // Transversal line t
      const tx1 = gx1 + gw * 0.22, ty1 = topY + 4;
      const tx2 = gx2 - gw * 0.22, ty2 = bottomY - 6;
      ctx.strokeStyle = primary;
      ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke();
      drawArrowHead(ctx, cx, cy, tx2, ty2, 7);
      drawArrowHead(ctx, cx, cy, tx1, ty1, 7);

      drawLabel("Line l", gx2 + 8, line1Y, fontLabel, color, "left");
      drawLabel("Line m", gx2 + 8, line2Y, fontLabel, color, "left");
      drawLabel("t", tx1 - 6, ty1, fontLabel, primary, "right");

      // Intersections
      const int1X = tx1 + (tx2 - tx1) * ((line1Y - ty1) / (ty2 - ty1));
      const int2X = tx1 + (tx2 - tx1) * ((line2Y - ty1) / (ty2 - ty1));

      // 8 Angles - spacious quadrant placement avoiding lines and transversal
      const offX_wide = Math.max(26, Math.round(30 * sFactor));
      const offX_mid  = Math.max(16, Math.round(18 * sFactor));
      const offY      = Math.max(12, Math.round(14 * sFactor));

      // Intersection 1 (Line l):
      // Angle 1: Exterior top-left (left of transversal, above line l)
      drawLabel("1", int1X - offX_wide, line1Y - offY, fontMath, primary);
      // Angle 2: Interior top-right (right of transversal, above line l)
      drawLabel("2", int1X + offX_mid, line1Y - offY, fontMath, primary);
      // Angle 3: Interior bottom-left (left of transversal, below line l)
      drawLabel("3", int1X - offX_mid, line1Y + offY, fontMath, primary);
      // Angle 4: Exterior bottom-right (right of transversal, below line l)
      drawLabel("4", int1X + offX_wide, line1Y + offY, fontMath, primary);

      // Intersection 2 (Line m):
      // Angle 5: Exterior top-left (left of transversal, above line m)
      drawLabel("5", int2X - offX_wide, line2Y - offY, fontMath, accent);
      // Angle 6: Interior top-right (right of transversal, above line m)
      drawLabel("6", int2X + offX_mid, line2Y - offY, fontMath, accent);
      // Angle 7: Interior bottom-left (left of transversal, below line m)
      drawLabel("7", int2X - offX_mid, line2Y + offY, fontMath, accent);
      // Angle 8: Exterior bottom-right (right of transversal, below line m)
      drawLabel("8", int2X + offX_wide, line2Y + offY, fontMath, accent);

      drawLabel("∠3=∠6 (alt int), ∠1=∠5 (corr)", cx, y2 - 6, fontSmall, primary);
    }

    // =========================================================================
    // 8. CONGRUENT TRIANGLES
    // =========================================================================
    else if (geo === "congruentRHS") {
      drawLabel("RHS Congruence Criterion", cx, y1 + 12, fontTitle, color);

      const halfW = gw / 2 - 20;
      const t1x = gx1 + halfW / 2, t2x = gx2 - halfW / 2;
      const baseY = bottomY - 14;
      const tTopY = topY + 8;
      const legW = halfW * 0.72;

      // Triangle 1: Right-angled at B (AB ⊥ BC)
      const bX = t1x - legW * 0.46, bY = baseY;
      const aX = bX, aY = tTopY; // AB is vertical
      const cX = bX + legW, cY = baseY; // BC is horizontal

      // Triangle 2: Right-angled at E (DE ⊥ EF)
      const eX = t2x - legW * 0.46, eY = baseY;
      const dX = eX, dY = tTopY; // DE is vertical
      const fX = eX + legW, fY = baseY; // EF is horizontal

      ctx.beginPath();
      ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath();
      ctx.moveTo(dX, dY); ctx.lineTo(eX, eY); ctx.lineTo(fX, fY); ctx.closePath();
      ctx.stroke();

      // Right-angle square markers at B and E
      const sq = Math.min(14, Math.min(legW, baseY - tTopY) * 0.20);
      ctx.strokeStyle = primary;
      ctx.strokeRect(bX, bY - sq, sq, sq);
      ctx.strokeRect(eX, eY - sq, sq, sq);

      // Hypotenuse AC = DF (indicated with double tick marks)
      const angH1 = Math.atan2(cY - aY, cX - aX) + Math.PI / 2;
      const m1x = (aX + cX) / 2, m1y = (aY + cY) / 2;
      drawTickMark(ctx, m1x - 2.5 * Math.cos(angH1), m1y - 2.5 * Math.sin(angH1), angH1, 6);
      drawTickMark(ctx, m1x + 2.5 * Math.cos(angH1), m1y + 2.5 * Math.sin(angH1), angH1, 6);

      const angH2 = Math.atan2(fY - dY, fX - dX) + Math.PI / 2;
      const m2x = (dX + fX) / 2, m2y = (dY + fY) / 2;
      drawTickMark(ctx, m2x - 2.5 * Math.cos(angH2), m2y - 2.5 * Math.sin(angH2), angH2, 6);
      drawTickMark(ctx, m2x + 2.5 * Math.cos(angH2), m2y + 2.5 * Math.sin(angH2), angH2, 6);

      // Equal side (leg) AB = DE (indicated with single tick mark)
      drawTickMark(ctx, bX, (aY + bY) / 2, 0, 6);
      drawTickMark(ctx, eX, (dY + eY) / 2, 0, 6);

      // Labels
      drawLabel("A", aX - 4, aY - 9, fontLabel, color, "right");
      drawLabel("B", bX - 8, bY + 4, fontLabel, color, "right");
      drawLabel("C", cX + 8, cY + 4, fontLabel, color, "left");

      drawLabel("D", dX - 4, dY - 9, fontLabel, color, "right");
      drawLabel("E", eX - 8, eY + 4, fontLabel, color, "right");
      drawLabel("F", fX + 8, fY + 4, fontLabel, color, "left");

      // Congruence symbol in center
      drawLabel("≅", cx, (tTopY + baseY) / 2, `bold ${Math.round(22 * sFactor)}px sans-serif`, primary);

      drawLabel("RHS: Right angle (∠B=∠E=90°), Hypotenuse (AC=DF) & Side (AB=DE) equal", cx, y2 - 6, fontSmall, primary);
    }
    else if (geo === "congruentSSS" || geo === "congruentSAS" || geo === "congruentASA" || geo === "congruentTrianglesOverview") {
      let critTitle = "Congruent Triangles";
      let critRule = "△ABC ≅ △DEF";
      if (geo === "congruentSSS") { critTitle = "SSS Congruence Criterion"; critRule = "All 3 pairs of corresponding sides equal"; }
      else if (geo === "congruentSAS") { critTitle = "SAS Congruence Criterion"; critRule = "2 sides and included angle equal"; }
      else if (geo === "congruentASA") { critTitle = "ASA Congruence Criterion"; critRule = "2 angles and included side equal"; }

      drawLabel(critTitle, cx, y1 + 12, fontTitle, color);

      const halfW = gw / 2 - 20;
      const t1x = gx1 + halfW / 2, t2x = gx2 - halfW / 2;
      const baseY = bottomY - 14;
      const tTopY = topY + 8;

      // Triangle 1: ABC
      const aX = t1x, aY = tTopY;
      const bX = t1x - halfW * 0.44, bY = baseY;
      const cX = t1x + halfW * 0.44, cY = baseY;

      // Triangle 2: DEF
      const dX = t2x, dY = tTopY;
      const eX = t2x - halfW * 0.44, eY = baseY;
      const fX = t2x + halfW * 0.44, fY = baseY;

      ctx.beginPath();
      ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath();
      ctx.moveTo(dX, dY); ctx.lineTo(eX, eY); ctx.lineTo(fX, fY); ctx.closePath();
      ctx.stroke();

      drawLabel("A", aX, aY - 6, fontLabel, color);
      drawLabel("B", bX - 6, bY + 4, fontLabel, color, "right");
      drawLabel("C", cX + 6, cY + 4, fontLabel, color, "left");

      drawLabel("D", dX, dY - 6, fontLabel, color);
      drawLabel("E", eX - 6, eY + 4, fontLabel, color, "right");
      drawLabel("F", fX + 6, fY + 4, fontLabel, color, "left");

      // Congruence symbol in center
      drawLabel("≅", cx, (tTopY + baseY) / 2, `bold ${Math.round(22 * sFactor)}px sans-serif`, primary);

      if (geo === "congruentSSS") {
        drawTickMark(ctx, (aX + bX) / 2, (aY + bY) / 2, 0.6, 5);
        drawTickMark(ctx, (dX + eX) / 2, (dY + eY) / 2, 0.6, 5);
        drawTickMark(ctx, (aX + cX) / 2 - 2.5, (aY + cY) / 2, -0.6, 5);
        drawTickMark(ctx, (aX + cX) / 2 + 2.5, (aY + cY) / 2, -0.6, 5);
        drawTickMark(ctx, (dX + fX) / 2 - 2.5, (dY + fY) / 2, -0.6, 5);
        drawTickMark(ctx, (dX + fX) / 2 + 2.5, (dY + fY) / 2, -0.6, 5);
        drawTickMark(ctx, t1x, baseY, Math.PI / 2, 5);
        drawTickMark(ctx, t2x, baseY, Math.PI / 2, 5);
      } else if (geo === "congruentSAS") {
        drawTickMark(ctx, (aX + bX) / 2, (aY + bY) / 2, 0.6, 5);
        drawTickMark(ctx, (dX + eX) / 2, (dY + eY) / 2, 0.6, 5);
        drawTickMark(ctx, t1x, baseY, Math.PI / 2, 5);
        drawTickMark(ctx, t2x, baseY, Math.PI / 2, 5);
        ctx.strokeStyle = primary;
        ctx.beginPath(); ctx.arc(bX, bY, 12, -Math.PI / 3, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(eX, eY, 12, -Math.PI / 3, 0); ctx.stroke();
      } else if (geo === "congruentASA") {
        ctx.strokeStyle = primary;
        ctx.beginPath(); ctx.arc(bX, bY, 12, -Math.PI / 3, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(eX, eY, 12, -Math.PI / 3, 0); ctx.stroke();
        ctx.strokeStyle = accent;
        ctx.beginPath(); ctx.arc(cX, cY, 12, Math.PI, 4 * Math.PI / 3); ctx.stroke();
        ctx.beginPath(); ctx.arc(fX, fY, 12, Math.PI, 4 * Math.PI / 3); ctx.stroke();
        drawTickMark(ctx, t1x, baseY, Math.PI / 2, 5);
        drawTickMark(ctx, t2x, baseY, Math.PI / 2, 5);
      }

      drawLabel(critRule, cx, y2 - 6, fontSmall, primary);
    }

    // =========================================================================
    // 9. SIMILAR TRIANGLES
    // =========================================================================
    else if (geo === "similarTriangles") {
      drawLabel("Similar Triangles", cx, y1 + 12, fontTitle, color);

      const baseY = bottomY - 14;
      const sW = gw * 0.32;
      const bW = gw * 0.48;

      // Small triangle ABC
      const sLx = gx1 + 4, sRx = sLx + sW;
      const sTx = sLx + sW * 0.45, sTy = baseY - (bottomY - topY - 14) * 0.55;

      // Large triangle DEF
      const bLx = gx2 - bW, bRx = gx2;
      const bTx = bLx + bW * 0.45, bTy = topY + 6;

      ctx.beginPath();
      ctx.moveTo(sTx, sTy); ctx.lineTo(sLx, baseY); ctx.lineTo(sRx, baseY); ctx.closePath();
      ctx.moveTo(bTx, bTy); ctx.lineTo(bLx, baseY); ctx.lineTo(bRx, baseY); ctx.closePath();
      ctx.stroke();

      drawLabel("A", sTx, sTy - 6, fontLabel, color);
      drawLabel("B", sLx - 6, baseY + 4, fontLabel, color, "right");
      drawLabel("C", sRx + 6, baseY + 4, fontLabel, color, "left");

      drawLabel("D", bTx, bTy - 6, fontLabel, color);
      drawLabel("E", bLx - 6, baseY + 4, fontLabel, color, "right");
      drawLabel("F", bRx + 6, baseY + 4, fontLabel, color, "left");

      drawLabel("∼", (sRx + bLx) / 2, (sTy + baseY) / 2, `bold ${Math.round(22 * sFactor)}px sans-serif`, primary);

      drawLabel("△ABC ∼ △DEF (k = AB/DE)", cx, y2 - 6, fontSmall, primary);
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

/**
 * EduAshram Advanced Educational Tools Engine
 * 1. Indian, International & Decimal Place Value Charts
 * 2. Perimeter, Area & Volume Formulas of 2D and 3D Figures
 * 3. Timeline Builder: History, Historical Events & Sequences
 * 4. Map Tools: Political Maps, Physical Maps & Geography Labelling
 */

(function () {
  "use strict";

  // Catalog of Advanced Edu Tools Presets
  const ADVANCED_PRESETS = [
    // =========================================================================
    // 1. PLACE VALUE CHARTS
    // =========================================================================
    {
      group: "place_value",
      subgroup: "indian",
      chip: "Indian PVC",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Indian Place Value Chart",
      subtitle: "Crores, Lakhs, Thousands, Ones (3,2,2 rule with powers of 10)",
      type: "placeValueIndian",
      w: 360,
      h: 175
    },
    {
      group: "place_value",
      subgroup: "intl",
      chip: "Intl PVC",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "International Place Value Chart",
      subtitle: "Millions, Thousands, Ones in groups of 3 with period headers",
      type: "placeValueInternational",
      w: 360,
      h: 175
    },
    {
      group: "place_value",
      subgroup: "decimal",
      chip: "Decimal PVC",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Decimal Place Value Chart",
      subtitle: "Whole number & fractional parts (Tenths, Hundredths, Thousandths)",
      type: "placeValueDecimal",
      w: 350,
      h: 165
    },
    {
      group: "place_value",
      subgroup: "comparison",
      chip: "Comparison",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Indian vs International Chart",
      subtitle: "Equivalence: 1 Lakh = 100K, 10 Lakh = 1M, 1 Crore = 10M",
      type: "placeValueComparison",
      w: 340,
      h: 160
    },

    // =========================================================================
    // 2. FORMULAS WITH LABELED IMAGES & MENSURATION (CLASS 6-10)
    // =========================================================================
    // --- 2D Figures with Images & Labels ---
    {
      group: "formulas",
      subgroup: "2d",
      chip: "△ Triangle",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Triangle: Perimeter & Area",
      subtitle: "Labeled base b, height h, sides a, b, c with P = a+b+c, A = ½bh, Heron's formula",
      type: "formulaTriangle",
      w: 430,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "⊿ Rt Triangle",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Right Triangle: Area & Pythagoras",
      subtitle: "Labeled base b, altitude p, hypotenuse h with Area = ½bp, h² = b² + p²",
      type: "formulaRightTriangle",
      w: 430,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "▭ Rectangle",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Rectangle: Perimeter, Area & Diagonal",
      subtitle: "Labeled length l, breadth b, diagonal d with P = 2(l+b), A = lb, d = √(l²+b²)",
      type: "formulaRectangle",
      w: 430,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "□ Square",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "Square: Perimeter, Area & Diagonal",
      subtitle: "Labeled side a, equal ticks, diagonal d with P = 4a, A = a², d = a√2",
      type: "formulaSquare",
      w: 420,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "○ Circle",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Circle & Sector: Circumference & Area",
      subtitle: "Labeled radius r, diameter d, sector θ with C = 2πr, A = πr², Arc & Sector formulas",
      type: "formulaCircle",
      w: 450,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "▱ Parallelogram",
      chipTheme: { bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" },
      title: "Parallelogram & Rhombus Formulas",
      subtitle: "Labeled base b, height h, diagonals d₁, d₂ with A = bh, Rhombus A = ½d₁d₂",
      type: "formulaParallelogram",
      w: 450,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "⏢ Trapezium",
      chipTheme: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
      title: "Trapezium: Perimeter & Area",
      subtitle: "Labeled parallel bases a ∥ b, height h, slant sides with Area = ½(a+b)h",
      type: "formulaTrapezium",
      w: 430,
      h: 240
    },

    // --- 3D Solids with Isometric Images & Labels ---
    {
      group: "formulas",
      subgroup: "3d",
      chip: "🧊 Cube",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "3D Cube: Surface Area & Volume",
      subtitle: "Isometric 3D cube with edge a with LSA = 4a², TSA = 6a², Volume = a³, Diagonal = a√3",
      type: "formulaCube",
      w: 440,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "📦 Cuboid",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "3D Cuboid: Surface Area & Volume",
      subtitle: "Isometric 3D box with l, b, h with 4-Walls = 2h(l+b), TSA = 2(lb+bh+hl), V = lbh",
      type: "formulaCuboid",
      w: 450,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "🛢️ Cylinder",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "3D Cylinder: Surface Area & Volume",
      subtitle: "3D cylinder with radius r, height h with CSA = 2πrh, TSA = 2πr(r+h), V = πr²h",
      type: "formulaCylinder",
      w: 440,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "🍦 Cone",
      chipTheme: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
      title: "3D Cone: Surface Area & Volume",
      subtitle: "3D cone with radius r, height h, slant l with Slant l = √(r²+h²), CSA = πrl, V = ⅓πr²h",
      type: "formulaCone",
      w: 440,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "⚽ Sphere",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Sphere & Hemisphere Formulas",
      subtitle: "3D sphere with radius r with Sphere SA = 4πr², V = ⁴⁄₃πr³, Hemisphere CSA = 2πr², TSA = 3πr²",
      type: "formulaSphere",
      w: 460,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "🥤 Frustum",
      chipTheme: { bg: "#fdf4ff", color: "#a21caf", border: "#f5d0fe" },
      title: "Frustum of Cone: Area & Volume",
      subtitle: "3D truncated cone with radii r₁, r₂, height h, slant l with CSA, TSA & Volume formulas",
      type: "formulaFrustum",
      w: 450,
      h: 245
    },

    // --- Master Summary Charts ---
    {
      group: "formulas",
      subgroup: "master",
      chip: "2D Master",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "2D Figures Master Chart (with Diagrams)",
      subtitle: "Complete reference table with labeled diagrams for Triangle, Rectangle, Square, Rhombus, Circle",
      type: "formulas2D",
      w: 450,
      h: 270
    },
    {
      group: "formulas",
      subgroup: "master",
      chip: "3D Master",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "3D Solids Master Chart (with Diagrams)",
      subtitle: "Complete reference table with 3D diagrams for Cube, Cuboid, Cylinder, Cone, Sphere",
      type: "formulas3D",
      w: 450,
      h: 270
    },
    {
      group: "formulas",
      subgroup: "master",
      chip: "Master Sheet",
      chipTheme: { bg: "#fdf4ff", color: "#a21caf", border: "#f5d0fe" },
      title: "Master Geometry Formula Sheet",
      subtitle: "Combined 2D and 3D reference guide with metric conversion rules",
      type: "formulasMaster",
      w: 460,
      h: 280
    },

    // =========================================================================
    // 3. TIMELINE BUILDER
    // =========================================================================
    {
      group: "timelines",
      subgroup: "india",
      chip: "Freedom 1857-1947",
      chipTheme: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
      title: "Indian Freedom Movement (1857–1947)",
      subtitle: "1857 Revolt → 1885 INC → 1919 Jallianwala → 1930 Dandi → 1942 Quit India → 1947",
      type: "timelineIndianFreedom",
      w: 390,
      h: 170
    },
    {
      group: "timelines",
      subgroup: "india",
      chip: "Ancient India",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Ancient Indian Dynasties & Eras",
      subtitle: "Indus Valley → Vedic Era → Maurya Empire → Gupta Golden Age → Chola Empire",
      type: "timelineAncientIndia",
      w: 390,
      h: 170
    },
    {
      group: "timelines",
      subgroup: "world",
      chip: "World History",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "World History Key Milestones",
      subtitle: "Renaissance → Industrial Revolution → French Revolution → WWI → WWII → UN",
      type: "timelineWorldHistory",
      w: 390,
      h: 170
    },
    {
      group: "timelines",
      subgroup: "science",
      chip: "Science & Math",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Science & Mathematical Milestones",
      subtitle: "Aryabhata's Zero → Printing Press → Calculus → Steam Engine → Relativity → AI",
      type: "timelineScienceMath",
      w: 390,
      h: 170
    },
    {
      group: "timelines",
      subgroup: "custom",
      chip: "Custom Sequence",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "Custom 5-Step Timeline",
      subtitle: "Editable chronological sequence template for history & science topics",
      type: "timelineCustom",
      w: 390,
      h: 170
    },

    // =========================================================================
    // 4. MAP TOOLS
    // =========================================================================
    {
      group: "maps",
      subgroup: "maps",
      chip: "India Political",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "India Political Map Outline",
      subtitle: "National boundaries, New Delhi, state outlines, Arabian Sea & Bay of Bengal",
      type: "mapIndiaPolitical",
      w: 300,
      h: 300
    },
    {
      group: "maps",
      subgroup: "maps",
      chip: "India Physical",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "India Physical Features Map",
      subtitle: "Himalayas, Northern Plains, Thar Desert, Deccan Plateau & Ghats",
      type: "mapIndiaPhysical",
      w: 300,
      h: 300
    },
    {
      group: "maps",
      subgroup: "maps",
      chip: "World Continents",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "World Map (Continents & Oceans)",
      subtitle: "7 Continents, 5 Oceans, Equator, Prime Meridian & Tropics",
      type: "mapWorldContinents",
      w: 380,
      h: 220
    },
    {
      group: "maps",
      subgroup: "symbols",
      chip: "Compass Rose",
      chipTheme: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
      title: "Cartographic Compass Rose",
      subtitle: "8-point directional compass (N, S, E, W, NE, NW, SE, SW) with degree ring",
      type: "mapCompassRose",
      w: 160,
      h: 160
    },
    {
      group: "maps",
      subgroup: "symbols",
      chip: "Scale Bar",
      chipTheme: { bg: "#f8fafc", color: "#334155", border: "#cbd5e1" },
      title: "Linear Map Scale Bar",
      subtitle: "Metric scale bar (0 - 250 - 500 - 1000 km) for geography map reading",
      type: "mapScaleBar",
      w: 220,
      h: 70
    },
    {
      group: "maps",
      subgroup: "symbols",
      chip: "Map Legend",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Map Legend / Key Box",
      subtitle: "Standard map symbols: Capital, River, Peak, Boundary & Water Body",
      type: "mapLegendBox",
      w: 190,
      h: 140
    },
    {
      group: "maps",
      subgroup: "symbols",
      chip: "Location Pin",
      chipTheme: { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
      title: "Map Location Pin & Label",
      subtitle: "Geographic marker pin with customizable landmark label bubble",
      type: "mapPinMarker",
      w: 120,
      h: 110
    }
  ];

  // Helper Drawing Functions
  function drawArrowHead(ctx, fromX, fromY, toX, toY, size) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = size || 7;
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

  function roundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawDoubleArrow(ctx, x1, y1, x2, y2, size) {
    const s = size || 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    drawArrowHead(ctx, (x1 + x2) / 2, (y1 + y2) / 2, x1, y1, s);
    drawArrowHead(ctx, (x1 + x2) / 2, (y1 + y2) / 2, x2, y2, s);
  }

  function drawTick(ctx, mx, my, angle, len) {
    const l = len || 5;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(mx - l * Math.cos(angle), my - l * Math.sin(angle));
    ctx.lineTo(mx + l * Math.cos(angle), my + l * Math.sin(angle));
    ctx.stroke();
    ctx.restore();
  }

  // Master Canvas Drawing Function for Advanced Edu Tools
  function drawAdvancedEduShape(ctx, shape, isDark) {
    if (!shape || !shape.start || !shape.end) return false;

    const geo = shape.geoType || shape.advancedType;
    if (!geo) return false;

    // Check if this engine handles this type
    const handles = ADVANCED_PRESETS.some((p) => p.type === geo);
    if (!handles) return false;

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
    const accent  = isActuallyDark ? "#34d399" : "#10b981";
    const warn    = isActuallyDark ? "#fbbf24" : "#f59e0b";
    const danger  = isActuallyDark ? "#f87171" : "#ef4444";
    const purple  = isActuallyDark ? "#c084fc" : "#7c3aed";
    const rose    = isActuallyDark ? "#fb7185" : "#e11d48";
    const borderCol = isActuallyDark ? "#334155" : "#cbd5e1";
    const cardBg  = isActuallyDark ? "rgba(30, 41, 59, 0.70)" : "rgba(255, 255, 255, 0.85)";

    const sFactor = Math.min(Math.max(Math.min(w / 340, h / 200), 0.85), 2.0);
    const fontTitle = `bold ${Math.max(11, Math.round(12.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontHeader = `bold ${Math.max(10, Math.round(11 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontBody  = `${Math.max(9, Math.round(10 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontSmall = `${Math.max(8.5, Math.round(9 * sFactor))}px "Plus Jakarta Sans", sans-serif`;

    function drawLabel(text, tx, ty, font, txtColor, align, baseline, withStroke = true) {
      if (text === undefined || text === null || text === "") return;
      const str = String(text);
      ctx.save();
      ctx.font = font || fontBody;
      ctx.textAlign = align || "center";
      ctx.textBaseline = baseline || "middle";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (withStroke) {
        ctx.strokeStyle = isActuallyDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.96)";
        ctx.lineWidth = Math.max(2, Math.min(3.2, Math.round(2.2 * Math.sqrt(sFactor))));
        ctx.strokeText(str, tx, ty);
      }

      ctx.fillStyle = txtColor || color;
      ctx.fillText(str, tx, ty);
      ctx.restore();
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = shape.width || 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const topY = y1 + 38;
    const bottomY = y2 - 12;
    const leftX = x1 + 14;
    const rightX = x2 - 14;
    const contentW = rightX - leftX;
    const contentH = bottomY - topY;

    // =========================================================================
    // 1. PLACE VALUE CHARTS
    // =========================================================================
    if (geo === "placeValueIndian" || geo === "placeValueInternational" || geo === "placeValueDecimal" || geo === "placeValueComparison") {
      // Background card
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      roundRect(ctx, leftX, y1 + 8, contentW, h - 16, 10);
      ctx.fill();
      ctx.stroke();

      if (geo === "placeValueIndian") {
        drawLabel("Indian Place Value Chart", cx, y1 + 22, fontTitle, color);

        const periods = [
          { name: "Crores", cols: ["TC", "C"], vals: ["10⁸", "10⁷"], c: rose },
          { name: "Lakhs", cols: ["TL", "L"], vals: ["10⁶", "10⁵"], c: warn },
          { name: "Thousands", cols: ["T-Th", "Th"], vals: ["10⁴", "10³"], c: primary },
          { name: "Ones", cols: ["H", "T", "O"], vals: ["10²", "10¹", "10⁰"], c: accent }
        ];

        const totalCols = 9;
        const colW = contentW / totalCols;
        const tY = topY + 8;
        const rowH = Math.min(26, contentH * 0.22);

        // Header Row: Periods
        let curX = leftX;
        periods.forEach((p) => {
          const pW = colW * p.cols.length;
          ctx.fillStyle = p.c;
          ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
          ctx.fillRect(curX, tY, pW, rowH);
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = p.c;
          ctx.strokeRect(curX, tY, pW, rowH);
          drawLabel(p.name, curX + pW / 2, tY + rowH / 2, fontHeader, p.c);
          curX += pW;
        });

        // Row 2: Place Names & Row 3: Place Values
        curX = leftX;
        let sampleDigits = ["7", "8", "4", "3", "2", "9", "6", "5", "1"];
        periods.forEach((p) => {
          p.cols.forEach((colName, idx) => {
            const rx = curX;
            ctx.strokeStyle = borderCol;
            ctx.strokeRect(rx, tY + rowH, colW, rowH);
            drawLabel(colName, rx + colW / 2, tY + rowH + rowH / 2, fontHeader, color);

            ctx.strokeRect(rx, tY + rowH * 2, colW, rowH);
            drawLabel(p.vals[idx], rx + colW / 2, tY + rowH * 2 + rowH / 2, fontSmall, primary);

            // Sample digit row
            ctx.strokeRect(rx, tY + rowH * 3, colW, rowH);
            const dIdx = Math.round((rx - leftX) / colW);
            drawLabel(sampleDigits[dIdx] || "·", rx + colW / 2, tY + rowH * 3 + rowH / 2, fontHeader, p.c);

            curX += colW;
          });
        });

        drawLabel("Example: 78,43,29,651  (Comma Rule: 3 digits from right, then groups of 2)", cx, bottomY - 6, fontSmall, primary);
      } else if (geo === "placeValueInternational") {
        drawLabel("International Place Value Chart", cx, y1 + 22, fontTitle, color);

        const periods = [
          { name: "Millions", cols: ["HM", "TM", "M"], vals: ["10⁸", "10⁷", "10⁶"], c: purple },
          { name: "Thousands", cols: ["H-Th", "T-Th", "Th"], vals: ["10⁵", "10⁴", "10³"], c: primary },
          { name: "Ones", cols: ["H", "T", "O"], vals: ["10²", "10¹", "10⁰"], c: accent }
        ];

        const totalCols = 9;
        const colW = contentW / totalCols;
        const tY = topY + 8;
        const rowH = Math.min(26, contentH * 0.22);

        let curX = leftX;
        periods.forEach((p) => {
          const pW = colW * p.cols.length;
          ctx.fillStyle = p.c;
          ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
          ctx.fillRect(curX, tY, pW, rowH);
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = p.c;
          ctx.strokeRect(curX, tY, pW, rowH);
          drawLabel(p.name, curX + pW / 2, tY + rowH / 2, fontHeader, p.c);
          curX += pW;
        });

        curX = leftX;
        const sampleDigits = ["7", "8", "4", "3", "2", "9", "6", "5", "1"];
        periods.forEach((p) => {
          p.cols.forEach((colName, idx) => {
            const rx = curX;
            ctx.strokeStyle = borderCol;
            ctx.strokeRect(rx, tY + rowH, colW, rowH);
            drawLabel(colName, rx + colW / 2, tY + rowH + rowH / 2, fontHeader, color);

            ctx.strokeRect(rx, tY + rowH * 2, colW, rowH);
            drawLabel(p.vals[idx], rx + colW / 2, tY + rowH * 2 + rowH / 2, fontSmall, primary);

            ctx.strokeRect(rx, tY + rowH * 3, colW, rowH);
            const dIdx = Math.round((rx - leftX) / colW);
            drawLabel(sampleDigits[dIdx] || "·", rx + colW / 2, tY + rowH * 3 + rowH / 2, fontHeader, p.c);

            curX += colW;
          });
        });

        drawLabel("Example: 784,329,651  (Comma Rule: Groups of 3 digits from right)", cx, bottomY - 6, fontSmall, primary);
      } else if (geo === "placeValueDecimal") {
        drawLabel("Decimal Place Value Chart", cx, y1 + 22, fontTitle, color);

        const sections = [
          { name: "Hundreds (100)", col: "H", val: "100", d: "3", c: primary },
          { name: "Tens (10)", col: "T", val: "10", d: "4", c: primary },
          { name: "Ones (1)", col: "O", val: "1", d: "5", c: primary },
          { name: "Decimal", col: "·", val: "Point", d: "·", c: danger },
          { name: "Tenths (1/10)", col: "1/10", val: "0.1", d: "6", c: accent },
          { name: "Hundredths (1/100)", col: "1/100", val: "0.01", d: "7", c: accent },
          { name: "Thousandths (1/1000)", col: "1/1000", val: "0.001", d: "8", c: accent }
        ];

        const totalCols = sections.length;
        const colW = contentW / totalCols;
        const tY = topY + 8;
        const rowH = Math.min(26, contentH * 0.22);

        sections.forEach((sec, idx) => {
          const rx = leftX + idx * colW;
          ctx.fillStyle = sec.c;
          ctx.globalAlpha = isActuallyDark ? 0.22 : 0.12;
          ctx.fillRect(rx, tY, colW, rowH);
          ctx.globalAlpha = 1.0;
          ctx.strokeStyle = sec.c;
          ctx.strokeRect(rx, tY, colW, rowH);
          drawLabel(sec.col, rx + colW / 2, tY + rowH / 2, fontHeader, sec.c);

          ctx.strokeStyle = borderCol;
          ctx.strokeRect(rx, tY + rowH, colW, rowH);
          drawLabel(sec.val, rx + colW / 2, tY + rowH + rowH / 2, fontSmall, color);

          ctx.strokeRect(rx, tY + rowH * 2, colW, rowH);
          drawLabel(sec.d, rx + colW / 2, tY + rowH * 2 + rowH / 2, fontHeader, sec.c);
        });

        drawLabel("345.678 = 300 + 40 + 5 + 6/10 + 7/100 + 8/1000", cx, bottomY - 6, fontSmall, primary);
      } else if (geo === "placeValueComparison") {
        drawLabel("Indian vs International System Comparison", cx, y1 + 22, fontTitle, color);

        const rows = [
          { ind: "1 Lakh (1,00,000)", intl: "100 Thousand (100,000)", pwr: "10⁵" },
          { ind: "10 Lakh (10,00,000)", intl: "1 Million (1,000,000)", pwr: "10⁶" },
          { ind: "1 Crore (1,00,00,000)", intl: "10 Million (10,000,000)", pwr: "10⁷" },
          { ind: "10 Crore (10,00,00,000)", intl: "100 Million (100,000,000)", pwr: "10⁸" },
          { ind: "100 Crore (1 Arab)", intl: "1 Billion (1,000,000,000)", pwr: "10⁹" }
        ];

        const tY = topY + 8;
        const rowH = Math.min(22, (contentH - 24) / 6);
        const col1W = contentW * 0.42;
        const col2W = contentW * 0.42;
        const col3W = contentW * 0.16;

        // Header
        ctx.fillStyle = primary;
        ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
        ctx.fillRect(leftX, tY, contentW, rowH);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = primary;
        ctx.strokeRect(leftX, tY, contentW, rowH);
        drawLabel("Indian System", leftX + col1W / 2, tY + rowH / 2, fontHeader, primary);
        drawLabel("International System", leftX + col1W + col2W / 2, tY + rowH / 2, fontHeader, purple);
        drawLabel("Value", rightX - col3W / 2, tY + rowH / 2, fontHeader, accent);

        rows.forEach((r, idx) => {
          const ry = tY + rowH * (idx + 1);
          ctx.strokeStyle = borderCol;
          ctx.strokeRect(leftX, ry, col1W, rowH);
          ctx.strokeRect(leftX + col1W, ry, col2W, rowH);
          ctx.strokeRect(leftX + col1W + col2W, ry, col3W, rowH);
          drawLabel(r.ind, leftX + col1W / 2, ry + rowH / 2, fontBody, color);
          drawLabel(r.intl, leftX + col1W + col2W / 2, ry + rowH / 2, fontBody, color);
          drawLabel(r.pwr, rightX - col3W / 2, ry + rowH / 2, fontSmall, accent);
        });

        drawLabel("Rule: 1 Million = 10 Lakhs  |  1 Billion = 100 Crores (1 Arab)", cx, bottomY - 4, fontSmall, primary);
      }
    }

    // =========================================================================
    // 2. FORMULAS WITH LABELED IMAGES & MENSURATION
    // =========================================================================
    else if (geo.startsWith("formula")) {
      function drawFormulaLayout({ title, subtitle, drawFigure, formulaRows, notes }) {
        // Outer Card Box Dimensions
        const cardX = leftX;
        const cardY = y1 + 4;
        const cardW = contentW;
        const cardH = h - 8;
        const cardR = 14;

        // 1. Outer Card Background & Smooth Border
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1.5;
        roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
        ctx.fill();
        ctx.stroke();

        // 2. Dedicated Top Header Section (generous height, no overlap)
        const headerH = Math.max(54, Math.min(68, Math.round(cardH * 0.16)));
        const headerBottomY = cardY + headerH;

        // Subtle Header Banner
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, cardX, cardY, cardW, headerH, cardR);
        ctx.clip();
        ctx.fillStyle = isActuallyDark ? "rgba(30, 41, 59, 0.95)" : "rgba(241, 245, 249, 0.88)";
        ctx.fillRect(cardX, cardY, cardW, headerH);
        ctx.restore();

        // Header separator line
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX, headerBottomY);
        ctx.lineTo(cardX + cardW, headerBottomY);
        ctx.stroke();

        // Main Title (bold, comfortable margin from top)
        const titleY = cardY + Math.round(headerH * 0.38);
        const subY = cardY + Math.round(headerH * 0.74);
        const cardTitleFont = `bold ${Math.max(14, Math.min(19, Math.round(15 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
        const cardSubFont = `600 ${Math.max(10, Math.min(12.5, Math.round(10.5 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;

        drawLabel(title, cx, titleY, cardTitleFont, color, "center", "middle", false);
        if (subtitle) {
          const subColor = isActuallyDark ? "#94a3b8" : "#64748b";
          drawLabel(subtitle, cx, subY, cardSubFont, subColor, "center", "middle", false);
        }

        // 3. Footer Strip (Notes & key properties at bottom)
        const footerH = notes ? Math.max(28, Math.min(36, Math.round(cardH * 0.09))) : 0;
        const footerTopY = cardY + cardH - footerH - 8;

        if (notes) {
          const footPillX = cardX + 14;
          const footPillW = cardW - 28;
          const footPillY = footerTopY + 2;
          const footPillH = footerH - 4;

          ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.08)" : "rgba(2, 132, 199, 0.05)";
          ctx.strokeStyle = isActuallyDark ? "rgba(56, 189, 248, 0.25)" : "rgba(2, 132, 199, 0.18)";
          ctx.lineWidth = 1;
          roundRect(ctx, footPillX, footPillY, footPillW, footPillH, 6);
          ctx.fill();
          ctx.stroke();

          const noteFont = `600 ${Math.max(9.5, Math.min(12, Math.round(10 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
          drawLabel("💡 " + notes, cx, footPillY + footPillH / 2, noteFont, primary, "center", "middle", false);
        }

        // 4. Main Body: Left Figure Showcase & Right Formula Deck
        const bodyTopY = headerBottomY + 10;
        const bodyBottomY = notes ? (footerTopY - 8) : (cardY + cardH - 12);
        const bodyH = bodyBottomY - bodyTopY;

        // Left Figure Box (44% width)
        const figBoxX = cardX + 10;
        const figBoxW = Math.max(140, Math.round(cardW * 0.44));
        const figBoxY = bodyTopY;
        const figBoxH = bodyH;

        // Framed Diagram Canvas
        ctx.fillStyle = isActuallyDark ? "rgba(15, 23, 42, 0.65)" : "rgba(248, 250, 252, 0.95)";
        ctx.strokeStyle = isActuallyDark ? "rgba(51, 65, 85, 0.9)" : "#e2e8f0";
        ctx.lineWidth = 1.2;
        roundRect(ctx, figBoxX, figBoxY, figBoxW, figBoxH, 10);
        ctx.fill();
        ctx.stroke();

        const figCX = figBoxX + figBoxW / 2;
        const figCY = figBoxY + figBoxH / 2;

        if (typeof drawFigure === "function") {
          ctx.save();
          drawFigure(figCX, figCY, figBoxW, figBoxH);
          ctx.restore();
        }

        // Right Formula Deck
        const formDeckX = figBoxX + figBoxW + 12;
        const formDeckW = (cardX + cardW - 10) - formDeckX;
        const formDeckY = bodyTopY;
        const formDeckH = bodyH;

        if (formulaRows && Array.isArray(formulaRows) && formulaRows.length > 0) {
          const rowCount = formulaRows.length;
          const rowGap = Math.max(6, Math.min(10, Math.round(formDeckH * 0.03)));
          const totalGaps = (rowCount - 1) * rowGap;
          const rowH = Math.max(34, Math.min(52, Math.floor((formDeckH - totalGaps) / rowCount)));
          const totalDeckH = rowCount * rowH + totalGaps;
          const startY = formDeckY + Math.max(0, (formDeckH - totalDeckH) / 2);

          // Compute uniform badge width for perfect vertical alignment across all rows
          const tagFont = `bold ${Math.max(10, Math.min(12.5, Math.round(11 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
          ctx.save();
          ctx.font = tagFont;
          let maxTagW = 80;
          formulaRows.forEach(r => {
            const m = ctx.measureText(r.tag || "");
            if (m.width > maxTagW) maxTagW = m.width;
          });
          ctx.restore();
          const badgeW = Math.max(95, Math.min(Math.round(formDeckW * 0.40), Math.round(maxTagW + 22)));

          formulaRows.forEach((row, idx) => {
            const ry = startY + idx * (rowH + rowGap);

            // Row Card Container
            ctx.fillStyle = row.bg || (isActuallyDark ? "rgba(30, 41, 59, 0.85)" : "#ffffff");
            ctx.strokeStyle = row.border || (isActuallyDark ? "#475569" : "#e2e8f0");
            ctx.lineWidth = 1.2;
            roundRect(ctx, formDeckX, ry, formDeckW, rowH, 8);
            ctx.fill();
            ctx.stroke();

            // Left Dedicated Tag Badge (uniform width, cannot overlap formula)
            const badgeH = rowH - 8;
            const badgeX = formDeckX + 4;
            const badgeY = ry + 4;

            ctx.fillStyle = row.tagBg || (isActuallyDark ? "rgba(255,255,255,0.06)" : "rgba(241, 245, 249, 0.95)");
            ctx.strokeStyle = row.tagColor || primary;
            ctx.lineWidth = 1;
            roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 6);
            ctx.fill();
            ctx.stroke();

            drawLabel(row.tag, badgeX + badgeW / 2, ry + rowH / 2, tagFont, row.tagColor || primary, "center", "middle", false);

            // Right Formula Expression (starts strictly after gutter)
            const formulaStartX = formDeckX + badgeW + 12;
            const maxFormulaW = (formDeckX + formDeckW - 8) - formulaStartX;

            let fSize = Math.max(11, Math.min(15, Math.round(13 * sFactor)));
            let formFont = `700 ${fSize}px "Plus Jakarta Sans", "Courier New", monospace, sans-serif`;
            ctx.font = formFont;
            let textMetrics = ctx.measureText(row.formula);
            if (textMetrics.width > maxFormulaW && maxFormulaW > 30) {
              fSize = Math.max(9.5, Math.floor(fSize * (maxFormulaW / textMetrics.width)));
              formFont = `700 ${fSize}px "Plus Jakarta Sans", "Courier New", monospace, sans-serif`;
            }

            const formulaTxtColor = row.color || (isActuallyDark ? "#f8fafc" : "#0f172a");
            drawLabel(row.formula, formulaStartX, ry + rowH / 2, formFont, formulaTxtColor, "left", "middle", false);
          });
        }
      }

      if (geo === "formulaTriangle") {
        drawFormulaLayout({
          title: "Triangle: Perimeter & Area Formulas",
          subtitle: "NCERT Class 7–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const triW = Math.min(fw * 0.72, 195);
            const triH = Math.min(fh * 0.60, 135);
            const aX = fcx, aY = fcy - triH / 2 - 10;
            const bX = fcx - triW / 2, bY = aY + triH;
            const cX = fcx + triW / 2, cY = bY;
            const dX = fcx, dY = bY;

            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.18)" : "rgba(2, 132, 199, 0.10)";
            ctx.beginPath();
            ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = primary;
            ctx.lineWidth = 2.2;
            ctx.stroke();

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = danger;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(aX, aY); ctx.lineTo(dX, dY); ctx.stroke();
            ctx.restore();

            const sq = Math.max(8, Math.round(10 * sFactor));
            ctx.strokeStyle = danger;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(dX, dY - sq, sq, sq);

            drawDoubleArrow(ctx, bX, bY + 14, cX, cY + 14, 6);
            drawLabel("Base (b)", fcx, bY + 28, fontSmall, primary, "center", "middle", true);

            const nodeFont = `bold ${Math.max(12, Math.round(13 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
            drawLabel("A", aX, aY - 14, nodeFont, color, "center", "middle", true);
            drawLabel("B", bX - 14, bY + 4, nodeFont, color, "center", "middle", true);
            drawLabel("C", cX + 14, cY + 4, nodeFont, color, "center", "middle", true);
            drawLabel("h", dX - 14, fcy - 4, nodeFont, danger, "center", "middle", true);
            drawLabel("c", (aX + bX) / 2 - 14, (aY + bY) / 2, fontHeader, color, "center", "middle", true);
            drawLabel("a", (aX + cX) / 2 + 14, (aY + cY) / 2, fontHeader, color, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Perimeter (P)", formula: "P = a + b + c", tagColor: primary },
            { tag: "Area (A)", formula: "Area = ½ × b × h", tagColor: accent },
            { tag: "Heron's Formula", formula: "Area = √[s(s-a)(s-b)(s-c)]", tagColor: warn },
            { tag: "Semi-Perimeter", formula: "s = (a + b + c) / 2", tagColor: purple }
          ],
          notes: "Equilateral Triangle: Area = (√3 / 4) a²  |  Altitude = (√3 / 2) a"
        });
      } else if (geo === "formulaRightTriangle") {
        drawFormulaLayout({
          title: "Right Triangle: Area & Pythagoras Theorem",
          subtitle: "NCERT Class 7–10 Geometry",
          drawFigure: (fcx, fcy, fw, fh) => {
            const rtW = Math.min(fw * 0.68, 175);
            const rtH = Math.min(fh * 0.62, 140);
            const bX = fcx - rtW / 2 + 10, bY = fcy + rtH / 2 - 8;
            const aX = bX, aY = bY - rtH;
            const cX = bX + rtW, cY = bY;

            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.10)";
            ctx.beginPath();
            ctx.moveTo(aX, aY); ctx.lineTo(bX, bY); ctx.lineTo(cX, cY); ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2.2;
            ctx.stroke();

            const sq = Math.max(9, Math.round(11 * sFactor));
            ctx.strokeStyle = primary;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bX, bY - sq, sq, sq);

            drawDoubleArrow(ctx, bX - 14, aY, bX - 14, bY, 6);
            drawLabel("p (height)", bX - 34, (aY + bY) / 2, fontSmall, primary, "center", "middle", true);

            drawDoubleArrow(ctx, bX, bY + 14, cX, cY + 14, 6);
            drawLabel("b (base)", (bX + cX) / 2, bY + 28, fontSmall, accent, "center", "middle", true);

            drawLabel("h (hypotenuse)", (aX + cX) / 2 + 22, (aY + cY) / 2 - 10, fontSmall, purple, "center", "middle", true);

            const nodeFont = `bold ${Math.max(12, Math.round(13 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
            drawLabel("A", aX - 10, aY - 10, nodeFont, color, "center", "middle", true);
            drawLabel("B", bX - 12, bY + 10, nodeFont, color, "center", "middle", true);
            drawLabel("C", cX + 12, cY + 10, nodeFont, color, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Area (A)", formula: "Area = ½ × b × p", tagColor: accent },
            { tag: "Perimeter (P)", formula: "P = b + p + h", tagColor: primary },
            { tag: "Pythagoras", formula: "h² = b² + p²  ⇒  h = √(b²+p²)", tagColor: purple },
            { tag: "Leg Relations", formula: "p = √(h² - b²),  b = √(h² - p²)", tagColor: warn }
          ],
          notes: "3-4-5, 5-12-13, 7-24-25, 8-15-17 are common Pythagorean triplets"
        });
      } else if (geo === "formulaRectangle") {
        drawFormulaLayout({
          title: "Rectangle: Perimeter, Area & Diagonal",
          subtitle: "NCERT Class 6–9 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const rw = Math.min(fw * 0.72, 195);
            const rh = Math.min(fh * 0.54, 115);
            const rx = fcx - rw / 2, ry = fcy - rh / 2 - 6;

            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.18)" : "rgba(2, 132, 199, 0.10)";
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeStyle = primary;
            ctx.lineWidth = 2.2;
            ctx.strokeRect(rx, ry, rw, rh);

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = purple;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(rx, ry + rh); ctx.lineTo(rx + rw, ry); ctx.stroke();
            ctx.restore();

            const sq = 8;
            ctx.strokeStyle = primary;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(rx, ry, sq, sq);
            ctx.strokeRect(rx + rw - sq, ry, sq, sq);
            ctx.strokeRect(rx, ry + rh - sq, sq, sq);
            ctx.strokeRect(rx + rw - sq, ry + rh - sq, sq, sq);

            drawDoubleArrow(ctx, rx, ry + rh + 14, rx + rw, ry + rh + 14, 6);
            drawLabel("Length (l)", fcx, ry + rh + 28, fontSmall, primary, "center", "middle", true);

            drawDoubleArrow(ctx, rx + rw + 14, ry, rx + rw + 14, ry + rh, 6);
            drawLabel("b", rx + rw + 28, fcy - 6, fontHeader, accent, "center", "middle", true);

            drawLabel("d = √(l²+b²)", fcx - 8, fcy - 18, fontSmall, purple, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Perimeter (P)", formula: "P = 2(l + b)", tagColor: primary },
            { tag: "Area (A)", formula: "Area = l × b", tagColor: accent },
            { tag: "Diagonal (d)", formula: "d = √(l² + b²)", tagColor: purple },
            { tag: "Side Relations", formula: "l = Area / b,  b = Area / l", tagColor: warn }
          ],
          notes: "Opposite sides are equal and all 4 interior angles are 90°"
        });
      } else if (geo === "formulaSquare") {
        drawFormulaLayout({
          title: "Square: Perimeter, Area & Diagonal",
          subtitle: "NCERT Class 6–9 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const s = Math.min(fw * 0.58, fh * 0.58, 125);
            const sx = fcx - s / 2, sy = fcy - s / 2 - 6;

            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.10)";
            ctx.fillRect(sx, sy, s, s);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2.2;
            ctx.strokeRect(sx, sy, s, s);

            const sq = 8;
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(sx, sy, sq, sq);
            ctx.strokeRect(sx + s - sq, sy, sq, sq);
            ctx.strokeRect(sx, sy + s - sq, sq, sq);
            ctx.strokeRect(sx + s - sq, sy + s - sq, sq, sq);

            drawTick(ctx, sx + s / 2, sy, 0, 7);
            drawTick(ctx, sx + s / 2, sy + s, 0, 7);
            drawTick(ctx, sx, sy + s / 2, Math.PI / 2, 7);
            drawTick(ctx, sx + s, sy + s / 2, Math.PI / 2, 7);

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = purple;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(sx, sy + s); ctx.lineTo(sx + s, sy); ctx.stroke();
            ctx.restore();

            drawDoubleArrow(ctx, sx, sy + s + 14, sx + s, sy + s + 14, 6);
            drawLabel("Side (a)", fcx, sy + s + 28, fontSmall, accent, "center", "middle", true);
            drawLabel("d = a√2", fcx + 12, fcy - 16, fontSmall, purple, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Perimeter (P)", formula: "P = 4a", tagColor: primary },
            { tag: "Area (A)", formula: "Area = a² = ½ d²", tagColor: accent },
            { tag: "Diagonal (d)", formula: "d = a√2  ⇒  a = d / √2", tagColor: purple },
            { tag: "Side (a)", formula: "a = P / 4 = √Area", tagColor: warn }
          ],
          notes: "All 4 sides equal, all angles 90°, diagonals bisect at 90°"
        });
      } else if (geo === "formulaCircle") {
        drawFormulaLayout({
          title: "Circle & Sector: Circumference & Area",
          subtitle: "NCERT Class 7–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const r = Math.min(fw * 0.34, fh * 0.34, 70);

            ctx.fillStyle = isActuallyDark ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.18)";
            ctx.beginPath();
            ctx.moveTo(fcx, fcy);
            ctx.arc(fcx, fcy, r, -Math.PI / 6, Math.PI / 4);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = warn;
            ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.arc(fcx, fcy, r, 0, Math.PI * 2); ctx.stroke();

            ctx.fillStyle = color;
            ctx.beginPath(); ctx.arc(fcx, fcy, 4, 0, Math.PI * 2); ctx.fill();
            drawLabel("O", fcx - 12, fcy - 8, fontHeader, color, "center", "middle", true);

            ctx.strokeStyle = primary;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(fcx, fcy); ctx.lineTo(fcx + r * Math.cos(-Math.PI / 6), fcy + r * Math.sin(-Math.PI / 6)); ctx.stroke();
            drawLabel("r", fcx + r * 0.6, fcy - 18, fontHeader, primary, "center", "middle", true);

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = purple;
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(fcx - r, fcy + 12); ctx.lineTo(fcx + r, fcy + 12); ctx.stroke();
            ctx.restore();
            drawLabel("d = 2r", fcx, fcy + 26, fontSmall, purple, "center", "middle", true);

            drawLabel("θ (sector)", fcx + 22, fcy + 4, fontSmall, warn, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Circumference", formula: "C = 2πr = πd", tagColor: primary },
            { tag: "Area (A)", formula: "Area = πr² = ¼ πd²", tagColor: accent },
            { tag: "Arc Length (L)", formula: "L = (θ / 360°) × 2πr", tagColor: warn },
            { tag: "Sector Area", formula: "Area = (θ / 360°) × πr²", tagColor: purple }
          ],
          notes: "π ≈ 22/7 or 3.14159  |  Semicircle Area = ½ πr², Perimeter = πr + 2r"
        });
      } else if (geo === "formulaParallelogram") {
        drawFormulaLayout({
          title: "Parallelogram & Rhombus Formulas",
          subtitle: "NCERT Class 7–9 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const bw = Math.min(fw * 0.60, 160);
            const bh = Math.min(fh * 0.50, 95);
            const slant = Math.round(bw * 0.28);
            const x1 = fcx - bw / 2 - slant / 2, y1_ = fcy + bh / 2 - 4;
            const x2 = x1 + bw, y2_ = y1_;
            const x3 = x2 + slant, y3_ = y1_ - bh;
            const x4 = x1 + slant, y4_ = y3_;

            ctx.fillStyle = isActuallyDark ? "rgba(192, 132, 252, 0.18)" : "rgba(126, 34, 206, 0.10)";
            ctx.beginPath();
            ctx.moveTo(x1, y1_); ctx.lineTo(x2, y2_); ctx.lineTo(x3, y3_); ctx.lineTo(x4, y4_); ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = purple;
            ctx.lineWidth = 2.2;
            ctx.stroke();

            drawParallelArrow(ctx, (x1 + x2) / 2, y1_, 0, 7);
            drawParallelArrow(ctx, (x4 + x3) / 2, y4_, 0, 7);

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = danger;
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(x4, y4_); ctx.lineTo(x4, y1_); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = danger;
            ctx.strokeRect(x4, y1_ - 8, 8, 8);

            drawDoubleArrow(ctx, x1, y1_ + 14, x2, y2_ + 14, 6);
            drawLabel("Base (b)", (x1 + x2) / 2, y1_ + 26, fontSmall, purple, "center", "middle", true);
            drawLabel("h", x4 - 12, fcy, fontHeader, danger, "center", "middle", true);
            drawLabel("a", (x1 + x4) / 2 - 14, (y1_ + y4_) / 2, fontSmall, color, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Parallelogram", formula: "Area = b × h,  P = 2(a + b)", tagColor: purple },
            { tag: "Rhombus Area", formula: "Area = ½ × d₁ × d₂", tagColor: accent },
            { tag: "Rhombus Side", formula: "a = ½ √(d₁² + d₂²),  P = 4a", tagColor: warn },
            { tag: "Diagonals", formula: "Bisect each other at right angles (90°)", tagColor: primary }
          ],
          notes: "Rhombus is an equilateral parallelogram with perpendicular diagonals"
        });
      } else if (geo === "formulaTrapezium") {
        drawFormulaLayout({
          title: "Trapezium: Perimeter & Area Formulas",
          subtitle: "NCERT Class 8–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const topW = Math.min(fw * 0.40, 95);
            const botW = Math.min(fw * 0.72, 175);
            const th = Math.min(fh * 0.52, 110);
            const topY_ = fcy - th / 2 - 6, botY_ = fcy + th / 2 - 6;
            const p1x = fcx - topW / 2, p1y = topY_;
            const p2x = fcx + topW / 2, p2y = topY_;
            const p3x = fcx + botW / 2, p3y = botY_;
            const p4x = fcx - botW / 2, p4y = botY_;

            ctx.fillStyle = isActuallyDark ? "rgba(234, 88, 12, 0.18)" : "rgba(234, 88, 12, 0.10)";
            ctx.beginPath();
            ctx.moveTo(p1x, p1y); ctx.lineTo(p2x, p2y); ctx.lineTo(p3x, p3y); ctx.lineTo(p4x, p4y); ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#c2410c";
            ctx.lineWidth = 2.2;
            ctx.stroke();

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = danger;
            ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(p1x, p1y); ctx.lineTo(p1x, botY_); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = danger;
            ctx.strokeRect(p1x, botY_ - 8, 8, 8);

            drawDoubleArrow(ctx, p1x, p1y - 12, p2x, p2y - 12, 5);
            drawLabel("a (top)", fcx, p1y - 24, fontSmall, color, "center", "middle", true);

            drawDoubleArrow(ctx, p4x, botY_ + 14, p3x, botY_ + 14, 6);
            drawLabel("b (base)", fcx, botY_ + 26, fontSmall, color, "center", "middle", true);

            drawLabel("h", p1x - 12, fcy - 6, fontHeader, danger, "center", "middle", true);
            drawLabel("c", (p1x + p4x) / 2 - 12, fcy - 6, fontSmall, color, "center", "middle", true);
            drawLabel("d", (p2x + p3x) / 2 + 12, fcy - 6, fontSmall, color, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Area (A)", formula: "Area = ½(a + b) × h", tagColor: accent },
            { tag: "Perimeter (P)", formula: "P = a + b + c + d", tagColor: primary },
            { tag: "Median (m)", formula: "m = ½(a + b)  ⇒  Area = m × h", tagColor: warn },
            { tag: "Parallel Bases", formula: "Bases a ∥ b are parallel segments", tagColor: purple }
          ],
          notes: "Area equals the product of altitude and average of parallel sides"
        });
      } else if (geo === "formulaCube") {
        drawFormulaLayout({
          title: "3D Cube: Surface Area & Volume",
          subtitle: "NCERT Class 8–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const s = Math.min(fw * 0.40, fh * 0.45, 88);
            const isoX = Math.round(s * 0.42), isoY = Math.round(s * 0.28);
            const x0 = fcx - s / 2 - isoX / 2, y0 = fcy - s / 2 + isoY / 2 - 6;

            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.22)" : "rgba(16, 185, 129, 0.14)";
            ctx.fillRect(x0, y0, s, s);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.strokeRect(x0, y0, s, s);

            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.38)" : "rgba(16, 185, 129, 0.25)";
            ctx.beginPath();
            ctx.moveTo(x0, y0); ctx.lineTo(x0 + isoX, y0 - isoY); ctx.lineTo(x0 + s + isoX, y0 - isoY); ctx.lineTo(x0 + s, y0); ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.30)" : "rgba(16, 185, 129, 0.18)";
            ctx.beginPath();
            ctx.moveTo(x0 + s, y0); ctx.lineTo(x0 + s + isoX, y0 - isoY); ctx.lineTo(x0 + s + isoX, y0 + s - isoY); ctx.lineTo(x0 + s, y0 + s); ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = isActuallyDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(x0, y0 + s); ctx.lineTo(x0 + isoX, y0 + s - isoY); ctx.lineTo(x0 + s + isoX, y0 + s - isoY);
            ctx.moveTo(x0 + isoX, y0 + s - isoY); ctx.lineTo(x0 + isoX, y0 - isoY);
            ctx.stroke();
            ctx.restore();

            drawDoubleArrow(ctx, x0, y0 + s + 14, x0 + s, y0 + s + 14, 5);
            drawLabel("Edge (a)", x0 + s / 2, y0 + s + 26, fontSmall, accent, "center", "middle", true);
            drawLabel("a", x0 - 12, y0 + s / 2, fontSmall, accent, "center", "middle", true);
          },
          formulaRows: [
            { tag: "LSA (4 Walls)", formula: "LSA = 4a²", tagColor: primary },
            { tag: "TSA (6 Faces)", formula: "TSA = 6a²", tagColor: accent },
            { tag: "Volume (V)", formula: "V = a³", tagColor: warn },
            { tag: "Space Diagonal", formula: "d = a√3  (Face Diag = a√2)", tagColor: purple }
          ],
          notes: "Cube has 6 equal square faces, 12 equal edges, and 8 vertices"
        });
      } else if (geo === "formulaCuboid") {
        drawFormulaLayout({
          title: "3D Cuboid: Surface Area & Volume",
          subtitle: "NCERT Class 8–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const l = Math.min(fw * 0.54, 130);
            const h_ = Math.min(fh * 0.44, 82);
            const isoX = Math.round(l * 0.28), isoY = Math.round(h_ * 0.28);
            const x0 = fcx - l / 2 - isoX / 2, y0 = fcy - h_ / 2 + isoY / 2 - 6;

            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.22)" : "rgba(2, 132, 199, 0.14)";
            ctx.fillRect(x0, y0, l, h_);
            ctx.strokeStyle = primary;
            ctx.lineWidth = 2;
            ctx.strokeRect(x0, y0, l, h_);

            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.38)" : "rgba(2, 132, 199, 0.25)";
            ctx.beginPath();
            ctx.moveTo(x0, y0); ctx.lineTo(x0 + isoX, y0 - isoY); ctx.lineTo(x0 + l + isoX, y0 - isoY); ctx.lineTo(x0 + l, y0); ctx.closePath();
            ctx.fill(); ctx.stroke();

            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.30)" : "rgba(2, 132, 199, 0.18)";
            ctx.beginPath();
            ctx.moveTo(x0 + l, y0); ctx.lineTo(x0 + l + isoX, y0 - isoY); ctx.lineTo(x0 + l + isoX, y0 + h_ - isoY); ctx.lineTo(x0 + l, y0 + h_); ctx.closePath();
            ctx.fill(); ctx.stroke();

            drawDoubleArrow(ctx, x0, y0 + h_ + 14, x0 + l, y0 + h_ + 14, 5);
            drawLabel("l (length)", x0 + l / 2, y0 + h_ + 26, fontSmall, primary, "center", "middle", true);

            drawDoubleArrow(ctx, x0 - 12, y0, x0 - 12, y0 + h_, 5);
            drawLabel("h", x0 - 24, y0 + h_ / 2, fontSmall, primary, "center", "middle", true);

            drawLabel("b (breadth)", x0 + l + isoX / 2 + 14, y0 - isoY / 2 - 4, fontSmall, accent, "center", "middle", true);
          },
          formulaRows: [
            { tag: "LSA (4 Walls)", formula: "LSA = 2h(l + b)", tagColor: primary },
            { tag: "TSA (Total)", formula: "TSA = 2(lb + bh + hl)", tagColor: accent },
            { tag: "Volume (V)", formula: "V = l × b × h", tagColor: warn },
            { tag: "Space Diagonal", formula: "d = √(l² + b² + h²)", tagColor: purple }
          ],
          notes: "Cuboid has 6 rectangular faces, opposite faces are identical"
        });
      } else if (geo === "formulaCylinder") {
        drawFormulaLayout({
          title: "3D Cylinder: Surface Area & Volume",
          subtitle: "NCERT Class 8–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const rx = Math.min(fw * 0.28, 55), ry = Math.round(rx * 0.32);
            const ch = Math.min(fh * 0.58, 120);
            const topY_ = fcy - ch / 2 - 4, botY_ = fcy + ch / 2 - 4;

            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.12)";
            ctx.beginPath();
            ctx.moveTo(fcx - rx, topY_);
            ctx.lineTo(fcx - rx, botY_);
            ctx.ellipse(fcx, botY_, rx, ry, 0, Math.PI, 0, true);
            ctx.lineTo(fcx + rx, topY_);
            ctx.ellipse(fcx, topY_, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fcx - rx, topY_); ctx.lineTo(fcx - rx, botY_);
            ctx.moveTo(fcx + rx, topY_); ctx.lineTo(fcx + rx, botY_);
            ctx.stroke();

            ctx.beginPath(); ctx.ellipse(fcx, topY_, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(fcx, botY_, rx, ry, 0, 0, Math.PI); ctx.stroke();

            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.ellipse(fcx, botY_, rx, ry, 0, Math.PI, Math.PI * 2); ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = danger;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(fcx, topY_); ctx.lineTo(fcx, botY_); ctx.stroke();
            ctx.restore();

            ctx.strokeStyle = primary;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(fcx, topY_); ctx.lineTo(fcx + rx, topY_); ctx.stroke();
            drawLabel("Radius (r)", fcx + rx / 2, topY_ - 14, fontSmall, primary, "center", "middle", true);

            drawDoubleArrow(ctx, fcx + rx + 16, topY_, fcx + rx + 16, botY_, 6);
            drawLabel("h (height)", fcx + rx + 32, fcy - 4, fontSmall, accent, "center", "middle", true);
          },
          formulaRows: [
            { tag: "CSA (Curved)", formula: "CSA = 2πrh", tagColor: primary },
            { tag: "TSA (Total)", formula: "TSA = 2πr(r + h)", tagColor: accent },
            { tag: "Volume (V)", formula: "V = πr²h", tagColor: warn },
            { tag: "Two Bases", formula: "Area = 2 × (πr²) = 2πr²", tagColor: purple }
          ],
          notes: "Hollow Cylinder: Volume = π(R² - r²)h,  TSA = 2π(R+r)h + 2π(R²-r²)"
        });
      } else if (geo === "formulaCone") {
        drawFormulaLayout({
          title: "3D Cone: Surface Area & Volume",
          subtitle: "NCERT Class 9–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const rx = Math.min(fw * 0.30, 58), ry = Math.round(rx * 0.30);
            const ch = Math.min(fh * 0.60, 125);
            const topY_ = fcy - ch / 2 - 6, botY_ = fcy + ch / 2 - 6;

            ctx.fillStyle = isActuallyDark ? "rgba(245, 158, 11, 0.18)" : "rgba(245, 158, 11, 0.12)";
            ctx.beginPath();
            ctx.moveTo(fcx, topY_);
            ctx.lineTo(fcx - rx, botY_);
            ctx.ellipse(fcx, botY_, rx, ry, 0, Math.PI, 0, true);
            ctx.lineTo(fcx, topY_);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = warn;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fcx, topY_); ctx.lineTo(fcx - rx, botY_);
            ctx.moveTo(fcx, topY_); ctx.lineTo(fcx + rx, botY_);
            ctx.stroke();

            ctx.beginPath(); ctx.ellipse(fcx, botY_, rx, ry, 0, 0, Math.PI); ctx.stroke();

            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.ellipse(fcx, botY_, rx, ry, 0, Math.PI, Math.PI * 2); ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = danger;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(fcx, topY_); ctx.lineTo(fcx, botY_); ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = danger;
            ctx.strokeRect(fcx, botY_ - 8, 8, 8);

            ctx.strokeStyle = primary;
            ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.moveTo(fcx, botY_); ctx.lineTo(fcx + rx, botY_); ctx.stroke();
            drawLabel("r", fcx + rx / 2, botY_ + 14, fontHeader, primary, "center", "middle", true);

            drawLabel("h", fcx - 12, fcy, fontHeader, danger, "center", "middle", true);
            drawLabel("l (slant)", fcx + rx / 2 + 16, fcy - 8, fontSmall, purple, "center", "middle", true);
            drawLabel("Apex", fcx, topY_ - 12, fontSmall, color, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Slant Height (l)", formula: "l = √(r² + h²)", tagColor: warn },
            { tag: "CSA (Curved)", formula: "CSA = πrl", tagColor: primary },
            { tag: "TSA (Total)", formula: "TSA = πr(r + l)", tagColor: accent },
            { tag: "Volume (V)", formula: "V = ⅓ πr²h", tagColor: purple }
          ],
          notes: "Cone volume is exactly 1/3 of the volume of a cylinder with same r & h"
        });
      } else if (geo === "formulaSphere") {
        drawFormulaLayout({
          title: "Sphere & Hemisphere Formulas",
          subtitle: "NCERT Class 9–10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const r = Math.min(fw * 0.26, fh * 0.28, 56);
            const sCX = fcx - Math.round(fw * 0.14);

            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.18)" : "rgba(2, 132, 199, 0.12)";
            ctx.beginPath(); ctx.arc(sCX, fcy, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = primary;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(sCX, fcy, r, 0, Math.PI * 2); ctx.stroke();

            ctx.beginPath(); ctx.ellipse(sCX, fcy, r, r * 0.34, 0, 0, Math.PI); ctx.stroke();

            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.ellipse(sCX, fcy, r, r * 0.34, 0, Math.PI, Math.PI * 2); ctx.stroke();
            ctx.restore();

            ctx.beginPath(); ctx.moveTo(sCX, fcy); ctx.lineTo(sCX + r, fcy); ctx.stroke();
            drawLabel("r", sCX + r / 2, fcy - 10, fontHeader, primary, "center", "middle", true);
            drawLabel("Sphere", sCX, fcy + r + 18, fontHeader, primary, "center", "middle", true);

            const hCX = fcx + Math.round(fw * 0.20), hR = Math.round(r * 0.72);
            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.12)";
            ctx.beginPath();
            ctx.ellipse(hCX, fcy - 8, hR, hR * 0.36, 0, 0, Math.PI * 2);
            ctx.arc(hCX, fcy - 8, hR, 0, Math.PI);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = accent;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.ellipse(hCX, fcy - 8, hR, hR * 0.36, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(hCX, fcy - 8, hR, 0, Math.PI); ctx.stroke();
            drawLabel("Hemisphere", hCX, fcy + hR + 12, fontHeader, accent, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Sphere SA", formula: "Surface Area = 4πr²", tagColor: primary },
            { tag: "Sphere Vol (V)", formula: "Volume = ⁴⁄₃ πr³", tagColor: warn },
            { tag: "Hemi CSA", formula: "CSA = 2πr²", tagColor: accent },
            { tag: "Hemi TSA", formula: "TSA = 3πr²  (Vol = ⅔ πr³)", tagColor: purple }
          ],
          notes: "A sphere has no edges or vertices; its surface area equals 4 great circles"
        });
      } else if (geo === "formulaFrustum") {
        drawFormulaLayout({
          title: "Frustum of Cone: Area & Volume",
          subtitle: "NCERT Class 10 Mensuration",
          drawFigure: (fcx, fcy, fw, fh) => {
            const r1 = Math.min(fw * 0.18, 35), r2 = Math.min(fw * 0.30, 60);
            const fh_ = Math.min(fh * 0.54, 115);
            const topY_ = fcy - fh_ / 2 - 4, botY_ = fcy + fh_ / 2 - 4;

            ctx.fillStyle = isActuallyDark ? "rgba(192, 132, 252, 0.18)" : "rgba(126, 34, 206, 0.12)";
            ctx.beginPath();
            ctx.ellipse(fcx, topY_, r1, r1 * 0.35, 0, 0, Math.PI * 2);
            ctx.lineTo(fcx + r2, botY_);
            ctx.ellipse(fcx, botY_, r2, r2 * 0.35, 0, 0, Math.PI);
            ctx.lineTo(fcx - r1, topY_);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = purple;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(fcx - r1, topY_); ctx.lineTo(fcx - r2, botY_);
            ctx.moveTo(fcx + r1, topY_); ctx.lineTo(fcx + r2, botY_);
            ctx.stroke();

            ctx.beginPath(); ctx.ellipse(fcx, topY_, r1, r1 * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(fcx, botY_, r2, r2 * 0.35, 0, 0, Math.PI); ctx.stroke();

            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.ellipse(fcx, botY_, r2, r2 * 0.35, 0, Math.PI, Math.PI * 2); ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = danger;
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(fcx, topY_); ctx.lineTo(fcx, botY_); ctx.stroke();
            ctx.restore();

            drawLabel("r₁ (top)", fcx + r1 / 2, topY_ - 12, fontSmall, purple, "center", "middle", true);
            drawLabel("r₂ (base)", fcx + r2 / 2, botY_ + 14, fontSmall, primary, "center", "middle", true);
            drawLabel("h", fcx - 12, fcy - 4, fontHeader, danger, "center", "middle", true);
            drawLabel("l (slant)", fcx + (r1 + r2) / 2 + 16, fcy - 4, fontSmall, warn, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Slant Height (l)", formula: "l = √[h² + (r₂ - r₁)²]", tagColor: warn },
            { tag: "CSA (Curved)", formula: "CSA = πl(r₁ + r₂)", tagColor: primary },
            { tag: "TSA (Total)", formula: "TSA = πl(r₁+r₂) + π(r₁² + r₂²)", tagColor: accent },
            { tag: "Volume (V)", formula: "V = ⅓πh(r₁² + r₂² + r₁r₂)", tagColor: purple }
          ],
          notes: "Formulas derived from similar cone subtraction: V = V_large - V_small"
        });
      } else if (geo === "formulas2D") {
        drawLabel("2D Plane Figures Master Reference Chart", cx, y1 + 22, fontTitle, color);

        const items = [
          { name: "Triangle", p: "P = a + b + c", a: "Area = ½ × b × h", h: "Heron: √[s(s-a)(s-b)(s-c)]" },
          { name: "Rectangle", p: "P = 2(l + b)", a: "Area = l × b", h: "Diagonal = √(l² + b²)" },
          { name: "Square", p: "P = 4a", a: "Area = a²", h: "Diagonal = a√2" },
          { name: "Parallelogram", p: "P = 2(a + b)", a: "Area = b × h", h: "Opposite sides equal" },
          { name: "Rhombus", p: "P = 4a", a: "Area = ½ × d₁ × d₂", h: "Side = ½ √(d₁² + d₂²)" },
          { name: "Trapezium", p: "P = a + b + c + d", a: "Area = ½(a + b)h", h: "Bases a ∥ b" },
          { name: "Circle", p: "C = 2πr", a: "Area = πr²", h: "d = 2r, Sector = (θ/360)πr²" }
        ];

        const tY = topY + 6;
        const rowH = Math.min(26, (contentH - 22) / (items.length + 1));
        const c1W = contentW * 0.28;
        const c2W = contentW * 0.26;
        const c3W = contentW * 0.26;
        const c4W = contentW * 0.20;

        ctx.fillStyle = primary;
        ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
        ctx.fillRect(leftX, tY, contentW, rowH);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = primary;
        ctx.strokeRect(leftX, tY, contentW, rowH);
        drawLabel("Figure & Diagram", leftX + c1W / 2, tY + rowH / 2, fontHeader, primary);
        drawLabel("Perimeter", leftX + c1W + c2W / 2, tY + rowH / 2, fontHeader, primary);
        drawLabel("Area", leftX + c1W + c2W + c3W / 2, tY + rowH / 2, fontHeader, accent);
        drawLabel("Key Relation", rightX - c4W / 2, tY + rowH / 2, fontHeader, warn);

        items.forEach((item, idx) => {
          const ry = tY + rowH * (idx + 1);
          ctx.strokeStyle = borderCol;
          ctx.strokeRect(leftX, ry, c1W, rowH);
          ctx.strokeRect(leftX + c1W, ry, c2W, rowH);
          ctx.strokeRect(leftX + c1W + c2W, ry, c3W, rowH);
          ctx.strokeRect(leftX + c1W + c2W + c3W, ry, c4W, rowH);

          // Draw small icon badge
          const iconX = leftX + 16, iconY = ry + rowH / 2;
          ctx.save();
          ctx.strokeStyle = primary;
          ctx.lineWidth = 1.2;
          if (idx === 0) { // Triangle
            ctx.beginPath(); ctx.moveTo(iconX, iconY - 6); ctx.lineTo(iconX - 7, iconY + 6); ctx.lineTo(iconX + 7, iconY + 6); ctx.closePath(); ctx.stroke();
          } else if (idx === 1) { // Rectangle
            ctx.strokeRect(iconX - 8, iconY - 5, 16, 10);
          } else if (idx === 2) { // Square
            ctx.strokeRect(iconX - 6, iconY - 6, 12, 12);
          } else if (idx === 3) { // Parallelogram
            ctx.beginPath(); ctx.moveTo(iconX - 6, iconY + 5); ctx.lineTo(iconX + 4, iconY + 5); ctx.lineTo(iconX + 8, iconY - 5); ctx.lineTo(iconX - 2, iconY - 5); ctx.closePath(); ctx.stroke();
          } else if (idx === 4) { // Rhombus
            ctx.beginPath(); ctx.moveTo(iconX, iconY - 7); ctx.lineTo(iconX + 6, iconY); ctx.lineTo(iconX, iconY + 7); ctx.lineTo(iconX - 6, iconY); ctx.closePath(); ctx.stroke();
          } else if (idx === 5) { // Trapezium
            ctx.beginPath(); ctx.moveTo(iconX - 4, iconY - 5); ctx.lineTo(iconX + 4, iconY - 5); ctx.lineTo(iconX + 8, iconY + 5); ctx.lineTo(iconX - 8, iconY + 5); ctx.closePath(); ctx.stroke();
          } else { // Circle
            ctx.beginPath(); ctx.arc(iconX, iconY, 6, 0, Math.PI * 2); ctx.stroke();
          }
          ctx.restore();

          drawLabel(item.name, leftX + 32, ry + rowH / 2, fontHeader, color, "left");
          drawLabel(item.p, leftX + c1W + c2W / 2, ry + rowH / 2, fontBody, color);
          drawLabel(item.a, leftX + c1W + c2W + c3W / 2, ry + rowH / 2, fontBody, accent);
          drawLabel(item.h, rightX - c4W / 2, ry + rowH / 2, fontSmall, warn);
        });

        drawLabel("Sector Area = (θ/360°) × πr²  |  Arc Length = (θ/360°) × 2πr", cx, bottomY - 4, fontSmall, primary);
      } else if (geo === "formulas3D") {
        drawLabel("3D Solid Figures Master Reference Chart", cx, y1 + 22, fontTitle, color);

        const items = [
          { name: "Cube", lsa: "4a²", tsa: "6a²", v: "a³", diag: "a√3" },
          { name: "Cuboid", lsa: "2h(l + b)", tsa: "2(lb + bh + hl)", v: "l × b × h", diag: "√(l²+b²+h²)" },
          { name: "Cylinder", lsa: "2πrh", tsa: "2πr(r + h)", v: "πr²h", diag: "r = rad, h = ht" },
          { name: "Cone", lsa: "πrl", tsa: "πr(r + l)", v: "⅓ πr²h", diag: "l = √(r²+h²)" },
          { name: "Sphere", lsa: "4πr²", tsa: "4πr²", v: "⁴⁄₃ πr³", diag: "Uniform radius r" },
          { name: "Hemisphere", lsa: "2πr²", tsa: "3πr²", v: "⅔ πr³", diag: "Half sphere" },
          { name: "Frustum", lsa: "πl(r₁+r₂)", tsa: "πl(r₁+r₂)+π(r₁²+r₂²)", v: "⅓πh(r₁²+r₂²+r₁r₂)", diag: "l = √[h²+(r₂-r₁)²]" }
        ];

        const tY = topY + 6;
        const rowH = Math.min(26, (contentH - 22) / (items.length + 1));
        const c1W = contentW * 0.24;
        const c2W = contentW * 0.18;
        const c3W = contentW * 0.26;
        const c4W = contentW * 0.16;
        const c5W = contentW * 0.16;

        ctx.fillStyle = primary;
        ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
        ctx.fillRect(leftX, tY, contentW, rowH);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = primary;
        ctx.strokeRect(leftX, tY, contentW, rowH);
        drawLabel("3D Solid", leftX + c1W / 2, tY + rowH / 2, fontHeader, primary);
        drawLabel("CSA / LSA", leftX + c1W + c2W / 2, tY + rowH / 2, fontHeader, primary);
        drawLabel("Total Surface Area", leftX + c1W + c2W + c3W / 2, tY + rowH / 2, fontHeader, accent);
        drawLabel("Volume", leftX + c1W + c2W + c3W + c4W / 2, tY + rowH / 2, fontHeader, warn);
        drawLabel("Key Relation", rightX - c5W / 2, tY + rowH / 2, fontHeader, purple);

        items.forEach((item, idx) => {
          const ry = tY + rowH * (idx + 1);
          ctx.strokeStyle = borderCol;
          ctx.strokeRect(leftX, ry, c1W, rowH);
          ctx.strokeRect(leftX + c1W, ry, c2W, rowH);
          ctx.strokeRect(leftX + c1W + c2W, ry, c3W, rowH);
          ctx.strokeRect(leftX + c1W + c2W + c3W, ry, c4W, rowH);
          ctx.strokeRect(leftX + c1W + c2W + c3W + c4W, ry, c5W, rowH);

          // Miniature 3D icon
          const iconX = leftX + 16, iconY = ry + rowH / 2;
          ctx.save();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.2;
          if (idx === 0) { // Cube
            ctx.strokeRect(iconX - 5, iconY - 3, 8, 8);
            ctx.beginPath(); ctx.moveTo(iconX + 3, iconY - 3); ctx.lineTo(iconX + 6, iconY - 6); ctx.lineTo(iconX - 2, iconY - 6); ctx.lineTo(iconX - 5, iconY - 3); ctx.stroke();
          } else if (idx === 1) { // Cuboid
            ctx.strokeRect(iconX - 7, iconY - 3, 11, 7);
          } else if (idx === 2) { // Cylinder
            ctx.beginPath(); ctx.ellipse(iconX, iconY - 5, 5, 2, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(iconX - 5, iconY - 5); ctx.lineTo(iconX - 5, iconY + 5); ctx.moveTo(iconX + 5, iconY - 5); ctx.lineTo(iconX + 5, iconY + 5); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(iconX, iconY + 5, 5, 2, 0, 0, Math.PI); ctx.stroke();
          } else if (idx === 3) { // Cone
            ctx.beginPath(); ctx.moveTo(iconX, iconY - 6); ctx.lineTo(iconX - 5, iconY + 5); ctx.lineTo(iconX + 5, iconY + 5); ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(iconX, iconY + 5, 5, 2, 0, 0, Math.PI); ctx.stroke();
          } else if (idx === 4) { // Sphere
            ctx.beginPath(); ctx.arc(iconX, iconY, 6, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(iconX, iconY, 6, 2, 0, 0, Math.PI); ctx.stroke();
          } else if (idx === 5) { // Hemisphere
            ctx.beginPath(); ctx.arc(iconX, iconY, 5, 0, Math.PI); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(iconX, iconY, 5, 2, 0, 0, Math.PI * 2); ctx.stroke();
          } else { // Frustum
            ctx.beginPath(); ctx.moveTo(iconX - 3, iconY - 5); ctx.lineTo(iconX + 3, iconY - 5); ctx.lineTo(iconX + 6, iconY + 5); ctx.lineTo(iconX - 6, iconY + 5); ctx.closePath(); ctx.stroke();
          }
          ctx.restore();

          drawLabel(item.name, leftX + 30, ry + rowH / 2, fontHeader, color, "left");
          drawLabel(item.lsa, leftX + c1W + c2W / 2, ry + rowH / 2, fontBody, color);
          drawLabel(item.tsa, leftX + c1W + c2W + c3W / 2, ry + rowH / 2, fontBody, accent);
          drawLabel(item.v, leftX + c1W + c2W + c3W + c4W / 2, ry + rowH / 2, fontBody, warn);
          drawLabel(item.diag, rightX - c5W / 2, ry + rowH / 2, fontSmall, purple);
        });

        drawLabel("1 m³ = 1000 Litres  |  1 Litre = 1000 cm³  |  1 m² = 10,000 cm²", cx, bottomY - 4, fontSmall, primary);
      } else if (geo === "formulasMaster" || geo === "formulas") {
        // Master Sheet: Combined 2D & 3D summary
        drawLabel("Master Geometry Formula Sheet (2D & 3D)", cx, y1 + 22, fontTitle, color);

        const colMid = leftX + contentW * 0.49;
        const colW = contentW * 0.48;

        drawLabel("2D Plane Figures", leftX + colW / 2, topY + 12, fontHeader, primary);
        const f2d = [
          "Square: P = 4a, Area = a²",
          "Rectangle: P = 2(l+b), Area = l×b",
          "Triangle: P = a+b+c, Area = ½bh",
          "Circle: C = 2πr, Area = πr²",
          "Parallelogram: Area = b×h",
          "Rhombus: Area = ½ × d₁ × d₂",
          "Trapezium: Area = ½(a+b)h"
        ];
        f2d.forEach((txt, idx) => {
          drawLabel(txt, leftX + colW / 2, topY + 32 + idx * 20, fontBody, color);
        });

        ctx.strokeStyle = borderCol;
        ctx.beginPath(); ctx.moveTo(colMid, topY + 8); ctx.lineTo(colMid, bottomY - 14); ctx.stroke();

        drawLabel("3D Solid Figures", rightX - colW / 2, topY + 12, fontHeader, accent);
        const f3d = [
          "Cube: V = a³, TSA = 6a²",
          "Cuboid: V = lbh, TSA = 2(lb+bh+hl)",
          "Cylinder: V = πr²h, CSA = 2πrh",
          "Cone: V = ⅓πr²h, CSA = πrl",
          "Sphere: V = ⁴⁄₃πr³, SA = 4πr²",
          "Hemisphere: V = ⅔πr³, TSA = 3πr²",
          "Frustum: V = ⅓πh(r₁²+r₂²+r₁r₂)"
        ];
        f3d.forEach((txt, idx) => {
          drawLabel(txt, rightX - colW / 2, topY + 32 + idx * 20, fontBody, color);
        });

        drawLabel("NCERT Mathematics Class 6-10 Complete Mensuration Guide", cx, bottomY - 4, fontSmall, primary);
      }
    }

    // =========================================================================
    // 3. TIMELINE BUILDER
    // =========================================================================
    else if (geo.startsWith("timeline")) {
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      roundRect(ctx, leftX, y1 + 8, contentW, h - 16, 10);
      ctx.fill();
      ctx.stroke();

      let tTitle = "Historical Timeline";
      let events = [];

      if (geo === "timelineIndianFreedom") {
        tTitle = "Indian Freedom Movement (1857–1947)";
        events = [
          { yr: "1857", title: "Sepoy Mutiny", sub: "1st War of Independence", c: rose },
          { yr: "1885", title: "INC Formed", sub: "A.O. Hume foundation", c: warn },
          { yr: "1919", title: "Jallianwala", sub: "Rowlatt Act protest", c: danger },
          { yr: "1920", title: "Non-Coop", sub: "Gandhiji launches movement", c: primary },
          { yr: "1930", title: "Dandi March", sub: "Civil Disobedience", c: accent },
          { yr: "1942", title: "Quit India", sub: "'Do or Die' call", c: purple },
          { yr: "1947", title: "Freedom!", sub: "15th August 1947", c: rose }
        ];
      } else if (geo === "timelineAncientIndia") {
        tTitle = "Chronology of Ancient Indian Eras & Dynasties";
        events = [
          { yr: "2500 BCE", title: "Indus Valley", sub: "Harappa & Mohenjo-daro", c: warn },
          { yr: "1500 BCE", title: "Vedic Era", sub: "Vedas & Upanishads", c: primary },
          { yr: "322 BCE", title: "Maurya Empire", sub: "Chandragupta & Ashoka", c: accent },
          { yr: "320 CE", title: "Gupta Empire", sub: "Golden Age of Math", c: purple },
          { yr: "850 CE", title: "Chola Empire", sub: "Maritime & Temples", c: rose }
        ];
      } else if (geo === "timelineWorldHistory") {
        tTitle = "World History Key Milestones";
        events = [
          { yr: "14th C", title: "Renaissance", sub: "Arts & Enlightenment", c: purple },
          { yr: "1760", title: "Industrial Rev", sub: "Steam & Manufacturing", c: warn },
          { yr: "1789", title: "French Rev", sub: "Liberty & Equality", c: primary },
          { yr: "1914", title: "World War I", sub: "Global conflict begins", c: danger },
          { yr: "1939", title: "World War II", sub: "Allies vs Axis powers", c: danger },
          { yr: "1945", title: "United Nations", sub: "Global peace charter", c: accent }
        ];
      } else if (geo === "timelineScienceMath") {
        tTitle = "Milestones in Mathematics & Science";
        events = [
          { yr: "5th C", title: "Aryabhata", sub: "Zero & Place Value", c: rose },
          { yr: "1440", title: "Printing Press", sub: "Gutenberg's invention", c: warn },
          { yr: "1687", title: "Principia", sub: "Newton's Gravitation", c: primary },
          { yr: "1769", title: "Steam Engine", sub: "James Watt design", c: accent },
          { yr: "1905", title: "Relativity", sub: "Einstein's E = mc²", c: purple },
          { yr: "Modern", title: "AI & Space", sub: "Digital Age & Chandrayaan", c: primary }
        ];
      } else if (geo === "timelineCustom" || true) {
        tTitle = "Custom Chronological Sequence";
        events = [
          { yr: "Phase 1", title: "Initiation", sub: "Project Kickoff", c: primary },
          { yr: "Phase 2", title: "Planning", sub: "Scope & Design", c: accent },
          { yr: "Phase 3", title: "Execution", sub: "Active Development", c: warn },
          { yr: "Phase 4", title: "Review", sub: "Testing & Quality", c: purple },
          { yr: "Phase 5", title: "Launch", sub: "Go Live & Deploy", c: rose }
        ];
      }

      drawLabel(tTitle, cx, y1 + 22, fontTitle, color);

      // Central Axis line
      const axisY = cy + 4;
      const count = events.length;
      const stepX = (contentW - 30) / Math.max(1, count - 1);
      const startX = leftX + 15;

      ctx.strokeStyle = primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(startX, axisY);
      ctx.lineTo(startX + stepX * (count - 1), axisY);
      ctx.stroke();
      drawArrowHead(ctx, startX, axisY, startX + stepX * (count - 1) + 12, axisY, 8);

      events.forEach((ev, idx) => {
        const ex = startX + idx * stepX;
        const isUp = idx % 2 === 0;

        // Node Circle
        ctx.fillStyle = ev.c;
        ctx.beginPath();
        ctx.arc(ex, axisY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = cardBg;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Milestone Year Badge
        ctx.strokeStyle = ev.c;
        ctx.lineWidth = 1.5;
        const badgeY = isUp ? axisY - 26 : axisY + 22;
        roundRect(ctx, ex - 28, badgeY - 10, 56, 20, 6);
        ctx.fillStyle = isActuallyDark ? "rgba(15, 23, 42, 0.9)" : "rgba(255, 255, 255, 0.95)";
        ctx.fill();
        ctx.stroke();
        drawLabel(ev.yr, ex, badgeY, fontHeader, ev.c);

        // Connector line
        ctx.beginPath();
        ctx.moveTo(ex, axisY + (isUp ? -7 : 7));
        ctx.lineTo(ex, badgeY + (isUp ? 10 : -10));
        ctx.stroke();

        // Title and description
        const textY = isUp ? badgeY - 18 : badgeY + 20;
        drawLabel(ev.title, ex, textY, fontHeader, color);
        drawLabel(ev.sub, ex, textY + (isUp ? -12 : 12), fontSmall, isActuallyDark ? "#94a3b8" : "#64748b");
      });

      drawLabel("Chronological Sequence & Event Mapping", cx, bottomY - 4, fontSmall, primary);
    }

    // =========================================================================
    // 4. MAP TOOLS
    // =========================================================================
    else if (geo === "mapIndiaPolitical" || geo === "mapIndiaPhysical") {
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      roundRect(ctx, leftX, y1 + 8, contentW, h - 16, 10);
      ctx.fill();
      ctx.stroke();

      const title = geo === "mapIndiaPolitical" ? "India: Political Outline & Key States" : "India: Major Physical Features & Relief";
      drawLabel(title, cx, y1 + 22, fontTitle, color);

      // Realistic vector coordinates representing the iconic Indian subcontinent outline
      // Normalized between [0, 1] for flexible canvas scaling
      const mapPoints = [
        [0.45, 0.05], [0.49, 0.07], [0.55, 0.12], [0.52, 0.18], [0.56, 0.23], // J&K / Ladakh / North
        [0.62, 0.27], [0.70, 0.29], [0.78, 0.28], [0.85, 0.25], [0.92, 0.28], // Uttarakhand / Nepal border / Northeast
        [0.96, 0.33], [0.92, 0.38], [0.85, 0.39], [0.82, 0.44], [0.78, 0.48], // Assam / Arunachal / Bangladesh border
        [0.72, 0.55], [0.68, 0.65], [0.60, 0.76], [0.54, 0.88], [0.50, 0.95], // Eastern coast down to Kanyakumari
        [0.47, 0.92], [0.42, 0.82], [0.38, 0.70], [0.34, 0.58], [0.30, 0.48], // Western coast up to Goa / Maharashtra
        [0.22, 0.46], [0.15, 0.48], [0.12, 0.42], [0.18, 0.36], [0.24, 0.34], // Gujarat Kathiawar & Kutch
        [0.28, 0.26], [0.34, 0.18], [0.40, 0.12], [0.45, 0.05]                // Rajasthan / Punjab / J&K return
      ];

      const mapW = contentW * 0.70;
      const mapH = contentH * 0.78;
      const mapX = leftX + (contentW - mapW) / 2;
      const mapY = topY + 14;

      // Draw map silhouette
      ctx.beginPath();
      mapPoints.forEach((pt, idx) => {
        const px = mapX + pt[0] * mapW;
        const py = mapY + pt[1] * mapH;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();

      ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.12)" : "rgba(224, 242, 254, 0.65)";
      ctx.fill();
      ctx.strokeStyle = primary;
      ctx.lineWidth = 2;
      ctx.stroke();

      if (geo === "mapIndiaPolitical") {
        // Capital: New Delhi
        const dlx = mapX + 0.42 * mapW, dly = mapY + 0.30 * mapH;
        ctx.fillStyle = danger;
        ctx.beginPath(); ctx.arc(dlx, dly, 5, 0, Math.PI * 2); ctx.fill();
        drawLabel("★ New Delhi", dlx + 36, dly, fontHeader, danger);

        // Key states & regional markers
        drawLabel("Rajasthan", mapX + 0.30 * mapW, mapY + 0.36 * mapH, fontSmall, color);
        drawLabel("Maharashtra", mapX + 0.38 * mapW, mapY + 0.56 * mapH, fontSmall, color);
        drawLabel("Tamil Nadu", mapX + 0.48 * mapW, mapY + 0.82 * mapH, fontSmall, color);
        drawLabel("West Bengal", mapX + 0.72 * mapW, mapY + 0.46 * mapH, fontSmall, color);
        drawLabel("Northeast", mapX + 0.88 * mapW, mapY + 0.34 * mapH, fontSmall, color);

        // Tropic of cancer dashed line
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = warn;
        ctx.beginPath();
        ctx.moveTo(mapX + 0.10 * mapW, mapY + 0.45 * mapH);
        ctx.lineTo(mapX + 0.85 * mapW, mapY + 0.45 * mapH);
        ctx.stroke();
        ctx.setLineDash([]);
        drawLabel("Tropic of Cancer (23.5° N)", mapX + 0.48 * mapW, mapY + 0.43 * mapH, fontSmall, warn);

        // Surrounding water bodies
        drawLabel("Arabian Sea", mapX + 0.12 * mapW, mapY + 0.65 * mapH, fontHeader, primary);
        drawLabel("Bay of Bengal", mapX + 0.84 * mapW, mapY + 0.65 * mapH, fontHeader, primary);
        drawLabel("Indian Ocean", cx, mapY + 0.98 * mapH, fontHeader, primary);

        // Islands
        drawLabel("Lakshadweep", mapX + 0.22 * mapW, mapY + 0.82 * mapH, fontSmall, accent);
        drawLabel("Andaman & Nicobar", mapX + 0.88 * mapW, mapY + 0.80 * mapH, fontSmall, accent);
      } else {
        // Physical features
        // 1. Himalayas Range
        ctx.strokeStyle = rose;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(mapX + 0.42 * mapW, mapY + 0.12 * mapH);
        ctx.quadraticCurveTo(mapX + 0.65 * mapW, mapY + 0.22 * mapH, mapX + 0.90 * mapW, mapY + 0.28 * mapH);
        ctx.stroke();
        drawLabel("The Great Himalayas", mapX + 0.66 * mapW, mapY + 0.16 * mapH, fontHeader, rose);

        // 2. Northern Plains
        drawLabel("Northern Plains", mapX + 0.50 * mapW, mapY + 0.34 * mapH, fontHeader, accent);

        // 3. Thar Desert
        drawLabel("Thar Desert", mapX + 0.26 * mapW, mapY + 0.34 * mapH, fontHeader, warn);

        // 4. Deccan Plateau
        drawLabel("Deccan Plateau", mapX + 0.48 * mapW, mapY + 0.62 * mapH, fontHeader, purple);

        // 5. Western & Eastern Ghats
        drawLabel("Western Ghats", mapX + 0.32 * mapW, mapY + 0.72 * mapH, fontSmall, primary);
        drawLabel("Eastern Ghats", mapX + 0.66 * mapW, mapY + 0.72 * mapH, fontSmall, primary);

        // Waters
        drawLabel("Arabian Sea", mapX + 0.12 * mapW, mapY + 0.65 * mapH, fontSmall, primary);
        drawLabel("Bay of Bengal", mapX + 0.84 * mapW, mapY + 0.65 * mapH, fontSmall, primary);
        drawLabel("Indian Ocean", cx, mapY + 0.98 * mapH, fontSmall, primary);
      }
    } else if (geo === "mapWorldContinents") {
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      roundRect(ctx, leftX, y1 + 8, contentW, h - 16, 10);
      ctx.fill();
      ctx.stroke();

      drawLabel("World Map: Continents & Oceans", cx, y1 + 22, fontTitle, color);

      // Latitudinal reference lines
      const eqY = topY + contentH * 0.52;
      const tcY = topY + contentH * 0.34;
      const capY = topY + contentH * 0.70;

      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = isActuallyDark ? "#475569" : "#cbd5e1";
      ctx.beginPath(); ctx.moveTo(leftX + 10, eqY); ctx.lineTo(rightX - 10, eqY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(leftX + 10, tcY); ctx.lineTo(rightX - 10, tcY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(leftX + 10, capY); ctx.lineTo(rightX - 10, capY); ctx.stroke();
      ctx.setLineDash([]);

      drawLabel("Equator (0°)", rightX - 35, eqY - 6, fontSmall, primary);
      drawLabel("Tropic of Cancer (23.5° N)", rightX - 60, tcY - 6, fontSmall, warn);
      drawLabel("Tropic of Capricorn (23.5° S)", rightX - 65, capY + 8, fontSmall, warn);

      // Continents represented with geographic position pills
      const continents = [
        { name: "North America", x: leftX + contentW * 0.20, y: topY + contentH * 0.28, c: primary },
        { name: "South America", x: leftX + contentW * 0.28, y: topY + contentH * 0.68, c: accent },
        { name: "Europe", x: leftX + contentW * 0.50, y: topY + contentH * 0.24, c: purple },
        { name: "Africa", x: leftX + contentW * 0.51, y: topY + contentH * 0.55, c: warn },
        { name: "Asia", x: leftX + contentW * 0.72, y: topY + contentH * 0.28, c: rose },
        { name: "Australia", x: leftX + contentW * 0.84, y: topY + contentH * 0.72, c: accent },
        { name: "Antarctica", x: cx, y: bottomY - 14, c: primary }
      ];

      continents.forEach((cont) => {
        ctx.fillStyle = cont.c;
        ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
        roundRect(ctx, cont.x - 38, cont.y - 12, 76, 24, 6);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = cont.c;
        ctx.stroke();
        drawLabel(cont.name, cont.x, cont.y, fontHeader, cont.c);
      });

      // Oceans
      drawLabel("Pacific Ocean", leftX + contentW * 0.08, topY + contentH * 0.45, fontSmall, primary);
      drawLabel("Atlantic Ocean", leftX + contentW * 0.38, topY + contentH * 0.40, fontSmall, primary);
      drawLabel("Indian Ocean", leftX + contentW * 0.65, topY + contentH * 0.62, fontSmall, primary);
      drawLabel("Arctic Ocean", cx, topY + 12, fontSmall, primary);
      drawLabel("Southern Ocean", cx, bottomY - 32, fontSmall, primary);
    } else if (geo === "mapCompassRose") {
      // 8-point nautical direction star
      drawLabel("Compass Rose", cx, y1 + 14, fontTitle, color);

      const r = Math.min(contentW, contentH) * 0.38;
      const cyRose = cy + 6;

      // Outer degree ring
      ctx.strokeStyle = primary;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cyRose, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cyRose, r * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      // Degree tick marks
      for (let deg = 0; deg < 360; deg += 30) {
        const rad = (deg * Math.PI) / 180;
        const x1 = cx + (r * 0.85) * Math.cos(rad);
        const y1 = cyRose + (r * 0.85) * Math.sin(rad);
        const x2 = cx + r * Math.cos(rad);
        const y2 = cyRose + r * Math.sin(rad);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }

      // 4 Main Cardinal points (N, S, E, W)
      const starPts = [
        { dir: "N", angle: -Math.PI / 2, len: r * 0.80, c: danger },
        { dir: "E", angle: 0, len: r * 0.70, c: primary },
        { dir: "S", angle: Math.PI / 2, len: r * 0.70, c: primary },
        { dir: "W", angle: Math.PI, len: r * 0.70, c: primary }
      ];

      starPts.forEach((sp) => {
        const tipX = cx + sp.len * Math.cos(sp.angle);
        const tipY = cyRose + sp.len * Math.sin(sp.angle);
        const leftAng = sp.angle - Math.PI / 2;
        const rightAng = sp.angle + Math.PI / 2;
        const baseW = 10;
        const b1x = cx + baseW * Math.cos(leftAng);
        const b1y = cyRose + baseW * Math.sin(leftAng);
        const b2x = cx + baseW * Math.cos(rightAng);
        const b2y = cyRose + baseW * Math.sin(rightAng);

        ctx.fillStyle = sp.c;
        ctx.beginPath(); ctx.moveTo(cx, cyRose); ctx.lineTo(tipX, tipY); ctx.lineTo(b1x, b1y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(cx, cyRose); ctx.lineTo(tipX, tipY); ctx.lineTo(b2x, b2y); ctx.closePath(); ctx.stroke();

        const labelDist = r + 14;
        const lx = cx + labelDist * Math.cos(sp.angle);
        const ly = cyRose + labelDist * Math.sin(sp.angle);
        drawLabel(sp.dir, lx, ly, `bold ${Math.round(13 * sFactor)}px sans-serif`, sp.c);
      });

      // 4 Intercardinal points (NE, NW, SE, SW)
      const subPoints = [
        { dir: "NE", angle: -Math.PI / 4 },
        { dir: "SE", angle: Math.PI / 4 },
        { dir: "SW", angle: (3 * Math.PI) / 4 },
        { dir: "NW", angle: (-3 * Math.PI) / 4 }
      ];
      subPoints.forEach((sp) => {
        const tipX = cx + (r * 0.55) * Math.cos(sp.angle);
        const tipY = cyRose + (r * 0.55) * Math.sin(sp.angle);
        ctx.strokeStyle = accent;
        ctx.beginPath(); ctx.moveTo(cx, cyRose); ctx.lineTo(tipX, tipY); ctx.stroke();
        const lx = cx + (r + 12) * Math.cos(sp.angle);
        const ly = cyRose + (r + 12) * Math.sin(sp.angle);
        drawLabel(sp.dir, lx, ly, fontSmall, accent);
      });

      ctx.fillStyle = primary; ctx.beginPath(); ctx.arc(cx, cyRose, 4, 0, Math.PI * 2); ctx.fill();
    } else if (geo === "mapScaleBar") {
      // Linear map scale bar
      drawLabel("Map Scale (Linear)", cx, y1 + 14, fontTitle, color);

      const barW = contentW * 0.80;
      const barH = 12;
      const bx = cx - barW / 2;
      const by = cy;

      const segments = [
        { label: "0", len: 0 },
        { label: "250", len: barW * 0.25 },
        { label: "500", len: barW * 0.50 },
        { label: "750", len: barW * 0.75 },
        { label: "1000 km", len: barW }
      ];

      // Draw alternating black/white segments
      segments.forEach((seg, idx) => {
        if (idx === 0) return;
        const prev = segments[idx - 1];
        const segW = seg.len - prev.len;
        ctx.fillStyle = idx % 2 === 1 ? primary : (isActuallyDark ? "#334155" : "#ffffff");
        ctx.fillRect(bx + prev.len, by, segW, barH);
        ctx.strokeStyle = color;
        ctx.strokeRect(bx + prev.len, by, segW, barH);
      });

      segments.forEach((seg) => {
        const sx = bx + seg.len;
        ctx.beginPath(); ctx.moveTo(sx, by - 4); ctx.lineTo(sx, by + barH + 4); ctx.stroke();
        drawLabel(seg.label, sx, by - 12, fontSmall, color);
      });

      drawLabel("1 cm represents 250 km  (Representative Fraction: 1 : 25,000,000)", cx, by + barH + 16, fontSmall, primary);
    } else if (geo === "mapLegendBox") {
      drawLabel("Map Legend / Key", cx, y1 + 14, fontTitle, color);

      ctx.fillStyle = cardBg;
      ctx.strokeStyle = borderCol;
      roundRect(ctx, leftX, topY + 4, contentW, contentH - 8, 8);
      ctx.fill();
      ctx.stroke();

      const legendItems = [
        { icon: "★", name: "National Capital", c: danger },
        { icon: "●", name: "Major City / Port", c: primary },
        { icon: "—·—", name: "International Boundary", c: color },
        { icon: "▲", name: "Mountain Peak", c: warn },
        { icon: "〰", name: "River / Canal", c: primary },
        { icon: "░░", name: "Desert Region", c: warn }
      ];

      const itemH = (contentH - 20) / legendItems.length;
      legendItems.forEach((item, idx) => {
        const iy = topY + 14 + idx * itemH;
        drawLabel(item.icon, leftX + 24, iy, fontHeader, item.c);
        drawLabel(item.name, leftX + 44, iy, fontBody, color, "left");
      });
    } else if (geo === "mapPinMarker") {
      drawLabel("Location Pin", cx, y1 + 12, fontTitle, color);

      const pinX = cx, pinY = cy - 6;
      const headR = 14;

      // Pin Head & needle
      ctx.fillStyle = danger;
      ctx.beginPath();
      ctx.arc(pinX, pinY - 14, headR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Needle point
      ctx.fillStyle = danger;
      ctx.beginPath();
      ctx.moveTo(pinX - headR * 0.7, pinY - 14);
      ctx.lineTo(pinX + headR * 0.7, pinY - 14);
      ctx.lineTo(pinX, pinY + 16);
      ctx.closePath();
      ctx.fill();

      // Inner white dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(pinX, pinY - 14, 5, 0, Math.PI * 2);
      ctx.fill();

      // Shadow on ground
      ctx.fillStyle = isActuallyDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.18)";
      ctx.beginPath();
      ctx.ellipse(pinX, pinY + 18, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      drawLabel("Custom Landmark", cx, bottomY - 6, fontHeader, primary);
    }

    ctx.restore();
    return true;
  }

  // Export engine globally
  window.EduAshramAdvancedTools = {
    ADVANCED_PRESETS,
    drawAdvancedEduShape
  };

  console.log("EduAshram Advanced Tools Engine loaded successfully (" + ADVANCED_PRESETS.length + " presets ready).");
})();


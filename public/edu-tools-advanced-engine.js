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
      chip: "Comparison",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Indian vs International Chart",
      subtitle: "Equivalence: 1 Lakh = 100K, 10 Lakh = 1M, 1 Crore = 10M",
      type: "placeValueComparison",
      w: 340,
      h: 160
    },

    // =========================================================================
    // 2. FORMULAS (PERIMETER, AREA & VOLUME)
    // =========================================================================
    {
      group: "formulas",
      chip: "2D Formulas",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "2D Perimeter & Area Formulas",
      subtitle: "Triangle, Rectangle, Square, Parallelogram, Rhombus, Trapezium, Circle",
      type: "formulas2D",
      w: 380,
      h: 230
    },
    {
      group: "formulas",
      chip: "3D Formulas",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "3D Surface Area & Volume Formulas",
      subtitle: "Cube, Cuboid, Cylinder, Cone, Sphere, Hemisphere & Frustum",
      type: "formulas3D",
      w: 380,
      h: 230
    },
    {
      group: "formulas",
      chip: "Master Sheet",
      chipTheme: { bg: "#fdf4ff", color: "#a21caf", border: "#f5d0fe" },
      title: "Master Geometry Formula Sheet",
      subtitle: "Combined 2D and 3D reference table for quick classroom revision",
      type: "formulasMaster",
      w: 400,
      h: 250
    },

    // =========================================================================
    // 3. TIMELINE BUILDER
    // =========================================================================
    {
      group: "timelines",
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

    function drawLabel(text, tx, ty, font, txtColor, align, baseline) {
      if (text === undefined || text === null || text === "") return;
      const str = String(text);
      ctx.save();
      ctx.font = font || fontBody;
      ctx.textAlign = align || "center";
      ctx.textBaseline = baseline || "middle";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.strokeStyle = isActuallyDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.96)";
      ctx.lineWidth = Math.max(2.5, Math.round(3 * sFactor));
      ctx.strokeText(str, tx, ty);

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
    // 2. FORMULAS (2D, 3D & MASTER)
    // =========================================================================
    else if (geo === "formulas2D" || geo === "formulas3D" || geo === "formulasMaster") {
      ctx.fillStyle = cardBg;
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = 1.5;
      roundRect(ctx, leftX, y1 + 8, contentW, h - 16, 10);
      ctx.fill();
      ctx.stroke();

      if (geo === "formulas2D") {
        drawLabel("Perimeter & Area Formulas (2D Figures)", cx, y1 + 22, fontTitle, color);

        const items = [
          { name: "Triangle", p: "P = a + b + c", a: "Area = ½ × b × h", h: "Heron: √[s(s-a)(s-b)(s-c)]" },
          { name: "Equilateral △", p: "P = 3a", a: "Area = (√3 / 4) a²", h: "Altitude = (√3 / 2) a" },
          { name: "Rectangle", p: "P = 2(l + b)", a: "Area = l × b", h: "Diagonal = √(l² + b²)" },
          { name: "Square", p: "P = 4a", a: "Area = a²", h: "Diagonal = a√2" },
          { name: "Parallelogram", p: "P = 2(a + b)", a: "Area = b × h", h: "Opposite sides equal" },
          { name: "Rhombus", p: "P = 4a", a: "Area = ½ × d₁ × d₂", h: "Side = ½ √(d₁² + d₂²)" },
          { name: "Trapezium", p: "P = a + b + c + d", a: "Area = ½(a + b)h", h: "Bases a || b" },
          { name: "Circle", p: "Circumference = 2πr", a: "Area = πr²", h: "d = 2r, π ≈ 22/7" }
        ];

        const tY = topY + 6;
        const rowH = Math.min(22, (contentH - 22) / (items.length + 1));
        const c1W = contentW * 0.24;
        const c2W = contentW * 0.28;
        const c3W = contentW * 0.28;
        const c4W = contentW * 0.20;

        // Table Header
        ctx.fillStyle = primary;
        ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
        ctx.fillRect(leftX, tY, contentW, rowH);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = primary;
        ctx.strokeRect(leftX, tY, contentW, rowH);
        drawLabel("Figure", leftX + c1W / 2, tY + rowH / 2, fontHeader, primary);
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
          drawLabel(item.name, leftX + c1W / 2, ry + rowH / 2, fontHeader, color);
          drawLabel(item.p, leftX + c1W + c2W / 2, ry + rowH / 2, fontBody, color);
          drawLabel(item.a, leftX + c1W + c2W + c3W / 2, ry + rowH / 2, fontBody, accent);
          drawLabel(item.h, rightX - c4W / 2, ry + rowH / 2, fontSmall, warn);
        });

        drawLabel("Sector Area = (θ/360°) × πr²  |  Arc Length = (θ/360°) × 2πr", cx, bottomY - 4, fontSmall, primary);
      } else if (geo === "formulas3D") {
        drawLabel("Surface Area & Volume Formulas (3D Figures)", cx, y1 + 22, fontTitle, color);

        const items = [
          { name: "Cube", lsa: "4a²", tsa: "6a²", v: "a³", diag: "a√3" },
          { name: "Cuboid", lsa: "2h(l + b)", tsa: "2(lb + bh + hl)", v: "l × b × h", diag: "√(l²+b²+h²)" },
          { name: "Cylinder", lsa: "2πrh", tsa: "2πr(r + h)", v: "πr²h", diag: "r = radius, h = height" },
          { name: "Cone", lsa: "πrl", tsa: "πr(r + l)", v: "⅓ πr²h", diag: "l = √(r² + h²)" },
          { name: "Sphere", lsa: "4πr²", tsa: "4πr²", v: "⁴⁄₃ πr³", diag: "Uniform radius r" },
          { name: "Hemisphere", lsa: "2πr²", tsa: "3πr²", v: "⅔ πr³", diag: "Half sphere with base" },
          { name: "Frustum of Cone", lsa: "πl(r₁ + r₂)", tsa: "πl(r₁+r₂) + π(r₁²+r₂²)", v: "⅓πh(r₁²+r₂²+r₁r₂)", diag: "l = √[h²+(r₁-r₂)²]" }
        ];

        const tY = topY + 6;
        const rowH = Math.min(23, (contentH - 22) / (items.length + 1));
        const c1W = contentW * 0.22;
        const c2W = contentW * 0.18;
        const c3W = contentW * 0.26;
        const c4W = contentW * 0.18;
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
        drawLabel("Key Formula", rightX - c5W / 2, tY + rowH / 2, fontHeader, purple);

        items.forEach((item, idx) => {
          const ry = tY + rowH * (idx + 1);
          ctx.strokeStyle = borderCol;
          ctx.strokeRect(leftX, ry, c1W, rowH);
          ctx.strokeRect(leftX + c1W, ry, c2W, rowH);
          ctx.strokeRect(leftX + c1W + c2W, ry, c3W, rowH);
          ctx.strokeRect(leftX + c1W + c2W + c3W, ry, c4W, rowH);
          ctx.strokeRect(leftX + c1W + c2W + c3W + c4W, ry, c5W, rowH);
          drawLabel(item.name, leftX + c1W / 2, ry + rowH / 2, fontHeader, color);
          drawLabel(item.lsa, leftX + c1W + c2W / 2, ry + rowH / 2, fontBody, color);
          drawLabel(item.tsa, leftX + c1W + c2W + c3W / 2, ry + rowH / 2, fontBody, accent);
          drawLabel(item.v, leftX + c1W + c2W + c3W + c4W / 2, ry + rowH / 2, fontBody, warn);
          drawLabel(item.diag, rightX - c5W / 2, ry + rowH / 2, fontSmall, purple);
        });

        drawLabel("1 m³ = 1000 Litres  |  1 Litre = 1000 cm³  |  1 m² = 10,000 cm²", cx, bottomY - 4, fontSmall, primary);
      } else {
        // Master Sheet: Combined 2D & 3D summary
        drawLabel("Master Geometry Formula Sheet (2D & 3D)", cx, y1 + 22, fontTitle, color);

        const colMid = leftX + contentW * 0.49;
        const colW = contentW * 0.48;

        // 2D Section Left
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

        // Divider
        ctx.strokeStyle = borderCol;
        ctx.beginPath(); ctx.moveTo(colMid, topY + 8); ctx.lineTo(colMid, bottomY - 14); ctx.stroke();

        // 3D Section Right
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
      } else {
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
        { name: "Antarctica", x: cx, bottomY - 14, c: primary }
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


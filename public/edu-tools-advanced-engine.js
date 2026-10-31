/**
 * EduAshram Advanced Educational Tools Engine
 * 1. Indian, International & Decimal Place Value Charts
 * 2. Perimeter, Area & Volume Formulas of 2D and 3D Figures
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
      w: 380,
      h: 115
    },
    {
      group: "place_value",
      subgroup: "intl",
      chip: "Intl PVC",
      chipTheme: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
      title: "International Place Value Chart",
      subtitle: "Millions, Thousands, Ones in groups of 3 with period headers",
      type: "placeValueInternational",
      w: 380,
      h: 115
    },
    {
      group: "place_value",
      subgroup: "decimal",
      chip: "Decimal PVC",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Decimal Place Value Chart",
      subtitle: "Whole number & fractional parts (Tenths, Hundredths, Thousandths)",
      type: "placeValueDecimal",
      w: 380,
      h: 115
    },
    {
      group: "place_value",
      subgroup: "comparison",
      chip: "Comparison",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Indian vs International Chart",
      subtitle: "Equivalence: 1 Lakh = 100K, 10 Lakh = 1M, 1 Crore = 10M",
      type: "placeValueComparison",
      w: 360,
      h: 120
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
      title: "Perimeter & Area",
      type: "formulaTriangle",
      w: 430,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "⊿ Right Triangle",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Area & Pythagoras Theorem",
      type: "formulaRightTriangle",
      w: 430,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "▭ Rectangle",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Perimeter, Area & Diagonal",
      type: "formulaRectangle",
      w: 430,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "□ Square",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "Perimeter, Area & Diagonal",
      type: "formulaSquare",
      w: 420,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "○ Circle",
      chipTheme: { bg: "#fffbeb", color: "#b45309", border: "#fde68a" },
      title: "Circumference & Area",
      type: "formulaCircle",
      w: 450,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "▱ Parallelogram",
      chipTheme: { bg: "#faf5ff", color: "#7e22ce", border: "#e9d5ff" },
      title: "Perimeter & Area",
      type: "formulaParallelogram",
      w: 450,
      h: 240
    },
    {
      group: "formulas",
      subgroup: "2d",
      chip: "⏢ Trapezium",
      chipTheme: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
      title: "Perimeter & Area",
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
      title: "Surface Area & Volume",
      type: "formulaCube",
      w: 440,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "📦 Cuboid",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "Surface Area & Volume",
      type: "formulaCuboid",
      w: 450,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "🛢️ Cylinder",
      chipTheme: { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" },
      title: "Surface Area & Volume",
      type: "formulaCylinder",
      w: 440,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "🍦 Cone",
      chipTheme: { bg: "#fef3c7", color: "#b45309", border: "#fde68a" },
      title: "Surface Area & Volume",
      type: "formulaCone",
      w: 440,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "⚽ Sphere",
      chipTheme: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
      title: "Surface Area & Volume",
      type: "formulaSphere",
      w: 460,
      h: 245
    },
    {
      group: "formulas",
      subgroup: "3d",
      chip: "🥤 Frustum",
      chipTheme: { bg: "#fdf4ff", color: "#a21caf", border: "#f5d0fe" },
      title: "Area & Volume",
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
      title: "2D Figures Master Chart",
      type: "formulas2D",
      w: 440,
      h: 180
    },
    {
      group: "formulas",
      subgroup: "master",
      chip: "3D Master",
      chipTheme: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
      title: "3D Solids Master Chart",
      type: "formulas3D",
      w: 450,
      h: 185
    },
    {
      group: "formulas",
      subgroup: "master",
      chip: "Master Sheet",
      chipTheme: { bg: "#fdf4ff", color: "#a21caf", border: "#f5d0fe" },
      title: "Master Formula Sheet (2D & 3D)",
      type: "formulasMaster",
      w: 450,
      h: 185
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

    const preset = ADVANCED_PRESETS.find((p) => p.type === geo);
    const baseW = preset && preset.w ? preset.w * 2 : 860;
    const baseH = preset && preset.h ? preset.h * 2 : 360;

    const scaleX = w / baseW;
    const scaleY = h / baseH;
    // Proportional scale factor using geometric mean, clamped to safe operational bounds (0.65 to 4.5)
    const sFactor = Math.max(0.65, Math.min(4.5, Math.sqrt(scaleX * scaleY)));

    const fontTitle = `bold ${Math.max(12, Math.round(14 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontHeader = `bold ${Math.max(10.5, Math.round(12 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontBody  = `${Math.max(9.5, Math.round(11 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
    const fontSmall = `${Math.max(8.5, Math.round(10 * sFactor))}px "Plus Jakarta Sans", sans-serif`;

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
        ctx.lineWidth = Math.max(2, Math.round(2.5 * Math.sqrt(sFactor)));
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
      function drawPlaceValueCard({ title, subtitle, renderTable, footerNote }) {
        const cardX = leftX;
        const cardY = y1 + 4;
        const cardW = contentW;
        const cardH = h - 8;
        const cardR = Math.max(10, Math.round(12 * Math.min(scaleX, scaleY)));

        // Outer Card
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1.5;
        roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
        ctx.fill();
        ctx.stroke();

        // Top Header Banner
        const headerH = subtitle
          ? Math.max(46, Math.round(cardH * 0.18))
          : Math.max(38, Math.round(cardH * 0.14));
        const headerBottomY = cardY + headerH;

        ctx.save();
        ctx.beginPath();
        roundRect(ctx, cardX, cardY, cardW, headerH, cardR);
        ctx.clip();
        ctx.fillStyle = isActuallyDark ? "rgba(30, 41, 59, 0.95)" : "rgba(241, 245, 249, 0.88)";
        ctx.fillRect(cardX, cardY, cardW, headerH);
        ctx.restore();

        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX, headerBottomY);
        ctx.lineTo(cardX + cardW, headerBottomY);
        ctx.stroke();

        const titleY = cardY + Math.round(headerH * 0.38);
        const subY = cardY + Math.round(headerH * 0.74);
        const cardTitleFont = `bold ${Math.max(13.5, Math.round(15 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
        const cardSubFont = `600 ${Math.max(9.5, Math.round(10.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;

        drawLabel(title, cx, titleY, cardTitleFont, color, "center", "middle", false);
        if (subtitle) {
          const subColor = isActuallyDark ? "#94a3b8" : "#64748b";
          drawLabel(subtitle, cx, subY, cardSubFont, subColor, "center", "middle", false);
        }

        // Bottom Footer Pill Strip
        const footerH = footerNote ? Math.max(24, Math.round(cardH * 0.10)) : 0;
        const footerY = cardY + cardH - footerH - 6;

        if (footerNote) {
          const footPillX = cardX + 12;
          const footPillW = cardW - 24;

          ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.08)" : "rgba(2, 132, 199, 0.05)";
          ctx.strokeStyle = isActuallyDark ? "rgba(56, 189, 248, 0.25)" : "rgba(2, 132, 199, 0.18)";
          ctx.lineWidth = 1;
          roundRect(ctx, footPillX, footerY, footPillW, footerH, 6);
          ctx.fill();
          ctx.stroke();

          const noteFont = `600 ${Math.max(9, Math.round(10 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
          drawLabel("💡 " + footerNote, cx, footerY + footerH / 2, noteFont, primary, "center", "middle", false);
        }

        // Table Area (strictly between header and footer)
        const tableAreaTop = headerBottomY + 8;
        const tableAreaBottom = footerNote ? (footerY - 8) : (cardY + cardH - 8);
        const tableAreaH = Math.max(60, tableAreaBottom - tableAreaTop);

        if (typeof renderTable === "function") {
          renderTable(cardX + 10, tableAreaTop, cardW - 20, tableAreaH);
        }
      }

      if (geo === "placeValueDecimal") {
        drawPlaceValueCard({
          title: "Decimal Place Value Chart",
          subtitle: "Whole Number (Integral) Part  •  Decimal Point  •  Fractional (Decimal) Part",
          footerNote: "Expanded Form: 345.678 = 300 + 40 + 5 + 6/10 + 7/100 + 8/1000  (300 + 40 + 5 + 0.6 + 0.07 + 0.008)",
          renderTable: (tblX, tblY, tblW, tblH) => {
            const cols = [
              { name: "Hundreds", sym: "H", val: "100", d: "3", dVal: "300", group: "whole", c: primary },
              { name: "Tens", sym: "T", val: "10", d: "4", dVal: "40", group: "whole", c: primary },
              { name: "Ones", sym: "O", val: "1", d: "5", dVal: "5", group: "whole", c: primary },
              { name: "Point", sym: "·", val: "·", d: "·", dVal: "·", group: "point", c: danger },
              { name: "Tenths", sym: "1/10", val: "0.1", d: "6", dVal: "0.6", group: "frac", c: accent },
              { name: "Hundredths", sym: "1/100", val: "0.01", d: "7", dVal: "0.07", group: "frac", c: accent },
              { name: "Thousandths", sym: "1/1000", val: "0.001", d: "8", dVal: "0.008", group: "frac", c: accent }
            ];

            const totalRows = 5;
            const rowH = Math.max(22, Math.floor(tblH / totalRows));
            const totalTblH = totalRows * rowH;
            const startY = tblY + Math.max(0, Math.floor((tblH - totalTblH) / 2));
            const colW = tblW / cols.length;

            const pvHeadFont = `bold ${Math.max(10.5, Math.round(Math.min(rowH * 0.36, 12 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const digitFont = `bold ${Math.max(13, Math.round(Math.min(rowH * 0.52, 18 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const pvValFont = `600 ${Math.max(9, Math.round(Math.min(rowH * 0.32, 10.5 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;

            // Row 0: Top Super-Header Grouping (Whole Number, Point, Fractional)
            const wW = colW * 3;
            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.22)" : "rgba(2, 132, 199, 0.12)";
            ctx.strokeStyle = primary;
            ctx.fillRect(tblX, startY, wW, rowH);
            ctx.strokeRect(tblX, startY, wW, rowH);
            drawLabel("Whole Number (Integral) Part", tblX + wW / 2, startY + rowH / 2, pvHeadFont, primary, "center", "middle", false);

            const pX = tblX + wW;
            ctx.fillStyle = isActuallyDark ? "rgba(244, 63, 94, 0.25)" : "rgba(225, 29, 72, 0.15)";
            ctx.strokeStyle = danger;
            ctx.fillRect(pX, startY, colW, rowH);
            ctx.strokeRect(pX, startY, colW, rowH);
            drawLabel("Decimal", pX + colW / 2, startY + rowH / 2, pvHeadFont, danger, "center", "middle", false);

            const fX = pX + colW;
            const fW = colW * 3;
            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.22)" : "rgba(16, 185, 129, 0.12)";
            ctx.strokeStyle = accent;
            ctx.fillRect(fX, startY, fW, rowH);
            ctx.strokeRect(fX, startY, fW, rowH);
            drawLabel("Fractional (Decimal) Part", fX + fW / 2, startY + rowH / 2, pvHeadFont, accent, "center", "middle", false);

            // Rows 1-4: Place Names, Values, Digits, Digit Values
            cols.forEach((col, idx) => {
              const cx_ = tblX + idx * colW;

              // Row 1: Place Name
              ctx.strokeStyle = borderCol;
              ctx.fillStyle = isActuallyDark ? "rgba(255,255,255,0.03)" : "rgba(248, 250, 252, 0.8)";
              ctx.fillRect(cx_, startY + rowH, colW, rowH);
              ctx.strokeRect(cx_, startY + rowH, colW, rowH);
              drawLabel(col.name, cx_ + colW / 2, startY + rowH + rowH / 2, pvHeadFont, col.c, "center", "middle", false);

              // Row 2: Symbol & Value (e.g. H / 100, 1/10 / 0.1)
              const valTxt = col.group === "point" ? "·" : (col.sym + " (" + col.val + ")");
              ctx.strokeRect(cx_, startY + rowH * 2, colW, rowH);
              drawLabel(valTxt, cx_ + colW / 2, startY + rowH * 2 + rowH / 2, pvValFont, color, "center", "middle", false);

              // Row 3: Sample Digit (large bold)
              ctx.fillStyle = isActuallyDark ? "rgba(255,255,255,0.05)" : "#ffffff";
              ctx.fillRect(cx_, startY + rowH * 3, colW, rowH);
              ctx.strokeRect(cx_, startY + rowH * 3, colW, rowH);
              drawLabel(col.d, cx_ + colW / 2, startY + rowH * 3 + rowH / 2, digitFont, col.c, "center", "middle", false);

              // Row 4: Value in Number
              ctx.strokeRect(cx_, startY + rowH * 4, colW, rowH);
              const valNumTxt = col.group === "point" ? "·" : col.dVal;
              drawLabel(valNumTxt, cx_ + colW / 2, startY + rowH * 4 + rowH / 2, pvValFont, col.c, "center", "middle", false);
            });
          }
        });
      } else if (geo === "placeValueIndian") {
        drawPlaceValueCard({
          title: "Indian Place Value Chart",
          subtitle: "Crores, Lakhs, Thousands, Ones Periods (Standard: 3, 2, 2 Rule)",
          footerNote: "Example: 78,43,29,651 = 78 Crore 43 Lakh 29 Thousand 651  (Rule: 3 digits from right, then groups of 2)",
          renderTable: (tblX, tblY, tblW, tblH) => {
            const periods = [
              { name: "Crores", cols: [{ s: "TC", v: "10⁸", d: "7", val: "70 Cr" }, { s: "C", v: "10⁷", d: "8", val: "8 Cr" }], c: rose },
              { name: "Lakhs", cols: [{ s: "TL", v: "10⁶", d: "4", val: "40 L" }, { s: "L", v: "10⁵", d: "3", val: "3 L" }], c: warn },
              { name: "Thousands", cols: [{ s: "T-Th", v: "10⁴", d: "2", val: "20 K" }, { s: "Th", v: "10³", d: "9", val: "9 K" }], c: primary },
              { name: "Ones", cols: [{ s: "H", v: "10²", d: "6", val: "600" }, { s: "T", v: "10¹", d: "5", val: "50" }, { s: "O", v: "10⁰", d: "1", val: "1" }], c: accent }
            ];

            const totalCols = 9;
            const colW = tblW / totalCols;
            const totalRows = 5;
            const rowH = Math.max(22, Math.floor(tblH / totalRows));
            const totalTblH = totalRows * rowH;
            const startY = tblY + Math.max(0, Math.floor((tblH - totalTblH) / 2));

            const pvHeadFont = `bold ${Math.max(10.5, Math.round(Math.min(rowH * 0.36, 12 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const digitFont = `bold ${Math.max(13, Math.round(Math.min(rowH * 0.52, 18 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const pvValFont = `600 ${Math.max(9, Math.round(Math.min(rowH * 0.32, 10.5 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;

            // Row 0: Period Headers
            let curX = tblX;
            periods.forEach((p) => {
              const pW = colW * p.cols.length;
              ctx.fillStyle = p.c;
              ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
              ctx.fillRect(curX, startY, pW, rowH);
              ctx.globalAlpha = 1.0;
              ctx.strokeStyle = p.c;
              ctx.strokeRect(curX, startY, pW, rowH);
              drawLabel(p.name, curX + pW / 2, startY + rowH / 2, pvHeadFont, p.c, "center", "middle", false);
              curX += pW;
            });

            // Rows 1-4: Place Names, Powers of 10, Sample Digits, Value
            curX = tblX;
            periods.forEach((p) => {
              p.cols.forEach((col) => {
                const rx = curX;
                ctx.strokeStyle = borderCol;
                ctx.strokeRect(rx, startY + rowH, colW, rowH);
                drawLabel(col.s, rx + colW / 2, startY + rowH + rowH / 2, pvHeadFont, color, "center", "middle", false);

                ctx.strokeRect(rx, startY + rowH * 2, colW, rowH);
                drawLabel(col.v, rx + colW / 2, startY + rowH * 2 + rowH / 2, pvValFont, primary, "center", "middle", false);

                ctx.fillStyle = isActuallyDark ? "rgba(255,255,255,0.05)" : "#ffffff";
                ctx.fillRect(rx, startY + rowH * 3, colW, rowH);
                ctx.strokeRect(rx, startY + rowH * 3, colW, rowH);
                drawLabel(col.d, rx + colW / 2, startY + rowH * 3 + rowH / 2, digitFont, p.c, "center", "middle", false);

                ctx.strokeRect(rx, startY + rowH * 4, colW, rowH);
                drawLabel(col.val, rx + colW / 2, startY + rowH * 4 + rowH / 2, pvValFont, p.c, "center", "middle", false);

                curX += colW;
              });
            });
          }
        });
      } else if (geo === "placeValueInternational") {
        drawPlaceValueCard({
          title: "International Place Value Chart",
          subtitle: "Millions, Thousands, Ones Periods (International Standard: Groups of 3)",
          footerNote: "Example: 784,329,651 = 784 Million 329 Thousand 651  (Comma Rule: Groups of 3 digits from right)",
          renderTable: (tblX, tblY, tblW, tblH) => {
            const periods = [
              { name: "Millions", cols: [{ s: "HM", v: "10⁸", d: "7", val: "700M" }, { s: "TM", v: "10⁷", d: "8", val: "80M" }, { s: "M", v: "10⁶", d: "4", val: "4M" }], c: purple },
              { name: "Thousands", cols: [{ s: "H-Th", v: "10⁵", d: "3", val: "300K" }, { s: "T-Th", v: "10⁴", d: "2", val: "20K" }, { s: "Th", v: "10³", d: "9", val: "9K" }], c: primary },
              { name: "Ones", cols: [{ s: "H", v: "10²", d: "6", val: "600" }, { s: "T", v: "10¹", d: "5", val: "50" }, { s: "O", v: "10⁰", d: "1", val: "1" }], c: accent }
            ];

            const totalCols = 9;
            const colW = tblW / totalCols;
            const totalRows = 5;
            const rowH = Math.max(22, Math.floor(tblH / totalRows));
            const totalTblH = totalRows * rowH;
            const startY = tblY + Math.max(0, Math.floor((tblH - totalTblH) / 2));

            const pvHeadFont = `bold ${Math.max(10.5, Math.round(Math.min(rowH * 0.36, 12 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const digitFont = `bold ${Math.max(13, Math.round(Math.min(rowH * 0.52, 18 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const pvValFont = `600 ${Math.max(9, Math.round(Math.min(rowH * 0.32, 10.5 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;

            // Row 0: Period Headers
            let curX = tblX;
            periods.forEach((p) => {
              const pW = colW * p.cols.length;
              ctx.fillStyle = p.c;
              ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
              ctx.fillRect(curX, startY, pW, rowH);
              ctx.globalAlpha = 1.0;
              ctx.strokeStyle = p.c;
              ctx.strokeRect(curX, startY, pW, rowH);
              drawLabel(p.name, curX + pW / 2, startY + rowH / 2, pvHeadFont, p.c, "center", "middle", false);
              curX += pW;
            });

            // Rows 1-4
            curX = tblX;
            periods.forEach((p) => {
              p.cols.forEach((col) => {
                const rx = curX;
                ctx.strokeStyle = borderCol;
                ctx.strokeRect(rx, startY + rowH, colW, rowH);
                drawLabel(col.s, rx + colW / 2, startY + rowH + rowH / 2, pvHeadFont, color, "center", "middle", false);

                ctx.strokeRect(rx, startY + rowH * 2, colW, rowH);
                drawLabel(col.v, rx + colW / 2, startY + rowH * 2 + rowH / 2, pvValFont, primary, "center", "middle", false);

                ctx.fillStyle = isActuallyDark ? "rgba(255,255,255,0.05)" : "#ffffff";
                ctx.fillRect(rx, startY + rowH * 3, colW, rowH);
                ctx.strokeRect(rx, startY + rowH * 3, colW, rowH);
                drawLabel(col.d, rx + colW / 2, startY + rowH * 3 + rowH / 2, digitFont, p.c, "center", "middle", false);

                ctx.strokeRect(rx, startY + rowH * 4, colW, rowH);
                drawLabel(col.val, rx + colW / 2, startY + rowH * 4 + rowH / 2, pvValFont, p.c, "center", "middle", false);

                curX += colW;
              });
            });
          }
        });
      } else if (geo === "placeValueComparison") {
        drawPlaceValueCard({
          title: "Indian vs International System Comparison",
          subtitle: "Equivalences: Lakhs & Crores vs Thousands, Millions & Billions",
          footerNote: "Key Rule: 1 Million = 10 Lakhs  |  1 Billion = 100 Crores (1 Arab)  |  1 Trillion = 1 Lakh Crores",
          renderTable: (tblX, tblY, tblW, tblH) => {
            const rows = [
              { ind: "1 Lakh (1,00,000)", intl: "100 Thousand (100,000)", pwr: "10⁵" },
              { ind: "10 Lakh (10,00,000)", intl: "1 Million (1,000,000)", pwr: "10⁶" },
              { ind: "1 Crore (1,00,00,000)", intl: "10 Million (10,000,000)", pwr: "10⁷" },
              { ind: "10 Crore (10,00,00,000)", intl: "100 Million (100,000,000)", pwr: "10⁸" },
              { ind: "100 Crore (1 Arab)", intl: "1 Billion (1,000,000,000)", pwr: "10⁹" }
            ];

            const totalRows = rows.length + 1; // 1 header + 5 rows
            const rowH = Math.max(22, Math.floor(tblH / totalRows));
            const totalTblH = totalRows * rowH;
            const startY = tblY + Math.max(0, Math.floor((tblH - totalTblH) / 2));

            const col1W = tblW * 0.42;
            const col2W = tblW * 0.42;
            const col3W = tblW * 0.16;

            const cmpHeadFont = `bold ${Math.max(11, Math.round(Math.min(rowH * 0.38, 12.5 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const cmpBodyFont = `600 ${Math.max(10, Math.round(Math.min(rowH * 0.34, 11 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            const cmpValFont = `bold ${Math.max(10, Math.round(Math.min(rowH * 0.34, 11 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;

            // Header
            ctx.fillStyle = primary;
            ctx.globalAlpha = isActuallyDark ? 0.25 : 0.15;
            ctx.fillRect(tblX, startY, tblW, rowH);
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = primary;
            ctx.strokeRect(tblX, startY, tblW, rowH);
            drawLabel("Indian System", tblX + col1W / 2, startY + rowH / 2, cmpHeadFont, primary, "center", "middle", false);
            drawLabel("International System", tblX + col1W + col2W / 2, startY + rowH / 2, cmpHeadFont, purple, "center", "middle", false);
            drawLabel("Value", tblX + col1W + col2W + col3W / 2, startY + rowH / 2, cmpHeadFont, accent, "center", "middle", false);

            rows.forEach((r, idx) => {
              const ry = startY + rowH * (idx + 1);
              ctx.strokeStyle = borderCol;
              ctx.strokeRect(tblX, ry, col1W, rowH);
              ctx.strokeRect(tblX + col1W, ry, col2W, rowH);
              ctx.strokeRect(tblX + col1W + col2W, ry, col3W, rowH);
              drawLabel(r.ind, tblX + col1W / 2, ry + rowH / 2, cmpBodyFont, color, "center", "middle", false);
              drawLabel(r.intl, tblX + col1W + col2W / 2, ry + rowH / 2, cmpBodyFont, color, "center", "middle", false);
              drawLabel(r.pwr, tblX + col1W + col2W + col3W / 2, ry + rowH / 2, cmpValFont, accent, "center", "middle", false);
            });
          }
        });
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
        const cardR = Math.max(10, Math.round(14 * Math.min(scaleX, scaleY)));

        // 1. Outer Card Background & Smooth Border
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1.5;
        roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
        ctx.fill();
        ctx.stroke();

        // 2. Dedicated Top Header Section
        const headerH = subtitle
          ? Math.max(48, Math.round(cardH * 0.15))
          : Math.max(38, Math.round(cardH * 0.12));
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

        // Main Title (bold, comfortable margin from top or vertically centered if no subtitle)
        const cardTitleFont = `bold ${Math.max(14, Math.round(15.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
        if (subtitle) {
          const titleY = cardY + Math.round(headerH * 0.38);
          const subY = cardY + Math.round(headerH * 0.74);
          const cardSubFont = `600 ${Math.max(10, Math.round(11 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
          const subColor = isActuallyDark ? "#94a3b8" : "#64748b";
          drawLabel(title, cx, titleY, cardTitleFont, color, "center", "middle", false);
          drawLabel(subtitle, cx, subY, cardSubFont, subColor, "center", "middle", false);
        } else {
          drawLabel(title, cx, cardY + headerH / 2, cardTitleFont, color, "center", "middle", false);
        }

        // 3. Footer Strip (Notes & key properties at bottom)
        const footerH = notes ? Math.max(28, Math.round(cardH * 0.09)) : 0;
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

          const noteFont = `600 ${Math.max(9.5, Math.round(10.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
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
          const rowGap = Math.max(6, Math.round(formDeckH * 0.025));
          const totalGaps = (rowCount - 1) * rowGap;
          const rowH = Math.max(34, Math.floor((formDeckH - totalGaps) / rowCount));
          const totalDeckH = rowCount * rowH + totalGaps;
          const startY = formDeckY + Math.max(0, (formDeckH - totalDeckH) / 2);

          // Compute uniform badge width for perfect vertical alignment across all rows
          const tagFontSize = Math.max(11, Math.round(Math.min(rowH * 0.32, 12.5 * sFactor)));
          const tagFont = `bold ${tagFontSize}px "Plus Jakarta Sans", sans-serif`;
          ctx.save();
          ctx.font = tagFont;
          let maxTagW = 80;
          formulaRows.forEach(r => {
            const m = ctx.measureText(r.tag || "");
            if (m.width > maxTagW) maxTagW = m.width;
          });
          ctx.restore();
          const badgeW = Math.max(95, Math.min(Math.round(formDeckW * 0.40), Math.round(maxTagW + 24)));

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

            let fSize = Math.max(12, Math.round(Math.min(rowH * 0.38, 15 * sFactor)));
            let formFont = `700 ${fSize}px "Plus Jakarta Sans", "Courier New", monospace, sans-serif`;
            ctx.font = formFont;
            let textMetrics = ctx.measureText(row.formula);
            if (textMetrics.width > maxFormulaW && maxFormulaW > 30) {
              fSize = Math.max(10, Math.floor(fSize * (maxFormulaW / textMetrics.width)));
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const triW = Math.min(fw * 0.72, 195 * sFactor);
            const triH = Math.min(fh * 0.60, 135 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const rtW = Math.min(fw * 0.68, 175 * sFactor);
            const rtH = Math.min(fh * 0.62, 140 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const rw = Math.min(fw * 0.72, 195 * sFactor);
            const rh = Math.min(fh * 0.54, 115 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const s = Math.min(fw * 0.58, fh * 0.58, 125 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const r = Math.min(fw * 0.34, fh * 0.34, 70 * sFactor);

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
          drawFigure: (fcx, fcy, fw, fh) => {
            const bw = Math.min(fw * 0.60, 160 * sFactor);
            const bh = Math.min(fh * 0.50, 95 * sFactor);
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
            drawLabel("b", (x4 + x3) / 2, y3_ - 10, fontSmall, purple, "center", "middle", true);
            drawLabel("h", x4 - 12, fcy, fontHeader, danger, "center", "middle", true);
            drawLabel("a", (x1 + x4) / 2 - 14, (y1_ + y4_) / 2, fontSmall, color, "center", "middle", true);
            drawLabel("a", (x2 + x3) / 2 + 14, (y2_ + y3_) / 2, fontSmall, color, "center", "middle", true);
          },
          formulaRows: [
            { tag: "Perimeter (P)", formula: "P = 2(a + b)  [Sum of all 4 sides]", tagColor: primary },
            { tag: "Area (A)", formula: "Area = base × height = b × h", tagColor: accent },
            { tag: "Volume (V)", formula: "Volume = N/A  (2D Flat Figure — Vol = 0)", tagColor: warn },
            { tag: "Rhombus Area", formula: "Area = ½ × d₁ × d₂  (diagonals ⊥ bisect)", tagColor: purple }
          ],
          notes: "Opposite sides & angles equal (a ∥ a, b ∥ b). Area = b × h. Rhombus = ½ d₁ d₂"
        });
      } else if (geo === "formulaTrapezium") {
        drawFormulaLayout({
          title: "Trapezium: Perimeter & Area Formulas",
          drawFigure: (fcx, fcy, fw, fh) => {
            const topW = Math.min(fw * 0.40, 95 * sFactor);
            const botW = Math.min(fw * 0.72, 175 * sFactor);
            const th = Math.min(fh * 0.52, 110 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const s = Math.min(fw * 0.40, fh * 0.45, 88 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const l = Math.min(fw * 0.54, 130 * sFactor);
            const h_ = Math.min(fh * 0.44, 82 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const rx = Math.min(fw * 0.28, 55 * sFactor), ry = Math.round(rx * 0.32);
            const ch = Math.min(fh * 0.58, 120 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const rx = Math.min(fw * 0.30, 58 * sFactor), ry = Math.round(rx * 0.30);
            const ch = Math.min(fh * 0.60, 125 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const r = Math.min(fw * 0.26, fh * 0.28, 56 * sFactor);
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
          drawFigure: (fcx, fcy, fw, fh) => {
            const r1 = Math.min(fw * 0.18, 35 * sFactor), r2 = Math.min(fw * 0.30, 60 * sFactor);
            const fh_ = Math.min(fh * 0.54, 115 * sFactor);
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
      }

      function drawCellText(txt, cellX, cellY, maxW, fontStr, textColor, align = "center") {
        if (txt === undefined || txt === null || txt === "") return;
        ctx.font = fontStr;
        const metrics = ctx.measureText(txt);
        if (metrics.width > maxW && maxW > 20) {
          const scale = Math.max(0.50, (maxW - 4) / metrics.width);
          const m = fontStr.match(/(\d+(?:\.\d+)?)px/);
          if (m) {
            const origSize = parseFloat(m[1]);
            const newSize = Math.max(8, Math.floor(origSize * scale * 10) / 10);
            const scaledFont = fontStr.replace(/\d+(?:\.\d+)?px/, `${newSize}px`);
            drawLabel(txt, cellX, cellY, scaledFont, textColor, align, "middle", false);
            return;
          }
        }
        drawLabel(txt, cellX, cellY, fontStr, textColor, align, "middle", false);
      }

      function drawMini2DIcon(type, cx_, cy_, size) {
        ctx.save();
        ctx.strokeStyle = primary;
        ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.20)" : "rgba(2, 132, 199, 0.12)";
        ctx.lineWidth = 1.3;
        const hs = size / 2;

        if (type === "triangle") {
          ctx.beginPath();
          ctx.moveTo(cx_, cy_ - hs);
          ctx.lineTo(cx_ - hs, cy_ + hs);
          ctx.lineTo(cx_ + hs, cy_ + hs);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (type === "rectangle") {
          ctx.fillRect(cx_ - hs, cy_ - hs * 0.6, size, size * 0.6);
          ctx.strokeRect(cx_ - hs, cy_ - hs * 0.6, size, size * 0.6);
        } else if (type === "square") {
          ctx.fillRect(cx_ - hs * 0.8, cy_ - hs * 0.8, size * 0.8, size * 0.8);
          ctx.strokeRect(cx_ - hs * 0.8, cy_ - hs * 0.8, size * 0.8, size * 0.8);
        } else if (type === "parallelogram") {
          const sl = hs * 0.4;
          ctx.beginPath();
          ctx.moveTo(cx_ - hs + sl, cy_ - hs * 0.6);
          ctx.lineTo(cx_ + hs, cy_ - hs * 0.6);
          ctx.lineTo(cx_ + hs - sl, cy_ + hs * 0.6);
          ctx.lineTo(cx_ - hs, cy_ + hs * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (type === "rhombus") {
          ctx.beginPath();
          ctx.moveTo(cx_, cy_ - hs);
          ctx.lineTo(cx_ + hs * 0.8, cy_);
          ctx.lineTo(cx_, cy_ + hs);
          ctx.lineTo(cx_ - hs * 0.8, cy_);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (type === "trapezium") {
          ctx.beginPath();
          ctx.moveTo(cx_ - hs * 0.5, cy_ - hs * 0.6);
          ctx.lineTo(cx_ + hs * 0.5, cy_ - hs * 0.6);
          ctx.lineTo(cx_ + hs, cy_ + hs * 0.6);
          ctx.lineTo(cx_ - hs, cy_ + hs * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (type === "circle") {
          ctx.beginPath();
          ctx.arc(cx_, cy_, hs * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      function drawMini3DIcon(type, cx_, cy_, size) {
        ctx.save();
        ctx.strokeStyle = primary;
        ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.22)" : "rgba(2, 132, 199, 0.12)";
        ctx.lineWidth = 1.2;

        if (type === "cube") {
          const s = size * 0.62;
          const iso = s * 0.35;
          const x0 = cx_ - s / 2 - iso / 2, y0 = cy_ - s / 2 + iso / 2;
          ctx.fillRect(x0, y0, s, s);
          ctx.strokeRect(x0, y0, s, s);
          ctx.beginPath();
          ctx.moveTo(x0, y0); ctx.lineTo(x0 + iso, y0 - iso); ctx.lineTo(x0 + s + iso, y0 - iso); ctx.lineTo(x0 + s, y0);
          ctx.moveTo(x0 + s, y0); ctx.lineTo(x0 + s + iso, y0 - iso); ctx.lineTo(x0 + s + iso, y0 + s - iso); ctx.lineTo(x0 + s, y0 + s);
          ctx.stroke();
        } else if (type === "cuboid") {
          const w_ = size * 0.76, h_ = size * 0.44;
          const iso = w_ * 0.25;
          const x0 = cx_ - w_ / 2 - iso / 2, y0 = cy_ - h_ / 2 + iso / 2;
          ctx.fillRect(x0, y0, w_, h_);
          ctx.strokeRect(x0, y0, w_, h_);
          ctx.beginPath();
          ctx.moveTo(x0, y0); ctx.lineTo(x0 + iso, y0 - iso); ctx.lineTo(x0 + w_ + iso, y0 - iso); ctx.lineTo(x0 + w_, y0);
          ctx.moveTo(x0 + w_, y0); ctx.lineTo(x0 + w_ + iso, y0 - iso); ctx.lineTo(x0 + w_ + iso, y0 + h_ - iso); ctx.lineTo(x0 + w_, y0 + h_);
          ctx.stroke();
        } else if (type === "cylinder") {
          const rx_ = size * 0.34, ry_ = rx_ * 0.34;
          const h_ = size * 0.58;
          ctx.beginPath();
          ctx.moveTo(cx_ - rx_, cy_ - h_ / 2);
          ctx.lineTo(cx_ - rx_, cy_ + h_ / 2);
          ctx.ellipse(cx_, cy_ + h_ / 2, rx_, ry_, 0, Math.PI, 0, true);
          ctx.lineTo(cx_ + rx_, cy_ - h_ / 2);
          ctx.ellipse(cx_, cy_ - h_ / 2, rx_, ry_, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx_, cy_ - h_ / 2, rx_, ry_, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx_, cy_ + h_ / 2, rx_, ry_, 0, 0, Math.PI); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx_ - rx_, cy_ - h_ / 2); ctx.lineTo(cx_ - rx_, cy_ + h_ / 2);
          ctx.moveTo(cx_ + rx_, cy_ - h_ / 2); ctx.lineTo(cx_ + rx_, cy_ + h_ / 2);
          ctx.stroke();
        } else if (type === "cone") {
          const rx_ = size * 0.36, ry_ = rx_ * 0.30;
          const topY_ = cy_ - size * 0.42, botY_ = cy_ + size * 0.35;
          ctx.beginPath();
          ctx.moveTo(cx_, topY_);
          ctx.lineTo(cx_ - rx_, botY_);
          ctx.ellipse(cx_, botY_, rx_, ry_, 0, Math.PI, 0, true);
          ctx.lineTo(cx_, topY_);
          ctx.fill();
          ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx_, botY_, rx_, ry_, 0, 0, Math.PI); ctx.stroke();
        } else if (type === "sphere") {
          const r_ = size * 0.40;
          ctx.beginPath(); ctx.arc(cx_, cy_, r_, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx_, cy_, r_, r_ * 0.32, 0, 0, Math.PI); ctx.stroke();
        } else if (type === "hemisphere") {
          const r_ = size * 0.40;
          ctx.beginPath();
          ctx.ellipse(cx_, cy_ - 2, r_, r_ * 0.35, 0, 0, Math.PI * 2);
          ctx.arc(cx_, cy_ - 2, r_, 0, Math.PI);
          ctx.fill(); ctx.stroke();
        } else if (type === "frustum") {
          const r1_ = size * 0.20, r2_ = size * 0.40;
          const topY_ = cy_ - size * 0.35, botY_ = cy_ + size * 0.35;
          ctx.beginPath();
          ctx.ellipse(cx_, topY_, r1_, r1_ * 0.35, 0, 0, Math.PI * 2);
          ctx.lineTo(cx_ + r2_, botY_);
          ctx.ellipse(cx_, botY_, r2_, r2_ * 0.35, 0, 0, Math.PI);
          ctx.lineTo(cx_ - r1_, topY_);
          ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx_, topY_, r1_, r1_ * 0.35, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(cx_, botY_, r2_, r2_ * 0.35, 0, 0, Math.PI); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx_ - r1_, topY_); ctx.lineTo(cx_ - r2_, botY_);
          ctx.moveTo(cx_ + r1_, topY_); ctx.lineTo(cx_ + r2_, botY_);
          ctx.stroke();
        }
        ctx.restore();
      }

      function drawMasterChartCard({ title, subtitle, footerNote, renderContent }) {
        const cardX = leftX;
        const cardY = y1 + 4;
        const cardW = contentW;
        const cardH = h - 8;
        const cardR = Math.max(10, Math.round(14 * Math.min(scaleX, scaleY)));

        // 1. Outer Card Container
        ctx.fillStyle = cardBg;
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1.5;
        roundRect(ctx, cardX, cardY, cardW, cardH, cardR);
        ctx.fill();
        ctx.stroke();

        // 2. Top Header Banner
        const headerH = subtitle
          ? Math.max(48, Math.round(cardH * 0.15))
          : Math.max(38, Math.round(cardH * 0.12));
        const headerBottomY = cardY + headerH;

        ctx.save();
        ctx.beginPath();
        roundRect(ctx, cardX, cardY, cardW, headerH, cardR);
        ctx.clip();
        ctx.fillStyle = isActuallyDark ? "rgba(30, 41, 59, 0.95)" : "rgba(241, 245, 249, 0.92)";
        ctx.fillRect(cardX, cardY, cardW, headerH);
        ctx.restore();

        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cardX, headerBottomY);
        ctx.lineTo(cardX + cardW, headerBottomY);
        ctx.stroke();

        const cardTitleFont = `bold ${Math.max(13.5, Math.round(15.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
        if (subtitle) {
          const titleY = cardY + Math.round(headerH * 0.38);
          const subY = cardY + Math.round(headerH * 0.74);
          const cardSubFont = `600 ${Math.max(10, Math.round(11 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
          const subColor = isActuallyDark ? "#94a3b8" : "#64748b";
          drawLabel(title, cx, titleY, cardTitleFont, color, "center", "middle", false);
          drawLabel(subtitle, cx, subY, cardSubFont, subColor, "center", "middle", false);
        } else {
          drawLabel(title, cx, cardY + headerH / 2, cardTitleFont, color, "center", "middle", false);
        }

        // 3. Footer Strip (Notes / Conversions)
        const footerH = footerNote ? Math.max(26, Math.round(cardH * 0.09)) : 0;
        const footerY = cardY + cardH - footerH - 6;

        if (footerNote) {
          const footPillX = cardX + 12;
          const footPillW = cardW - 24;

          ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.08)" : "rgba(2, 132, 199, 0.05)";
          ctx.strokeStyle = isActuallyDark ? "rgba(56, 189, 248, 0.25)" : "rgba(2, 132, 199, 0.18)";
          ctx.lineWidth = 1;
          roundRect(ctx, footPillX, footerY, footPillW, footerH, 6);
          ctx.fill();
          ctx.stroke();

          const noteFont = `600 ${Math.max(9.5, Math.round(10.5 * sFactor))}px "Plus Jakarta Sans", sans-serif`;
          drawLabel(footerNote, cx, footerY + footerH / 2, noteFont, primary, "center", "middle", false);
        }

        // 4. Content Area
        const bodyTop = headerBottomY + 8;
        const bodyBottom = footerNote ? (footerY - 8) : (cardY + cardH - 8);
        const bodyH = Math.max(60, bodyBottom - bodyTop);

        if (typeof renderContent === "function") {
          renderContent(cardX + 10, bodyTop, cardW - 20, bodyH);
        }
      }

      if (geo === "formulas2D") {
        drawMasterChartCard({
          title: "2D Plane Figures Master Reference Chart",
          footerNote: "💡 Arc Length L = (θ / 360°) × 2πr  |  Semicircle Area = ½ πr²  |  Ring Area = π(R² - r²)",
          renderContent: (tblX, tblY, tblW, tblH) => {
            const items = [
              { name: "Triangle", icon: "triangle", p: "P = a + b + c", a: "Area = ½ × b × h", h: "Heron: √[s(s-a)(s-b)(s-c)]" },
              { name: "Rectangle", icon: "rectangle", p: "P = 2(l + b)", a: "Area = l × b", h: "Diagonal d = √(l² + b²)" },
              { name: "Square", icon: "square", p: "P = 4a", a: "Area = a² = ½ d²", h: "Diagonal d = a√2" },
              { name: "Parallelogram", icon: "parallelogram", p: "P = 2(a + b)", a: "Area = b × h", h: "Opposite sides equal & ∥" },
              { name: "Rhombus", icon: "rhombus", p: "P = 4a", a: "Area = ½ × d₁ × d₂", h: "Diagonals ⊥ bisect" },
              { name: "Trapezium", icon: "trapezium", p: "P = a + b + c + d", a: "Area = ½(a + b) × h", h: "Parallel bases a ∥ b" },
              { name: "Circle", icon: "circle", p: "C = 2πr = πd", a: "Area = πr²", h: "Sector = (θ/360°) × πr²" }
            ];

            const totalRows = items.length + 1;
            const rowH = Math.max(22, Math.floor(tblH / totalRows));
            const actualH = totalRows * rowH;
            const startY = tblY + Math.max(0, Math.floor((tblH - actualH) / 2));

            const c1W = Math.round(tblW * 0.22);
            const c2W = Math.round(tblW * 0.24);
            const c3W = Math.round(tblW * 0.26);
            const c4W = tblW - (c1W + c2W + c3W);

            const c1X = tblX;
            const c2X = c1X + c1W;
            const c3X = c2X + c2W;
            const c4X = c3X + c3W;

            // 1. Table Header Row
            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.16)" : "rgba(2, 132, 199, 0.09)";
            ctx.fillRect(tblX, startY, tblW, rowH);
            ctx.strokeStyle = primary;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(tblX, startY, tblW, rowH);

            const thFontSize = Math.max(11, Math.round(Math.min(rowH * 0.38, 13 * sFactor)));
            const thFont = `bold ${thFontSize}px "Plus Jakarta Sans", sans-serif`;
            drawLabel("2D Plane Figure", c1X + c1W / 2, startY + rowH / 2, thFont, primary, "center", "middle", false);
            drawLabel("Perimeter (P)", c2X + c2W / 2, startY + rowH / 2, thFont, primary, "center", "middle", false);
            drawLabel("Area (A)", c3X + c3W / 2, startY + rowH / 2, thFont, accent, "center", "middle", false);
            drawLabel("Key Relation", c4X + c4W / 2, startY + rowH / 2, thFont, warn, "center", "middle", false);

            ctx.beginPath();
            ctx.moveTo(c2X, startY); ctx.lineTo(c2X, startY + rowH);
            ctx.moveTo(c3X, startY); ctx.lineTo(c3X, startY + rowH);
            ctx.moveTo(c4X, startY); ctx.lineTo(c4X, startY + rowH);
            ctx.stroke();

            // 2. Data Rows
            const rowFontSize = Math.max(11, Math.round(Math.min(rowH * 0.38, 12.5 * sFactor)));
            const nameFont = `bold ${rowFontSize}px "Plus Jakarta Sans", sans-serif`;
            const formFont = `700 ${rowFontSize}px "Plus Jakarta Sans", monospace, sans-serif`;
            const relFont = `600 ${Math.max(10, Math.round(rowFontSize * 0.92))}px "Plus Jakarta Sans", sans-serif`;

            items.forEach((item, idx) => {
              const ry = startY + rowH * (idx + 1);

              const isEven = idx % 2 === 0;
              ctx.fillStyle = isEven
                ? (isActuallyDark ? "rgba(255, 255, 255, 0.02)" : "rgba(248, 250, 252, 0.7)")
                : (isActuallyDark ? "rgba(255, 255, 255, 0.05)" : "rgba(241, 245, 249, 0.45)");
              ctx.fillRect(tblX, ry, tblW, rowH);

              ctx.strokeStyle = isActuallyDark ? "rgba(148, 163, 184, 0.22)" : "rgba(203, 213, 225, 0.85)";
              ctx.lineWidth = 1;
              ctx.strokeRect(c1X, ry, c1W, rowH);
              ctx.strokeRect(c2X, ry, c2W, rowH);
              ctx.strokeRect(c3X, ry, c3W, rowH);
              ctx.strokeRect(c4X, ry, c4W, rowH);

              // Col 1: Icon Badge + Name
              const badgeSize = Math.max(18, Math.round(rowH * 0.64));
              const badgeX = c1X + 6;
              const badgeY = ry + (rowH - badgeSize) / 2;

              ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.14)" : "rgba(2, 132, 199, 0.08)";
              roundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 4);
              ctx.fill();

              drawMini2DIcon(item.icon, badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize * 0.75);

              const textStartX = badgeX + badgeSize + 8;
              const maxNameW = c1W - (badgeSize + 16);
              drawCellText(item.name, textStartX, ry + rowH / 2, maxNameW, nameFont, color, "left");

              // Col 2: Perimeter
              drawCellText(item.p, c2X + c2W / 2, ry + rowH / 2, c2W - 8, formFont, color);

              // Col 3: Area
              drawCellText(item.a, c3X + c3W / 2, ry + rowH / 2, c3W - 8, formFont, accent);

              // Col 4: Key Relation
              drawCellText(item.h, c4X + c4W / 2, ry + rowH / 2, c4W - 8, relFont, warn);
            });
          }
        });
      } else if (geo === "formulas3D") {
        drawMasterChartCard({
          title: "3D Solid Figures Master Reference Chart",
          footerNote: "💡 1 m³ = 1000 Litres  |  1 Litre = 1000 cm³  |  1 m² = 10,000 cm²",
          renderContent: (tblX, tblY, tblW, tblH) => {
            const items = [
              { name: "Cube", icon: "cube", lsa: "4a²", tsa: "6a²", v: "a³", diag: "d = a√3" },
              { name: "Cuboid", icon: "cuboid", lsa: "2h(l + b)", tsa: "2(lb + bh + hl)", v: "l × b × h", diag: "d = √(l²+b²+h²)" },
              { name: "Cylinder", icon: "cylinder", lsa: "2πrh", tsa: "2πr(r + h)", v: "πr²h", diag: "Two Bases = 2πr²" },
              { name: "Cone", icon: "cone", lsa: "πrl", tsa: "πr(r + l)", v: "⅓ πr²h", diag: "l = √(r² + h²)" },
              { name: "Sphere", icon: "sphere", lsa: "4πr²", tsa: "4πr²", v: "⁴⁄₃ πr³", diag: "Diameter d = 2r" },
              { name: "Hemisphere", icon: "hemisphere", lsa: "2πr²", tsa: "3πr²", v: "⅔ πr³", diag: "Base Area = πr²" },
              { name: "Frustum", icon: "frustum", lsa: "πl(r₁ + r₂)", tsa: "π[l(r₁+r₂) + r₁² + r₂²]", v: "⅓πh(r₁² + r₂² + r₁r₂)", diag: "l = √[h²+(r₂-r₁)²]" }
            ];

            const totalRows = items.length + 1;
            const rowH = Math.max(22, Math.floor(tblH / totalRows));
            const actualH = totalRows * rowH;
            const startY = tblY + Math.max(0, Math.floor((tblH - actualH) / 2));

            const c1W = Math.round(tblW * 0.18);
            const c2W = Math.round(tblW * 0.17);
            const c3W = Math.round(tblW * 0.28);
            const c4W = Math.round(tblW * 0.19);
            const c5W = tblW - (c1W + c2W + c3W + c4W);

            const c1X = tblX;
            const c2X = c1X + c1W;
            const c3X = c2X + c2W;
            const c4X = c3X + c3W;
            const c5X = c4X + c4W;

            // 1. Table Header Row
            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.16)" : "rgba(2, 132, 199, 0.09)";
            ctx.fillRect(tblX, startY, tblW, rowH);
            ctx.strokeStyle = primary;
            ctx.lineWidth = 1.2;
            ctx.strokeRect(tblX, startY, tblW, rowH);

            const thFontSize = Math.max(11, Math.round(Math.min(rowH * 0.38, 13 * sFactor)));
            const thFont = `bold ${thFontSize}px "Plus Jakarta Sans", sans-serif`;
            drawLabel("3D Solid", c1X + c1W / 2, startY + rowH / 2, thFont, primary, "center", "middle", false);
            drawLabel("CSA / LSA", c2X + c2W / 2, startY + rowH / 2, thFont, primary, "center", "middle", false);
            drawLabel("Total Surface Area", c3X + c3W / 2, startY + rowH / 2, thFont, accent, "center", "middle", false);
            drawLabel("Volume (V)", c4X + c4W / 2, startY + rowH / 2, thFont, warn, "center", "middle", false);
            drawLabel("Key Relation", c5X + c5W / 2, startY + rowH / 2, thFont, purple, "center", "middle", false);

            ctx.beginPath();
            ctx.moveTo(c2X, startY); ctx.lineTo(c2X, startY + rowH);
            ctx.moveTo(c3X, startY); ctx.lineTo(c3X, startY + rowH);
            ctx.moveTo(c4X, startY); ctx.lineTo(c4X, startY + rowH);
            ctx.moveTo(c5X, startY); ctx.lineTo(c5X, startY + rowH);
            ctx.stroke();

            // 2. Data Rows
            const rowFontSize = Math.max(11, Math.round(Math.min(rowH * 0.38, 12.5 * sFactor)));
            const nameFont = `bold ${rowFontSize}px "Plus Jakarta Sans", sans-serif`;
            const formFont = `700 ${rowFontSize}px "Plus Jakarta Sans", monospace, sans-serif`;
            const relFont = `600 ${Math.max(10, Math.round(rowFontSize * 0.92))}px "Plus Jakarta Sans", sans-serif`;

            items.forEach((item, idx) => {
              const ry = startY + rowH * (idx + 1);

              const isEven = idx % 2 === 0;
              ctx.fillStyle = isEven
                ? (isActuallyDark ? "rgba(255, 255, 255, 0.02)" : "rgba(248, 250, 252, 0.7)")
                : (isActuallyDark ? "rgba(255, 255, 255, 0.05)" : "rgba(241, 245, 249, 0.45)");
              ctx.fillRect(tblX, ry, tblW, rowH);

              ctx.strokeStyle = isActuallyDark ? "rgba(148, 163, 184, 0.22)" : "rgba(203, 213, 225, 0.85)";
              ctx.lineWidth = 1;
              ctx.strokeRect(c1X, ry, c1W, rowH);
              ctx.strokeRect(c2X, ry, c2W, rowH);
              ctx.strokeRect(c3X, ry, c3W, rowH);
              ctx.strokeRect(c4X, ry, c4W, rowH);
              ctx.strokeRect(c5X, ry, c5W, rowH);

              // Col 1: Icon Badge + Name
              const badgeSize = Math.max(18, Math.round(rowH * 0.64));
              const badgeX = c1X + 6;
              const badgeY = ry + (rowH - badgeSize) / 2;

              ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.14)" : "rgba(2, 132, 199, 0.08)";
              roundRect(ctx, badgeX, badgeY, badgeSize, badgeSize, 4);
              ctx.fill();

              drawMini3DIcon(item.icon, badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize * 0.75);

              const textStartX = badgeX + badgeSize + 8;
              const maxNameW = c1W - (badgeSize + 16);
              drawCellText(item.name, textStartX, ry + rowH / 2, maxNameW, nameFont, color, "left");

              // Col 2: CSA / LSA
              drawCellText(item.lsa, c2X + c2W / 2, ry + rowH / 2, c2W - 8, formFont, color);

              // Col 3: TSA
              drawCellText(item.tsa, c3X + c3W / 2, ry + rowH / 2, c3W - 8, formFont, accent);

              // Col 4: Volume
              drawCellText(item.v, c4X + c4W / 2, ry + rowH / 2, c4W - 8, formFont, warn);

              // Col 5: Key Relation
              drawCellText(item.diag, c5X + c5W / 2, ry + rowH / 2, c5W - 8, relFont, purple);
            });
          }
        });
      } else if (geo === "formulasMaster" || geo === "formulas") {
        drawMasterChartCard({
          title: "Master Geometry Formula Sheet (2D & 3D)",
          footerNote: "💡 1 m³ = 1000 Litres  |  1 Litre = 1000 cm³  |  1 m² = 10,000 cm²  |  1 hectare = 10,000 m²",
          renderContent: (tblX, tblY, tblW, tblH) => {
            const gap = 12;
            const colW = (tblW - gap) / 2;
            const leftPanelX = tblX;
            const rightPanelX = tblX + colW + gap;

            const f2d = [
              { name: "Square", f: "P = 4a,  Area = a²" },
              { name: "Rectangle", f: "P = 2(l+b),  Area = l × b" },
              { name: "Triangle", f: "P = a+b+c,  Area = ½ b h" },
              { name: "Circle", f: "C = 2πr,  Area = πr²" },
              { name: "Parallelogram", f: "P = 2(a+b),  Area = b × h" },
              { name: "Rhombus", f: "Area = ½ × d₁ × d₂" },
              { name: "Trapezium", f: "Area = ½(a+b) × h" }
            ];

            const f3d = [
              { name: "Cube", f: "V = a³,  TSA = 6a²" },
              { name: "Cuboid", f: "V = l b h,  TSA = 2(lb+bh+hl)" },
              { name: "Cylinder", f: "V = πr²h,  CSA = 2πrh" },
              { name: "Cone", f: "V = ⅓πr²h,  CSA = πrl" },
              { name: "Sphere", f: "V = ⁴⁄₃πr³,  SA = 4πr²" },
              { name: "Hemisphere", f: "V = ⅔πr³,  TSA = 3πr²" },
              { name: "Frustum", f: "V = ⅓πh(r₁²+r₂²+r₁r₂)" }
            ];

            const cardH_ = tblH;
            const headH = Math.max(28, Math.round(cardH_ * 0.13));
            const rowH = Math.max(22, Math.floor((cardH_ - headH - 8) / 7));

            // Left Panel: 2D Figures
            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.05)" : "rgba(2, 132, 199, 0.03)";
            ctx.strokeStyle = isActuallyDark ? "rgba(56, 189, 248, 0.25)" : "rgba(2, 132, 199, 0.18)";
            ctx.lineWidth = 1;
            roundRect(ctx, leftPanelX, tblY, colW, cardH_, 8);
            ctx.fill();
            ctx.stroke();

            // Left Panel Header
            ctx.save();
            roundRect(ctx, leftPanelX, tblY, colW, cardH_, 8);
            ctx.clip();
            ctx.fillStyle = isActuallyDark ? "rgba(56, 189, 248, 0.15)" : "rgba(2, 132, 199, 0.08)";
            ctx.fillRect(leftPanelX, tblY, colW, headH);
            ctx.strokeStyle = isActuallyDark ? "rgba(56, 189, 248, 0.3)" : "rgba(2, 132, 199, 0.2)";
            ctx.beginPath(); ctx.moveTo(leftPanelX, tblY + headH); ctx.lineTo(leftPanelX + colW, tblY + headH); ctx.stroke();
            ctx.restore();

            const pHeadFont = `bold ${Math.max(11, Math.round(Math.min(headH * 0.44, 13 * sFactor)))}px "Plus Jakarta Sans", sans-serif`;
            drawLabel("📐 2D Plane Figures", leftPanelX + colW / 2, tblY + headH / 2, pHeadFont, primary, "center", "middle", false);

            const fRowSize = Math.max(10, Math.round(Math.min(rowH * 0.40, 12 * sFactor)));
            const fNameFont = `bold ${fRowSize}px "Plus Jakarta Sans", sans-serif`;
            const fFormFont = `700 ${fRowSize}px "Plus Jakarta Sans", monospace, sans-serif`;

            f2d.forEach((item, idx) => {
              const ry = tblY + headH + 4 + idx * rowH;
              const isEven = idx % 2 === 0;
              if (isEven) {
                ctx.fillStyle = isActuallyDark ? "rgba(255,255,255,0.02)" : "rgba(241, 245, 249, 0.5)";
                ctx.fillRect(leftPanelX + 4, ry, colW - 8, rowH);
              }
              drawCellText(item.name, leftPanelX + 12, ry + rowH / 2, colW * 0.35, fNameFont, color, "left");
              drawCellText(item.f, leftPanelX + colW * 0.38, ry + rowH / 2, colW * 0.58, fFormFont, accent, "left");
            });

            // Right Panel: 3D Solids
            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.05)" : "rgba(16, 185, 129, 0.03)";
            ctx.strokeStyle = isActuallyDark ? "rgba(16, 185, 129, 0.25)" : "rgba(16, 185, 129, 0.18)";
            ctx.lineWidth = 1;
            roundRect(ctx, rightPanelX, tblY, colW, cardH_, 8);
            ctx.fill();
            ctx.stroke();

            // Right Panel Header
            ctx.save();
            roundRect(ctx, rightPanelX, tblY, colW, cardH_, 8);
            ctx.clip();
            ctx.fillStyle = isActuallyDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.08)";
            ctx.fillRect(rightPanelX, tblY, colW, headH);
            ctx.strokeStyle = isActuallyDark ? "rgba(16, 185, 129, 0.3)" : "rgba(2, 132, 199, 0.2)";
            ctx.beginPath(); ctx.moveTo(rightPanelX, tblY + headH); ctx.lineTo(rightPanelX + colW, tblY + headH); ctx.stroke();
            ctx.restore();

            drawLabel("📦 3D Solid Figures", rightPanelX + colW / 2, tblY + headH / 2, pHeadFont, accent, "center", "middle", false);

            f3d.forEach((item, idx) => {
              const ry = tblY + headH + 4 + idx * rowH;
              const isEven = idx % 2 === 0;
              if (isEven) {
                ctx.fillStyle = isActuallyDark ? "rgba(255,255,255,0.02)" : "rgba(241, 245, 249, 0.5)";
                ctx.fillRect(rightPanelX + 4, ry, colW - 8, rowH);
              }
              drawCellText(item.name, rightPanelX + 12, ry + rowH / 2, colW * 0.35, fNameFont, color, "left");
              drawCellText(item.f, rightPanelX + colW * 0.38, ry + rowH / 2, colW * 0.58, fFormFont, warn, "left");
            });
          }
        });
      }
    }



    else {
      ctx.restore();
      return false;
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


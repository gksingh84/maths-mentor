/**
 * EduAshram Graph Plotter Engine
 * Comprehensive Mathematical Function Grapher & Coordinate Geometry Tool
 * Aligned with NCERT & CBSE Curriculum (Grades 6–10 & Secondary Math)
 */

(function () {
  "use strict";

  // =========================================================================
  // 1. Safe Mathematical Expression Parser & Evaluator
  // =========================================================================

  function compileMathExpression(rawExpr) {
    if (!rawExpr || typeof rawExpr !== "string") return null;
    let expr = rawExpr.trim();
    if (!expr) return null;

    // Remove leading 'y =' or 'f(x) =' if user typed it
    expr = expr.replace(/^(y|f\(x\)|g\(x\)|h\(x\))\s*=\s*/i, "");

    // Replace |x| or |expr| with abs(expr)
    expr = expr.replace(/\|([^|]+)\|/g, "abs($1)");

    // Replace pi / π with (Math.PI)
    expr = expr.replace(/(\d+(\.\d+)?)π/g, "$1*π");
    expr = expr.replace(/(\d+(\.\d+)?)pi\b/gi, "$1*pi");
    expr = expr.replace(/\bpi\b/gi, "(Math.PI)").replace(/π/g, "(Math.PI)");

    // Replace standalone constant e (not in exp or words)
    expr = expr.replace(/(\d+(\.\d+)?)e\b/gi, "$1*e");
    expr = expr.replace(/(^|[^a-zA-Z0-9_])e([^a-zA-Z0-9_]|$)/g, "$1(Math.E)$2");

    // Implicit multiplication
    expr = expr.replace(/(\d+(\.\d+)?)x/gi, "$1*x");
    expr = expr.replace(/(\d+(\.\d+)?)\(/g, "$1*(");
    expr = expr.replace(/\)\(/g, ")*(");
    expr = expr.replace(/\)x/gi, ")*x");
    expr = expr.replace(/x\(/gi, "x*(");
    expr = expr.replace(/(\d+(\.\d+)?)(sin|cos|tan|sqrt|cbrt|abs|ln|log|exp)\b/gi, "$1*$3");
    expr = expr.replace(/x(sin|cos|tan|sqrt|cbrt|abs|ln|log|exp)\b/gi, "x*$1");
    expr = expr.replace(/\)(sin|cos|tan|sqrt|cbrt|abs|ln|log|exp)\b/gi, ")*$1");

    // Math functions
    expr = expr.replace(/\bln\b\(/gi, "Math.log(");
    expr = expr.replace(/\blog\b\(/gi, "Math.log10(");
    expr = expr.replace(/\bsin\b\(/gi, "Math.sin(");
    expr = expr.replace(/\bcos\b\(/gi, "Math.cos(");
    expr = expr.replace(/\btan\b\(/gi, "Math.tan(");
    expr = expr.replace(/\bsqrt\b\(/gi, "Math.sqrt(");
    expr = expr.replace(/\bcbrt\b\(/gi, "Math.cbrt(");
    expr = expr.replace(/\babs\b\(/gi, "Math.abs(");
    expr = expr.replace(/\bexp\b\(/gi, "Math.exp(");

    // Unary minus: replace unary - at start or after operator with (0 - 1)*
    expr = expr.replace(/^(\s*)\-/g, "$1(0 - 1)*");
    expr = expr.replace(/([\+\-\*\/\(\,])\s*\-/g, "$1(0 - 1)*");

    // Power operator
    expr = expr.replace(/\^/g, "**");

    // Security check: allowed characters only
    const stripped = expr.replace(/Math\.(PI|E|sin|cos|tan|sqrt|cbrt|abs|log|log10|exp)/g, "")
                         .replace(/[0-9xX\s\+\-\*\/\%\(\)\.\,]/g, "");
    if (stripped.length > 0) {
      return null;
    }

    try {
      const fn = new Function("x", "Math", "try { return (" + expr + "); } catch(e) { return NaN; }");
      return (x) => {
        try {
          const val = fn(x, Math);
          return typeof val === "number" && !isNaN(val) ? val : null;
        } catch (e) {
          return null;
        }
      };
    } catch (err) {
      return null;
    }
  }

  // =========================================================================
  // 2. Numerical Analysis: Roots, Intersections, Extrema & Tables
  // =========================================================================

  function findRoots(fn, xMin, xMax) {
    if (!fn) return [];
    const roots = [];
    const steps = 300;
    const dx = (xMax - xMin) / steps;
    let prevX = xMin;
    let prevY = fn(prevX);

    for (let i = 1; i <= steps; i++) {
      const curX = xMin + i * dx;
      const curY = fn(curX);

      if (prevY === null || curY === null || !isFinite(prevY) || !isFinite(curY)) {
        prevX = curX;
        prevY = curY;
        continue;
      }

      if (Math.abs(curY) < 1e-9) {
        if (!roots.some((r) => Math.abs(r - curX) < 0.05)) {
          roots.push(curX);
        }
      } else if (prevY * curY < 0) {
        if (Math.abs(curY - prevY) < 25) {
          let a = prevX, b = curX;
          let ya = prevY, yb = curY;
          for (let iter = 0; iter < 16; iter++) {
            const mid = (a + b) / 2;
            const yMid = fn(mid);
            if (yMid === null || !isFinite(yMid)) break;
            if (Math.abs(yMid) < 1e-6) {
              a = mid;
              break;
            }
            if (ya * yMid <= 0) {
              b = mid;
              yb = yMid;
            } else {
              a = mid;
              ya = yMid;
            }
          }
          const root = (a + b) / 2;
          if (!roots.some((r) => Math.abs(r - root) < 0.05)) {
            roots.push(root);
          }
        }
      }
      prevX = curX;
      prevY = curY;
    }
    return roots.map((r) => Math.round(r * 100) / 100);
  }

  function findIntersections(fn1, fn2, xMin, xMax) {
    if (!fn1 || !fn2) return [];
    const diff = (x) => {
      const y1 = fn1(x);
      const y2 = fn2(x);
      if (y1 === null || y2 === null || !isFinite(y1) || !isFinite(y2)) return null;
      return y1 - y2;
    };
    const xRoots = findRoots(diff, xMin, xMax);
    return xRoots.map((x) => {
      const y = fn1(x);
      return {
        x: Math.round(x * 100) / 100,
        y: y !== null && isFinite(y) ? Math.round(y * 100) / 100 : 0
      };
    });
  }

  function findExtrema(fn, xMin, xMax, yMin, yMax) {
    if (!fn) return [];
    const extrema = [];
    const steps = 300;
    const dx = (xMax - xMin) / steps;

    for (let i = 1; i < steps - 1; i++) {
      const xPrev = xMin + (i - 1) * dx;
      const xCur = xMin + i * dx;
      const xNext = xMin + (i + 1) * dx;

      const yPrev = fn(xPrev);
      const yCur = fn(xCur);
      const yNext = fn(xNext);

      if (yPrev === null || yCur === null || yNext === null) continue;
      if (!isFinite(yPrev) || !isFinite(yCur) || !isFinite(yNext)) continue;

      const isMax = yCur > yPrev && yCur > yNext;
      const isMin = yCur < yPrev && yCur < yNext;

      if ((isMax || isMin) && yCur >= yMin && yCur <= yMax) {
        if (!extrema.some((e) => Math.abs(e.x - xCur) < 0.1)) {
          extrema.push({
            type: isMax ? "max" : "min",
            x: Math.round(xCur * 100) / 100,
            y: Math.round(yCur * 100) / 100
          });
        }
      }
    }
    return extrema;
  }

  function generateTableOfValues(fn, xMin, xMax, step = 1) {
    if (!fn) return [];
    const rows = [];
    const startX = Math.ceil(xMin);
    const endX = Math.floor(xMax);
    for (let x = startX; x <= endX; x += step) {
      const y = fn(x);
      rows.push({
        x: x,
        y: y !== null && isFinite(y) ? (Number.isInteger(y) ? y : Math.round(y * 100) / 100) : "Undefined"
      });
    }
    return rows;
  }

  // =========================================================================
  // 3. NCERT Curriculum Quick Presets (Classes 6–10)
  // =========================================================================

  const NCERT_GRAPH_PRESETS = [
    {
      id: "linear_two_vars",
      title: "Class 9/10: Pair of Linear Equations (Intersecting Lines)",
      description: "Find point of intersection for simultaneous linear equations",
      xMin: -5,
      xMax: 7,
      yMin: -4,
      yMax: 8,
      curves: [
        { id: "f1", expr: "2x - 1", color: "#2563eb", lineWidth: 2.5, lineDash: [], label: "y = 2x - 1", enabled: true, showRoots: true, showYIntercept: true, showVertex: false },
        { id: "f2", expr: "-x + 5", color: "#dc2626", lineWidth: 2.5, lineDash: [], label: "y = -x + 5", enabled: true, showRoots: true, showYIntercept: true, showVertex: false }
      ],
      showIntersections: true,
      showGrid: true
    },
    {
      id: "linear_parallel",
      title: "Class 10: Inconsistent Linear Equations (Parallel Lines)",
      description: "Lines with identical slope and no solution (a1/a2 = b1/b2 ≠ c1/c2)",
      xMin: -6,
      xMax: 6,
      yMin: -6,
      yMax: 6,
      curves: [
        { id: "f1", expr: "2x + 2", color: "#2563eb", lineWidth: 2.5, lineDash: [], label: "y = 2x + 2", enabled: true, showRoots: true, showYIntercept: true, showVertex: false },
        { id: "f2", expr: "2x - 2", color: "#ea580c", lineWidth: 2.5, lineDash: [5, 4], label: "y = 2x - 2", enabled: true, showRoots: true, showYIntercept: true, showVertex: false }
      ],
      showIntersections: true,
      showGrid: true
    },
    {
      id: "quad_standard",
      title: "Class 10: Quadratic Polynomial (Two Real Zeroes)",
      description: "Parabola y = x² - 4 intersecting x-axis at -2 and 2",
      xMin: -5,
      xMax: 5,
      yMin: -6,
      yMax: 8,
      curves: [
        { id: "f1", expr: "x^2 - 4", color: "#2563eb", lineWidth: 2.5, lineDash: [], label: "y = x² - 4", enabled: true, showRoots: true, showYIntercept: true, showVertex: true }
      ],
      showIntersections: false,
      showGrid: true
    },
    {
      id: "quad_inverted",
      title: "Class 10: Quadratic Polynomial (Downward Parabola)",
      description: "Parabola opening downwards y = -x² + 4x - 3 with maximum vertex",
      xMin: -2,
      xMax: 6,
      yMin: -6,
      yMax: 4,
      curves: [
        { id: "f1", expr: "-x^2 + 4x - 3", color: "#7c3aed", lineWidth: 2.5, lineDash: [], label: "y = -x² + 4x - 3", enabled: true, showRoots: true, showYIntercept: true, showVertex: true }
      ],
      showIntersections: false,
      showGrid: true
    },
    {
      id: "quad_equal_roots",
      title: "Class 10: Quadratic with Equal Zeroes (Tangent to X-axis)",
      description: "Parabola touching x-axis at a single point (x - 2)²",
      xMin: -2,
      xMax: 6,
      yMin: -2,
      yMax: 8,
      curves: [
        { id: "f1", expr: "(x - 2)^2", color: "#059669", lineWidth: 2.5, lineDash: [], label: "y = (x - 2)²", enabled: true, showRoots: true, showYIntercept: true, showVertex: true }
      ],
      showIntersections: false,
      showGrid: true
    },
    {
      id: "cubic_polynomial",
      title: "Class 10: Cubic Polynomial (Three Zeroes)",
      description: "Cubic curve y = x³ - 4x with roots at -2, 0, and 2",
      xMin: -4,
      xMax: 4,
      yMin: -6,
      yMax: 6,
      curves: [
        { id: "f1", expr: "x^3 - 4x", color: "#0284c7", lineWidth: 2.5, lineDash: [], label: "y = x³ - 4x", enabled: true, showRoots: true, showYIntercept: true, showVertex: true }
      ],
      showIntersections: false,
      showGrid: true
    },
    {
      id: "direct_proportion",
      title: "Class 8: Direct Proportion (Passing through Origin)",
      description: "Linear graph representing constant ratio y = kx",
      xMin: -1,
      xMax: 8,
      yMin: -1,
      yMax: 10,
      curves: [
        { id: "f1", expr: "1.5x", color: "#0284c7", lineWidth: 2.5, lineDash: [], label: "y = 1.5x", enabled: true, showRoots: true, showYIntercept: true, showVertex: false }
      ],
      showIntersections: false,
      showGrid: true
    },
    {
      id: "inverse_proportion",
      title: "Class 8: Inverse Proportion (Rectangular Hyperbola)",
      description: "Reciprocal curve y = k/x showing asymptotic behavior",
      xMin: -6,
      xMax: 6,
      yMin: -6,
      yMax: 6,
      curves: [
        { id: "f1", expr: "4/x", color: "#d97706", lineWidth: 2.5, lineDash: [], label: "y = 4/x", enabled: true, showRoots: false, showYIntercept: false, showVertex: false }
      ],
      showIntersections: false,
      showGrid: true
    },
    {
      id: "trig_sine_cosine",
      title: "Class 10: Trigonometric Waves (Sine vs Cosine)",
      description: "Comparison of sine and cosine periodic waveforms",
      xMin: -6.5,
      xMax: 6.5,
      yMin: -3,
      yMax: 3,
      curves: [
        { id: "f1", expr: "2*sin(x)", color: "#2563eb", lineWidth: 2.5, lineDash: [], label: "y = 2·sin(x)", enabled: true, showRoots: true, showYIntercept: true, showVertex: false },
        { id: "f2", expr: "2*cos(x)", color: "#16a34a", lineWidth: 2.5, lineDash: [5, 4], label: "y = 2·cos(x)", enabled: true, showRoots: true, showYIntercept: true, showVertex: false }
      ],
      showIntersections: true,
      showGrid: true
    },
    {
      id: "modulus_v_shape",
      title: "Absolute Value / Modulus V-Shape",
      description: "Piecewise linear V-curve y = |x - 2| with vertex at (2, 0)",
      xMin: -3,
      xMax: 7,
      yMin: -2,
      yMax: 6,
      curves: [
        { id: "f1", expr: "abs(x - 2)", color: "#9333ea", lineWidth: 2.5, lineDash: [], label: "y = |x - 2|", enabled: true, showRoots: true, showYIntercept: true, showVertex: true }
      ],
      showIntersections: false,
      showGrid: true
    }
  ];

  // =========================================================================
  // 4. Vector Canvas Renderer: drawGraphPlotterShape
  // =========================================================================

  function drawGraphPlotterShape(ctx, shape, isPreview) {
    if (!shape || !shape.start || !shape.end) return;

    const x1 = Math.min(shape.start.x, shape.end.x);
    const x2 = Math.max(shape.start.x, shape.end.x);
    const y1 = Math.min(shape.start.y, shape.end.y);
    const y2 = Math.max(shape.start.y, shape.end.y);
    const w = x2 - x1;
    const h = y2 - y1;

    if (w < 40 || h < 40) return;

    ctx.save();

    // Check dark mode
    let isDark = false;
    if (typeof boardTheme === "string" && (boardTheme === "blackboard" || boardTheme === "dark")) {
      isDark = true;
    }

    // Color definitions
    const cardBg = isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.96)";
    const cardBorder = isDark ? "#334155" : "#cbd5e1";
    const majorGridCol = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(100, 116, 139, 0.22)";
    const minorGridCol = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(148, 163, 184, 0.10)";
    const axisCol = isDark ? "#f8fafc" : "#1e293b";
    const axisTextCol = isDark ? "#cbd5e1" : "#475569";
    const titleCol = isDark ? "#38bdf8" : "#0284c7";

    // 1. Draw Card Background with Rounded Corners
    const radius = 10;
    ctx.beginPath();
    ctx.moveTo(x1 + radius, y1);
    ctx.lineTo(x2 - radius, y1);
    ctx.quadraticCurveTo(x2, y1, x2, y1 + radius);
    ctx.lineTo(x2, y2 - radius);
    ctx.quadraticCurveTo(x2, y2, x2 - radius, y2);
    ctx.lineTo(x1 + radius, y2);
    ctx.quadraticCurveTo(x1, y2, x1, y2 - radius);
    ctx.lineTo(x1, y1 + radius);
    ctx.quadraticCurveTo(x1, y1, x1 + radius, y1);
    ctx.closePath();

    ctx.fillStyle = cardBg;
    ctx.fill();
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Layout Measurements
    const padTop = 38;
    const padBottom = 32;
    const padLeft = 44;
    const padRight = 24;

    const plotX1 = x1 + padLeft;
    const plotX2 = x2 - padRight;
    const plotY1 = y1 + padTop;
    const plotY2 = y2 - padBottom;
    const plotW = Math.max(10, plotX2 - plotX1);
    const plotH = Math.max(10, plotY2 - plotY1);

    // Ranges
    const xMin = typeof shape.xMin === "number" ? shape.xMin : -6;
    const xMax = typeof shape.xMax === "number" ? shape.xMax : 6;
    const yMin = typeof shape.yMin === "number" ? shape.yMin : -6;
    const yMax = typeof shape.yMax === "number" ? shape.yMax : 6;

    const xRange = Math.max(0.1, xMax - xMin);
    const yRange = Math.max(0.1, yMax - yMin);

    // Coordinate conversion functions
    function toScreenX(x) {
      return plotX1 + ((x - xMin) / xRange) * plotW;
    }
    function toScreenY(y) {
      return plotY2 - ((y - yMin) / yRange) * plotH;
    }

    // 3. Draw Header Title and Active Curve Badges
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = titleCol;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const title = shape.title || "Graph Plotter";
    ctx.fillText(title, x1 + 14, y1 + 18);

    // Draw active curves indicators in header
    const curves = Array.isArray(shape.curves) && shape.curves.length ? shape.curves : [
      { id: "f1", expr: "x^2 - 4", color: "#2563eb", lineWidth: 2.5, label: "y = x² - 4", enabled: true }
    ];

    let chipX = x1 + 14 + ctx.measureText(title).width + 16;
    curves.forEach((c) => {
      if (!c.enabled) return;
      const labelText = c.label || ("y = " + c.expr);
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      const chipW = ctx.measureText(labelText).width + 20;

      if (chipX + chipW < x2 - 10) {
        ctx.fillStyle = isDark ? "rgba(30, 41, 59, 0.85)" : "#f1f5f9";
        ctx.strokeStyle = c.color || "#2563eb";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(chipX, y1 + 9, chipW, 18, 4) : ctx.rect(chipX, y1 + 9, chipW, 18);
        ctx.fill();
        ctx.stroke();

        // Color dot
        ctx.fillStyle = c.color || "#2563eb";
        ctx.beginPath();
        ctx.arc(chipX + 8, y1 + 18, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isDark ? "#f8fafc" : "#1e293b";
        ctx.fillText(labelText, chipX + 15, y1 + 18);

        chipX += chipW + 8;
      }
    });

    // 4. Clip to Plotting Area for Grid and Curves
    ctx.save();
    ctx.beginPath();
    ctx.rect(plotX1, plotY1, plotW, plotH);
    ctx.clip();

    // 5. Draw Grid Lines
    const showGrid = shape.showGrid !== false;
    if (showGrid) {
      // Determine optimal grid step
      let stepX = 1;
      if (xRange > 20) stepX = 5;
      else if (xRange > 10) stepX = 2;
      else if (xRange <= 4) stepX = 0.5;

      let stepY = 1;
      if (yRange > 20) stepY = 5;
      else if (yRange > 10) stepY = 2;
      else if (yRange <= 4) stepY = 0.5;

      // Minor grid lines
      ctx.strokeStyle = minorGridCol;
      ctx.lineWidth = 1;
      const subStepX = stepX / 2;
      const subStartX = Math.floor(xMin / subStepX) * subStepX;
      for (let x = subStartX; x <= xMax; x += subStepX) {
        const sx = toScreenX(x);
        ctx.beginPath();
        ctx.moveTo(sx, plotY1);
        ctx.lineTo(sx, plotY2);
        ctx.stroke();
      }
      const subStepY = stepY / 2;
      const subStartY = Math.floor(yMin / subStepY) * subStepY;
      for (let y = subStartY; y <= yMax; y += subStepY) {
        const sy = toScreenY(y);
        ctx.beginPath();
        ctx.moveTo(plotX1, sy);
        ctx.lineTo(plotX2, sy);
        ctx.stroke();
      }

      // Major grid lines
      ctx.strokeStyle = majorGridCol;
      ctx.lineWidth = 1.2;
      const startGridX = Math.floor(xMin / stepX) * stepX;
      for (let x = startGridX; x <= xMax; x += stepX) {
        const sx = toScreenX(x);
        ctx.beginPath();
        ctx.moveTo(sx, plotY1);
        ctx.lineTo(sx, plotY2);
        ctx.stroke();
      }
      const startGridY = Math.floor(yMin / stepY) * stepY;
      for (let y = startGridY; y <= yMax; y += stepY) {
        const sy = toScreenY(y);
        ctx.beginPath();
        ctx.moveTo(plotX1, sy);
        ctx.lineTo(plotX2, sy);
        ctx.stroke();
      }
    }

    // 6. Draw Axes (X and Y)
    const originSx = toScreenX(0);
    const originSy = toScreenY(0);

    const hasYAxis = originSx >= plotX1 && originSx <= plotX2;
    const hasXAxis = originSy >= plotY1 && originSy <= plotY2;

    const axisXPos = hasYAxis ? originSx : plotX1;
    const axisYPos = hasXAxis ? originSy : plotY2;

    ctx.strokeStyle = axisCol;
    ctx.lineWidth = 2;

    // Horizontal X-Axis
    ctx.beginPath();
    ctx.moveTo(plotX1 - 6, axisYPos);
    ctx.lineTo(plotX2 + 6, axisYPos);
    ctx.stroke();

    // Vertical Y-Axis
    ctx.beginPath();
    ctx.moveTo(axisXPos, plotY2 + 6);
    ctx.lineTo(axisXPos, plotY1 - 6);
    ctx.stroke();

    // Arrows on Axes
    function drawArrow(fromX, fromY, toX, toY) {
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const headLen = 7;
      ctx.fillStyle = axisCol;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }
    drawArrow(plotX2 - 10, axisYPos, plotX2 + 6, axisYPos);
    drawArrow(axisXPos, plotY1 + 10, axisXPos, plotY1 - 6);

    // 7. Plot Function Curves
    const compiledCurves = [];

    curves.forEach((curve) => {
      if (!curve.enabled) return;
      const fn = compileMathExpression(curve.expr);
      if (!fn) return;

      compiledCurves.push({ curve, fn });

      ctx.save();
      ctx.strokeStyle = curve.color || "#2563eb";
      ctx.lineWidth = curve.lineWidth || 2.5;
      if (Array.isArray(curve.lineDash) && curve.lineDash.length > 0) {
        ctx.setLineDash(curve.lineDash);
      } else {
        ctx.setLineDash([]);
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.beginPath();
      const numSamples = Math.min(600, Math.max(250, Math.round(plotW * 1.5)));
      const sampleDx = xRange / numSamples;
      let inPath = false;
      let prevYVal = null;

      for (let i = 0; i <= numSamples; i++) {
        const x = xMin + i * sampleDx;
        const y = fn(x);

        if (y === null || !isFinite(y)) {
          inPath = false;
          prevYVal = null;
          continue;
        }

        const sx = toScreenX(x);
        const sy = toScreenY(y);

        // Detect vertical jump (e.g. 1/x or tan(x) asymptotic discontinuities)
        if (prevYVal !== null && Math.abs(y - prevYVal) > yRange * 0.75 && (y * prevYVal < 0 || Math.abs(y) > yRange * 2)) {
          inPath = false;
        }

        if (!inPath) {
          ctx.moveTo(sx, sy);
          inPath = true;
        } else {
          ctx.lineTo(sx, sy);
        }
        prevYVal = y;
      }
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore(); // Restore clipping

    // 8. Draw Axis Numbers / Ticks (Outside Clipping Area)
    ctx.font = "10px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = axisTextCol;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Step calculation for ticks
    let tickStepX = 1;
    if (xRange > 20) tickStepX = 5;
    else if (xRange > 10) tickStepX = 2;

    let tickStepY = 1;
    if (yRange > 20) tickStepY = 5;
    else if (yRange > 10) tickStepY = 2;

    // X-Axis Ticks
    const startTickX = Math.floor(xMin / tickStepX) * tickStepX;
    for (let x = startTickX; x <= xMax; x += tickStepX) {
      if (Math.abs(x) < 0.001) continue; // Skip 0 (drawn at origin)
      const sx = toScreenX(x);
      if (sx < plotX1 || sx > plotX2) continue;

      ctx.beginPath();
      ctx.strokeStyle = axisCol;
      ctx.lineWidth = 1;
      ctx.moveTo(sx, axisYPos - 3);
      ctx.lineTo(sx, axisYPos + 3);
      ctx.stroke();

      const labelY = axisYPos + 5 > plotY2 ? plotY2 + 4 : axisYPos + 5;
      ctx.fillText(Number.isInteger(x) ? x.toString() : x.toFixed(1), sx, labelY);
    }

    // Y-Axis Ticks
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const startTickY = Math.floor(yMin / tickStepY) * tickStepY;
    for (let y = startTickY; y <= yMax; y += tickStepY) {
      if (Math.abs(y) < 0.001) continue; // Skip 0
      const sy = toScreenY(y);
      if (sy < plotY1 || sy > plotY2) continue;

      ctx.beginPath();
      ctx.strokeStyle = axisCol;
      ctx.lineWidth = 1;
      ctx.moveTo(axisXPos - 3, sy);
      ctx.lineTo(axisXPos + 3, sy);
      ctx.stroke();

      const labelX = axisXPos - 5 < plotX1 ? plotX1 - 3 : axisXPos - 5;
      ctx.fillText(Number.isInteger(y) ? y.toString() : y.toFixed(1), labelX, sy);
    }

    // Origin label "O"
    if (hasXAxis && hasYAxis) {
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.font = "italic 11px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = axisTextCol;
      ctx.fillText("O", originSx - 4, originSy + 4);
    }

    // Axis Names (X and Y)
    ctx.font = "bold italic 12px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = axisCol;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("x", plotX2 + 9, axisYPos);

    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("y", axisXPos, plotY1 - 9);

    // 9. Analysis Markers: Roots, Y-Intercepts, Extrema & Intersections
    compiledCurves.forEach(({ curve, fn }) => {
      // Roots (X-intercepts)
      if (curve.showRoots) {
        const roots = findRoots(fn, xMin, xMax);
        roots.forEach((r) => {
          const sx = toScreenX(r);
          const sy = toScreenY(0);
          if (sx >= plotX1 && sx <= plotX2 && sy >= plotY1 && sy <= plotY2) {
            ctx.fillStyle = curve.color || "#2563eb";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Coordinate label badge
            const lbl = "(" + (Number.isInteger(r) ? r : r.toFixed(2)) + ", 0)";
            drawMarkerBadge(ctx, lbl, sx, sy - 12, curve.color || "#2563eb", isDark);
          }
        });
      }

      // Y-Intercept
      if (curve.showYIntercept && xMin <= 0 && xMax >= 0) {
        const y0 = fn(0);
        if (y0 !== null && isFinite(y0) && y0 >= yMin && y0 <= yMax) {
          const sx = toScreenX(0);
          const sy = toScreenY(y0);
          ctx.fillStyle = curve.color || "#2563eb";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          const lbl = "(0, " + (Number.isInteger(y0) ? y0 : y0.toFixed(2)) + ")";
          drawMarkerBadge(ctx, lbl, sx + 16, sy, curve.color || "#2563eb", isDark);
        }
      }

      // Vertex / Extrema
      if (curve.showVertex) {
        const extrema = findExtrema(fn, xMin, xMax, yMin, yMax);
        extrema.forEach((pt) => {
          const sx = toScreenX(pt.x);
          const sy = toScreenY(pt.y);
          if (sx >= plotX1 && sx <= plotX2 && sy >= plotY1 && sy <= plotY2) {
            ctx.fillStyle = "#8b5cf6"; // Purple accent
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const lbl = "Vertex: (" + pt.x + ", " + pt.y + ")";
            drawMarkerBadge(ctx, lbl, sx, pt.type === "max" ? sy - 14 : sy + 14, "#8b5cf6", isDark);
          }
        });
      }
    });

    // Intersections between simultaneous curves
    if (shape.showIntersections && compiledCurves.length >= 2) {
      for (let i = 0; i < compiledCurves.length; i++) {
        for (let j = i + 1; j < compiledCurves.length; j++) {
          const inters = findIntersections(compiledCurves[i].fn, compiledCurves[j].fn, xMin, xMax);
          inters.forEach((pt) => {
            if (pt.y >= yMin && pt.y <= yMax) {
              const sx = toScreenX(pt.x);
              const sy = toScreenY(pt.y);
              if (sx >= plotX1 && sx <= plotX2 && sy >= plotY1 && sy <= plotY2) {
                // Gold double ring marker
                ctx.fillStyle = "#f59e0b";
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = "#d97706";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(sx, sy, 8.5, 0, Math.PI * 2);
                ctx.stroke();

                const lbl = "Intersection (" + pt.x + ", " + pt.y + ")";
                drawMarkerBadge(ctx, lbl, sx, sy - 16, "#d97706", isDark);
              }
            }
          });
        }
      }
    }

    // 10. Table of Values Overlay (if enabled)
    if (shape.showKeyPointsTable && compiledCurves.length > 0) {
      const primary = compiledCurves[0];
      const tableRows = generateTableOfValues(primary.fn, xMin, xMax, 1);
      if (tableRows.length > 0) {
        const tableW = 120;
        const rowH = 16;
        const maxDisplay = Math.min(tableRows.length, 7);
        const tableH = 22 + maxDisplay * rowH;
        const tx = plotX2 - tableW - 8;
        const ty = plotY1 + 8;

        ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.90)" : "rgba(255, 255, 255, 0.92)";
        ctx.strokeStyle = isDark ? "#475569" : "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(tx, ty, tableW, tableH, 6) : ctx.rect(tx, ty, tableW, tableH);
        ctx.fill();
        ctx.stroke();

        // Table Header
        ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = primary.curve.color || "#2563eb";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("x", tx + 30, ty + 11);
        ctx.fillText("y = f(x)", tx + 85, ty + 11);

        ctx.strokeStyle = isDark ? "#334155" : "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(tx, ty + 20);
        ctx.lineTo(tx + tableW, ty + 20);
        ctx.moveTo(tx + 60, ty);
        ctx.lineTo(tx + 60, ty + tableH);
        ctx.stroke();

        // Rows
        ctx.font = "10px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = isDark ? "#f8fafc" : "#1e293b";
        tableRows.slice(0, maxDisplay).forEach((row, rIdx) => {
          const ry = ty + 22 + rIdx * rowH + rowH / 2;
          ctx.fillText(row.x.toString(), tx + 30, ry);
          ctx.fillText(row.y.toString(), tx + 85, ry);
        });
      }
    }

    ctx.restore();
  }

  // Helper for drawing marker badge labels
  function drawMarkerBadge(ctx, text, x, y, accentColor, isDark) {
    ctx.save();
    ctx.font = "bold 10px system-ui, -apple-system, sans-serif";
    const textW = ctx.measureText(text).width;
    const badgeW = textW + 12;
    const badgeH = 18;
    const bx = x - badgeW / 2;
    const by = y - badgeH / 2;

    ctx.fillStyle = isDark ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(bx, by, badgeW, badgeH, 4) : ctx.rect(bx, by, badgeW, badgeH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDark ? "#f8fafc" : "#0f172a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // =========================================================================
  // 5. Edu Tools Insertion Panel
  // =========================================================================

  function renderGraphPlotterEduToolsPanel(container, insertCallback) {
    if (!container) return;

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = "10px";
    wrap.style.padding = "10px";
    wrap.style.background = "#f8fafc";
    wrap.style.border = "1.5px solid #6366f1";
    wrap.style.borderRadius = "8px";
    wrap.style.marginBottom = "1.25rem";

    // Header
    const headRow = document.createElement("div");
    headRow.style.display = "flex";
    headRow.style.justifyContent = "space-between";
    headRow.style.alignItems = "center";

    const titleSpan = document.createElement("span");
    titleSpan.style.fontWeight = "700";
    titleSpan.style.fontSize = "0.86rem";
    titleSpan.style.color = "#4338ca";
    titleSpan.textContent = "📈 Function Graph Plotter";
    headRow.appendChild(titleSpan);

    const gradeBadge = document.createElement("span");
    gradeBadge.style.fontSize = "0.68rem";
    gradeBadge.style.fontWeight = "600";
    gradeBadge.style.padding = "2px 6px";
    gradeBadge.style.borderRadius = "4px";
    gradeBadge.style.background = "#e0e7ff";
    gradeBadge.style.color = "#3730a3";
    gradeBadge.textContent = "NCERT Class 6–10";
    headRow.appendChild(gradeBadge);

    wrap.appendChild(headRow);

    // Preset Selector
    const presetLbl = document.createElement("label");
    presetLbl.style.fontSize = "0.72rem";
    presetLbl.style.fontWeight = "600";
    presetLbl.style.color = "#475569";
    presetLbl.textContent = "Select NCERT Topic / Example:";
    wrap.appendChild(presetLbl);

    const presetSelect = document.createElement("select");
    presetSelect.style.width = "100%";
    presetSelect.style.padding = "5px 8px";
    presetSelect.style.fontSize = "0.75rem";
    presetSelect.style.borderRadius = "6px";
    presetSelect.style.border = "1px solid #cbd5e1";
    presetSelect.style.background = "#ffffff";
    presetSelect.style.color = "#0f172a";

    NCERT_GRAPH_PRESETS.forEach((p, idx) => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.title;
      presetSelect.appendChild(opt);
    });
    wrap.appendChild(presetSelect);

    // Curve 1 Formula Input
    const c1Lbl = document.createElement("label");
    c1Lbl.style.fontSize = "0.72rem";
    c1Lbl.style.fontWeight = "600";
    c1Lbl.style.color = "#1e293b";
    c1Lbl.textContent = "Function 1: y = f(x)";
    wrap.appendChild(c1Lbl);

    const c1Input = document.createElement("input");
    c1Input.type = "text";
    c1Input.value = NCERT_GRAPH_PRESETS[0].curves[0].expr;
    c1Input.placeholder = "e.g. 2x - 1, x^2 - 4, sin(x)";
    c1Input.style.padding = "5px 8px";
    c1Input.style.fontSize = "0.80rem";
    c1Input.style.borderRadius = "6px";
    c1Input.style.border = "1.5px solid #2563eb";
    c1Input.style.background = "#ffffff";
    c1Input.style.color = "#0f172a";
    wrap.appendChild(c1Input);

    // Curve 2 Formula Input (Optional)
    const c2Row = document.createElement("div");
    c2Row.style.display = "flex";
    c2Row.style.flexDirection = "column";
    c2Row.style.gap = "2px";

    const c2Header = document.createElement("div");
    c2Header.style.display = "flex";
    c2Header.style.justifyContent = "space-between";
    c2Header.style.alignItems = "center";

    const c2Lbl = document.createElement("label");
    c2Lbl.style.fontSize = "0.72rem";
    c2Lbl.style.fontWeight = "600";
    c2Lbl.style.color = "#dc2626";
    c2Lbl.textContent = "Function 2: y = g(x) (Simultaneous)";
    c2Header.appendChild(c2Lbl);

    const c2Toggle = document.createElement("input");
    c2Toggle.type = "checkbox";
    c2Toggle.checked = !!(NCERT_GRAPH_PRESETS[0].curves[1] && NCERT_GRAPH_PRESETS[0].curves[1].enabled);
    c2Header.appendChild(c2Toggle);
    c2Row.appendChild(c2Header);

    const c2Input = document.createElement("input");
    c2Input.type = "text";
    c2Input.value = NCERT_GRAPH_PRESETS[0].curves[1] ? NCERT_GRAPH_PRESETS[0].curves[1].expr : "-x + 5";
    c2Input.placeholder = "e.g. -x + 5";
    c2Input.style.padding = "5px 8px";
    c2Input.style.fontSize = "0.80rem";
    c2Input.style.borderRadius = "6px";
    c2Input.style.border = "1.5px solid #dc2626";
    c2Input.style.background = "#ffffff";
    c2Input.style.color = "#0f172a";
    c2Row.appendChild(c2Input);
    wrap.appendChild(c2Row);

    // Preset selection handler
    presetSelect.addEventListener("change", () => {
      const selected = NCERT_GRAPH_PRESETS.find((p) => p.id === presetSelect.value);
      if (selected) {
        c1Input.value = selected.curves[0].expr;
        if (selected.curves[1]) {
          c2Toggle.checked = true;
          c2Input.value = selected.curves[1].expr;
        } else {
          c2Toggle.checked = false;
        }
      }
    });

    // Checkboxes Row
    const chkRow = document.createElement("div");
    chkRow.style.display = "grid";
    chkRow.style.gridTemplateColumns = "1fr 1fr";
    chkRow.style.gap = "6px";

    function makeCheckbox(label, checked) {
      const lbl = document.createElement("label");
      lbl.style.display = "flex";
      lbl.style.alignItems = "center";
      lbl.style.gap = "5px";
      lbl.style.fontSize = "0.72rem";
      lbl.style.color = "#334155";
      lbl.style.cursor = "pointer";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = checked;
      lbl.appendChild(chk);
      const span = document.createElement("span");
      span.textContent = label;
      lbl.appendChild(span);
      return { container: lbl, input: chk };
    }

    const rootsChk = makeCheckbox("Zeroes / Roots", true);
    const yInterChk = makeCheckbox("Y-Intercept", true);
    const vertexChk = makeCheckbox("Vertex / Extrema", true);
    const interChk = makeCheckbox("Intersections", true);
    const tableChk = makeCheckbox("Table of Values", false);
    const gridChk = makeCheckbox("Grid lines", true);

    chkRow.appendChild(rootsChk.container);
    chkRow.appendChild(yInterChk.container);
    chkRow.appendChild(vertexChk.container);
    chkRow.appendChild(interChk.container);
    chkRow.appendChild(tableChk.container);
    chkRow.appendChild(gridChk.container);
    wrap.appendChild(chkRow);

    // Insert Button
    const insertBtn = document.createElement("button");
    insertBtn.type = "button";
    insertBtn.innerHTML = "<span style='font-size:1.1rem;'>📈</span> Insert Graph on Board";
    insertBtn.style.padding = "8px 12px";
    insertBtn.style.background = "#4f46e5";
    insertBtn.style.color = "#ffffff";
    insertBtn.style.fontWeight = "700";
    insertBtn.style.fontSize = "0.84rem";
    insertBtn.style.border = "none";
    insertBtn.style.borderRadius = "6px";
    insertBtn.style.cursor = "pointer";
    insertBtn.style.display = "flex";
    insertBtn.style.alignItems = "center";
    insertBtn.style.justifyContent = "center";
    insertBtn.style.gap = "6px";
    insertBtn.style.marginTop = "4px";

    insertBtn.addEventListener("click", () => {
      const activePreset = NCERT_GRAPH_PRESETS.find((p) => p.id === presetSelect.value) || NCERT_GRAPH_PRESETS[0];

      const curvesToInsert = [
        {
          id: "f1",
          expr: c1Input.value.trim() || "x^2 - 4",
          color: "#2563eb",
          lineWidth: 2.5,
          lineDash: [],
          label: "y = " + (c1Input.value.trim() || "x^2 - 4"),
          enabled: true,
          showRoots: rootsChk.input.checked,
          showYIntercept: yInterChk.input.checked,
          showVertex: vertexChk.input.checked
        }
      ];

      if (c2Toggle.checked && c2Input.value.trim()) {
        curvesToInsert.push({
          id: "f2",
          expr: c2Input.value.trim(),
          color: "#dc2626",
          lineWidth: 2.5,
          lineDash: [],
          label: "y = " + c2Input.value.trim(),
          enabled: true,
          showRoots: rootsChk.input.checked,
          showYIntercept: yInterChk.input.checked,
          showVertex: vertexChk.input.checked
        });
      }

      const graphShape = {
        type: "graphPlotter",
        title: activePreset.title.split(":")[1] ? activePreset.title.split(":")[1].trim() : "Function Graph",
        xMin: activePreset.xMin,
        xMax: activePreset.xMax,
        yMin: activePreset.yMin,
        yMax: activePreset.yMax,
        showGrid: gridChk.input.checked,
        showIntersections: interChk.input.checked,
        showKeyPointsTable: tableChk.input.checked,
        curves: curvesToInsert,
        rotation: 0
      };

      if (typeof insertCallback === "function") {
        insertCallback(graphShape);
      }
    });

    wrap.appendChild(insertBtn);
    container.appendChild(wrap);
  }

  // =========================================================================
  // 6. Selected Shape Property Inspector Editor
  // =========================================================================

  function renderSelectedGraphPlotterEditor(shape, parentWrap, updateCallback) {
    if (!shape || shape.type !== "graphPlotter") return;

    const card = document.createElement("div");
    card.style.background = "#f8fafc";
    card.style.border = "1.5px solid #6366f1";
    card.style.borderRadius = "8px";
    card.style.padding = "10px";
    card.style.marginTop = "0.75rem";
    card.style.marginBottom = "0.5rem";

    // Header
    const headRow = document.createElement("div");
    headRow.style.display = "flex";
    headRow.style.justifyContent = "space-between";
    headRow.style.alignItems = "center";
    headRow.style.marginBottom = "8px";

    const titleText = document.createElement("span");
    titleText.style.fontWeight = "700";
    titleText.style.fontSize = "0.84rem";
    titleText.style.color = "#4338ca";
    titleText.textContent = "📈 Graph Plotter Options";
    headRow.appendChild(titleText);

    card.appendChild(headRow);

    // Title Input
    const titleLbl = document.createElement("label");
    titleLbl.style.fontSize = "0.72rem";
    titleLbl.style.color = "#475569";
    titleLbl.textContent = "Graph Title:";
    card.appendChild(titleLbl);

    const titleIn = document.createElement("input");
    titleIn.type = "text";
    titleIn.value = shape.title || "Function Graph";
    titleIn.style.width = "100%";
    titleIn.style.padding = "4px 6px";
    titleIn.style.fontSize = "0.78rem";
    titleIn.style.borderRadius = "5px";
    titleIn.style.border = "1px solid #cbd5e1";
    titleIn.style.marginBottom = "8px";
    titleIn.style.boxSizing = "border-box";
    titleIn.addEventListener("input", (e) => {
      shape.title = e.target.value;
      if (updateCallback) updateCallback();
    });
    card.appendChild(titleIn);

    // Curves Editor
    shape.curves = Array.isArray(shape.curves) && shape.curves.length ? shape.curves : [
      { id: "f1", expr: "x^2 - 4", color: "#2563eb", lineWidth: 2.5, label: "y = x² - 4", enabled: true }
    ];

    shape.curves.forEach((curve, idx) => {
      const cBox = document.createElement("div");
      cBox.style.padding = "6px";
      cBox.style.background = "#ffffff";
      cBox.style.border = "1px solid #e2e8f0";
      cBox.style.borderRadius = "6px";
      cBox.style.marginBottom = "6px";

      const cHead = document.createElement("div");
      cHead.style.display = "flex";
      cHead.style.justifyContent = "space-between";
      cHead.style.alignItems = "center";
      cHead.style.marginBottom = "4px";

      const cName = document.createElement("span");
      cName.style.fontSize = "0.74rem";
      cName.style.fontWeight = "700";
      cName.style.color = curve.color || "#2563eb";
      cName.textContent = "Curve " + (idx + 1);
      cHead.appendChild(cName);

      const cEnable = document.createElement("input");
      cEnable.type = "checkbox";
      cEnable.checked = curve.enabled !== false;
      cEnable.title = "Enable / Disable Curve";
      cEnable.addEventListener("change", (e) => {
        curve.enabled = e.target.checked;
        if (updateCallback) updateCallback();
      });
      cHead.appendChild(cEnable);
      cBox.appendChild(cHead);

      const exprIn = document.createElement("input");
      exprIn.type = "text";
      exprIn.value = curve.expr || "";
      exprIn.placeholder = "e.g. 2x + 1, x^2 - 4";
      exprIn.style.width = "100%";
      exprIn.style.padding = "3px 6px";
      exprIn.style.fontSize = "0.78rem";
      exprIn.style.borderRadius = "4px";
      exprIn.style.border = "1px solid " + (curve.color || "#cbd5e1");
      exprIn.style.boxSizing = "border-box";
      exprIn.addEventListener("input", (e) => {
        curve.expr = e.target.value;
        curve.label = "y = " + e.target.value;
        if (updateCallback) updateCallback();
      });
      cBox.appendChild(exprIn);
      card.appendChild(cBox);
    });

    // Range Controls
    const rangeGrid = document.createElement("div");
    rangeGrid.style.display = "grid";
    rangeGrid.style.gridTemplateColumns = "1fr 1fr";
    rangeGrid.style.gap = "6px";
    rangeGrid.style.marginTop = "6px";
    rangeGrid.style.marginBottom = "8px";

    function makeRangeInput(lblText, val, setter) {
      const box = document.createElement("div");
      box.style.display = "flex";
      box.style.flexDirection = "column";
      box.style.gap = "2px";

      const l = document.createElement("span");
      l.style.fontSize = "0.68rem";
      l.style.color = "#64748b";
      l.textContent = lblText;
      box.appendChild(l);

      const inp = document.createElement("input");
      inp.type = "number";
      inp.value = val;
      inp.style.padding = "3px 5px";
      inp.style.fontSize = "0.75rem";
      inp.style.borderRadius = "4px";
      inp.style.border = "1px solid #cbd5e1";
      inp.addEventListener("change", (e) => {
        setter(Number(e.target.value));
        if (updateCallback) updateCallback();
      });
      box.appendChild(inp);
      return box;
    }

    rangeGrid.appendChild(makeRangeInput("X Min", shape.xMin, (v) => (shape.xMin = v)));
    rangeGrid.appendChild(makeRangeInput("X Max", shape.xMax, (v) => (shape.xMax = v)));
    rangeGrid.appendChild(makeRangeInput("Y Min", shape.yMin, (v) => (shape.yMin = v)));
    rangeGrid.appendChild(makeRangeInput("Y Max", shape.yMax, (v) => (shape.yMax = v)));
    card.appendChild(rangeGrid);

    // Analysis Toggles
    const togglesBox = document.createElement("div");
    togglesBox.style.display = "flex";
    togglesBox.style.flexDirection = "column";
    togglesBox.style.gap = "4px";

    function makeToggle(label, checked, setter) {
      const lbl = document.createElement("label");
      lbl.style.display = "flex";
      lbl.style.alignItems = "center";
      lbl.style.gap = "6px";
      lbl.style.fontSize = "0.72rem";
      lbl.style.cursor = "pointer";
      lbl.style.color = "#334155";

      const chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = checked;
      chk.addEventListener("change", (e) => {
        setter(e.target.checked);
        if (updateCallback) updateCallback();
      });
      lbl.appendChild(chk);

      const s = document.createElement("span");
      s.textContent = label;
      lbl.appendChild(s);
      return lbl;
    }

    togglesBox.appendChild(makeToggle("Show Roots / Zeroes", shape.curves[0] && shape.curves[0].showRoots, (v) => {
      shape.curves.forEach((c) => (c.showRoots = v));
    }));
    togglesBox.appendChild(makeToggle("Show Intersections", shape.showIntersections, (v) => (shape.showIntersections = v)));
    togglesBox.appendChild(makeToggle("Show Extrema / Vertex", shape.curves[0] && shape.curves[0].showVertex, (v) => {
      shape.curves.forEach((c) => (c.showVertex = v));
    }));
    togglesBox.appendChild(makeToggle("Show Table of Values", shape.showKeyPointsTable, (v) => (shape.showKeyPointsTable = v)));
    togglesBox.appendChild(makeToggle("Show Grid Lines", shape.showGrid !== false, (v) => (shape.showGrid = v)));

    card.appendChild(togglesBox);
    parentWrap.appendChild(card);
  }

  // =========================================================================
  // 7. Global Export
  // =========================================================================

  window.EduAshramGraphPlotter = {
    compileMathExpression,
    findRoots,
    findIntersections,
    findExtrema,
    generateTableOfValues,
    NCERT_GRAPH_PRESETS,
    drawGraphPlotterShape,
    renderGraphPlotterEduToolsPanel,
    renderSelectedGraphPlotterEditor
  };

  console.log("EduAshram Graph Plotter Engine loaded successfully.");
})();

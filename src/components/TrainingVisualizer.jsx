import { useRef, useEffect, useState } from 'preact/hooks';

export function TrainingVisualizer({ history, currentStepIndex, isTraining, paramsConfig }) {
  const canvasRef = useRef(null);
  const [page, setPage] = useState(0);
  const itemsPerPage = 6;

  // Reset page when config changes (e.g. switching stats)
  useEffect(() => {
    setPage(0);
  }, [paramsConfig]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !history || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    // Globals
    const maxError = Math.max(...history.map(h => h.error));
    // Determine visible history limit
    const showAll = !isTraining && history.length > 0;
    const limit = showAll
      ? history.length - 1
      : (currentStepIndex !== null && currentStepIndex >= 0)
        ? Math.min(currentStepIndex, history.length - 1)
        : -1;

    // Find Best So Far
    let bestIdx = -1;
    let minErr = Infinity;
    for (let i = 0; i <= limit; i++) {
      if (history[i].error < minErr) {
        minErr = history[i].error;
        bestIdx = i;
      }
    }

    // --- CHART CONFIGURATION ---
    let charts = [];

    if (paramsConfig) {
      // Create a virtual list of "all plots"
      // Item 0: Error over Step
      // Item 1..N: Each Param
      const totalVisualizations = 1 + paramsConfig.length;

      // Pagination Logic
      const startIdx = page * itemsPerPage;
      const endIdx = Math.min(startIdx + itemsPerPage, totalVisualizations);

      // Determine Grid Layout
      const count = endIdx - startIdx;
      const cols = 3;
      const rows = 2; // Fixed 3x2 grid for max 6

      const chartW = width / cols;
      const chartH = height / rows;

      // Generate charts for visible items
      for (let i = startIdx; i < endIdx; i++) {
        const relIdx = i - startIdx;
        const col = relIdx % cols;
        const row = Math.floor(relIdx / cols);

        const offsetX = col * chartW;
        const offsetY = row * chartH;

        if (i === 0) {
          // --- PLOT 0: ACCURACY OVER STEP ---
          const xMax = Math.max(10, history.length - 1);
          charts.push({
            type: 'accuracy_step',
            xLabel: 'Training Step',
            xMin: 0,
            xMax: xMax,
            yMode: 'accuracy',
            getValue: (h, idx) => idx,
            getYValue: (h) => h.accuracy || 0,
            offsetX, offsetY, w: chartW, h: chartH,
            showYAxis: true
          });

        } else if (i === 1) {
          // --- PLOT 1: ERROR OVER STEP ---
          const xMax = Math.max(10, history.length - 1);
          charts.push({
            type: 'error_step',
            xLabel: 'Training Step',
            xMin: 0,
            xMax: xMax,
            yMode: 'error_log',
            getValue: (h, idx) => idx,
            getYValue: (h) => h.error,
            offsetX, offsetY, w: chartW, h: chartH,
            showYAxis: true
          });

        } else {
          // --- PLOT 2..N: PARAM OVER ERROR ---
          const paramIdx = i - 2; // Shift indices back
          const cfg = paramsConfig[paramIdx];

          const values = history.map(h => h.params[paramIdx]);
          const pMin = Math.min(...values);
          const pMax = Math.max(...values);

          charts.push({
            type: 'param_error',
            xLabel: cfg.name,
            xMin: pMin,
            xMax: pMax,
            yMode: 'error_log',
            getValue: (h) => h.params[paramIdx],
            getYValue: (h) => h.error,
            offsetX, offsetY, w: chartW, h: chartH
          });
        }
      }

    } else {
      // Legacy Mode (Phase 1 & 2)
      // Charts: Accuracy vs Step, Error vs Step, Weight vs Error, Bias vs Error
      // 2x2 Layout
      const chartW = width / 2;
      const chartH = height / 2;

      const valuesW = history.map(h => h.weight);
      const valuesB = history.map(h => h.bias);
      const xMaxStep = Math.max(10, history.length - 1);

      charts = [
        {
          type: 'accuracy_step', xLabel: 'Accuracy', xMin: 0, xMax: xMaxStep,
          yMode: 'accuracy', getValue: (h, idx) => idx, getYValue: (h) => h.accuracy || 0,
          offsetX: 0, offsetY: 0, w: chartW, h: chartH, showYAxis: true
        },
        {
          type: 'error_step', xLabel: 'Step', xMin: 0, xMax: xMaxStep,
          yMode: 'error_log', getValue: (h, idx) => idx, getYValue: (h) => h.error,
          offsetX: chartW, offsetY: 0, w: chartW, h: chartH, showYAxis: true
        },
        {
          xLabel: 'Weight', xMin: Math.min(...valuesW), xMax: Math.max(...valuesW),
          yMode: 'error_log', getValue: (h) => h.weight, getYValue: (h) => h.error,
          offsetX: 0, offsetY: chartH, w: chartW, h: chartH
        },
        {
          xLabel: 'Bias', xMin: Math.min(...valuesB), xMax: Math.max(...valuesB),
          yMode: 'error_log', getValue: (h) => h.bias, getYValue: (h) => h.error,
          offsetX: chartW, offsetY: chartH, w: chartW, h: chartH
        }
      ];
    }

    // --- DRAWING LOOP ---
    const padding = 50; // Increased padding for larger fonts

    charts.forEach(chart => {
      const { xLabel, xMin, xMax, getValue, getYValue, offsetX, offsetY, w, h, yMode, showYAxis } = chart;
      const mapX = (v) => offsetX + padding + (v - xMin) / ((xMax - xMin) || 1) * (w - 2 * padding);

      // Define MapY based on Mode
      let mapY;

      if (yMode === 'accuracy') {
        // Linear 0 to 1
        mapY = (acc) => offsetY + h - padding - (acc) * (h - 2 * padding);
      } else {
        // Error (Linear) - undoing log scale
        // minError is 0 for visual simplicity or true min
        const yMin = 0;
        const yMax = maxError || 1;

        mapY = (e) => {
          const norm = (e - yMin) / (yMax - yMin);
          return offsetY + h - padding - norm * (h - 2 * padding);
        };
      }

      // Chart Area Box
      ctx.strokeStyle = '#eee';
      ctx.lineWidth = 2; // Thicker lines
      ctx.strokeRect(offsetX, offsetY, w, h);

      // Axes
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2; // Thicker axes
      // Y Axis
      ctx.moveTo(offsetX + padding, offsetY + padding);
      ctx.lineTo(offsetX + padding, offsetY + h - padding);
      // X Axis
      ctx.lineTo(offsetX + w - padding, offsetY + h - padding);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#333';
      ctx.font = '22px sans-serif'; // Larger font
      ctx.textAlign = 'center';

      // Truncate overly long labels
      let label = xLabel;
      if (label.length > 20) label = label.substring(0, 18) + '...';

      ctx.fillText(label, offsetX + w / 2, offsetY + h - 15);

      // --- Y-AXIS TICKS & TITLE ---
      // Draw if leftmost OR explicitly requested
      if (offsetX === 0 || showYAxis) {
        ctx.save();
        ctx.translate(offsetX + 15, offsetY + h / 2); // Adjusted offset
        ctx.rotate(-Math.PI / 2);

        if (yMode === 'accuracy') {
          ctx.fillText("Accuracy", 0, 0);
          ctx.restore();

          ctx.textAlign = 'right';
          ctx.fillStyle = '#666';
          ctx.font = '18px sans-serif'; // Larger font

          // 0, 0.25, 0.5, 0.75, 1.0 ticks
          [0, 0.25, 0.5, 0.75, 1.0].forEach(v => {
            const y = mapY(v);
            ctx.fillText(v.toFixed(2), offsetX + padding - 8, y + 6);
            // Grid
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#f0f0f0';
            ctx.moveTo(offsetX + padding, y);
            ctx.lineTo(offsetX + w - padding, y);
            ctx.stroke();
          });
        } else {
          // Error (Linear)
          ctx.fillText("Error", 0, 0);
          ctx.restore();

          ctx.textAlign = 'right';
          ctx.fillStyle = '#666';
          ctx.font = '18px sans-serif'; // Larger font

          // 5 Linear ticks
          const steps = 5;
          for (let i = 0; i <= steps; i++) {
            const val = (i / steps) * maxError;
            const y = mapY(val);

            ctx.fillText(val.toFixed(2), offsetX + padding - 8, y + 6);

            if (i > 0) { // Don't draw bottom line over axis
              ctx.beginPath();
              ctx.lineWidth = 1;
              ctx.strokeStyle = '#f0f0f0';
              ctx.moveTo(offsetX + padding, y);
              ctx.lineTo(offsetX + w - padding, y);
              ctx.stroke();
            }
          }
        }
      }

      // X Ticks
      ctx.fillStyle = '#666';
      ctx.font = '18px sans-serif'; // Larger font
      ctx.textAlign = 'center';
      ctx.fillText(xMin.toFixed(1), offsetX + padding, offsetY + h - padding + 25);
      ctx.fillText(xMax.toFixed(1), offsetX + w - padding, offsetY + h - padding + 25);

      // Plot Points
      ctx.fillStyle = yMode === 'accuracy' ? 'rgba(155, 89, 182, 0.4)' : 'rgba(52, 152, 219, 0.4)'; // Purple for Acc, Blue for Error
      for (let i = 0; i <= limit; i++) {
        const val = getValue(history[i], i);
        const yVal = getYValue(history[i]);
        const x = mapX(val);
        const y = mapY(yVal);
        ctx.fillRect(x, y, 4, 4); // Larger points
      }

      // Highlight Best
      if (bestIdx >= 0) {
        const bestVal = getValue(history[bestIdx], bestIdx);
        const yVal = getYValue(history[bestIdx]);
        const bx = mapX(bestVal);
        const by = mapY(yVal);

        ctx.beginPath();
        ctx.fillStyle = '#2ecc71'; // Green
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2; // Thicker line
        ctx.arc(bx, by, 10, 0, Math.PI * 2); // Larger radius
        ctx.fill();
        ctx.stroke();
      }

      // Highlight Current
      if (isTraining && currentStepIndex !== null && currentStepIndex >= 0 && currentStepIndex <= limit) {
        const curVal = getValue(history[currentStepIndex], currentStepIndex);
        const yVal = getYValue(history[currentStepIndex]);
        const cx = mapX(curVal);
        const cy = mapY(yVal);

        ctx.beginPath();
        ctx.fillStyle = '#e74c3c'; // Red
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2; // Thicker line
        ctx.arc(cx, cy, 8, 0, Math.PI * 2); // Larger radius
        ctx.fill();
        ctx.stroke();
      }
    });

    // Legend overlay (Top Right of total canvas)
    const legendX = width - 150; // Adjusted for font size
    const legendY = 20;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(legendX, legendY, 140, 70); // Larger box
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, 140, 70);

    ctx.textAlign = 'left';
    ctx.font = '16px sans-serif'; // Larger font

    // Red Dot
    ctx.beginPath();
    ctx.fillStyle = '#e74c3c';
    ctx.arc(legendX + 15, legendY + 20, 6, 0, Math.PI * 2); // Larger dot
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText("Current Scan", legendX + 30, legendY + 25);

    // Green Dot
    ctx.beginPath();
    ctx.fillStyle = '#2ecc71';
    ctx.arc(legendX + 15, legendY + 50, 6, 0, Math.PI * 2); // Larger dot
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText("Best So Far", legendX + 30, legendY + 55);

    // Final Error Display
    if (!isTraining && bestIdx >= 0) {
      ctx.fillStyle = '#333';
      ctx.font = 'bold 18px sans-serif'; // Larger font
      ctx.textAlign = 'right';
      ctx.fillText(`Min Error: ${minErr.toFixed(5)}`, width - 20, height - 20);
    }

  }, [history, currentStepIndex, isTraining, paramsConfig, page]);

  const totalPages = paramsConfig ? Math.ceil((paramsConfig.length + 1) / itemsPerPage) : 1;

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff' }}>
      <canvas
        ref={canvasRef}
        width={1600}
        height={800}
        style={{ width: '100%', height: 'auto' }}
      />
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px', gap: '10px' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
            Previous
          </button>
          <span style={{ alignSelf: 'center' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

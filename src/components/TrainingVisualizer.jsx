import { useRef, useEffect } from 'preact/hooks';

export function TrainingVisualizer({ history, currentStepIndex, isTraining, paramsConfig }) {
  const canvasRef = useRef(null);

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
      // Generic Mode: One chart per parameter
      // Determine Grid Layout
      // Example: 5 params -> 3 cols, 2 rows.
      const count = paramsConfig.length;
      const cols = count >= 4 ? 3 : count;
      const rows = Math.ceil(count / cols);

      const chartW = width / cols;
      const chartH = height / rows;

      charts = paramsConfig.map((cfg, idx) => {
        // Calculate ranges for this param
        // Note: History params might go slightly outside config.min/max due to floats or logic, 
        // but usually stick to it. safer to measure history.
        const values = history.map(h => h.params[idx]);
        const pMin = Math.min(...values);
        const pMax = Math.max(...values);

        const col = idx % cols;
        const row = Math.floor(idx / cols);

        return {
          xLabel: cfg.name,
          xMin: pMin,
          xMax: pMax,
          getValue: (h, i) => h.params[idx],
          offsetX: col * chartW,
          offsetY: row * chartH,
          w: chartW,
          h: chartH
        };
      });

    } else {
      // Legacy Mode
      const chartW = width / 2;
      const valuesW = history.map(h => h.weight);
      const valuesB = history.map(h => h.bias);

      charts = [
        {
          xLabel: 'Weight',
          xMin: Math.min(...valuesW),
          xMax: Math.max(...valuesW),
          getValue: (h) => h.weight,
          offsetX: 0,
          offsetY: 0,
          w: chartW,
          h: height
        },
        {
          xLabel: 'Bias',
          xMin: Math.min(...valuesB),
          xMax: Math.max(...valuesB),
          getValue: (h) => h.bias,
          offsetX: chartW,
          offsetY: 0,
          w: chartW,
          h: height
        }
      ];
    }

    // --- DRAWING LOOP ---
    const padding = 35;

    charts.forEach(chart => {
      const { xLabel, xMin, xMax, getValue, offsetX, offsetY, w, h } = chart;

      // Mappers
      // Map Y (Error) fits within the chart height
      const mapY = (e) => offsetY + h - padding - (e / (maxError || 1)) * (h - 2 * padding);
      const mapX = (v) => offsetX + padding + (v - xMin) / ((xMax - xMin) || 1) * (w - 2 * padding);

      // Chart Area Box
      ctx.strokeStyle = '#eee';
      ctx.strokeRect(offsetX, offsetY, w, h);

      // Axes
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      // Y Axis
      ctx.moveTo(offsetX + padding, offsetY + padding);
      ctx.lineTo(offsetX + padding, offsetY + h - padding);
      // X Axis
      ctx.lineTo(offsetX + w - padding, offsetY + h - padding);
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#333';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, offsetX + w / 2, offsetY + h - 10);

      // Y-Axis Title (Error) - only on leftmost charts
      if (offsetX === 0) {
        ctx.save();
        ctx.translate(offsetX + 10, offsetY + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Error", 0, 0);
        ctx.restore();
      }

      // Ticks - simplified
      ctx.fillStyle = '#666';
      ctx.font = '9px sans-serif';
      // X Min/Max
      ctx.fillText(xMin.toFixed(1), offsetX + padding, offsetY + h - padding + 12);
      ctx.fillText(xMax.toFixed(1), offsetX + w - padding, offsetY + h - padding + 12);

      // Plot Points (Scattered cloud of all past evaluations)
      ctx.fillStyle = 'rgba(52, 152, 219, 0.4)'; // Blue transparent
      for (let i = 0; i <= limit; i++) {
        const val = getValue(history[i], i);
        const x = mapX(val);
        const y = mapY(history[i].error);
        ctx.fillRect(x, y, 2, 2);
      }

      // Highlight Best So Far (Green)
      if (bestIdx >= 0) {
        const bestVal = getValue(history[bestIdx], bestIdx);
        const bx = mapX(bestVal);
        const by = mapY(history[bestIdx].error);

        ctx.beginPath();
        ctx.fillStyle = '#2ecc71'; // Green
        ctx.strokeStyle = '#27ae60';
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Highlight Current Scanner Position (Red)
      if (currentStepIndex !== null && currentStepIndex >= 0 && currentStepIndex <= limit) {
        const curVal = getValue(history[currentStepIndex], currentStepIndex);
        const cx = mapX(curVal);
        const cy = mapY(history[currentStepIndex].error);

        ctx.beginPath();
        ctx.fillStyle = '#e74c3c'; // Red
        ctx.strokeStyle = '#c0392b';
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Legend overlay (Top Right of total canvas)
    const legendX = width - 120;
    const legendY = 10;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(legendX, legendY, 110, 50);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(legendX, legendY, 110, 50);

    ctx.textAlign = 'left';
    ctx.font = '10px sans-serif';

    // Red Dot
    ctx.beginPath();
    ctx.fillStyle = '#e74c3c';
    ctx.arc(legendX + 10, legendY + 15, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText("Current Scan", legendX + 20, legendY + 18);

    // Green Dot
    ctx.beginPath();
    ctx.fillStyle = '#2ecc71';
    ctx.arc(legendX + 10, legendY + 35, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#333';
    ctx.fillText("Best So Far", legendX + 20, legendY + 38);


  }, [history, currentStepIndex, isTraining, paramsConfig]);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={400} // Increased height to accommodate rows
        style={{ width: '100%', height: 'auto' }}
      />
    </div>
  );
}

import { useRef, useEffect } from 'preact/hooks';

export function TrainingVisualizer({ history, currentStepIndex }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !history || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Split into two charts: Left (Weight vs Error), Right (Bias vs Error)
    const chartWidth = width / 2;
    const padding = 40;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Find Scales
    const maxError = Math.max(...history.map(h => h.error));
    // Weight Range
    const wMin = Math.min(...history.map(h => h.weight));
    const wMax = Math.max(...history.map(h => h.weight));
    // Bias Range
    const bMin = Math.min(...history.map(h => h.bias));
    const bMax = Math.max(...history.map(h => h.bias));

    // Mapping Functions
    const mapY = (e) => height - padding - (e / maxError) * (height - 2 * padding);

    const drawChart = (offsetX, xLabel, xMin, xMax, valueKey) => {
      const mapX = (val) => offsetX + padding + (val - xMin) / (xMax - xMin) * (chartWidth - 2 * padding);

      // Axes
      ctx.beginPath();
      ctx.strokeStyle = '#333';
      ctx.moveTo(offsetX + padding, padding);
      ctx.lineTo(offsetX + padding, height - padding);
      ctx.lineTo(offsetX + chartWidth - padding, height - padding);
      ctx.stroke();

      // Axis Labels
      ctx.fillStyle = '#333';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, offsetX + chartWidth / 2, height - 10);

      // Y-Axis Label (only for left chart)
      if (offsetX === 0) {
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Error (MSE)', 0, 0);
        ctx.restore();
      }

      // Ticks
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      // X Ticks (5 steps)
      for(let i=0; i<=5; i++) {
        const val = xMin + (xMax - xMin) * (i/5);
        const x = mapX(val);
        ctx.fillText(val.toFixed(0), x, height - padding + 12);
        // Tick mark
        ctx.beginPath();
        ctx.moveTo(x, height - padding);
        ctx.lineTo(x, height - padding + 4);
        ctx.stroke();
      }

      // Y Ticks (5 steps) - only on left axis
      if (offsetX === 0) {
          ctx.textAlign = 'right';
          for(let i=0; i<=5; i++) {
            const val = maxError * (i/5);
            const y = mapY(val);
            ctx.fillText(val.toFixed(0), padding - 5, y + 3);
             // Tick mark
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding - 4, y);
            ctx.stroke();
          }
      }

      // Plot Points (Scatter projection)
      // We plot all points up to currentStepIndex
      const limit = (currentStepIndex !== null && currentStepIndex >= 0)
        ? Math.min(currentStepIndex, history.length - 1)
        : history.length - 1;

      ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
      for (let i = 0; i <= limit; i++) {
        const point = history[i];
        const x = mapX(point[valueKey]);
        const y = mapY(point.error);
        ctx.fillRect(x, y, 2, 2);
      }

      // Highlight Current
      if (currentStepIndex !== null && currentStepIndex >= 0 && currentStepIndex < history.length) {
        const point = history[currentStepIndex];
        const cx = mapX(point[valueKey]);
        const cy = mapY(point.error);

        ctx.beginPath();
        ctx.strokeStyle = '#e74c3c';
        ctx.fillStyle = '#e74c3c';
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Tooltip
        ctx.textAlign = 'center';
        ctx.fillText(`${point[valueKey]}`, cx, cy - 8);
      }
    };

    // Draw Chart 1: Weight vs Error
    drawChart(0, 'Weight (w)', wMin, wMax, 'weight');

    // Draw Chart 2: Bias vs Error
    drawChart(chartWidth, 'Bias (b)', bMin, bMax, 'bias');

  }, [history, currentStepIndex]);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff' }}>
      <h3>Training Visualisierung (Projektionen)</h3>
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        style={{ width: '100%' }}
      />
    </div>
  );
}

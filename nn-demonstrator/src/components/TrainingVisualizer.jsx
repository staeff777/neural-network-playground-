import { useRef, useEffect } from 'preact/hooks';

export function TrainingVisualizer({ history, currentStepIndex }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !history || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Find Scales
    const maxError = Math.max(...history.map(h => h.error));
    // Min error usually 0
    // X axis is now just the index
    const totalSteps = history.length;

    const mapX = (i) => padding + (i / totalSteps) * (width - 2 * padding);
    const mapY = (e) => height - padding - (e / maxError) * (height - 2 * padding);

    // Draw Axes
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.setLineDash([]);
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Iteration (Search Step)', width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Error (MSE)', 0, 0);
    ctx.restore();

    // Draw Curve (Progressive)
    ctx.beginPath();
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;

    const limit = (currentStepIndex !== null && currentStepIndex >= 0)
      ? Math.min(currentStepIndex, history.length - 1)
      : history.length - 1;

    for (let i = 0; i <= limit; i++) {
      const point = history[i];
      const x = mapX(i);
      const y = mapY(point.error);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw Current Scan Point (if scanning)
    if (currentStepIndex !== null && currentStepIndex >= 0 && currentStepIndex < history.length) {
      const point = history[currentStepIndex];
      const cx = mapX(currentStepIndex);
      const cy = mapY(point.error);

      // Draw Guide Line to Y Axis
      ctx.beginPath();
      ctx.strokeStyle = '#e74c3c';
      ctx.setLineDash([5, 5]);
      ctx.moveTo(padding, cy);
      ctx.lineTo(cx, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Error Value on Y Axis
      ctx.fillStyle = '#e74c3c';
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(point.error.toFixed(1), padding - 5, cy + 4);

      // Draw Point
      ctx.beginPath();
      ctx.fillStyle = '#e74c3c';
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Tooltip (Simplified)
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center'; // Restore alignment for tooltip
      ctx.font = '12px sans-serif';

      // Show current params being tested
      ctx.fillText(`w: ${point.weight}, b: ${point.bias}`, cx, cy - 25);
      if (point.mae !== undefined) {
        ctx.fillText(`mean delta: ${point.mae.toFixed(1)}`, cx, cy - 10);
      }
    }

  }, [history, currentStepIndex]);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff' }}>
      <h3>Training Visualisierung (Exhaustive Search)</h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        style={{ width: '100%' }}
      />
    </div>
  );
}

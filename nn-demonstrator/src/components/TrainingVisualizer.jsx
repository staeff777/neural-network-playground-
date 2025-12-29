import { useRef, useEffect } from 'preact/hooks';

export function TrainingVisualizer({ history, currentStepIndex, isTraining, parameterLabels = [] }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !history || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // We have N parameters. (e.g., 4 weights + 1 bias = 5)
    // We want to draw N small plots side-by-side (or wrapped).
    // History point: { weights: [w1, w2...], bias: b, error: e }

    // Determine dimensions
    const sample = history[0];
    const numWeights = sample.weights ? sample.weights.length : 1; // 1 for old physics
    const numParams = numWeights + 1; // + bias

    // Grid Layout:
    // If 2 params: 2 cols.
    // If 5 params: 3 cols, 2 rows? Or just 5 cols if small?
    // Let's do a flex-like layout manually.
    const cols = numParams > 3 ? 3 : numParams;
    const rows = Math.ceil(numParams / cols);

    const chartWidth = width / cols;
    const chartHeight = height / rows;
    const padding = 30;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Global Error Max (for unified Y scale)
    const maxError = Math.max(...history.map(h => h.error));
    const mapY = (e, offsetY) => offsetY + chartHeight - padding - (e / maxError) * (chartHeight - 2 * padding);

    // Draw Function
    const drawSubChart = (pIndex, label, col, row) => {
        const offsetX = col * chartWidth;
        const offsetY = row * chartHeight;

        // Extract values for this parameter across history
        const getValue = (h) => {
            if (pIndex < numWeights) return Array.isArray(h.weights) ? h.weights[pIndex] : h.weight; // Handle generic array vs legacy prop
            return h.bias;
        };

        const values = history.map(getValue);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);

        const mapX = (val) => offsetX + padding + (val - minVal) / (maxVal - minVal || 1) * (chartWidth - 2 * padding);

        // Axes
        ctx.beginPath();
        ctx.strokeStyle = '#ddd';
        ctx.rect(offsetX + padding, offsetY + padding, chartWidth - 2*padding, chartHeight - 2*padding);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#333';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, offsetX + chartWidth / 2, offsetY + 15);

        // Plot Points
        // To avoid drawing 100k points, we rely on the history being pre-sampled by the worker/trainer if large.
        // Current index handling:
        const showAll = !isTraining && history.length > 0;
        const limit = showAll
            ? history.length - 1
            : (currentStepIndex !== null && currentStepIndex >= 0)
                ? Math.min(currentStepIndex, history.length - 1)
                : -1;

        ctx.fillStyle = 'rgba(52, 152, 219, 0.5)';
        for (let i = 0; i <= limit; i++) {
            const h = history[i];
            const cx = mapX(getValue(h));
            const cy = mapY(h.error, offsetY);
            ctx.fillRect(cx, cy, 2, 2);
        }

        // Current/Best Point
        if (limit >= 0) {
            const h = history[limit];
            const cx = mapX(getValue(h));
            const cy = mapY(h.error, offsetY);
            ctx.beginPath();
            ctx.fillStyle = '#e74c3c';
            ctx.arc(cx, cy, 4, 0, Math.PI*2);
            ctx.fill();
        }
    };

    // Render loop
    let p = 0;
    // Weights
    for(let i=0; i<numWeights; i++) {
        const c = p % cols;
        const r = Math.floor(p / cols);
        const lbl = parameterLabels[i] || `w${i+1}`;
        drawSubChart(i, lbl, c, r);
        p++;
    }
    // Bias
    const c = p % cols;
    const r = Math.floor(p / cols);
    drawSubChart(numWeights, "Bias", c, r);

  }, [history, currentStepIndex, isTraining, parameterLabels]);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={400} // Increased height for multiple rows
        style={{ width: '100%' }}
      />
    </div>
  );
}

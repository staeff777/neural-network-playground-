import { useRef, useEffect } from 'preact/hooks';

export function PositionTimeGraph({ data, groundTruth, neuralNet }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear
        ctx.clearRect(0, 0, width, height);

        if (!data || data.length === 0) {
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            ctx.fillText("No data available", width / 2, height / 2);
            return;
        }

        const padding = 40;
        const graphWidth = width - 2 * padding;
        const graphHeight = height - 2 * padding;

        // Determine Scales
        // Time (x) is usually 0 to 10 or similar. Let's find max from data.
        const xMax = Math.max(...data.map(d => d.input)) || 10;
        // Position (y)
        const yMax = Math.max(...data.map(d => d.target)) || 100;

        // Scales
        const mapX = (x) => padding + (x / xMax) * graphWidth;
        const mapY = (y) => height - padding - (y / yMax) * graphHeight;

        // Axes
        ctx.beginPath();
        ctx.strokeStyle = '#333';
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Labels
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.fillText("Time (t)", width / 2, height - 10);

        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText("Position (s)", 0, 0);
        ctx.restore();

        // Draw Points
        data.forEach(d => {
            const cx = mapX(d.input);
            const cy = mapY(d.target);

            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#2ecc71'; // Green points
            ctx.fill();
        });

        // Draw Model Curve (if exists)
        if (neuralNet) {
            ctx.beginPath();
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;

            // Draw smooth line
            for (let t = 0; t <= xMax; t += 0.1) {
                const pred = neuralNet.predict(t);
                const cx = mapX(t);
                const cy = mapY(pred);
                if (t === 0) ctx.moveTo(cx, cy);
                else ctx.lineTo(cx, cy);
            }
            ctx.stroke();
        }

    }, [data, groundTruth, neuralNet]);

    return (
        <div style={{ border: '1px solid #ccc', margin: '10px 0', borderRadius: '4px' }}>
            <canvas
                ref={canvasRef}
                width={600}
                height={300}
                style={{ width: '100%', display: 'block' }}
            />
        </div>
    );
}

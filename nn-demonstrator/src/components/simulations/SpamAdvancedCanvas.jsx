import { useRef, useEffect } from 'preact/hooks';

export function SpamAdvancedCanvas({ data, currentInput, currentPrediction }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Layout: 4 small plots
        // 1. Spam Words (Top Left)
        // 2. Caps (Top Right)
        // 3. Links (Bottom Left)
        // 4. Total Words (Bottom Right)

        const pad = 30;
        const w = (width - 3 * pad) / 2;
        const h = (height - 3 * pad) / 2;

        const plots = [
            { x: pad, y: pad, label: "Spam Worte", idx: 0, maxX: 15 },
            { x: pad + w + pad, y: pad, label: "Großbuchstaben", idx: 1, maxX: 25 },
            { x: pad, y: pad + h + pad, label: "Links", idx: 2, maxX: 8 },
            { x: pad + w + pad, y: pad + h + pad, label: "Gesamtworte", idx: 3, maxX: 100 }
        ];

        plots.forEach(plot => {
            // Draw Box
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(plot.x, plot.y, w, h);

            // Label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(plot.label, plot.x + w/2, plot.y - 5);

            // Draw Points
            data.forEach(pt => {
                const xVal = pt.input[plot.idx];
                const isSpam = pt.target === 1;

                // Map x to plot width
                const px = plot.x + (xVal / plot.maxX) * w;
                // Map target (0 or 1) to height (with some jitter to see overlap)
                // 0 is bottom, 1 is top
                const py = plot.y + h - (pt.target * (h - 20)) - 10;

                ctx.beginPath();
                ctx.arc(px, py, 3, 0, 2 * Math.PI);
                ctx.fillStyle = isSpam ? 'rgba(231, 76, 60, 0.6)' : 'rgba(46, 204, 113, 0.6)';
                ctx.fill();
            });

            // Draw Current Input if Active
            if (currentInput) {
                const xVal = currentInput[plot.idx];
                const px = plot.x + (xVal / plot.maxX) * w;
                // We don't know the target yet for current input, assume user wants to see where it falls on X
                ctx.beginPath();
                ctx.moveTo(px, plot.y);
                ctx.lineTo(px, plot.y + h);
                ctx.strokeStyle = '#3498db';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

    }, [data, currentInput, currentPrediction]);

    return (
        <div style={{ textAlign: 'center' }}>
            <canvas ref={canvasRef} width={600} height={400} style={{ border: '1px solid #eee', maxWidth: '100%' }} />
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                X-Achse: Merkmal Wert | Y-Achse: Spam (Oben) vs Kein Spam (Unten)
            </div>
        </div>
    );
}

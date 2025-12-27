import { useRef, useEffect } from 'preact/hooks';

export function SpamCanvas({ time, groundTruth, neuralNet }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Axes
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Scales
    // Word Count (X): 0 to 20
    // Probability (Y): 0 to 1
    const xMin = 0, xMax = 20;
    const yMin = 0, yMax = 1;

    const mapX = (x) => padding + (x / xMax) * graphWidth;
    const mapY = (y) => height - padding - y * graphHeight;

    // Draw Grid/Axes
    ctx.beginPath();
    ctx.strokeStyle = '#eee';
    // Horizontal lines
    for (let i = 0; i <= 4; i++) {
        const y = mapY(i * 0.25);
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
    }
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
        const x = mapX(i * 2);
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
    }
    ctx.stroke();

    // Axis Lines
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding); // Y Axis
    ctx.lineTo(width - padding, height - padding); // X Axis
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText("Anzahl 'Spam' Wörter", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Spam Wahrscheinlichkeit', 0, 0);
    ctx.restore();

    // 1. Draw Ground Truth Curve (Gray Dashed)
    const drawCurve = (model, color, dash = []) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.lineWidth = 2;
      for (let x = xMin; x <= xMax; x += 0.5) {
        let y = 0;
        if (typeof model.getProbability === 'function') {
            y = model.getProbability(x);
        } else if (typeof model.predict === 'function') {
            y = model.predict(x);
        }

        const px = mapX(x);
        const py = mapY(y);
        if (x === xMin) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawCurve(groundTruth, '#ccc', [5, 5]); // Ground Truth (Gray/Ghost)
    drawCurve(neuralNet, '#e74c3c'); // Model (Red)

    // 2. Draw Simulation "State" (Points appearing over time)
    // Time represents approximate seconds. Let's say 2 points per second.
    // Total batch size: 50.
    const speed = 2; // points per unit of time
    const count = Math.floor(time * speed);
    const totalPoints = 50;

    // Pseudo-random generator for consistent data points
    const pseudoRand = (seed) => {
        const x = Math.sin(seed * 123.456) * 10000;
        return x - Math.floor(x);
    };

    const pointsToShow = Math.min(count, totalPoints);

    for (let i = 0; i < pointsToShow; i++) {
        // Generate consistent data for index i
        // 1. Word Count (0-20)
        // Use i as seed
        const r1 = pseudoRand(i + 1);
        const wordCount = Math.floor(r1 * 21); // 0 to 20

        // 2. Is Spam? (Based on Ground Truth + Noise?)
        // To be consistent with the "Training Data" generation, we should use the ground truth logic
        // But here we want visual points.
        // Let's rely on groundTruth.classify which might be probabilistic.
        // We need it to be deterministic for the SAME index i, so we must mock the randomness inside classify if possible,
        // or just implement the classification here using a seeded random.

        const prob = groundTruth.getProbability(wordCount);
        // Use a second random seed for the label decision to keep it stable
        const r2 = pseudoRand(i + 999);
        const isSpam = r2 < prob ? 1 : 0;

        const cx = mapX(wordCount);
        const cy = mapY(isSpam);

        // Draw Point
        ctx.beginPath();
        // Visual Jitter to avoid perfect overlap?
        // Add slight random offset to x and y for visualization only
        const jitterX = (pseudoRand(i + 333) - 0.5) * 10;
        const jitterY = (pseudoRand(i + 444) - 0.5) * 10;

        ctx.arc(cx + jitterX, cy + jitterY, 5, 0, Math.PI * 2);

        // Color based on Label (Green = Safe/Ham, Red = Spam)
        // But usually Spam=1, Ham=0.
        // User convention: Spam (1) is Red? Ham (0) is Green?
        ctx.fillStyle = isSpam ? '#e74c3c' : '#2ecc71';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }

    // Highlight the *latest* point with extra info
    if (pointsToShow > 0 && pointsToShow <= totalPoints) {
         const i = pointsToShow - 1;
         // Recalculate for the last point to draw label
         const r1 = pseudoRand(i + 1);
         const wordCount = Math.floor(r1 * 21);
         const prob = groundTruth.getProbability(wordCount);
         const r2 = pseudoRand(i + 999);
         const isSpam = r2 < prob ? 1 : 0;
         const jitterX = (pseudoRand(i + 333) - 0.5) * 10;
         const jitterY = (pseudoRand(i + 444) - 0.5) * 10;

         const cx = mapX(wordCount) + jitterX;
         const cy = mapY(isSpam) + jitterY;

         // Highlight circle
         ctx.beginPath();
         ctx.arc(cx, cy, 8, 0, Math.PI*2);
         ctx.strokeStyle = '#333';
         ctx.stroke();

         // Label
         ctx.fillStyle = '#333';
         ctx.font = '10px sans-serif';
         ctx.fillText(`${wordCount}`, cx, cy - 12);
    }

  }, [time, groundTruth, neuralNet]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        style={{ width: '100%', border: '1px solid #ccc', background: '#fff' }}
      />
    </div>
  );
}

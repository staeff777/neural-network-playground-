import { useRef, useEffect } from 'preact/hooks';

export function SpamCanvas({ time, groundTruth, neuralNet, data, staticMode = false, showModel = true, showGroundTruth = true }) {
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

    // 1. Draw Curves
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

    if (showGroundTruth && groundTruth) {
      drawCurve(groundTruth, '#ccc', [5, 5]); // Ground Truth (Gray/Ghost)
    }

    if (showModel && neuralNet) {
      drawCurve(neuralNet, '#e74c3c'); // Model (Red)
    }

    // 2. Draw Points
    // Static Mode: Draw from data prop
    if (staticMode && data) {
      data.forEach(d => {
        const cx = mapX(d.input);
        const cy = mapY(d.target); // 0 or 1

        // Prediction Halo
        let predColor = null;
        if (neuralNet && showModel) {
          try {
            // Determine prediction details
            const prediction = neuralNet.predict(d.input);
            // Classification logic: >0.5 is Spam (1), else Ham (0)
            const isSpamPred = prediction > 0.5;
            // Prediction Color: Red for Spam, Green for Ham
            predColor = isSpamPred ? '#e74c3c' : '#2ecc71';
          } catch (e) {
            // If model not ready or error, skip halo
          }
        }

        ctx.beginPath();
        // Jitter for visibility
        const jitterX = (Math.sin(d.input * 123) * 5);
        const jitterY = (Math.cos(d.input * 321) * 5);

        // Draw Halo if prediction exists
        if (predColor) {
          ctx.arc(cx + jitterX, cy + jitterY, 8, 0, Math.PI * 2); // Larger radius
          ctx.strokeStyle = predColor;
          ctx.lineWidth = 2; // Thicker line
          ctx.stroke();
          // Start new path for inner fill
          ctx.beginPath();
        }

        ctx.arc(cx + jitterX, cy + jitterY, 5, 0, Math.PI * 2);
        ctx.fillStyle = d.target === 1 ? '#e74c3c' : '#2ecc71';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      return; // Done for static mode
    }

    // Dynamic Mode (Simulation)
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

      const prob = groundTruth ? groundTruth.getProbability(wordCount) : 0;
      // Use a second random seed for the label decision to keep it stable
      const r2 = pseudoRand(i + 999);
      const isSpam = r2 < prob ? 1 : 0;

      const cx = mapX(wordCount);
      const cy = mapY(isSpam);

      // Prediction Halo
      let predColor = null;
      if (neuralNet && showModel) {
        try {
          const prediction = neuralNet.predict(wordCount);
          const isSpamPred = prediction > 0.5;
          predColor = isSpamPred ? '#e74c3c' : '#2ecc71';
        } catch (e) { }
      }

      // Draw Point
      ctx.beginPath();
      // Visual Jitter to avoid perfect overlap?
      // Add slight random offset to x and y for visualization only
      const jitterX = (pseudoRand(i + 333) - 0.5) * 10;
      const jitterY = (pseudoRand(i + 444) - 0.5) * 10;

      // Draw Halo
      if (predColor) {
        ctx.arc(cx + jitterX, cy + jitterY, 8, 0, Math.PI * 2);
        ctx.strokeStyle = predColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
      }

      ctx.arc(cx + jitterX, cy + jitterY, 5, 0, Math.PI * 2);

      // Color based on Label (Green = Safe/Ham, Red = Spam)
      // But usually Spam=1, Ham=0.
      // User convention: Spam (1) is Red? Ham (0) is Green?
      ctx.fillStyle = isSpam ? '#e74c3c' : '#2ecc71';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
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
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1; // Default
      ctx.stroke();

      // Label
      ctx.fillStyle = '#333';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${wordCount}`, cx, cy - 12);
    }

  }, [time, groundTruth, neuralNet, data, staticMode, showModel, showGroundTruth]);

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

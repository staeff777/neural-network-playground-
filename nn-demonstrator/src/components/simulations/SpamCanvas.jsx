import { useRef, useEffect } from 'preact/hooks';

export function SpamCanvas({ time, groundTruth, neuralNet }) { // 'time' here represents 'simulation step' or index if iterating
  // For Spam simulation, "Running" might mean "Visualizing incoming emails one by one".
  // Or it could just show the static curve and points.
  // The user asked for "Inbox" view vs "Sigmoid Graph". We agreed on Sigmoid Graph.

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

    // 1. Draw Ground Truth Curve (Green Dashed?) - Optional, maybe just show Neural Net curve
    // User wants to compare "Ground Truth" vs "Model".
    // Physics sim shows Ground Truth Ball (Ghost) vs Model Ball.
    // Here we can show Ground Truth Curve vs Model Curve.

    const drawCurve = (model, color, dash = []) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.lineWidth = 2;
      for (let x = xMin; x <= xMax; x += 0.5) {
        // We need to access sigmoid logic.
        // If 'model' is GroundTruth, it has .getProbability or .sigmoid
        // If 'model' is NeuralNet, it has .predict
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

    // 2. Draw Simulation "State"
    // In Physics: Ball moves.
    // In Spam: Maybe we flash random points?
    // "handleRun" sets time 0..infinity.
    // We can simulate emails arriving.

    // We can use 'time' to animate a point appearing.
    // Let's generate a pseudo-random point based on time to show "checking".
    // Or just nothing if we only want static analysis.
    // The user asked for "Simulation".

    // Let's show a "Current Email" being evaluated.
    // We use Math.sin(time) or just noise to pick a random X.
    if (time > 0) {
        // Use time to seed/move a cursor?
        // Let's just pick a random email based on the integer part of time (simulation step)
        // If time is float, we can stabilize it.
        const currentMsgId = Math.floor(time);
        // Simple pseudo-random based on ID
        const pseudoRand = (seed) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const wordCount = Math.floor(pseudoRand(currentMsgId) * 20); // 0-20 words
        const isSpam = groundTruth.classify(wordCount); // 0 or 1

        const modelProb = neuralNet.predict(wordCount);
        const prediction = modelProb > 0.5 ? 1 : 0;

        // Draw the point
        const cx = mapX(wordCount);
        const cy = mapY(isSpam); // It's either 0 or 1

        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fillStyle = isSpam ? '#e74c3c' : '#2ecc71'; // Red for Spam, Green for Ham
        ctx.fill();
        ctx.stroke();

        // Draw line to curve
        const curveY = mapY(modelProb);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx, curveY);
        ctx.strokeStyle = '#aaa';
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.fillStyle = '#333';
        ctx.fillText(`${wordCount} Wörter`, cx, cy + (isSpam ? -15 : 15));
        ctx.fillText(prediction === isSpam ? "Korrekt" : "Falsch", cx, cy + (isSpam ? -28 : 28));
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

import { useRef, useEffect } from 'preact/hooks';

export function SimulationCanvas({ time, groundTruth, neuralNet, maxDistance = 300 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const paddingX = 50;
    const trackWidth = width - 2 * paddingX;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Positions
    const posGT = groundTruth.getPosition(time);
    const posNN = neuralNet.predict(time);

    // Scaling
    const xGT = paddingX + ((posGT % maxDistance) / maxDistance * trackWidth);
    const xNN = paddingX + ((posNN % maxDistance) / maxDistance * trackWidth);

    // Draw Tracks
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height / 2); // Top track
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, height / 2, width, height / 2); // Bottom track

    // Draw Lane markers
    ctx.beginPath();
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([20, 20]);
    ctx.moveTo(0, height / 4);
    ctx.lineTo(width, height / 4);
    ctx.moveTo(0, height * 3 / 4);
    ctx.lineTo(width, height * 3 / 4);
    ctx.stroke();

    // Draw Start/Finish lines (visual aid for wrapping)
    ctx.beginPath();
    ctx.strokeStyle = '#ccc';
    ctx.setLineDash([]); // solid
    ctx.moveTo(paddingX, 0);
    ctx.lineTo(paddingX, height);
    ctx.moveTo(width - paddingX, 0);
    ctx.lineTo(width - paddingX, height);
    ctx.stroke();

    // Draw Cars
    drawCar(ctx, xGT, height / 4, '#2ecc71', 'Ground Truth');
    drawCar(ctx, xNN, height * 3 / 4, '#e74c3c', 'Neural Net');

    // Draw Info Overlay
    ctx.fillStyle = '#333';
    ctx.font = '14px monospace';
    ctx.fillText(`Zeit: ${time.toFixed(1)}s`, 10, 20);
    ctx.fillText(`Pos GT: ${posGT.toFixed(1)}m`, 10, 40);
    ctx.fillText(`Pos NN: ${posNN.toFixed(1)}m`, 10, height / 2 + 40);

  }, [time, groundTruth, neuralNet, maxDistance]);

  function drawCar(ctx, x, y, color, label) {
    ctx.save();
    ctx.translate(x, y);

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(-20, -10, 40, 20);

    // Wheels
    ctx.fillStyle = '#000';
    ctx.fillRect(-15, -15, 10, 5); // FL
    ctx.fillRect(5, -15, 10, 5);  // FR
    ctx.fillRect(-15, 10, 10, 5);  // BL
    ctx.fillRect(5, 10, 10, 5);   // BR

    // Label
    ctx.fillStyle = '#000';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, 0, -20);

    ctx.restore();
  }

  return (
    <div style={{ border: '2px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        style={{ width: '100%', display: 'block' }}
      />
    </div>
  );
}

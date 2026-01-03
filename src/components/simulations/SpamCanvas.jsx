import { useRef, useEffect, useState } from 'preact/hooks';
import { getNiceTicks } from '../../utils/graphUtils';

export function SpamCanvas({ time, groundTruth, neuralNet, data, staticMode = false, showModel = true, showGroundTruth = true }) {
  const canvasRef = useRef(null);
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [hoverInfo, setHoverInfo] = useState(null);

  // Points rendered in the current frame (screen coordinates)
  const drawnPoints = useRef([]);

  // Event Handlers for Zoom/Pan
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const oldK = transform.k;
    let newK = oldK * (1 + delta);

    // Limits
    newK = Math.max(0.5, Math.min(newK, 10));

    // Zoom towards mouse pointer
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    // Calculate mouse position relative to graph origin (excluding padding)
    const padding = 40;
    // Current Graph Coords under mouse
    const graphValX = (mx - padding - transform.x) / oldK;
    const graphValY = (my - (300 - padding) - transform.y) / oldK; // height is 300

    // Calculate new translation to keep the point under mouse fixed
    const newTx = mx - padding - graphValX * newK;
    const newTy = my - (300 - padding) - graphValY * newK;

    setTransform({ k: newK, x: newTx, y: newTy });
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (isDragging) {
      const dx = (e.clientX - lastMouse.current.x) * scaleX;
      const dy = (e.clientY - lastMouse.current.y) * scaleY;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setHoverInfo(null);
    } else {
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      // Check drawn points
      // Iterate in reverse to find topmost (painter's algo)
      let found = null;
      let minDist = 15; // Hit radius
      const points = drawnPoints.current;
      for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        const dist = Math.sqrt(Math.pow(p.x - mx, 2) + Math.pow(p.y - my, 2));
        if (dist < minDist) {
          minDist = dist;
          found = p.info;
        }
      }
      setHoverInfo(found);
    }
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverInfo(null);
  };

  const lastClickRef = useRef(0);
  const handleClick = () => {
    const now = Date.now();
    if (now - lastClickRef.current < 300) {
      setHoverInfo(null);
    }
    lastClickRef.current = now;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);
    drawnPoints.current = []; // Reset tracked points

    // Axes Layout
    const padding = 40;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;

    // Fixed Domains
    const xMinGlobal = 0, xMaxGlobal = 20;
    const yMinGlobal = 0, yMaxGlobal = 1;

    // Mapping Functions with Transform
    const mapX = (x) => padding + (x / xMaxGlobal) * graphWidth * transform.k + transform.x;
    const mapY = (y) => (height - padding) - (y / yMaxGlobal) * graphHeight * transform.k + transform.y;

    // --- Draw Axes & Grid ---
    const getInvX = (sx) => ((sx - padding - transform.x) / (graphWidth * transform.k)) * xMaxGlobal;
    const getInvY = (sy) => -((sy - (height - padding) - transform.y) / (graphHeight * transform.k)) * yMaxGlobal; // Negate because Y goes up

    const visXMin = getInvX(padding);
    const visXMax = getInvX(width - padding);
    const visYMin = getInvY(height - padding);
    const visYMax = getInvY(padding); // Top of graph is smaller sy

    // Ticks
    const xTicks = getNiceTicks(visXMin, visXMax, 10);
    const yTicks = getNiceTicks(visYMin, visYMax, 5);

    ctx.beginPath();
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;

    // Grid & Ticks X
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px sans-serif';

    xTicks.forEach(val => {
      const x = mapX(val);
      if (x < padding || x > width - padding) return; // Clip locally
      // Grid line
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      // TIck Label
      ctx.fillText(Number(val.toFixed(2)), x, height - padding + 5);
    });

    // Grid & Ticks Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    yTicks.forEach(val => {
      const y = mapY(val);
      if (y < padding || y > height - padding) return;
      // Grid line
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      // Tick Label
      ctx.fillText(Number(val.toFixed(2)), padding - 5, y);
    });
    ctx.stroke();

    // Axis Lines (The Box)
    ctx.beginPath();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.rect(padding, padding, graphWidth, graphHeight);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText("Anzahl 'Spam' Wörter", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Spam Wahrscheinlichkeit', 0, 0);
    ctx.restore();

    // --- Content Clipping ---
    ctx.save();
    ctx.beginPath();
    ctx.rect(padding, padding, graphWidth, graphHeight);
    ctx.clip();

    // 1. Draw Curves
    const drawCurve = (model, color, dash = []) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.lineWidth = 2;

      const drawMin = Math.max(xMinGlobal, visXMin);
      const drawMax = Math.min(xMaxGlobal, visXMax);

      if (drawMax < drawMin) return; // Offscreen

      // Resolution optimization
      const step = (drawMax - drawMin) / 100;
      const safeStep = Math.max(step, 0.05); // Don't go too granular

      let started = false;
      for (let x = drawMin; x <= drawMax + safeStep; x += safeStep) {
        const safeX = Math.min(Math.max(x, xMinGlobal), xMaxGlobal);

        let y = 0;
        if (typeof model.getProbability === 'function') {
          y = model.getProbability(safeX);
        } else if (typeof model.predict === 'function') {
          y = model.predict(safeX);
        }

        const px = mapX(safeX);
        const py = mapY(y);

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    if (showGroundTruth && groundTruth) {
      drawCurve(groundTruth, '#ccc', [5, 5]);
    }

    if (showModel && neuralNet) {
      drawCurve(neuralNet, '#e74c3c');
    }

    // 2. Draw Points
    // Static Mode
    if (staticMode && data) {
      data.forEach(d => {
        // Simple culling
        if (d.input < visXMin - 5 || d.input > visXMax + 5) return;

        const cx = mapX(d.input);
        const cy = mapY(d.target);

        // Record for hover
        drawnPoints.current.push({
          x: cx, y: cy,
          info: { x: cx, y: cy, input: d.input, target: d.target }
        });

        let predColor = null;
        if (neuralNet && showModel) {
          try {
            const prediction = neuralNet.predict(d.input);
            predColor = prediction > 0.5 ? '#e74c3c' : '#2ecc71';
          } catch (e) { }
        }

        const jitterX = (Math.sin(d.input * 123) * 5);
        const jitterY = (Math.cos(d.input * 321) * 5);

        if (predColor) {
          ctx.beginPath();
          ctx.arc(cx + jitterX, cy + jitterY, 8, 0, Math.PI * 2);
          ctx.strokeStyle = predColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(cx + jitterX, cy + jitterY, 5, 0, Math.PI * 2);
        ctx.fillStyle = d.target === 1 ? '#e74c3c' : '#2ecc71';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
    // Dynamic Mode
    else if (!staticMode) {
      const speed = 2;
      const count = Math.floor(time * speed);
      const totalPoints = 50;
      const pseudoRand = (seed) => {
        const x = Math.sin(seed * 123.456) * 10000;
        return x - Math.floor(x);
      };
      const pointsToShow = Math.min(count, totalPoints);

      for (let i = 0; i < pointsToShow; i++) {
        const r1 = pseudoRand(i + 1);
        const wordCount = Math.floor(r1 * 21);
        const prob = groundTruth ? groundTruth.getProbability(wordCount) : 0;
        const isSpam = pseudoRand(i + 999) < prob ? 1 : 0;

        if (wordCount < visXMin - 5 || wordCount > visXMax + 5) continue;

        const cx = mapX(wordCount);
        const cy = mapY(isSpam);

        let predColor = null;
        if (neuralNet && showModel) {
          try {
            const prediction = neuralNet.predict(wordCount);
            predColor = prediction > 0.5 ? '#e74c3c' : '#2ecc71';
          } catch (e) { }
        }

        const jitterX = (pseudoRand(i + 333) - 0.5) * 10;
        const jitterY = (pseudoRand(i + 444) - 0.5) * 10;

        // Record for hover
        const finalX = cx + jitterX;
        const finalY = cy + jitterY;
        drawnPoints.current.push({
          x: finalX, y: finalY,
          info: { x: finalX, y: finalY, input: wordCount, target: isSpam }
        });

        if (predColor) {
          ctx.beginPath();
          ctx.arc(finalX, finalY, 8, 0, Math.PI * 2);
          ctx.strokeStyle = predColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(finalX, finalY, 5, 0, Math.PI * 2);
        ctx.fillStyle = isSpam ? '#e74c3c' : '#2ecc71';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Highlight latest
      if (pointsToShow > 0 && pointsToShow <= totalPoints) {
        const i = pointsToShow - 1;
        const r1 = pseudoRand(i + 1);
        const wordCount = Math.floor(r1 * 21);
        const prob = groundTruth.getProbability(wordCount);
        const isSpam = pseudoRand(i + 999) < prob ? 1 : 0;
        const jitterX = (pseudoRand(i + 333) - 0.5) * 10;
        const jitterY = (pseudoRand(i + 444) - 0.5) * 10;

        const cx = mapX(wordCount) + jitterX;
        const cy = mapY(isSpam) + jitterY;

        // Check visibility
        if (cx > padding && cx < width - padding && cy > padding && cy < height - padding) {
          ctx.beginPath();
          ctx.arc(cx, cy, 8, 0, Math.PI * 2);
          ctx.strokeStyle = '#333';
          ctx.stroke();

          ctx.fillStyle = '#333';
          ctx.font = '10px sans-serif';
          ctx.fillText(`${wordCount}`, cx, cy - 12);
        }
      }
    }

    ctx.restore(); // End Clip

    // Draw Tooltip (Outside Clip)
    if (hoverInfo) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.strokeStyle = '#fff';

      const labelText = hoverInfo.target === 1 ? 'SPAM' : 'HAM';
      const wordsText = `Words: ${hoverInfo.input}`;

      const tw = 100;
      const th = 40;
      let tx = hoverInfo.x + 10;
      let ty = hoverInfo.y - 10;

      // Boundary check
      if (tx + tw > width) tx = hoverInfo.x - tw - 10;
      if (ty + th > height) ty = hoverInfo.y - th - 10;
      if (ty < 0) ty = hoverInfo.y + 10;

      ctx.beginPath();
      ctx.roundRect(tx, ty, tw, th, 4);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';

      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = hoverInfo.target === 1 ? '#e74c3c' : '#2ecc71';
      ctx.fillText(labelText, tx + 8, ty + 6);

      ctx.fillStyle = '#ddd';
      ctx.font = '10px sans-serif';
      ctx.fillText(wordsText, tx + 8, ty + 20);

      ctx.restore();
    }

  }, [time, groundTruth, neuralNet, data, staticMode, showModel, showGroundTruth, transform, hoverInfo]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        style={{ width: '100%', border: '1px solid #ccc', background: '#fff', cursor: hoverInfo ? 'pointer' : (isDragging ? 'grabbing' : 'grab') }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    </div>
  );
}

import { useRef, useEffect, useState } from 'preact/hooks';

const FEATURES = [
    { label: "Spam Words", idx: 0, max: 15 },
    { label: "Großbuchstaben", idx: 1, max: 25 },
    { label: "Links", idx: 2, max: 8 },
    { label: "Gesamtworte", idx: 3, max: 100 }
];

export function SpamAdvancedCanvas({
    data,
    currentInput,
    currentPrediction,
    neuralNet,
    allowedModes = ['features', 'scatter', '3d', 'text'],
    hideControls = false,
    showModel = true,
    additionalControls = null
}) {
    const canvasRef = useRef(null);
    // Initialize viewMode to the first allowed mode
    const [viewMode, setViewMode] = useState(allowedModes[0]);

    // Sync viewMode if allowedModes changes and current is invalid
    useEffect(() => {
        if (!allowedModes.includes(viewMode)) {
            setViewMode(allowedModes[0]);
        }
    }, [allowedModes]);

    // Axes Selection
    const [xAxis, setXAxis] = useState(0); // Default: Spam Words
    const [yAxis, setYAxis] = useState(3); // Default: Total Words
    const [zAxis, setZAxis] = useState(2); // Default: Links (for 3D)

    // 3D Rotation State
    const [rotation, setRotation] = useState({ x: -0.5, y: 0.5 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    // State for Tooltip
    const [hoverInfo, setHoverInfo] = useState(null);

    const handleMouseDown = (e) => {
        if (viewMode !== '3d') return;
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        // Existing 3D rotation logic
        if (isDragging.current && viewMode === '3d') {
            const deltaX = e.clientX - lastMouse.current.x;
            const deltaY = e.clientY - lastMouse.current.y;

            setRotation(prev => ({
                x: prev.x + deltaY * 0.01,
                y: prev.y + deltaX * 0.01
            }));

            lastMouse.current = { x: e.clientX, y: e.clientY };
            return; // Exit if dragging in 3D
        }

        // New tooltip logic for scatter plot
        if (viewMode === 'scatter') {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;

            let found = null;
            const hitRadius = 10; // Radius for hit detection

            const padding = 50;
            const plotW = canvas.width - 2 * padding;
            const plotH = canvas.height - 2 * padding;
            const originX = padding;
            const originY = canvas.height - padding;
            const xMax = FEATURES[xAxis].max;
            const yMax = FEATURES[yAxis].max;

            if (data) {
                for (const pt of data) {
                    const x = originX + (pt.input[xAxis] / xMax) * plotW;
                    const y = originY - (pt.input[yAxis] / yMax) * plotH;

                    const dist = Math.sqrt((x - mx) ** 2 + (y - my) ** 2);
                    if (dist < hitRadius) {
                        found = { x, y, text: pt.text, isSpam: pt.target === 1 };
                        break;
                    }
                }
            }
            setHoverInfo(found);
        } else {
            // If not in scatter mode and not dragging in 3D, clear hover info
            setHoverInfo(null);
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseOut = () => {
        setHoverInfo(null); // Clear tooltip when mouse leaves canvas
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height); // dynamic input needs clear background

        // --- 3D PLOT MODE ---
        // Helper to find max value in data for a feature index
        const getDataMax = (idx) => {
            if (!data || data.length === 0) return FEATURES[idx].max;
            const max = Math.max(...data.map(d => d.input[idx]));
            return max > 0 ? max : FEATURES[idx].max; // Prevent 0 div
        };

        if (viewMode === '3d') {
            const xMax = getDataMax(xAxis);
            const yMax = getDataMax(yAxis);
            const zMax = getDataMax(zAxis);

            const cx = width / 2;
            const cy = height / 2;
            const size = 150; // Cube half-size

            // Projection Helper
            const project = (x, y, z) => {
                // Rotate Y
                let x1 = x * Math.cos(rotation.y) - z * Math.sin(rotation.y);
                let z1 = x * Math.sin(rotation.y) + z * Math.cos(rotation.y);

                // Rotate X
                let y1 = y * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
                let z2 = y * Math.sin(rotation.x) + z1 * Math.cos(rotation.x);

                // Perspective
                const scale = 400 / (400 - z2);
                return {
                    x: cx + x1 * scale,
                    y: cy + y1 * scale,
                    z: z2
                };
            };

            // Draw Cube Axis
            const corners = [
                [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
            ];
            const projCorners = corners.map(c => project(c[0] * size, c[1] * size, c[2] * size));

            // Axis Colors
            const colX = '#e29301ff'; // Dark Red
            const colY = '#2980b9'; // Dark Blue
            const colZ = '#c00798ff'; // Dark Orange

            // Draw Cube Edges (Axis-aligned coloring)
            const drawEdges = (indices, color) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                indices.forEach(([s, e]) => {
                    ctx.moveTo(projCorners[s].x, projCorners[s].y);
                    ctx.lineTo(projCorners[e].x, projCorners[e].y);
                });
                ctx.stroke();
            };

            // Indices based on corners array order:
            // 0:[-1,-1,-1], 1:[1,-1,-1], 2:[1,1,-1], 3:[-1,1,-1] (Back Face Z=-1)
            // 4:[-1,-1,1], 5:[1,-1,1], 6:[1,1,1], 7:[-1,1,1] (Front Face Z=1)

            // X-Edges (moving along X, indices 0-1, 3-2, 4-5, 7-6)
            drawEdges([[0, 1], [3, 2], [4, 5], [7, 6]], colX);

            // Y-Edges (moving along Y, indices 0-3, 1-2, 4-7, 5-6)
            drawEdges([[0, 3], [1, 2], [4, 7], [5, 6]], colY);

            // Z-Edges (connecting back to front, 0-4, 1-5, 2-6, 3-7)
            drawEdges([[0, 4], [1, 5], [2, 6], [3, 7]], colZ);

            // Draw Axis Labels
            ctx.font = 'bold 11px sans-serif';

            ctx.fillStyle = colX;
            ctx.fillText("X: " + FEATURES[xAxis].label, projCorners[1].x, projCorners[1].y);

            ctx.fillStyle = colY;
            ctx.fillText("Y: " + FEATURES[yAxis].label, projCorners[3].x, projCorners[3].y);

            ctx.fillStyle = colZ;
            ctx.fillText("Z: " + FEATURES[zAxis].label, projCorners[4].x, projCorners[4].y);

            // Draw Points
            const pointsToDraw = [];

            // Helper to normalize data -1 to 1 based on dynamic max
            const norm = (val, max) => (val / max) * 2 - 1;

            // --- DRAW DECISION PLANE (3D) ---
            if (showModel && neuralNet && neuralNet.weights) {
                const wX = neuralNet.weights[xAxis] || 0;
                const wY = neuralNet.weights[yAxis] || 0;
                const wZ = neuralNet.weights[zAxis] || 0;
                const b = neuralNet.bias || 0;

                // Equation: wX*x + wY*y + wZ*z + b = 0 => z = -(wX*x + wY*y + b) / wZ

                if (Math.abs(wZ) > 0.001) {
                    // Draw a grid on the plane
                    ctx.strokeStyle = 'rgba(142, 68, 173, 0.3)'; // Semi-transparent Purple
                    ctx.lineWidth = 1;

                    const getZ = (vx, vy) => {
                        const rx = (vx + 1) / 2 * xMax;
                        const ry = (vy + 1) / 2 * yMax;
                        const rz = (-wX * rx - wY * ry - b) / wZ;
                        return norm(rz, zMax);
                    };

                    const drawPlaneLine = (p1, p2) => {
                        if (Math.abs(p1.z) <= 3 && Math.abs(p2.z) <= 3) {
                            const pp1 = project(p1.x * size, -p1.y * size, p1.z * size);
                            const pp2 = project(p2.x * size, -p2.y * size, p2.z * size);
                            ctx.beginPath();
                            ctx.moveTo(pp1.x, pp1.y);
                            ctx.lineTo(pp2.x, pp2.y);
                            ctx.stroke();
                        }
                    };

                    const steps = 6;
                    // Grid Lines along X
                    for (let i = 0; i <= steps; i++) {
                        const vy = -1 + (i / steps) * 2;
                        const z1 = getZ(-1, vy);
                        const z2 = getZ(1, vy);
                        drawPlaneLine({ x: -1, y: vy, z: z1 }, { x: 1, y: vy, z: z2 });
                    }

                    // Grid Lines along Y
                    for (let i = 0; i <= steps; i++) {
                        const vx = -1 + (i / steps) * 2;
                        const z1 = getZ(vx, -1);
                        const z2 = getZ(vx, 1);
                        drawPlaneLine({ x: vx, y: -1, z: z1 }, { x: vx, y: 1, z: z2 });
                    }
                }
            }

            if (data) {
                data.forEach(pt => {
                    const vx = norm(pt.input[xAxis], xMax);
                    const vy = -norm(pt.input[yAxis], yMax); // Y inverted in canvas
                    const vz = norm(pt.input[zAxis], zMax); // Z depth

                    const proj = project(vx * size, vy * size, vz * size);

                    // Predict for Halo
                    let haloColor = null;
                    if (neuralNet && showModel) {
                        try {
                            const pred = neuralNet.predict(pt.input);
                            haloColor = pred > 0.5 ? '#e74c3c' : '#2ecc71';
                        } catch (e) { }
                    }

                    pointsToDraw.push({
                        ...proj,
                        color: pt.target === 1 ? '#e74c3c' : '#2ecc71',
                        radius: 3,
                        haloColor
                    });
                });
            }


            // Sort by depth (Painter's algo)
            pointsToDraw.sort((a, b) => a.z - b.z);

            pointsToDraw.forEach(p => {
                // Background Halo
                if (p.haloColor) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius + 2, 0, Math.PI * 2);
                    ctx.strokeStyle = p.haloColor;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                if (p.border) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            return;
        }

        // --- SCATTER PLOT MODE (2D) ---
        if (viewMode === 'scatter') {
            const xMax = getDataMax(xAxis);
            const yMax = getDataMax(yAxis);

            const padding = 50;
            const plotW = width - 2 * padding;
            const plotH = height - 2 * padding;
            const originX = padding;
            const originY = height - padding;

            const colX = '#c0392b';
            const colY = '#2980b9';

            // Axes
            ctx.lineWidth = 2;

            // X Axis
            ctx.beginPath();
            ctx.strokeStyle = colX;
            ctx.moveTo(originX, originY);
            ctx.lineTo(originX + plotW, originY);
            ctx.stroke();

            // Y Axis
            ctx.beginPath();
            ctx.strokeStyle = colY;
            ctx.moveTo(originX, originY);
            ctx.lineTo(originX, originY - plotH);
            ctx.stroke();

            // Labels with Max Values
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px sans-serif';

            ctx.fillStyle = colX;
            ctx.fillText(`${FEATURES[xAxis].label} (max: ${xMax})`, originX + plotW / 2, originY + 35);

            ctx.save();
            ctx.translate(15, originY - plotH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = colY;
            ctx.fillText(`${FEATURES[yAxis].label} (max: ${yMax})`, 0, 0);
            ctx.restore();

            const drawPoint = (input, color, radius, stroke, haloColor) => {
                const xVal = input[xAxis];
                const yVal = input[yAxis];

                const x = originX + (xVal / xMax) * plotW;
                const y = originY - (yVal / yMax) * plotH;

                if (haloColor) {
                    ctx.beginPath();
                    ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
                    ctx.strokeStyle = haloColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.fillStyle = color;
                ctx.fill();
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            };

            // Draw Data
            if (data) {
                data.forEach(pt => {
                    let haloColor = null;
                    if (neuralNet && showModel) {
                        try {
                            const pred = neuralNet.predict(pt.input);
                            haloColor = pred > 0.5 ? '#e74c3c' : '#2ecc71';
                        } catch (e) { }
                    }
                    drawPoint(pt.input, pt.target === 1 ? '#e74c3c' : '#2ecc71', 5, '#fff', haloColor);
                });
            }

            // --- DRAW DECISION LINE (2D) ---
            // Equation: wX*x + wY*y + b = 0  => y = (-wX*x - b) / wY
            if (showModel && neuralNet) {
                let weights = neuralNet.weights;
                const bias = neuralNet.bias || 0;

                // Handle legacy structure if needed, but spam_advanced uses .weights array
                if (weights) {
                    const wX = weights[xAxis] || 0;
                    const wY = weights[yAxis] || 0;
                    const b = bias;

                    // We need to find two points on the edges of the plot to draw the line.
                    // The plot shows x from 0 to xMax, y from 0 to yMax.
                    // We'll calculate y for x=0 and x=xMax.

                    // Helper to get pixel coordinates
                    const toPix = (xVal, yVal) => {
                        const px = originX + (xVal / xMax) * plotW;
                        const py = originY - (yVal / yMax) * plotH;
                        return { x: px, y: py };
                    };

                    ctx.beginPath();
                    ctx.strokeStyle = '#c0392b'; // Same red as Spam usually, or maybe purple? Let's use darker gray or specific style
                    ctx.strokeStyle = 'rgba(142, 68, 173, 0.8)'; // Purple
                    ctx.lineWidth = 2;
                    ctx.setLineDash([10, 5]);

                    // Case A: Not vertical
                    if (Math.abs(wY) > 0.001) {
                        const f = (x) => (-wX * x - b) / wY;

                        const p1 = toPix(0, f(0));
                        const p2 = toPix(xMax, f(xMax));

                        // Note: We don't strictly clip to box here for simplicity, canvas clipping handles it effectively 
                        // if we just draw long lines, BUT we want it to look nice.
                        // Let's rely on Start/End points at x=0 and x=xMax.

                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                    // Case B: Vertical Line (wY is 0) => wX*x + b = 0 => x = -b/wX
                    else if (Math.abs(wX) > 0.001) {
                        const xVal = -b / wX;
                        const p1 = toPix(xVal, 0);
                        const p2 = toPix(xVal, yMax);
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }

                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Draw Equation Label
                    ctx.fillStyle = 'rgba(142, 68, 173, 1)';
                    ctx.font = 'bold 12px monospace';
                    ctx.textAlign = 'left';
                    const eq = `${wX.toFixed(2)}x + ${wY.toFixed(2)}y + ${b.toFixed(2)} = 0`;
                    ctx.fillText(eq, originX + 10, originY - plotH - 5);
                }
            }

            // Draw Current
            if (currentInput) {
                drawPoint(currentInput, '#3498db', 8, '#2980b9');
            }

            // Info Text
            ctx.fillStyle = '#666';
            ctx.textAlign = 'right';
            ctx.font = '11px sans-serif';
            ctx.fillText("Rot=Spam, Grün=OK", width - 10, 20);

            // Tooltip Overlay
            if (hoverInfo) {
                ctx.save();
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.strokeStyle = '#fff';

                const text = hoverInfo.text || "No Text";
                const label = hoverInfo.isSpam ? "SPAM" : "HAM";
                const metrics = ctx.measureText(text);

                const tw = Math.max(metrics.width, 100) + 20;
                const th = 50;
                let tx = hoverInfo.x + 15;
                let ty = hoverInfo.y - 15;

                // Canvas boundaries check
                if (tx + tw > width) tx = hoverInfo.x - tw - 10;
                if (ty + th > height) ty = hoverInfo.y - th - 10;
                if (ty < 0) ty = hoverInfo.y + 20;

                // Box
                ctx.beginPath();
                ctx.roundRect(tx, ty, tw, th, 5);
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.stroke();

                // Text
                ctx.textBaseline = 'top';
                ctx.textAlign = 'left';

                // Label
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = hoverInfo.isSpam ? '#e74c3c' : '#2ecc71';
                ctx.fillText(label, tx + 10, ty + 10);

                // Content
                ctx.font = 'italic 11px sans-serif';
                ctx.fillStyle = '#ddd';
                ctx.fillText(text, tx + 10, ty + 28);

                ctx.restore();
            }

            return;
        }

        // --- TEXT VIEW MODE ---
        if (viewMode === 'text') {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (!currentInput || !currentInput.text) {
                ctx.fillStyle = '#999';
                ctx.font = '20px sans-serif';
                ctx.fillText("Kein Text verfügbar", width / 2, height / 2);
                return;
            }

            // Draw Background based on Prediction
            const isSpamPred = currentPrediction > 0.5;
            const bgColor = isSpamPred ? '#feeff0' : '#effaf0'; // Light Red/Green
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

            // Text Wrapping
            const text = currentInput.text;
            ctx.fillStyle = '#333';
            ctx.font = '24px serif';

            const words = text.split(' ');
            let line = '';
            const lineHeight = 35;
            const x = width / 2;
            let y = height / 3;
            const maxWidth = width - 100;

            for (let n = 0; n < words.length; n++) {
                const testLine = line + words[n] + ' ';
                const metrics = ctx.measureText(testLine);
                const testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                }
                else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, y);

            // Prediction & Ground Truth
            y += 60;

            // Ground Truth
            const isSpamGT = currentInput.groundTruth === 1;
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#555';
            ctx.fillText(`Wahrheit: ${isSpamGT ? 'SPAM' : 'HAM'}`, x, y);

            y += 30;
            // Prediction
            const probPct = (currentPrediction * 100).toFixed(1);
            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = isSpamPred ? '#c0392b' : '#27ae60';
            ctx.fillText(`Vorhersage: ${isSpamPred ? 'SPAM' : 'HAM'} (${probPct}%)`, x, y);

            return;
        }

        // --- FEATURE HISTOGRAMS MODE (Original) ---
        const pad = 30;
        const w = (width - 3 * pad) / 2;
        const h = (height - 3 * pad) / 2;

        const plots = [
            { x: pad, y: pad, ...FEATURES[0] },
            { x: pad + w + pad, y: pad, ...FEATURES[1] },
            { x: pad, y: pad + h + pad, ...FEATURES[2] },
            { x: pad + w + pad, y: pad + h + pad, ...FEATURES[3] }
        ];

        plots.forEach(plot => {
            // Draw Box
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(plot.x, plot.y, w, h);

            // Label
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(plot.label, plot.x + w / 2, plot.y - 5);

            // Draw Points
            if (data) {
                data.forEach(pt => {
                    const xVal = pt.input[plot.idx];
                    const px = plot.x + (xVal / plot.max) * w;
                    const py = plot.y + h - (pt.target * (h - 20)) - 10;

                    let haloColor = null;
                    if (neuralNet && showModel) {
                        try {
                            const pred = neuralNet.predict(pt.input);
                            haloColor = pred > 0.5 ? '#e74c3c' : '#2ecc71';
                        } catch (e) { }
                    }

                    if (haloColor) {
                        ctx.beginPath();
                        ctx.arc(px, py, 4.5, 0, 2 * Math.PI);
                        ctx.strokeStyle = haloColor;
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }

                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, 2 * Math.PI);
                    ctx.fillStyle = pt.target ? 'rgba(231, 76, 60, 0.6)' : 'rgba(46, 204, 113, 0.6)';
                    ctx.fill();
                });
            }

            if (currentInput) {
                const xVal = currentInput[plot.idx];
                const px = plot.x + (xVal / plot.max) * w;
                ctx.beginPath();
                ctx.moveTo(px, plot.y);
                ctx.lineTo(px, plot.y + h);
                ctx.strokeStyle = '#3498db';
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

    }, [data, currentInput, currentPrediction, neuralNet, viewMode, xAxis, yAxis, zAxis, rotation, showModel]);

    // VIEW MODE LABELS MAPPING
    const viewLabels = {
        'features': 'Alle Features',
        'scatter': '2D Plot',
        '3d': '3D Plot',
        'text': 'Text Mode'
    };

    return (
        <div style={{ textAlign: 'center' }}>
            {/* View Selector & Axis Controls */}
            {!hideControls && (
                <div style={{ marginBottom: '10px', display: 'flex', gap: '5px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                    {/* Left: Additional Controls (e.g. Data Tab Toggle) */}
                    <div>
                        {additionalControls}
                    </div>

                    {/* Right: Plot Controls */}
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={{ padding: '4px' }}>
                            {allowedModes.map(mode => (
                                <option key={mode} value={mode}>{viewLabels[mode]}</option>
                            ))}
                        </select>

                        {(viewMode === 'scatter' || viewMode === '3d') && (
                            <>
                                <span>X:</span>
                                <select value={xAxis} onChange={e => setXAxis(parseInt(e.target.value))} style={{ padding: '4px' }}>
                                    {FEATURES.map(f => <option key={f.idx} value={f.idx}>{f.label}</option>)}
                                </select>
                                <span>Y:</span>
                                <select value={yAxis} onChange={e => setYAxis(parseInt(e.target.value))} style={{ padding: '4px' }}>
                                    {FEATURES.map(f => <option key={f.idx} value={f.idx}>{f.label}</option>)}
                                </select>
                            </>
                        )}

                        {viewMode === '3d' && (
                            <>
                                <span>Z:</span>
                                <select value={zAxis} onChange={e => setZAxis(parseInt(e.target.value))} style={{ padding: '4px' }}>
                                    {FEATURES.map(f => <option key={f.idx} value={f.idx}>{f.label}</option>)}
                                </select>
                            </>
                        )}
                    </div>
                </div>
            )}

            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{ border: '1px solid #eee', maxWidth: '100%', borderRadius: '4px', cursor: viewMode === '3d' ? 'grab' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseOut={handleMouseOut}
            />

            {!hideControls && (
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                    {viewMode === '3d' ? 'Drag to rotate 3D view' : 'Wähle Achsen für die Visualisierung'}
                </div>
            )}
        </div>
    );
}

import { useRef, useEffect, useState } from 'preact/hooks';
import { getNiceTicks } from '../../utils/graphUtils';

export const DEFAULT_FEATURES = [
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
    additionalControls = null,
    features = DEFAULT_FEATURES
}) {
    const canvasRef = useRef(null);
    const [viewMode, setViewMode] = useState(allowedModes[0]);

    useEffect(() => {
        if (!allowedModes.includes(viewMode)) {
            setViewMode(allowedModes[0]);
        }
    }, [allowedModes]);

    const [xAxis, setXAxis] = useState(0);
    // Smart default: If limited features (Phase 4/5), pick the second one. Otherwise keep legacy default (3).
    const [yAxis, setYAxis] = useState(features.length === 2 ? 1 : 3);
    const [zAxis, setZAxis] = useState(2);
    // Background Grid State
    const [showGrid, setShowGrid] = useState(false);

    // 3D Rotation State
    const [rotation, setRotation] = useState({ x: -0.5, y: 0.5 });

    // Scatter Zoom/Pan State
    const [scatterTransform, setScatterTransform] = useState({ k: 1, x: 0, y: 0 });

    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState(null);

    // Hitbox tracking
    const drawnPoints = useRef([]);

    const handleWheel = (e) => {
        if (viewMode !== 'scatter') return;
        e.preventDefault();

        const zoomSensitivity = 0.001;
        const delta = -e.deltaY * zoomSensitivity;
        const oldK = scatterTransform.k;
        let newK = oldK * (1 + delta);
        newK = Math.max(0.5, Math.min(newK, 50)); // Allow deeper zoom

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        const padding = 50;
        const originY = canvas.height - padding;

        const graphX = (mx - padding - scatterTransform.x) / oldK;
        const valY_scaled_unzoomed = (originY + scatterTransform.y - my) / oldK;

        const newTx = mx - padding - graphX * newK;
        const newTy = my - originY + valY_scaled_unzoomed * newK;

        setScatterTransform({ k: newK, x: newTx, y: newTy });
    };

    const handleMouseDown = (e) => {
        if (viewMode !== '3d' && viewMode !== 'scatter') return;
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Dragging Logic
        if (isDragging.current) {
            const deltaX = (e.clientX - lastMouse.current.x) * scaleX;
            const deltaY = (e.clientY - lastMouse.current.y) * scaleY;
            lastMouse.current = { x: e.clientX, y: e.clientY };

            if (viewMode === '3d') {
                setRotation(prev => ({
                    x: prev.x + deltaY * 0.01,
                    y: prev.y + deltaX * 0.01
                }));
            } else if (viewMode === 'scatter') {
                setScatterTransform(prev => ({
                    ...prev,
                    x: prev.x + deltaX,
                    y: prev.y + deltaY
                }));
            }
            return;
        }

        // Universal Hover Logic using drawnPoints
        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        let found = null;
        const hitRadius = 15;
        let minDist = hitRadius;

        // Unlocked loop for all modes
        const points = drawnPoints.current;
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            const dist = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);
            if (dist < minDist) {
                minDist = dist;
                found = p.info;
            }
        }
        setHoverInfo(found);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseOut = () => {
        setHoverInfo(null);
        isDragging.current = false;
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

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, width, height);

        drawnPoints.current = []; // Reset hitboxes

        const getDataMax = (idx) => {
            if (!data || data.length === 0) return features[idx].max;
            const max = Math.max(...data.map(d => d.input[idx]));
            return max > 0 ? max : features[idx].max;
        };

        const getColor = (target) => {
            if (target === 2) return '#3498db'; // Blue (New Class)
            if (target === 1) return '#e74c3c'; // Red (Spam)
            return '#2ecc71'; // Green (Ham)
        };

        const getLabel = (target) => {
            if (target === 3) return 'CLASS 3';
            if (target === 1) return 'SPAM';
            return 'HAM';
        };

        // --- 3D PLOT MODE ---
        if (viewMode === '3d') {
            const xMax = getDataMax(xAxis);
            const yMax = getDataMax(yAxis);
            const zMax = getDataMax(zAxis);

            const cx = width / 2;
            const cy = height / 2;
            const size = 150;

            const project = (x, y, z) => {
                let x1 = x * Math.cos(rotation.y) - z * Math.sin(rotation.y);
                let z1 = x * Math.sin(rotation.y) + z * Math.cos(rotation.y);
                let y1 = y * Math.cos(rotation.x) - z1 * Math.sin(rotation.x);
                let z2 = y * Math.sin(rotation.x) + z1 * Math.cos(rotation.x);
                const scale = 400 / (400 - z2);
                return {
                    x: cx + x1 * scale,
                    y: cy + y1 * scale,
                    z: z2
                };
            };

            const corners = [
                [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
            ];
            const projCorners = corners.map(c => project(c[0] * size, c[1] * size, c[2] * size));

            const colX = '#e29301ff';
            const colY = '#2980b9';
            const colZ = '#c00798ff';

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

            drawEdges([[0, 1], [3, 2], [4, 5], [7, 6]], colX);
            drawEdges([[0, 3], [1, 2], [4, 7], [5, 6]], colY);
            drawEdges([[0, 4], [1, 5], [2, 6], [3, 7]], colZ);

            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = colX;
            ctx.fillText("X: " + features[xAxis].label, projCorners[1].x, projCorners[1].y);
            ctx.fillStyle = colY;
            ctx.fillText("Y: " + features[yAxis].label, projCorners[3].x, projCorners[3].y);
            ctx.fillStyle = colZ;
            ctx.fillText("Z: " + features[zAxis].label, projCorners[4].x, projCorners[4].y);

            const pointsToDraw = [];
            const norm = (val, max) => (val / max) * 2 - 1;

            if (showModel && neuralNet && neuralNet.weights) {
                const wX = neuralNet.weights[xAxis] || 0;
                const wY = neuralNet.weights[yAxis] || 0;
                const wZ = neuralNet.weights[zAxis] || 0;
                const b = neuralNet.bias || 0;

                if (Math.abs(wZ) > 0.001) {
                    ctx.strokeStyle = 'rgba(142, 68, 173, 0.3)';
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
                    for (let i = 0; i <= steps; i++) {
                        const vy = -1 + (i / steps) * 2;
                        const z1 = getZ(-1, vy);
                        const z2 = getZ(1, vy);
                        drawPlaneLine({ x: -1, y: vy, z: z1 }, { x: 1, y: vy, z: z2 });
                    }
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
                    const vy = -norm(pt.input[yAxis], yMax);
                    const vz = norm(pt.input[zAxis], zMax);

                    const proj = project(vx * size, vy * size, vz * size);

                    let haloColor = null;
                    if (neuralNet && showModel) {
                        try {
                            const pred = neuralNet.predict(pt.input);
                            haloColor = pred > 0.5 ? '#e74c3c' : '#2ecc71';
                        } catch (e) { }
                    }

                    pointsToDraw.push({
                        ...proj,
                        color: getColor(pt.target),
                        radius: 3,
                        haloColor,
                        pt // Keep ref
                    });
                });
            }

            pointsToDraw.sort((a, b) => a.z - b.z);

            pointsToDraw.forEach(p => {
                // Record Hitbox (only if in front of "camera")
                if (p.z < 3) {
                    drawnPoints.current.push({
                        x: p.x, y: p.y,
                        info: {
                            x: p.x, y: p.y,
                            text: p.pt.text,
                            target: p.pt.target,
                            isSpam: p.pt.target === 1,
                            features: {
                                xLabel: features[xAxis].label,
                                xVal: p.pt.input[xAxis],
                                yLabel: features[yAxis].label,
                                yVal: p.pt.input[yAxis],
                                zLabel: features[zAxis].label,
                                zVal: p.pt.input[zAxis]
                            }
                        }
                    });
                }

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
            });

            // return; // Allow fallthrough for tooltips
        }

        // --- SCATTER PLOT MODE (2D) ---
        if (viewMode === 'scatter') {
            const xMax = getDataMax(xAxis);
            const yMax = getDataMax(yAxis);

            const padding = 50;
            const plotW = width - 2 * padding;
            const plotH = height - 2 * padding;
            const originY = height - padding;

            const colX = '#c0392b';
            const colY = '#2980b9';

            // Transformers
            const mapX = (val) => padding + (val / xMax) * plotW * scatterTransform.k + scatterTransform.x;
            const mapY = (val) => originY - (val / yMax) * plotH * scatterTransform.k + scatterTransform.y;

            // Box Clipping
            ctx.save();
            ctx.beginPath();
            ctx.rect(padding, padding, plotW, plotH);
            ctx.clip();
            ctx.restore();

            // Inverse Map for Ticks
            const getInvX = (sx) => ((sx - padding - scatterTransform.x) / (plotW * scatterTransform.k)) * xMax;
            const getInvY = (sy) => ((originY + scatterTransform.y - sy) / (plotH * scatterTransform.k)) * yMax;

            const visXMin = getInvX(padding);
            const visXMax = getInvX(padding + plotW);
            const visYMin = getInvY(originY); // Bottom val
            const visYMax = getInvY(padding); // Top val

            // Tick Gen
            const xTicks = getNiceTicks(Math.min(visXMin, visXMax), Math.max(visXMin, visXMax), 8);
            const yTicks = getNiceTicks(Math.min(visYMin, visYMax), Math.max(visYMin, visYMax), 6);

            ctx.lineWidth = 1;
            ctx.strokeStyle = '#eee'; // Grid color
            ctx.fillStyle = '#666';
            ctx.font = '10px sans-serif';

            // Draw Grid & Ticks X
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            xTicks.forEach(val => {
                const x = mapX(val);
                if (x < padding || x > padding + plotW) return;

                // Grid
                ctx.beginPath();
                ctx.moveTo(x, padding);
                ctx.lineTo(x, originY);
                ctx.stroke();

                // Label
                ctx.fillText(Number(val.toFixed(2)), x, originY + 5);
            });

            // Draw Grid & Ticks Y
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            yTicks.forEach(val => {
                const y = mapY(val);
                if (y < padding || y > originY) return;

                // Grid
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(padding + plotW, y);
                ctx.stroke();

                // Label
                ctx.fillText(Number(val.toFixed(2)), padding - 5, y);
            });


            // Axes Limit Box
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            ctx.strokeRect(padding, padding, plotW, plotH);

            // Labels with Max Values
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px sans-serif';

            ctx.fillStyle = colX;
            ctx.fillText(`${features[xAxis].label}`, padding + plotW / 2, originY + 30);

            ctx.save();
            ctx.translate(15, originY - plotH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillStyle = colY;
            ctx.fillText(`${features[yAxis].label}`, 0, 0);
            ctx.restore();

            // --- DATA CLIPPING START ---
            ctx.save();
            ctx.beginPath();
            ctx.rect(padding, padding, plotW, plotH);
            ctx.clip();

            // --- DECISION BOUNDARY GRID ---
            // Only active for Phase 4/5 (2 features) to avoid performance hits on higher dimensions
            if (showGrid && neuralNet && features.length === 2) {
                const step = 0.5;
                // Calculate visible range in data coordinates
                const xStart = Math.floor(visXMin / step) * step;
                const xEnd = Math.ceil(visXMax / step) * step;
                const yStart = Math.floor(visYMin / step) * step;
                const yEnd = Math.ceil(visYMax / step) * step;

                // Simple check to prevent hanging if zoomed out too far (too many cells)
                const totalCells = ((xEnd - xStart) / step) * ((yEnd - yStart) / step);
                if (totalCells < 50000) {
                    for (let vx = xStart; vx <= xEnd; vx += step) {
                        for (let vy = yStart; vy <= yEnd; vy += step) {
                            try {
                                const input = [0, 0];
                                // Map scatter plot axes to input vector
                                // If xAxis is 0 (Words), put vx there.
                                if (xAxis < 2) input[xAxis] = vx;
                                if (yAxis < 2) input[yAxis] = vy;

                                const pred = neuralNet.predict(input);

                                const sx = mapX(vx);
                                const sy = mapY(vy);
                                const sx2 = mapX(vx + step);
                                const sy2 = mapY(vy + step);

                                const w = Math.abs(sx2 - sx);
                                const h = Math.abs(sy - sy2);
                                const drawX = Math.min(sx, sx2);
                                const drawY = Math.min(sy, sy2);


                                // Color Interpolation
                                // Green (HAM): 46, 204, 113
                                // Red (SPAM): 231, 76, 60
                                const r = Math.round(46 * (1 - pred) + 231 * pred);
                                const g = Math.round(204 * (1 - pred) + 76 * pred);
                                const b = Math.round(113 * (1 - pred) + 60 * pred);

                                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`; // Low opacity
                                // Add 0.5 overlap to prevent grid lines due to antialiasing
                                ctx.fillRect(drawX, drawY, w + 0.5, h + 0.5);

                            } catch (e) { }
                        }
                    }
                }
            }

            const drawPoint = (input, color, radius, stroke, haloColor) => {
                const x = mapX(input[xAxis]);
                const y = mapY(input[yAxis]);

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
                    const x = mapX(pt.input[xAxis]);
                    const y = mapY(pt.input[yAxis]);

                    if (x < padding || x > padding + plotW || y < padding || y > originY) return;

                    drawnPoints.current.push({
                        x, y,
                        info: {
                            x, y,
                            text: pt.text,
                            target: pt.target,
                            isSpam: pt.target === 1,
                            features: {
                                xLabel: features[xAxis].label,
                                xVal: pt.input[xAxis],
                                yLabel: features[yAxis].label,
                                yVal: pt.input[yAxis]
                            }
                        }
                    });

                    let haloColor = null;
                    if (neuralNet && showModel) {
                        try {
                            const pred = neuralNet.predict(pt.input);
                            haloColor = pred > 0.5 ? '#e74c3c' : '#2ecc71';
                        } catch (e) { }
                    }
                    drawPoint(pt.input, getColor(pt.target), 5, '#fff', haloColor);
                });
            }

            // --- DRAW DECISION LINE (2D) ---
            if (showModel && neuralNet) {
                let weights = neuralNet.weights;
                const bias = neuralNet.bias || 0;

                if (weights) {
                    const wX = weights[xAxis] || 0;
                    const wY = weights[yAxis] || 0;
                    const b = bias;

                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(142, 68, 173, 0.8)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([10, 5]);

                    const bigMin = visXMin - (visXMax - visXMin);
                    const bigMax = visXMax + (visXMax - visXMin);
                    const toPix = (valX, valY) => ({ x: mapX(valX), y: mapY(valY) });

                    if (Math.abs(wY) > 0.001) {
                        const f = (x) => (-wX * x - b) / wY;
                        const p1 = toPix(bigMin, f(bigMin));
                        const p2 = toPix(bigMax, f(bigMax));
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                    else if (Math.abs(wX) > 0.001) {
                        const xVal = -b / wX;
                        const p1 = toPix(xVal, visYMin - 100);
                        const p2 = toPix(xVal, visYMax + 100);
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }

                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }

            if (currentInput) {
                drawPoint(currentInput, '#3498db', 8, '#2980b9');
            }

            ctx.restore(); // END DATA CLIP

            // Info Text
            ctx.fillStyle = '#666';
            ctx.textAlign = 'right';
            ctx.font = '11px sans-serif';
            ctx.fillText("Rot=Spam, Grün=OK", width - 10, 20);
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

            const isSpamPred = currentPrediction > 0.5;
            const bgColor = isSpamPred ? '#feeff0' : '#effaf0';
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

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

            y += 60;

            const isSpamGT = currentInput.groundTruth === 1;
            ctx.font = 'bold 16px sans-serif';
            ctx.fillStyle = '#555';
            ctx.fillText(`Wahrheit: ${isSpamGT ? 'SPAM' : 'HAM'}`, x, y);

            y += 30;
            const probPct = (currentPrediction * 100).toFixed(1);
            ctx.font = 'bold 20px sans-serif';
            ctx.fillStyle = isSpamPred ? '#c0392b' : '#27ae60';
            ctx.fillText(`Vorhersage: ${isSpamPred ? 'SPAM' : 'HAM'} (${probPct}%)`, x, y);

            return;
        }

        // --- FEATURE HISTOGRAMS MODE ---
        if (viewMode === 'features') {
            const pad = 30;
            const w = (width - 3 * pad) / 2;
            const h = (height - 3 * pad) / 2;

            const plots = [
                { x: pad, y: pad, ...features[0] },
                { x: pad + w + pad, y: pad, ...features[1] },
                { x: pad, y: pad + h + pad, ...features[2] },
                { x: pad + w + pad, y: pad + h + pad, ...features[3] }
            ];

            plots.forEach(plot => {
                ctx.strokeStyle = '#ccc';
                ctx.strokeRect(plot.x, plot.y, w, h);

                ctx.fillStyle = '#333';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(plot.label, plot.x + w / 2, plot.y - 5);

                if (data) {
                    data.forEach(pt => {
                        const xVal = pt.input[plot.idx];
                        const px = plot.x + (xVal / plot.max) * w;
                        const py = plot.y + h - (pt.target * (h - 20)) - 10;

                        drawnPoints.current.push({
                            x: px, y: py,
                            info: {
                                x: px, y: py,
                                text: pt.text,
                                target: pt.target,
                                isSpam: pt.target === 1,
                                features: {
                                    valLabel: plot.label,
                                    val: xVal
                                }
                            }
                        });

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
                        // Use hexToRgba logic or just simple opacity check if needed, but let's stick to simple
                        ctx.fillStyle = getColor(pt.target);
                        ctx.globalAlpha = 0.6;
                        ctx.fill();
                        ctx.globalAlpha = 1.0;
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
        } // End features mode

        // Tooltip Overlay for Features Mode
        if (hoverInfo && (viewMode === 'features' || viewMode === 'scatter' || viewMode === '3d')) {
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.85)';
            ctx.strokeStyle = '#fff';

            const text = hoverInfo.text || "No Text";
            const label = getLabel(hoverInfo.target !== undefined ? hoverInfo.target : (hoverInfo.isSpam ? 1 : 0));
            const metrics = ctx.measureText(text);

            const tw = Math.max(metrics.width, 140) + 20;
            let th = 70;

            // Dynamic Height
            if (hoverInfo.features) {
                if (hoverInfo.features.zLabel) th = 90;
                else if (hoverInfo.features.yLabel) th = 85;
                else th = 60; // Just one val
            }

            let tx = hoverInfo.x + 15;
            let ty = hoverInfo.y - 15;

            if (tx + tw > width) tx = hoverInfo.x - tw - 10;
            if (ty + th > height) ty = hoverInfo.y - th - 10;
            if (ty < 0) ty = hoverInfo.y + 20;

            ctx.beginPath();
            ctx.roundRect(tx, ty, tw, th, 5);
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.textBaseline = 'top';
            ctx.textAlign = 'left';

            ctx.font = 'bold 12px sans-serif';
            ctx.fillStyle = getColor(hoverInfo.target !== undefined ? hoverInfo.target : (hoverInfo.isSpam ? 1 : 0));
            ctx.fillText(label, tx + 10, ty + 10);

            ctx.fillStyle = '#ddd';
            ctx.font = 'italic 11px sans-serif';
            ctx.fillText(text, tx + 10, ty + 28);

            if (hoverInfo.features) {
                ctx.fillStyle = '#fff';
                ctx.font = '11px monospace';
                if (hoverInfo.features.xLabel) {
                    ctx.fillText(`${hoverInfo.features.xLabel}: ${hoverInfo.features.xVal}`, tx + 10, ty + 46);
                    ctx.fillText(`${hoverInfo.features.yLabel}: ${hoverInfo.features.yVal}`, tx + 10, ty + 60);
                    if (hoverInfo.features.zLabel) {
                        ctx.fillText(`${hoverInfo.features.zLabel}: ${hoverInfo.features.zVal}`, tx + 10, ty + 74);
                    }
                } else if (hoverInfo.features.valLabel) {
                    ctx.fillText(`${hoverInfo.features.valLabel}: ${hoverInfo.features.val}`, tx + 10, ty + 46);
                }
            }

            ctx.restore();
        }

    }, [data, currentInput, currentPrediction, neuralNet, viewMode, xAxis, yAxis, zAxis, rotation, showModel, scatterTransform, showGrid]);

    const viewLabels = {
        'features': 'Alle Features',
        'scatter': '2D Plot',
        '3d': '3D Plot',
        'text': 'Text Mode'
    };

    return (
        <div style={{ textAlign: 'center' }}>
            {!hideControls && (
                <div style={{ marginBottom: '10px', display: 'flex', gap: '5px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                    <div>
                        {additionalControls}
                    </div>
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
                                    {features.map(f => <option key={f.idx} value={f.idx}>{f.label}</option>)}
                                </select>
                                <span>Y:</span>
                                <select value={yAxis} onChange={e => setYAxis(parseInt(e.target.value))} style={{ padding: '4px' }}>
                                    {features.map(f => <option key={f.idx} value={f.idx}>{f.label}</option>)}
                                </select>
                            </>
                        )}

                        {/* Grid Toggle for Scatter Mode (Phase 4/5) */}
                        {viewMode === 'scatter' && features.length === 2 && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '5px', fontSize: '0.8rem', cursor: 'pointer', background: '#f5f5f5', padding: '2px 5px', borderRadius: '3px', border: '1px solid #ddd' }}>
                                <input
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={e => setShowGrid(e.target.checked)}
                                />
                                Show Grid
                            </label>
                        )}

                        {viewMode === '3d' && (
                            <>
                                <span>Z:</span>
                                <select value={zAxis} onChange={e => setZAxis(parseInt(e.target.value))} style={{ padding: '4px' }}>
                                    {features.map(f => <option key={f.idx} value={f.idx}>{f.label}</option>)}
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
                style={{ border: '1px solid #eee', maxWidth: '100%', borderRadius: '4px', cursor: hoverInfo ? 'pointer' : (viewMode === '3d' || viewMode === 'scatter' ? (isDragging.current ? 'grabbing' : 'grab') : 'default') }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onMouseOut={handleMouseOut}
                onClick={handleClick}
            />

            {!hideControls && (
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                    {viewMode === '3d' ? 'Drag to rotate 3D view' : (viewMode === 'scatter' ? 'Drag to Pan, Scroll to Zoom' : 'Wähle Achsen für die Visualisierung')}
                </div>
            )}
        </div>
    );
}

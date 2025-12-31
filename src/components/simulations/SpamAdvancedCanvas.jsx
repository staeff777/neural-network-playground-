import { useRef, useEffect, useState } from 'preact/hooks';

const FEATURES = [
    { label: "Spam Words", idx: 0, max: 15 },
    { label: "Großbuchstaben", idx: 1, max: 25 },
    { label: "Links", idx: 2, max: 8 },
    { label: "Gesamtworte", idx: 3, max: 100 }
];

export function SpamAdvancedCanvas({ data, currentInput, currentPrediction }) {
    const canvasRef = useRef(null);
    const [viewMode, setViewMode] = useState('scatter'); // 'features', 'scatter', '3d'

    // Axes Selection
    const [xAxis, setXAxis] = useState(0); // Default: Spam Words
    const [yAxis, setYAxis] = useState(3); // Default: Total Words
    const [zAxis, setZAxis] = useState(2); // Default: Links (for 3D)

    // 3D Rotation State
    const [rotation, setRotation] = useState({ x: -0.5, y: 0.5 });
    const isDragging = useRef(false);
    const lastMouse = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (viewMode !== '3d') return;
        isDragging.current = true;
        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e) => {
        if (!isDragging.current || viewMode !== '3d') return;
        const deltaX = e.clientX - lastMouse.current.x;
        const deltaY = e.clientY - lastMouse.current.y;

        setRotation(prev => ({
            x: prev.x + deltaY * 0.01,
            y: prev.y + deltaX * 0.01
        }));

        lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
        isDragging.current = false;
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
        if (viewMode === '3d') {
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

            // Edges
            ctx.strokeStyle = '#eee';
            ctx.beginPath();
            const edges = [
                [0, 1], [1, 2], [2, 3], [3, 0], // Front face
                [4, 5], [5, 6], [6, 7], [7, 4], // Back face
                [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting
            ];
            edges.forEach(([s, e]) => {
                ctx.moveTo(projCorners[s].x, projCorners[s].y);
                ctx.lineTo(projCorners[e].x, projCorners[e].y);
            });
            ctx.stroke();

            // Draw Axis Labels (Simple)
            ctx.fillStyle = '#333';
            ctx.font = '10px sans-serif';
            ctx.fillText("X: " + FEATURES[xAxis].label, projCorners[1].x, projCorners[1].y);
            ctx.fillText("Y: " + FEATURES[yAxis].label, projCorners[3].x, projCorners[3].y);
            ctx.fillText("Z: " + FEATURES[zAxis].label, projCorners[4].x, projCorners[4].y);

            // Draw Points
            const pointsToDraw = [];

            // Helper to normalize data -1 to 1
            const norm = (val, max) => (val / max) * 2 - 1;

            if (data) {
                data.forEach(pt => {
                    const vx = norm(pt.input[xAxis], FEATURES[xAxis].max);
                    const vy = -norm(pt.input[yAxis], FEATURES[yAxis].max); // Y inverted in canvas
                    const vz = norm(pt.input[zAxis], FEATURES[zAxis].max); // Z depth

                    const proj = project(vx * size, vy * size, vz * size);
                    pointsToDraw.push({ ...proj, color: pt.target === 1 ? '#e74c3c' : '#2ecc71', radius: 3 });
                });
            }

            if (currentInput) {
                const vx = norm(currentInput[xAxis], FEATURES[xAxis].max);
                const vy = -norm(currentInput[yAxis], FEATURES[yAxis].max);
                const vz = norm(currentInput[zAxis], FEATURES[zAxis].max);

                const proj = project(vx * size, vy * size, vz * size);
                pointsToDraw.push({ ...proj, color: '#3498db', radius: 5, border: true });
            }

            // Sort by depth (Painter's algo)
            pointsToDraw.sort((a, b) => a.z - b.z);

            pointsToDraw.forEach(p => {
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
            const padding = 50;
            const plotW = width - 2 * padding;
            const plotH = height - 2 * padding;
            const originX = padding;
            const originY = height - padding;

            // Axes
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(originX, originY);
            ctx.lineTo(originX + plotW, originY); // X
            ctx.moveTo(originX, originY);
            ctx.lineTo(originX, originY - plotH); // Y
            ctx.stroke();

            // Labels
            ctx.fillStyle = '#333';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(FEATURES[xAxis].label, originX + plotW / 2, originY + 35);

            ctx.save();
            ctx.translate(15, originY - plotH / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(FEATURES[yAxis].label, 0, 0);
            ctx.restore();

            const drawPoint = (input, color, radius, stroke) => {
                const xVal = input[xAxis];
                const yVal = input[yAxis];
                const xMax = FEATURES[xAxis].max;
                const yMax = FEATURES[yAxis].max;

                const x = originX + (xVal / xMax) * plotW;
                const y = originY - (yVal / yMax) * plotH;

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
                    drawPoint(pt.input, pt.target === 1 ? '#e74c3c' : '#2ecc71', 5, '#fff');
                });
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

    }, [data, currentInput, currentPrediction, viewMode, xAxis, yAxis, zAxis, rotation]);

    return (
        <div style={{ textAlign: 'center' }}>
            {/* View Selector & Axis Controls */}
            <div style={{ marginBottom: '10px', display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                <select value={viewMode} onChange={e => setViewMode(e.target.value)} style={{ padding: '4px' }}>
                    <option value="features">Alle Features</option>
                    <option value="scatter">2D Plot</option>
                    <option value="3d">3D Plot</option>
                </select>

                {viewMode !== 'features' && (
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

            <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{ border: '1px solid #eee', maxWidth: '100%', borderRadius: '4px', cursor: viewMode === '3d' ? 'grab' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />

            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                {viewMode === '3d' ? 'Drag to rotate 3D view' : 'Wähle Achsen für die Visualisierung'}
            </div>
        </div>
    );
}

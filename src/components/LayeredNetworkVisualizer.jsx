export function LayeredNetworkVisualizer({ model, inputs, inputLabels, output, outputLabel }) {
    if (!model || !model.getTopology) return null;

    const { inputCount, hiddenCounts, outputCount, weights1, biases1, weights2 } = model.getTopology();
    // Assume generic "hidden" array of counts if we were fully generic, 
    // but our model returns specific weights1/2.

    // Get live activations
    let activations = { hidden: [], output: [] };
    if (model.getActivations) {
        activations = model.getActivations(inputs);
    }

    // Config
    const width = 600;
    const height = 400;
    const centerY = height / 2;
    const centerX = width / 2;

    // Box dimensions
    const boxWidth = 350;
    const boxHeight = 280;
    const boxLeft = centerX - boxWidth / 2;
    const boxRight = centerX + boxWidth / 2;

    // Node Layout
    // Layer 0: Inputs (On Left Boundary)
    // Layer 1: Hidden (Center)
    // Layer 2: Output (On Right Boundary)

    // Calculate hidden layer X positions
    // For single hidden layer, it's just centerX.
    // Generally: boxLeft + (i / (totalLayers - 1)) * boxWidth

    const layers = [
        { count: inputCount, x: boxLeft, labels: inputLabels, values: inputs },
        { count: hiddenCounts[0], x: centerX, values: activations.hidden },
        { count: outputCount, x: boxRight, labels: [outputLabel], values: activations.output }
    ];

    const maxNodes = Math.max(...layers.map(l => l.count));
    const spacingY = Math.min(50, boxHeight / maxNodes);

    const getNodeY = (layerIdx, nodeIdx) => {
        const count = layers[layerIdx].count;
        const totalH = (count - 1) * spacingY;
        return centerY - totalH / 2 + nodeIdx * spacingY;
    };

    // Helper colors
    const getWeightColor = (w) => {
        // Minimum alpha 0.2 so structure is visible
        const alpha = Math.max(0.2, Math.min(0.8, Math.abs(w) / 2));
        return w > 0 ? `rgba(46, 204, 113, ${alpha})` : `rgba(231, 76, 60, ${alpha})`;
    };

    const getActColor = (val) => {
        const v = Math.max(0, Math.min(1, val));
        const r = Math.round(255 + (52 - 255) * v);
        const g = Math.round(255 + (152 - 255) * v);
        const b = Math.round(255 + (219 - 255) * v);
        return `rgb(${r},${g},${b})`;
    };

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem', color: '#555' }}>Neural Network Activity</h3>
            <svg width={width} height={height} style={{ overflow: 'visible' }}>

                {/* The Black Box */}
                <rect
                    x={boxLeft}
                    y={centerY - boxHeight / 2}
                    width={boxWidth}
                    height={boxHeight}
                    rx="15"
                    fill="none"
                    stroke="#333"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                />
                <text x={centerX} y={centerY - boxHeight / 2 + 20} textAnchor="middle" fill="#777" fontSize="12" fontWeight="bold">NEURAL NETWORK</text>

                {/* CONNECTIONS */}
                {/* Layer 0 -> 1 (Weights 1) */}
                {weights1.map((row, j) => (
                    row.map((w, i) => (
                        <line
                            key={`L0-${i}-${j}`}
                            x1={layers[0].x} y1={getNodeY(0, i)}
                            x2={layers[1].x} y2={getNodeY(1, j)}
                            stroke={getWeightColor(w)}
                            strokeWidth={Math.max(1, Math.min(4, Math.abs(w)))}
                        />
                    ))
                ))}

                {/* Layer 1 -> 2 (Weights 2) */}
                {weights2.map((w, j) => (
                    <line
                        key={`L1-${j}-0`} // Assuming 1 output node
                        x1={layers[1].x} y1={getNodeY(1, j)}
                        x2={layers[2].x} y2={getNodeY(2, 0)}
                        stroke={getWeightColor(w)}
                        strokeWidth={Math.max(1, Math.min(4, Math.abs(w)))}
                    />
                ))}

                {/* NODES */}
                {layers.map((layer, lIdx) => (
                    <g key={`layer-${lIdx}`}>
                        {Array.from({ length: layer.count }).map((_, nIdx) => {
                            const x = layer.x;
                            const y = getNodeY(lIdx, nIdx);
                            const val = layer.values && layer.values[nIdx] !== undefined ? layer.values[nIdx] : 0;

                            return (
                                <g key={`n-${lIdx}-${nIdx}`}>
                                    {/* Circle with activation color */}
                                    <circle
                                        cx={x} cy={y} r={12}
                                        fill={getActColor(val)}
                                        stroke="#333"
                                        strokeWidth="1.5"
                                    />

                                    {/* Labels for Input/Output */}
                                    {layer.labels && (
                                        <text
                                            x={lIdx === 0 ? x - 30 : x + 30}
                                            y={y}
                                            textAnchor={lIdx === 0 ? "end" : "start"}
                                            dominantBaseline="middle"
                                            fontSize="13"
                                            fontWeight="bold"
                                            fill="#333"
                                        >
                                            {layer.labels[nIdx] || ''}
                                        </text>
                                    )}

                                    <title>{val.toFixed(3)}</title>
                                </g>
                            );
                        })}
                    </g>
                ))}

                {/* Legend */}
                <g transform={`translate(${width - 100}, ${height - 50})`}>
                    <rect width="90" height="40" fill="white" stroke="#ccc" rx="4" />
                    <line x1="10" y1="10" x2="30" y2="10" stroke="#2ecc71" strokeWidth="3" />
                    <text x="35" y="14" fontSize="10">Positive</text>
                    <line x1="10" y1="28" x2="30" y2="28" stroke="#e74c3c" strokeWidth="3" />
                    <text x="35" y="32" fontSize="10">Negative</text>
                </g>

            </svg>
        </div>
    );
}

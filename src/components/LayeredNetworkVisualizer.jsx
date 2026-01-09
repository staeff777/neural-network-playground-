import { useState } from 'react';
import { getPlaygroundOptions } from '../lib/options.js';

export function LayeredNetworkVisualizer({ model, inputs, inputLabels, output, outputLabel, formula, collapseModelArchitectureByDefault }) {
    if (!model || !model.getTopology) return null;

    const topology = model.getTopology();
    const { inputCount, hiddenCounts, outputCount, weights1, biases1, weights2 } = topology;
    // Handle specific model difference (bias2 vs biases2)
    const biases2 = topology.biases2 || (topology.bias2 !== undefined ? [topology.bias2] : null);

    // Get live activations
    let activations = { hidden: [], output: [] };
    if (model.getActivations) {
        activations = model.getActivations(inputs);
    }

    // State for interactions
    const [selectedNode, setSelectedNode] = useState(null); // { layer: 0/1/2, index: number }
    const [showMatrices, setShowMatrices] = useState(false);
    const resolvedCollapseByDefault =
        typeof collapseModelArchitectureByDefault === 'boolean'
            ? collapseModelArchitectureByDefault
            : getPlaygroundOptions().collapseModelArchitectureByDefault;
    const [showDetails, setShowDetails] = useState(!resolvedCollapseByDefault);

    // Config
    const width = 400;
    const height = 400;
    const centerY = height / 2;
    const centerX = width / 2;

    // Box dimensions
    const boxWidth = 300;
    const boxHeight = 300;
    const boxLeft = centerX - boxWidth / 2;
    const boxRight = centerX + boxWidth / 2;

    const layers = [
        { count: inputCount, x: boxLeft, labels: inputLabels, values: inputs },
        { count: hiddenCounts[0], x: centerX, values: activations.hidden },
        { count: outputCount, x: boxRight, labels: [outputLabel], values: activations.output }
    ];

    const maxNodes = Math.max(...layers.map(l => l.count));
    const spacingY = Math.min(50, boxHeight / maxNodes);

    const getNodeY = (layerIdx, nodeIdx) => {
        const count = layers[layerIdx].count;
        let spacingY = Math.min(50, boxHeight / count);
        const totalH = (count - 1) * spacingY;
        return centerY - totalH / 2 + nodeIdx * spacingY;
    };

    const handleNodeClick = (layerIdx, nodeIdx) => {
        if (selectedNode && selectedNode.layer === layerIdx && selectedNode.index === nodeIdx) {
            setSelectedNode(null); // Deselect if clicking same node
        } else {
            setSelectedNode({ layer: layerIdx, index: nodeIdx });
        }
    };

    // Helper to determine if a connection should be highlighted
    const isConnHighlighted = (layerFrom, idxFrom, layerTo, idxTo) => {
        if (!selectedNode) return false;
        // Highlight outgoing connections from selected node
        if (selectedNode.layer === layerFrom && selectedNode.index === idxFrom) return true;
        // Highlight incoming connections to selected node
        if (selectedNode.layer === layerTo && selectedNode.index === idxTo) return true;

        return false;
    };

    const isNodeSelected = (lIdx, nIdx) => selectedNode && selectedNode.layer === lIdx && selectedNode.index === nIdx;

    if (showMatrices) {
        return (
            <div
                style={{
                    border: '1px solid #ccc', borderRadius: '8px', padding: '10px',
                    background: '#fff', textAlign: 'center', height: '400px',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden'
                }}
            >
                <div style={{ flex: '0 0 auto', marginBottom: '10px' }}>
                    <h3 style={{ margin: '0', fontSize: '1rem', color: '#555' }}>Network Parameters</h3>
                </div>

                <div style={{ flex: '1 1 auto', overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap', paddingBottom: '10px' }}>
                        {/* Layer 1 */}
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Layer 1 Weights</h4>
                            <MatrixDisplay data={weights1} />
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '5px', marginTop: '10px' }}>Layer 1 Biases</h4>
                            <VectorDisplay data={biases1} />
                        </div>

                        {/* Layer 2 */}
                        <div style={{ textAlign: 'center' }}>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Layer 2 Weights (to Output)</h4>
                            <VectorDisplay data={Array.isArray(weights2[0]) ? weights2.flat() : weights2} isVertical={true} />
                            {biases2 && (
                                <>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '5px', marginTop: '10px' }}>Layer 2 Bias</h4>
                                    <VectorDisplay data={Array.isArray(biases2) ? biases2 : [biases2]} />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        flex: '0 0 auto', marginTop: '10px', cursor: 'pointer',
                        fontStyle: 'italic', color: '#777', padding: '5px'
                    }}
                    onClick={() => setShowMatrices(false)}
                >
                    Back to Network
                </div>
            </div>
        );
    }

    // Colors
    const layerColors = [
        { fill: '#e3f2fd', stroke: '#2196f3', highlight: '#1976d2' }, // Layer 0: Blue
        { fill: '#f3e5f5', stroke: '#9c27b0', highlight: '#7b1fa2' }, // Layer 1: Purple
        { fill: '#e8f5e9', stroke: '#4caf50', highlight: '#388e3c' }  // Layer 2: Green
    ];
    const connectionColor = '#bdbdbd'; // Visible gray
    const highlightColor = '#ff9800'; // Orange for active path

    return (
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '10px', fontSize: '1rem', color: '#555' }}>Neural Network Activity</h3>
            <svg width={width} height={height} style={{ overflow: 'visible' }}>

                {/* The Box (Solid Border) */}
                <rect
                    x={boxLeft}
                    y={centerY - boxHeight / 2}
                    width={boxWidth}
                    height={boxHeight}
                    rx="15"
                    fill="transparent"
                    stroke="#333"
                    strokeWidth="2"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowDetails((v) => !v)}
                />

                {/* CONNECTIONS */}
                {/* Layer 0 -> 1 (Weights 1) */}
                {showDetails && weights1.map((row, j) => (
                    row.map((w, i) => {
                        const highlighted = isConnHighlighted(0, i, 1, j);
                        const faded = selectedNode && !highlighted;

                        // Style
                        const startColor = layerColors[0].stroke;
                        const endColor = layerColors[1].stroke;

                        const strokeColor = highlighted ? highlightColor : connectionColor;
                        const strokeWidth = highlighted ? 3 : 1.5;
                        const opacity = faded ? 0.2 : 1;

                        return (
                            <line
                                key={`L0-${i}-${j}`}
                                x1={layers[0].x} y1={getNodeY(0, i)}
                                x2={layers[1].x} y2={getNodeY(1, j)}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                strokeOpacity={opacity}
                                style={{ transition: 'all 0.3s ease' }}
                            />
                        );
                    })
                ))}

                {/* Layer 1 -> 2 (Weights 2) */}
                {showDetails && weights2.map((w, j) => {
                    const highlighted = isConnHighlighted(1, j, 2, 0);
                    const faded = selectedNode && !highlighted;

                    const strokeColor = highlighted ? highlightColor : connectionColor;
                    const strokeWidth = highlighted ? 3 : 1.5;
                    const opacity = faded ? 0.2 : 1;

                    return (
                        <line
                            key={`L1-${j}-0`}
                            x1={layers[1].x} y1={getNodeY(1, j)}
                            x2={layers[2].x} y2={getNodeY(2, 0)}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeOpacity={opacity}
                            style={{ transition: 'all 0.3s ease' }}
                        />
                    );
                })}

                {/* NODES */}
                {(showDetails ? layers : [layers[0], layers[2]]).map((layer, lIdxFromVisible) => {
                    const lIdx = showDetails ? lIdxFromVisible : (lIdxFromVisible === 0 ? 0 : 2);
                    return (
                    <g key={`layer-${lIdx}`}>
                        {Array.from({ length: layer.count }).map((_, nIdx) => {
                            const x = layer.x;
                            const y = getNodeY(lIdx, nIdx);
                            const val = layer.values && layer.values[nIdx] !== undefined ? layer.values[nIdx] : 0;
                            const isSelected = isNodeSelected(lIdx, nIdx);
                            const colors = layerColors[lIdx] || layerColors[0];

                            return (
                                <g
                                    key={`n-${lIdx}-${nIdx}`}
                                    onClick={() => handleNodeClick(lIdx, nIdx)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Circle */}
                                    <circle
                                        cx={x} cy={y} r={12}
                                        fill={isSelected ? colors.highlight : colors.fill}
                                        stroke={colors.stroke}
                                        strokeWidth={isSelected ? "3" : "2"}
                                        style={{ transition: 'all 0.3s ease' }}
                                    />

                                    {/* Show numeric values when collapsed */}
                                    {!showDetails && (lIdx === 0 || lIdx === 2) && (
                                        <text
                                            x={x}
                                            y={y + 3}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="8"
                                            fontWeight="600"
                                            fill="#333"
                                            style={{ pointerEvents: 'none' }}
                                        >
                                            {Number.isFinite(val) ? val.toFixed(2) : '0.00'}
                                        </text>
                                    )}

                                    {/* Inner Value Dot (optional visualization of activation?) 
                                        Let's keep it simple for now as requested "remove coloring of neurons" 
                                        But maybe a small text or just the clean colored circle is enough.
                                    */}

                                    {/* Labels for Input/Output */}
                                    {layer.labels && (
                                        <text
                                            x={lIdx === 0 ? x - 18 : x + 18}
                                            y={y}
                                            textAnchor={lIdx === 0 ? "end" : "start"}
                                            style={{ textAnchor: lIdx === 0 ? "end" : "start", pointerEvents: 'none' }}
                                            dominantBaseline="middle"
                                            fontSize="14"
                                            fontWeight="600"
                                            fill="#444"
                                        >


                                            {(layer.labels[nIdx] || '').toString().split('\n').map((line, i, arr) => (
                                                <tspan
                                                    key={i}
                                                    x={lIdx === 0 ? x - 18 : x + 18}
                                                    dy={i === 0 ? `${(arr.length - 1) * -0.6}em` : '1.2em'}
                                                >
                                                    {line}
                                                </tspan>
                                            ))}
                                        </text>
                                    )}

                                    {/* Hover Title */}
                                    <title>{val.toFixed(3)}</title>
                                </g>
                            );
                        })}
                    </g>
                );
                })}

                {/* Legend removed as colors are removed */}

                {/* Formula - Clickable to toggle matrix view */}
                {showDetails && formula && (
                    <foreignObject className="formula" x={centerX - 200} y={height - 25} width={400} height={20}>
                        <div
                            style={{
                                display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%',
                                fontSize: '18px', fontStyle: 'italic', color: '#777', cursor: 'pointer', userSelect: 'none'
                            }}
                            onClick={() => setShowMatrices(true)}
                            title="Click to view matrices"
                        >
                            {formula}
                        </div>
                    </foreignObject>
                )}

            </svg>
        </div>
    );
}

// Simple Helpers for Matrix Display
function MatrixDisplay({ data }) {
    if (!data) return null;
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data[0].length}, 1fr)`, gap: '2px', border: '1px solid #999', padding: '2px', background: '#eee' }}>
            {data.map((row, i) =>
                row.map((val, j) => (
                    <div key={`${i} -${j} `} style={{ padding: '2px 4px', background: '#fff', fontSize: '10px', textAlign: 'center' }}>
                        {val.toFixed(2)}
                    </div>
                ))
            )}
        </div>
    );
}

function VectorDisplay({ data, isVertical = false }) {
    if (!data) return null;
    const arr = Array.isArray(data) ? data : [data];
    return (
        <div style={{ display: 'flex', flexDirection: isVertical ? 'column' : 'row', gap: '2px', border: '1px solid #999', padding: '2px', background: '#eee' }}>
            {arr.map((val, i) => (
                <div key={i} style={{ padding: '2px 4px', background: '#fff', fontSize: '10px', textAlign: 'center' }}>
                    {val.toFixed(2)}
                </div>
            ))}
        </div>
    );
}

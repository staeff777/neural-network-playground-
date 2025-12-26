export function NetworkVisualizer({ input, weight, output }) {
  // Layout Constants
  const circleRadius = 30;
  const inputX = 50;
  const outputX = 300;
  const y = 80;
  const arrowLength = 10;

  // Calculate marker refX so the arrow tip touches the circle edge.
  // Circle edge is at outputX - circleRadius.
  // Line ends at outputX.
  // Marker tip (x=10) needs to align with circle edge.
  // Marker coordinate system: tip is at x=10.
  // We want tip (10) to map to (outputX - circleRadius).
  // The marker placement logic aligns (refX, refY) with the line end point (outputX, y).
  // So: outputX - (refX - 10) = outputX - circleRadius
  // => refX - 10 = circleRadius
  // => refX = circleRadius + 10 = 30 + 10 = 40.
  const markerRefX = circleRadius + arrowLength;

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff', textAlign: 'center' }}>
      <h3>Modell Architektur</h3>
      <svg
        width="350"
        height="160"
        style={{ overflow: 'visible' }}
        role="img"
        aria-labelledby="network-title network-desc"
      >
        <title id="network-title">Neural Network Architecture</title>
        <desc id="network-desc">
          A visualization of a simple neural network with one input node and one output node connected by a weighted edge.
          The input is {input?.toFixed(2)}, the weight is {weight?.toFixed(2)}, and the output is {output?.toFixed(2)}.
        </desc>

        {/* Definition for arrow marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth={arrowLength}
            markerHeight="7"
            refX={markerRefX}
            refY="3.5"
            orient="auto"
          >
            <polygon points={`0 0, ${arrowLength} 3.5, 0 7`} fill="#333" />
          </marker>
        </defs>

        {/* Connection Line */}
        <line
          x1={inputX} y1={y}
          x2={outputX} y2={y}
          stroke="#333"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />

        {/* Weight Label (on line) */}
        <rect x={(inputX + outputX)/2 - 25} y={y - 25} width="50" height="20" fill="#fff" rx="4" stroke="#ccc" />
        <text
          x={(inputX + outputX)/2}
          y={y - 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#e74c3c"
          fontSize="12"
          fontWeight="bold"
        >
          w: {weight?.toFixed(2)}
        </text>

        {/* Input Node */}
        <circle cx={inputX} cy={y} r={circleRadius} fill="#fff" stroke="#333" strokeWidth="2" />
        <text x={inputX} y={y} textAnchor="middle" dominantBaseline="middle" fontWeight="bold">Input</text>
        <text x={inputX} y={y + 45} textAnchor="middle" fontSize="12" fill="#555">Zeit (t)</text>
        <text x={inputX} y={y + 60} textAnchor="middle" fontSize="14" fill="#333" fontWeight="bold">{input?.toFixed(2)}</text>

        {/* Output Node */}
        <circle cx={outputX} cy={y} r={circleRadius} fill="#fff" stroke="#333" strokeWidth="2" />
        <text x={outputX} y={y} textAnchor="middle" dominantBaseline="middle" fontWeight="bold">Output</text>
        <text x={outputX} y={y + 45} textAnchor="middle" fontSize="12" fill="#555">Pos (m)</text>
        <text x={outputX} y={y + 60} textAnchor="middle" fontSize="14" fill="#333" fontWeight="bold">{output?.toFixed(2)}</text>

        {/* Equation */}
        <text x={175} y={140} textAnchor="middle" fontSize="14" fontStyle="italic" fill="#777">
          pos = w * t
        </text>
      </svg>
    </div>
  );
}

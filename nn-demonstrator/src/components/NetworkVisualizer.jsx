export function NetworkVisualizer({ input, weight, bias, output }) {
  // Layout Constants
  const circleRadius = 30;
  const inputX = 50;
  const outputX = 300;
  const y = 80;
  const arrowLength = 10;

  // Standard marker refX (tip of the arrow)
  const markerRefX = arrowLength;

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff', textAlign: 'center' }}>
      <h3>Modell Architektur</h3>
      <svg
        width="350"
        height="200"
        style={{ overflow: 'visible' }}
        role="img"
        aria-labelledby="network-title network-desc"
      >
        <title id="network-title">Neural Network Architecture</title>
        <desc id="network-desc">
          A visualization of a simple neural network with one input node and one output node connected by a weighted edge.
          The input is {input?.toFixed(2)}, the weight is {weight?.toFixed(2)}, the bias is {bias?.toFixed(2)}, and the output is {output?.toFixed(2)}.
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

        {/* Connection Line (Weight) */}
        {/* Ends at the edge of the output circle so the marker is visible */}
        <line
          x1={inputX} y1={y}
          x2={outputX - circleRadius} y2={y}
          stroke="#333"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />

        {/* Bias Connection (from a bias node/point to output) */}
        {/* Ends at the bottom edge of the output circle */}
        <line
          x1={outputX} y1={y + 80}
          x2={outputX} y2={y + circleRadius}
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

        {/* Bias Label */}
         <text x={outputX + 15} y={y + 80} textAnchor="start" dominantBaseline="middle" fill="#2980b9" fontSize="12" fontWeight="bold">
          b: {bias ? bias.toFixed(2) : "0.00"}
        </text>
        <circle cx={outputX} cy={y + 80} r={5} fill="#2980b9" />


        {/* Output Node */}
        <circle cx={outputX} cy={y} r={circleRadius} fill="#fff" stroke="#333" strokeWidth="2" />
        <text x={outputX} y={y} textAnchor="middle" dominantBaseline="middle" fontWeight="bold">Output</text>
        <text x={outputX} y={y - 45} textAnchor="middle" fontSize="12" fill="#555">Pos (m)</text>
        <text x={outputX} y={y - 60} textAnchor="middle" fontSize="14" fill="#333" fontWeight="bold">{output?.toFixed(2)}</text>

        {/* Equation */}
        <text x={175} y={180} textAnchor="middle" fontSize="14" fontStyle="italic" fill="#777">
          pos = w * t + b
        </text>
      </svg>
    </div>
  );
}

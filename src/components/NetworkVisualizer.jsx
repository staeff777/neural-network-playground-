export function NetworkVisualizer({
  input,       // can be number or array
  weight,      // can be number or array
  bias,
  output,
  formula = "y = w * x + b",
  inputLabel = "Input",   // can be string or array
  outputLabel = "Output",
  biasLabel = "b"
}) {
  const circleRadius = 30;
  const outputX = 300;

  // Normalize inputs to arrays
  const inputs = Array.isArray(input) ? input : [input];
  const weights = Array.isArray(weight) ? weight : [weight];
  const inputLabels = Array.isArray(inputLabel) ? inputLabel : [inputLabel];

  const bVal = Number(bias) || 0;
  const outVal = Number(output) || 0;

  // Determine layout based on number of inputs
  const numInputs = inputs.length;
  // Spacing
  const centerY = 100;
  const spacingY = 80;
  const startY = centerY - ((numInputs - 1) * spacingY) / 2;
  const inputX = 50;

  // SVG height needs to adapt if many inputs
  const svgHeight = Math.max(200, numInputs * 80 + 50);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff', textAlign: 'center' }}>
      <h3>Modell Architektur</h3>
      <svg width="350" height={svgHeight} style={{ overflow: 'visible' }}>
        <title>Network Visualization</title>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
        </defs>

        {inputs.map((inp, i) => {
            const y = startY + i * spacingY;
            const wVal = Number(weights[i]) || 0;
            const label = inputLabels[i] || `x${i+1}`;
            const val = Number(inp) || 0;

            return (
                <g key={i}>
                    {/* Connection Line */}
                    <line
                      x1={inputX} y1={y}
                      x2={outputX} y2={centerY}
                      stroke="#333"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />

                    {/* Weight Label (approximate position on line) */}
                    <g transform={`translate(${(inputX + outputX)/2 - 15}, ${(y + centerY)/2 - 10})`}>
                         <rect x="-15" y="-10" width="40" height="20" fill="#fff" rx="4" stroke="#ccc" />
                         <text x="5" y="5" textAnchor="middle" fill="#e74c3c" fontSize="11" fontWeight="bold">
                            {wVal.toFixed(1)}
                         </text>
                    </g>

                    {/* Input Node */}
                    <circle cx={inputX} cy={y} r={circleRadius} fill="#fff" stroke="#333" strokeWidth="2" />
                    <text x={inputX} y={y} textAnchor="middle" dominantBaseline="middle" fontWeight="bold" fontSize="12">In {i+1}</text>
                    <text x={inputX} y={y + 40} textAnchor="middle" fontSize="10" fill="#555">{label}</text>
                    <text x={inputX} y={y + 52} textAnchor="middle" fontSize="12" fill="#333" fontWeight="bold">{val.toFixed(0)}</text>
                </g>
            );
        })}

        {/* Bias Connection */}
        <line
          x1={outputX} y1={centerY + 60}
          x2={outputX} y2={centerY + circleRadius}
          stroke="#333"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
        />
        <circle cx={outputX} cy={centerY + 80} r={5} fill="#2980b9" />
        <text x={outputX + 15} y={centerY + 80} textAnchor="start" dominantBaseline="middle" fill="#2980b9" fontSize="12" fontWeight="bold">
          {biasLabel}: {bVal.toFixed(2)}
        </text>

        {/* Output Node */}
        <circle cx={outputX} cy={centerY} r={circleRadius} fill="#fff" stroke="#333" strokeWidth="2" aria-label="Output Node" />
        <text x={outputX} y={centerY} textAnchor="middle" dominantBaseline="middle" fontWeight="bold">Output</text>
        <text x={outputX} y={centerY - 45} textAnchor="middle" fontSize="12" fill="#555">{outputLabel}</text>
        <text x={outputX} y={centerY - 60} textAnchor="middle" fontSize="14" fill="#333" fontWeight="bold">{outVal.toFixed(2)}</text>

        {/* Formula */}
        <text x={175} y={svgHeight - 10} textAnchor="middle" fontSize="12" fontStyle="italic" fill="#777">
          {formula}
        </text>
      </svg>
    </div>
  );
}

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
  // Normalize inputs to arrays
  const inputs = Array.isArray(input) ? input : [input];
  const weights = Array.isArray(weight) ? weight : [weight];
  const inputLabels = Array.isArray(inputLabel) ? inputLabel : [inputLabel];

  const bVal = Number(bias) || 0;
  const outVal = Number(output) || 0;

  // Layout Constants
  const numInputs = inputs.length;
  const circleRadius = 24;
  const nodeDiameter = circleRadius * 2;
  const spacingY = 90; // Vertical spacing between inputs

  // Box Dimensions
  const boxWidth = 300; // Widened to fit internal components
  const boxPaddingTop = 60;
  const boxPaddingBottom = 60;

  // Calculate total height based on inputs
  const contentHeight = Math.max(1, (numInputs - 1)) * spacingY;
  const boxHeight = Math.max(150, contentHeight + boxPaddingTop + boxPaddingBottom);

  const svgHeight = boxHeight + 60;
  const svgWidth = 600; // Widened SVG

  const centerX = svgWidth / 2;
  const boxLeft = centerX - boxWidth / 2;
  const boxRight = centerX + boxWidth / 2;
  const centerY = boxHeight / 2 + 20;

  // Input Positions
  const startY = centerY - (contentHeight / 2);

  // Internal Layout Positions
  // Output is at boxRight.
  // Activation is to the left of Output.
  const activationX = boxRight - 80;
  // Sum Point is to the left of Activation.
  const sumPointX = activationX - 60;

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px', background: '#fff', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '10px' }}>Modell Architektur</h3>
      <svg width={svgWidth} height={svgHeight} style={{ overflow: 'visible' }}>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="27" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
          </marker>
        </defs>

        {/* The Model "Box" */}
        <rect
          x={boxLeft}
          y={20}
          width={boxWidth}
          height={boxHeight}
          rx="15"
          fill="none"
          stroke="#333"
          strokeWidth="3"
          strokeDasharray="5,5"
        />
        <text x={centerX} y={40} textAnchor="middle" fill="#777" fontSize="12" fontWeight="bold">NEURAL NETWORK</text>

        {/* Converge point for weights */}
        {(() => {
          const biasY = centerY - 50; // Coming from top

          return (
            <>
              {/* Inputs to Sum Point */}
              {inputs.map((inp, i) => {
                const y = numInputs > 1 ? startY + i * spacingY : centerY;
                const wVal = Number(weights[i]) || 0;
                const label = inputLabels[i] || `x${i + 1}`;
                const val = Number(inp) || 0;

                return (
                  <g key={i}>
                    {/* Line to Sum Point */}
                    <line
                      x1={boxLeft} y1={y}
                      x2={sumPointX} y2={centerY}
                      stroke="#999"
                      strokeWidth="1"
                    />

                    {/* Weight Label - positioned along the line */}
                    <g transform={`translate(${(boxLeft + sumPointX) / 2 + (i - (numInputs - 1) / 2) * 5}, ${(y + centerY) / 2})`}>
                      <rect x="-16" y="-9" width="32" height="18" fill="#fff" rx="4" stroke="#e0e0e0" />
                      <text x="0" y="4" textAnchor="middle" fill="#e74c3c" fontSize="10" fontWeight="bold">
                        {wVal.toFixed(1)}
                      </text>
                    </g>

                    {/* Input Node */}
                    <circle cx={boxLeft} cy={y} r={circleRadius} fill="#fff" stroke="#333" strokeWidth="2" />

                    {/* Input Label (Further Left) */}
                    <text x={boxLeft - 40} y={y} textAnchor="end" dominantBaseline="middle" fontWeight="bold" fontSize="14">
                      {label}
                    </text>
                    {/* Value */}
                    <text x={boxLeft} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#333">
                      {val.toFixed(simConfig?.id === 'spam' || simConfig?.id === 'spam_advanced' ? 0 : 1)}
                    </text>
                  </g>
                );
              })}

              {/* Sum Point to Activation */}
              <line x1={sumPointX} y1={centerY} x2={activationX} y2={centerY} stroke="#333" strokeWidth="2" />

              {/* Activation Node */}
              <g transform={`translate(${activationX}, ${centerY})`}>
                <rect x="-18" y="-18" width="36" height="36" rx="6" fill="#fff" stroke="#333" strokeWidth="2" />
                {/* Sigmoid-ish curve */}
                <path d="M -10 8 C -4 8, -4 -8, 10 -8" stroke="#333" strokeWidth="2" fill="none" />
              </g>

              {/* Activation to Output */}
              {/* Line starts from right edge of activation box (x+18) to left edge of output circle (boxRight - circleRadius) */}
              <line
                x1={activationX + 18} y1={centerY}
                x2={boxRight - circleRadius} y2={centerY}
                stroke="#333"
                strokeWidth="2"
              />


              {/* Bias to Sum Point */}
              <path
                d={`M ${activationX} ${biasY} Q ${activationX} ${centerY} ${sumPointX + 10} ${centerY}`}
                fill="none"
                stroke="#f39c12"
                strokeWidth="1"
                markerEnd="url(#arrowhead)"
              />
              <circle cx={activationX} cy={biasY} r={12} fill="#f1c40f" stroke="#f39c12" />
              <text x={activationX} y={biasY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="bold" fill="#fff">b</text>
              <text x={activationX + 18} y={biasY} textAnchor="start" dominantBaseline="middle" fontSize="12" fill="#f39c12" fontWeight="bold">
                {bVal.toFixed(2)}
              </text>

            </>
          )
        })()}

        {/* Output Node (On Right Boundary) */}
        <circle cx={boxRight} cy={centerY} r={circleRadius} fill="#fff" stroke="#333" strokeWidth="2" />
        <text x={boxRight} y={centerY} textAnchor="middle" dominantBaseline="middle" fontWeight="bold" fontSize="12">
          {outVal.toFixed(2)}
        </text>

        {/* Output Label (Further Right) */}
        <text x={boxRight + 40} y={centerY} textAnchor="start" dominantBaseline="middle" fontWeight="bold" fontSize="14" fill="#333">
          {outputLabel}
        </text>


        {/* Formula */}
        <text x={centerX} y={svgHeight - 15} textAnchor="middle" fontSize="12" fontStyle="italic" fill="#777">
          {formula}
        </text>
      </svg>
    </div>
  );
}

// Helper to access simConfig safely if needed, but props should suffice.
// Actually `simConfig` isn't in scope here. I used it for `toFixed`.
// I'll just use a safe default or pass a prop if needed. 
// For now, toFixed(1) for generic inputs is fine.
const simConfig = {};


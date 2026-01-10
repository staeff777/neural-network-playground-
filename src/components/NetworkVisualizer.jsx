import { LayeredNetworkVisualizer } from "./LayeredNetworkVisualizer";
import { useState } from "react";
import { getPlaygroundOptions } from "../lib/options.js";

export function NetworkVisualizer({
  input, // can be number or array
  weight, // can be number or array
  bias,
  output,
  formula = "y = w * x + b",
  inputLabel = "Input", // can be string or array
  outputLabel = "Output",
  biasLabel = "b",
  decimals = 1,
  model = null,
  collapseModelArchitectureByDefault,
  showActivation = true,
}) {
  const resolvedCollapseByDefault =
    typeof collapseModelArchitectureByDefault === "boolean"
      ? collapseModelArchitectureByDefault
      : getPlaygroundOptions().collapseModelArchitectureByDefault;
  const [showDetails, setShowDetails] = useState(!resolvedCollapseByDefault);

  if (model && model.getTopology) {
    // Normalize inputs
    let rawInput = input;
    if (
      input &&
      !Array.isArray(input) &&
      typeof input === "object" &&
      input.input &&
      Array.isArray(input.input)
    ) {
      rawInput = input.input;
    }
    const inputs = Array.isArray(rawInput) ? rawInput : [rawInput];
    const inpLabels = Array.isArray(inputLabel) ? inputLabel : [inputLabel];

    return (
      <LayeredNetworkVisualizer
        model={model}
        inputs={inputs}
        inputLabels={inpLabels}
        output={output}
        outputLabel={outputLabel}
        formula={formula}
        collapseModelArchitectureByDefault={collapseModelArchitectureByDefault}
      />
    );
  }

  // Normalize inputs to arrays
  let rawInput = input;
  if (
    input &&
    !Array.isArray(input) &&
    typeof input === "object" &&
    input.input &&
    Array.isArray(input.input)
  ) {
    rawInput = input.input;
  }
  const inputs = Array.isArray(rawInput) ? rawInput : [rawInput];
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
  const boxWidth = 260; // Widened to fit internal components
  const boxPaddingTop = 60;
  const boxPaddingBottom = 60;

  // Calculate total height based on inputs
  const contentHeight = Math.max(1, numInputs - 1) * spacingY;
  const boxHeight = Math.max(
    150,
    contentHeight + boxPaddingTop + boxPaddingBottom,
  );

  const svgHeight = boxHeight + 60;
  const svgWidth = 600; // Widened SVG

  const centerX = svgWidth / 2 + 10;
  const boxLeft = centerX - boxWidth / 2;
  const boxRight = centerX + boxWidth / 2;
  const centerY = boxHeight / 2 + 20;

  // Input Positions
  const startY = centerY - contentHeight / 2;

  // Internal Layout Positions
  // Output is at boxRight.
  // Activation is to the left of Output (optional).
  const activationX = boxRight - 50;
  // Sum Point is to the left of Activation (or to the left of Output if activation is hidden).
  const sumPointX = (showActivation ? activationX : boxRight - circleRadius) - 60;
  const biasNodeX = showActivation ? activationX - 20 : sumPointX;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "10px",
        background: "#fff",
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="model-title" style={{ marginBottom: "10px" }}>
        Model Architecture
      </div>
      <svg width={svgWidth} height={svgHeight} style={{ overflow: "visible" }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="27"
            refY="3.5"
            orient="auto"
          >
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
          fill="transparent"
          stroke="#333"
          strokeWidth="2"
          style={{ cursor: "pointer" }}
          onClick={() => setShowDetails((v) => !v)}
        />

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
                    {showDetails && (
                      <>
                        {/* Line to Sum Point */}
                        <line
                          x1={boxLeft}
                          y1={y}
                          x2={sumPointX}
                          y2={centerY}
                          stroke="#666"
                          strokeWidth="1"
                        />

                        {/* Weight Label - positioned along the line */}
                        <g
                          transform={`translate(${(boxLeft + sumPointX) / 2 + (1 - (numInputs - 1) / 2) * 5}, ${(y + centerY) / 2})`}
                        >
                          <rect
                            x="-24"
                            y="-8"
                            width="50"
                            height="18"
                            fill="#fff"
                            rx="4"
                            stroke="#e0e0e0"
                          />
                          <text
                            x="0"
                            y="5"
                            textAnchor="middle"
                            fill="#e74c3c"
                            fontSize="10"
                            fontWeight="bold"
                          >
                            {wVal.toFixed(1)}
                          </text>
                        </g>
                      </>
                    )}

                    {/* Input Node */}
                    <circle
                      cx={boxLeft}
                      cy={y}
                      r={circleRadius}
                      fill="#fff"
                      stroke="#333"
                      strokeWidth="2"
                    />

                    {/* Input Label (Further Left - Right Aligned) */}
                    <text
                      x={boxLeft - 30}
                      y={y + 2}
                      textAnchor="end"
                      style={{ textAnchor: "end" }}
                      dominantBaseline="middle"
                      fontWeight="bold"
                      fontSize="14"
                      fill="#333"
                    >
                      {label
                        .toString()
                        .split("\n")
                        .map((line, i, arr) => (
                          <tspan
                            key={i}
                            x={boxLeft - 30}
                            dy={
                              i === 0 ? `${(arr.length - 1) * -0.6}em` : "1.2em"
                            }
                          >
                            {line}
                          </tspan>
                        ))}
                    </text>
                    {/* Value */}
                    <text
                      x={boxLeft - 1}
                      y={y + 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fill="#333"
                    >
                      {val.toFixed(decimals)}
                    </text>
                  </g>
                );
              })}

              {showDetails && (
                <>
                  {/* Sum Point to Activation (or Output for linear models) */}
                  <line
                    x1={sumPointX}
                    y1={centerY}
                    x2={showActivation ? activationX : boxRight - circleRadius}
                    y2={centerY}
                    stroke="#666"
                    strokeWidth="1"
                  />

                  {showActivation && (
                    <>
                      {/* Activation Node */}
                      <g transform={`translate(${activationX}, ${centerY})`}>
                        <rect
                          x="-18"
                          y="-18"
                          width="36"
                          height="36"
                          rx="6"
                          fill="#fff"
                          stroke="#333"
                          strokeWidth="2"
                        />
                        {/* Sigmoid-ish curve */}
                        <path
                          d="M -10 8 C -4 8, -4 -8, 10 -8"
                          stroke="#333"
                          strokeWidth="2"
                          fill="none"
                        />
                      </g>

                      {/* Activation to Output */}
                      {/* Line starts from right edge of activation box (x+18) to left edge of output circle (boxRight - circleRadius) */}
                      <line
                        x1={activationX + 18}
                        y1={centerY}
                        x2={boxRight - circleRadius}
                        y2={centerY}
                        stroke="#333"
                        strokeWidth="2"
                      />
                    </>
                  )}

                  {/* Bias to Sum Point */}
                  <path
                    d={`M ${biasNodeX} ${biasY} Q ${biasNodeX} ${centerY} ${sumPointX + 10} ${centerY}`}
                    fill="none"
                    stroke="#f39c12"
                    strokeWidth="1"
                  />
                  <circle
                    cx={biasNodeX}
                    cy={biasY}
                    r={12}
                    fill="#f1c40f"
                    stroke="#f39c12"
                  />
                  <text
                    x={biasNodeX}
                    y={biasY + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="12"
                    fontWeight="bold"
                    fill="#fff"
                  >
                    {biasLabel}
                  </text>
                  <text
                    x={biasNodeX + 18}
                    y={biasY + 1}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fontSize="12"
                    fill="#f39c12"
                    fontWeight="bold"
                  >
                    {bVal.toFixed(2)}
                  </text>
                </>
              )}
            </>
          );
        })()}

        {/* Output Node (On Right Boundary) */}
        <circle
          cx={boxRight}
          cy={centerY}
          r={circleRadius}
          fill="#fff"
          stroke="#333"
          strokeWidth="2"
        />
        <text
          x={boxRight + 6}
          y={centerY + 3}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
        >
          {outVal.toFixed(2)}
        </text>

        {/* Output Label (Further Right) */}
        <text
          x={boxRight + 30}
          y={centerY + 2}
          textAnchor="start"
          dominantBaseline="middle"
          fontWeight="bold"
          fontSize="14"
          fill="#333"
        >
          {outputLabel
            .toString()
            .split("\n")
            .map((line, i, arr) => (
              <tspan
                key={i}
                x={boxRight + 33}
                dy={i === 0 ? `${(arr.length - 1) * -0.6}em` : "1.2em"}
              >
                {line}
              </tspan>
            ))}
        </text>

        {/* Formula */}
        {showDetails && (
          <foreignObject
            className="formula"
            x={centerX - 200}
            y={svgHeight - 25}
            width={400}
            height={20}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                height: "100%",
                fontSize: "18px",
                fontStyle: "italic",
                color: "#777",
              }}
            >
              {formula}
            </div>
          </foreignObject>
        )}
      </svg>
    </div>
  );
}

// Helper to access simConfig safely if needed, but props should suffice.
// Actually `simConfig` isn't in scope here. I used it for `toFixed`.
// I'll just use a safe default or pass a prop if needed.
// For now, toFixed(1) for generic inputs is fine.

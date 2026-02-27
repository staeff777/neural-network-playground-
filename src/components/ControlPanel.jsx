export function ControlPanel({
  onTrain,
  onRun,

  isTraining,
  trainingStep,
  dataCount,
  trainerType,
  onTrainerTypeChange,
  isRunning,
  simulationEnabled = true,
}) {
  return (
    <div
      class="control-panel"
      role="region"
      aria-label="Controls"
      style={{
        padding: "20px",
        background: "#eee",
        borderRadius: "8px",
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <span aria-live="polite">Data Points: {dataCount}</span>

      <div
        style={{
          borderLeft: "1px solid #ccc",
          paddingLeft: "10px",
          marginLeft: "10px",
          display: "flex",
          gap: "5px",
          alignItems: "center",
        }}
      >
        <label htmlFor="trainer-type" style={{ fontSize: "0.9em", color: "#555", marginRight: "5px" }}>Trainer:</label>
        <select
          id="trainer-type"
          value={trainerType}
          onChange={(e) => onTrainerTypeChange(e.target.value)}
          disabled={isTraining}
          aria-label="Trainer Type"
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value="exhaustive">Grid Search </option>
          <option value="random">Adaptive Random </option>
        </select>
        <span title={dataCount === 0 ? "Generate data points first to train" : ""}>
          <button
            onClick={onTrain}
            disabled={isTraining || dataCount === 0}
            aria-busy={isTraining}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              pointerEvents: (isTraining || dataCount === 0) ? "none" : "auto",
            }}
          >
            {isTraining && (
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="16 32" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            )}
            {isTraining ? "Searching..." : "2. Train"}
          </button>
        </span>
      </div>

      {simulationEnabled && (
        <button
          onClick={onRun}
          disabled={isTraining}
          aria-pressed={isRunning}
          style={isRunning ? { background: "#f39c12", color: "#000" } : {}}
        >
          3. Simulation {isRunning ? "Stop" : "Start"}
        </button>
      )}
    </div>
  );
}

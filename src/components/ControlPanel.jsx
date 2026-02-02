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
        <select
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
        <span
          title={
            isTraining
              ? "Training is currently in progress..."
              : dataCount === 0
              ? "No training data available. Simulation data is generated automatically."
              : "Start training to find optimal parameters"
          }
          style={{ cursor: (isTraining || dataCount === 0) ? "not-allowed" : "default" }}
        >
          <button
            onClick={onTrain}
            disabled={isTraining || dataCount === 0}
            aria-busy={isTraining}
            aria-label={isTraining ? "Training in progress" : "Start Training"}
            style={{ pointerEvents: (isTraining || dataCount === 0) ? "none" : "auto" }}
          >
            {isTraining ? "Searching..." : "2. Train"}
          </button>
        </span>
      </div>

      {simulationEnabled && (
        <span
          title={isTraining ? "Simulation controls are disabled during training" : (isRunning ? "Stop simulation" : "Start simulation")}
          style={{ cursor: isTraining ? "not-allowed" : "default" }}
        >
          <button
            onClick={onRun}
            disabled={isTraining}
            aria-pressed={isRunning}
            style={{
              pointerEvents: isTraining ? "none" : "auto",
              ...(isRunning ? { background: "#f39c12", color: "white" } : {})
            }}
          >
            3. Simulation {isRunning ? "Stop" : "Start"}
          </button>
        </span>
      )}
    </div>
  );
}

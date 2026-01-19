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
        <button
          onClick={onTrain}
          disabled={isTraining || dataCount === 0}
          aria-busy={isTraining}
          title={
            isTraining
              ? "Training in progress"
              : dataCount === 0
                ? "No data generated yet"
                : "Start training"
          }
        >
          {isTraining ? "Searching..." : "2. Train"}
        </button>
      </div>

      {simulationEnabled && (
        <button
          onClick={onRun}
          disabled={isTraining}
          aria-pressed={isRunning}
          title={
            isTraining
              ? "Cannot run simulation while training"
              : isRunning
                ? "Stop simulation"
                : "Start simulation"
          }
          style={isRunning ? { background: "#d35400", color: "white" } : {}}
        >
          3. Simulation {isRunning ? "Stop" : "Start"}
        </button>
      )}
    </div>
  );
}

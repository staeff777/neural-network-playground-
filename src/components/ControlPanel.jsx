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
  const isTrainDisabled = isTraining || dataCount === 0;

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
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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
          aria-label="Select Training Method"
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
          title={dataCount === 0 ? "Generate data first" : ""}
          style={{ cursor: isTrainDisabled ? "not-allowed" : "default" }}
        >
          <button
            onClick={onTrain}
            disabled={isTrainDisabled}
            aria-busy={isTraining}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              pointerEvents: isTrainDisabled ? "none" : "auto",
            }}
          >
            {isTraining && (
               <svg
                 viewBox="0 0 50 50"
                 style={{
                   width: '1em',
                   height: '1em',
                   animation: 'spin 1s linear infinite'
                 }}
               >
                 <circle
                   cx="25"
                   cy="25"
                   r="20"
                   fill="none"
                   stroke="currentColor"
                   strokeWidth="5"
                   strokeDasharray="80"
                   strokeDashoffset="0"
                 ></circle>
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
          style={isRunning ? { background: "#f39c12", color: "white" } : {}}
        >
          3. Simulation {isRunning ? "Stop" : "Start"}
        </button>
      )}
    </div>
  );
}

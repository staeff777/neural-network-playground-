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
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          {isTraining ? (
            <>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
                  opacity=".25"
                  fill="currentColor"
                />
                <path
                  d="M12,4a8,8,0,0,1,7.89,6.7A1.5,1.5,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.5,1.5,0,0,0,1.48-1.75A8,8,0,0,1,12,4Z"
                  fill="currentColor"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    dur="0.75s"
                    values="0 12 12;360 12 12"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
              Searching...
            </>
          ) : (
            "2. Train"
          )}
        </button>
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

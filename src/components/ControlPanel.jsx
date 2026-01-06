export function ControlPanel({

  onTrain,
  onRun,
  onReset,
  isTraining,
  trainingStep,
  dataCount,
  trainerType,
  onTrainerTypeChange,
  isRunning
}) {
  return (
    <div
      role="region"
      aria-label="Steuerung"
      style={{ padding: '20px', background: '#eee', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}
    >

      <span aria-live="polite">Datenpunkte: {dataCount}</span>

      <div style={{ borderLeft: '1px solid #ccc', paddingLeft: '10px', marginLeft: '10px', display: 'flex', gap: '5px', alignItems: 'center' }}>
        <select
          value={trainerType}
          onChange={e => onTrainerTypeChange(e.target.value)}
          disabled={isTraining}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="exhaustive">Grid Search </option>
          <option value="random">Adaptive Random </option>
        </select>
        <button
          onClick={onTrain}
          disabled={isTraining || dataCount === 0}
          aria-busy={isTraining}
        >
          {isTraining ? 'Suche läuft...' : '2. Trainieren'}
        </button>
      </div>

      <button
        onClick={onRun}
        disabled={isTraining}
        style={isRunning ? { background: '#f39c12', color: 'white' } : {}}
      >
        3. Simulation {isRunning ? 'Stoppen' : 'Starten'}
      </button>

      <button
        onClick={onReset}
        style={{ marginLeft: 'auto', background: '#e74c3c', color: 'white' }}
        aria-label="Simulation zurücksetzen"
      >
        Reset
      </button>
    </div>
  );
}

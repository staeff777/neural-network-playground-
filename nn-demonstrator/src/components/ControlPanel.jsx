export function ControlPanel({ onGenerateData, onTrain, onRun, onReset, isTraining, trainingStep, dataCount }) {
  return (
    <div style={{ padding: '20px', background: '#eee', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button onClick={onGenerateData} disabled={isTraining}>
        1. Trainingsdaten Generieren
      </button>
      <span>Datenpunkte: {dataCount}</span>

      <button onClick={onTrain} disabled={isTraining || dataCount === 0}>
        2. Trainieren (Suche)
      </button>

      <button onClick={onRun} disabled={isTraining}>
        3. Simulation Starten
      </button>

      <button onClick={onReset} style={{ marginLeft: 'auto', background: '#e74c3c', color: 'white' }}>
        Reset
      </button>
    </div>
  );
}

export function ControlPanel({
  onGenerateData,
  onTrain,
  onRun,
  onReset,
  onToggleData,
  showData,
  isTraining,
  trainingStep,
  dataCount
}) {
  return (
    <div style={{ padding: '20px', background: '#eee', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      <button onClick={onGenerateData} disabled={isTraining}>
        1. Trainingsdaten Generieren
      </button>
      <span>Datenpunkte: {dataCount}</span>

      {dataCount > 0 && (
        <button onClick={onToggleData} style={{ fontSize: '0.8rem', padding: '5px 10px' }}>
          {showData ? 'Daten verbergen' : 'Daten zeigen'}
        </button>
      )}

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

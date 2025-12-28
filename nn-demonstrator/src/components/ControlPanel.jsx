export function ControlPanel({
  onGenerateData,
  onTrain,
  onRun,
  onReset,
  isTraining,
  trainingStep,
  dataCount
}) {
  return (
    <div style={{ padding: '20px', background: '#eee', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }} role="region" aria-label="Steuerpanel">
      <button
        onClick={onGenerateData}
        disabled={isTraining}
        title={isTraining ? "Training läuft" : "Trainingsdaten generieren"}
        aria-label="Trainingsdaten generieren"
      >
        1. Trainingsdaten Generieren
      </button>
      <span aria-live="polite">Datenpunkte: {dataCount}</span>

      <button
        onClick={onTrain}
        disabled={isTraining || dataCount === 0}
        aria-busy={isTraining}
        title={isTraining ? "Training läuft" : dataCount === 0 ? "Keine Daten vorhanden" : "Training starten"}
        aria-label={isTraining ? "Training läuft" : "Modell trainieren"}
      >
        {isTraining ? "Training läuft..." : "2. Trainieren (Suche)"}
      </button>

      <button
        onClick={onRun}
        disabled={isTraining}
        title={isTraining ? "Training läuft" : "Simulation starten"}
        aria-label="Simulation starten"
      >
        3. Simulation Starten
      </button>

      <button
        onClick={onReset}
        style={{ marginLeft: 'auto', background: '#e74c3c', color: 'white' }}
        title="Alles zurücksetzen"
        aria-label="Anwendung zurücksetzen"
      >
        Reset
      </button>
    </div>
  );
}

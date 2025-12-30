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
    <div
      role="region"
      aria-label="Simulation Controls"
      aria-busy={isTraining}
      style={{ padding: '20px', background: '#eee', borderRadius: '8px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}
    >
      <button
        onClick={onGenerateData}
        disabled={isTraining}
        title={isTraining ? "Training läuft..." : "Generiere neue Trainingsdaten"}
      >
        1. Trainingsdaten Generieren
      </button>
      <span aria-live="polite">Datenpunkte: {dataCount}</span>

      <button
        onClick={onTrain}
        disabled={isTraining || dataCount === 0}
        title={
          isTraining ? "Training läuft..." :
          dataCount === 0 ? "Keine Daten vorhanden. Bitte zuerst generieren." :
          "Starte den Trainingsprozess"
        }
      >
        2. Trainieren (Suche)
      </button>

      <button
        onClick={onRun}
        disabled={isTraining}
        title={isTraining ? "Training läuft..." : "Starte die Simulation mit dem aktuellen Modell"}
      >
        3. Simulation Starten
      </button>

      <button
        onClick={onReset}
        style={{ marginLeft: 'auto', background: '#e74c3c', color: 'white' }}
        title="Setze das Modell und die Daten zurück"
      >
        Reset
      </button>
    </div>
  );
}

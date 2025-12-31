import { useState, useEffect, useRef } from 'preact/hooks';
import { ExhaustiveTrainer } from './lib/trainer';
import { TrainingVisualizer } from './components/TrainingVisualizer';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { ControlPanel } from './components/ControlPanel';
import { getSimulationConfig } from './lib/simulations/registry';
import './app.css';

export function App() {
  const [simConfig, setSimConfig] = useState(null);

  // Logic Objects
  const groundTruth = useRef(null);
  const neuralNet = useRef(null);


  // App State
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [trainingData, setTrainingData] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [trainingStepIndex, setTrainingStepIndex] = useState(-1);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('simulation');
  const [statusMsg, setStatusMsg] = useState('Bereit.');

  // Ref for tracking time delta
  const lastTimeRef = useRef(0);

  // Initialize Simulation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const simId = params.get('sim') || 'physics';
    const config = getSimulationConfig(simId);

    if (!config) {
      setStatusMsg('Fehler: Simulation nicht gefunden.');
      return;
    }

    // Initialize Logic
    try {
      groundTruth.current = new config.GroundTruth(...(config.groundTruthDefaults || []));
      neuralNet.current = new config.Model();
      // Defaults
      if (config.defaultParams) {
        if (config.defaultParams.weight !== undefined) neuralNet.current.setWeight(config.defaultParams.weight);
        if (config.defaultParams.weights !== undefined && neuralNet.current.setWeights) neuralNet.current.setWeights(config.defaultParams.weights);
        if (config.defaultParams.bias !== undefined) neuralNet.current.setBias(config.defaultParams.bias);
      }

      setSimConfig(config);
    } catch (e) {
      console.error("Initialization Error:", e);
      setStatusMsg(`Init Fehler: ${e.message}`);
    }
  }, []);

  // Animation Loop for Simulation
  useEffect(() => {
    let animationFrameId;

    const loop = (timestamp) => {
      if (!isRunning) return;

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const dt = (timestamp - lastTimeRef.current) / 1000; // Delta time in seconds
      lastTimeRef.current = timestamp;

      // Cap dt to prevent huge jumps if tab was backgrounded
      const safeDt = Math.min(dt, 0.1);

      setTime(prevTime => {
        // Physics logic was originally tuned to 0.05 per frame @ 60fps = 3.0 units/sec.
        // To preserve that speed: time += safeDt * 3.
        const speedMultiplier = 3.0;
        const newTime = prevTime + (safeDt * speedMultiplier);

        // Check for auto-stop
        if (simConfig && simConfig.isFinished && simConfig.isFinished(newTime)) {
          setIsRunning(false);
          setStatusMsg('Simulation beendet.');
          return newTime;
        }

        return newTime;
      });

      animationFrameId = requestAnimationFrame(loop);
    };

    if (isRunning) {
      lastTimeRef.current = 0; // Reset timer start
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, simConfig]);


  const handleGenerateData = () => {
    try {
      if (!simConfig) return;
      if (!groundTruth.current) throw new Error("Ground Truth not initialized");

      const data = simConfig.generateData(groundTruth.current);
      setTrainingData(data);
      setStatusMsg(`${data.length} Trainingsdaten generiert.`);
      setActiveTab('data');
    } catch (e) {
      console.error("Generate Data Error:", e);
      setStatusMsg(`Fehler beim Generieren: ${e.message}`);
    }
  };

  const handleTrain = async () => {
    try {
      if (trainingData.length === 0 || !simConfig) return;

      setIsTraining(true);
      setTrainingStepIndex(0); // Will visually track the latest added point
      setTrainingHistory([]); // Start fresh
      setStatusMsg('Suche optimales Gewicht und Bias (Live Visualisierung)...');
      setActiveTab('training');

      const trainer = new ExhaustiveTrainer(neuralNet.current);

      // Progress Callback
      const handleProgress = (newChunk, bestSoFar) => {
        // Append new points
        setTrainingHistory(prev => {
          const updated = [...prev, ...newChunk];
          // Update Step Index to the end of the list to mimic "scanning cursor"
          setTrainingStepIndex(updated.length - 1);
          return updated;
        });

        // Optional: Live update of the model to the "Best So Far"
        // This is cool because the user sees the model getting better in the "Neural Network" view instantly
        if (bestSoFar && bestSoFar.bestParams) {
          // Generic
          if (neuralNet.current.setWeights) {
            const { weights, bias } = bestSoFar.bestParams;
            neuralNet.current.setWeights(weights);
            neuralNet.current.setBias(bias);
          }
        } else if (bestSoFar && bestSoFar.bestWeight !== undefined) {
          // Legacy
          neuralNet.current.setWeight(bestSoFar.bestWeight);
          neuralNet.current.setBias(bestSoFar.bestBias);
        }
      };

      let result;
      if (simConfig.trainingConfig.params) {
        // Generic Trainer
        result = await trainer.trainAsync(trainingData, simConfig.trainingConfig.params, handleProgress);
      } else {
        // Legacy Trainer
        result = await trainer.trainAsync(
          trainingData,
          simConfig.trainingConfig.weightRange,
          simConfig.trainingConfig.biasRange,
          handleProgress
        );
      }

      setStatusMsg(`Training fertig! Min Error: ${result.minError.toFixed(5)}`);
      setIsTraining(false);
    } catch (e) {
      console.error("Training Error:", e);
      setIsTraining(false);
      setStatusMsg(`Fehler beim Training: ${e.message}`);
    }
  };

  const handleRun = () => {
    setTime(0);
    setIsRunning(true);
    setStatusMsg('Simulation läuft...');
    setActiveTab('simulation');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setTrainingData([]);
    setTrainingHistory([]);
    setTrainingStepIndex(-1);
    try {
      if (neuralNet.current && simConfig?.defaultParams) {
        if (simConfig.defaultParams.weight !== undefined) neuralNet.current.setWeight(simConfig.defaultParams.weight);
        if (simConfig.defaultParams.weights !== undefined && neuralNet.current.setWeights) neuralNet.current.setWeights(simConfig.defaultParams.weights);
        if (simConfig.defaultParams.bias !== undefined) neuralNet.current.setBias(simConfig.defaultParams.bias);
      }
    } catch (e) {
      console.error("Reset Error:", e);
    }
    setStatusMsg('Reset durchgeführt.');
  };

  if (!simConfig) return <div>Lade Simulation...</div>;

  const CanvasComponent = simConfig.CanvasComponent;
  const vizProps = simConfig.networkViz || {};

  const currentInput = simConfig.getInput ? simConfig.getInput(time) : time;

  return (
    <div className="container">
      <header>
        <h1>Neural Network Demonstrator</h1>
        <p>{simConfig.title}</p>
        <div className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
          <a href="?sim=physics" style={{ marginRight: '10px', fontWeight: simConfig.id === 'physics' ? 'bold' : 'normal' }}>Phase 1 (Physik)</a>
          <a href="?sim=spam" style={{ marginRight: '10px', fontWeight: simConfig.id === 'spam' ? 'bold' : 'normal' }}>Phase 2 (Spam)</a>
          <a href="?sim=spam_advanced" style={{ fontWeight: simConfig.id === 'spam_advanced' ? 'bold' : 'normal' }}>Phase 3 (Spam Extended)</a>
        </div>
      </header>

      <main>
        <div className="top-section" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'start' }}>
          <div className="simulation-wrapper" style={{ flex: '1 1 500px' }}>
            <div className="simulation-section">
              <div className="tabs">
                <button
                  className={`tab-button ${activeTab === 'simulation' ? 'active' : ''}`}
                  onClick={() => setActiveTab('simulation')}
                >
                  Simulation
                </button>
                <button
                  className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
                  onClick={() => setActiveTab('data')}
                >
                  Trainingsdaten
                </button>
                <button
                  className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
                  onClick={() => setActiveTab('training')}
                >
                  Training
                </button>
              </div>

              {activeTab === 'simulation' && (
                <>
                  {/* Pass current prediction to canvas so it can visualize it */}
                  {(() => {
                    let pred = 0;
                    try {
                      if (neuralNet.current) {
                        pred = neuralNet.current.predict(currentInput);
                      }
                    } catch (e) { console.error("Predict Error", e); }

                    return (
                      <CanvasComponent
                        time={time}
                        data={trainingData} // Some sims need data for visualization (like spam)
                        currentInput={currentInput}
                        currentPrediction={pred}
                        groundTruth={groundTruth.current}
                        neuralNet={neuralNet.current}
                      />
                    );
                  })()}

                  <div className="stats" style={{ marginTop: '10px' }}>
                    <p>{simConfig.description}</p>
                    <p style={{ color: '#646cff', fontWeight: 'bold' }}>Status: {statusMsg}</p>
                  </div>
                </>
              )}

              {activeTab === 'data' && (
                <div className="data-content">
                  {trainingData.length > 0 ? (
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ background: '#eee', borderBottom: '2px solid #ddd' }}>
                            {/* Dynamic Header Generation */}
                            {Array.isArray(vizProps.inputLabels) ? (
                              vizProps.inputLabels.map((lbl, idx) => (
                                <th key={idx} style={{ padding: '8px' }}>{lbl}</th>
                              ))
                            ) : (
                              <th style={{ padding: '8px' }}>Input ({vizProps.inputLabel})</th>
                            )}
                            <th style={{ padding: '8px' }}>Target</th>
                            <th style={{ padding: '8px' }}>E-Mail Text</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trainingData.map((d, i) => {
                            // Color coding
                            const isSpam = d.target === 1;
                            const rowColor = isSpam ? '#ffebee' : '#e8f5e9'; // Light Red / Light Green

                            return (
                              <tr key={i} style={{ background: rowColor, borderBottom: '1px solid #ddd' }}>
                                {/* Dynamic Feature Cells */}
                                {Array.isArray(d.input) ? (
                                  d.input.map((v, idx) => (
                                    <td key={idx} style={{ padding: '8px' }}>{v.toFixed(0)}</td>
                                  ))
                                ) : (
                                  <td style={{ padding: '8px' }}>{d.input.toFixed(2)}</td>
                                )}

                                <td style={{ padding: '8px', fontWeight: 'bold', color: isSpam ? '#c0392b' : '#27ae60' }}>
                                  {isSpam ? 'SPAM' : 'HAM'}
                                </td>
                                <td style={{ padding: '8px', color: '#555', fontStyle: 'italic', maxWidth: '300px' }}>
                                  {d.text || '-'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      Noch keine Trainingsdaten generiert.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'training' && (
                <div className="training-content">
                  {trainingHistory.length > 0 ? (
                    <TrainingVisualizer
                      history={trainingHistory}
                      currentStepIndex={trainingStepIndex}
                      isTraining={isTraining}
                      paramsConfig={simConfig.trainingConfig.params}
                    />
                  ) : (
                    <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      Noch kein Training gestartet.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="network-wrapper" style={{ flex: '0 0 350px' }}>
            <NetworkVisualizer
              input={currentInput}
              weight={neuralNet.current ? (neuralNet.current.weights || neuralNet.current.weight) : 0}
              bias={neuralNet.current ? neuralNet.current.bias : 0}
              output={neuralNet.current ? neuralNet.current.predict(currentInput) : 0}
              formula={vizProps.formula}
              inputLabel={vizProps.inputLabels || vizProps.inputLabel}
              outputLabel={vizProps.outputLabel}
              biasLabel={vizProps.biasLabel}
            />
          </div>
        </div>

        <ControlPanel
          onGenerateData={handleGenerateData}
          onTrain={handleTrain}
          onRun={handleRun}
          onReset={handleReset}
          isTraining={isTraining}
          trainingStep={trainingStepIndex}
          dataCount={trainingData.length}
        />
      </main>
    </div>
  );
}

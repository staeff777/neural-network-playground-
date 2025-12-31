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
  const trainer = useRef(null);

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
        if(config.defaultParams) {
            if (config.defaultParams.weight !== undefined) neuralNet.current.setWeight(config.defaultParams.weight);
            if (config.defaultParams.weights !== undefined && neuralNet.current.setWeights) neuralNet.current.setWeights(config.defaultParams.weights);
            if (config.defaultParams.bias !== undefined) neuralNet.current.setBias(config.defaultParams.bias);
        }

        trainer.current = new ExhaustiveTrainer(neuralNet.current);
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

  // Training Loop
  useEffect(() => {
    let intervalId;
    if (isTraining && trainingHistory.length > 0) {
      intervalId = setInterval(() => {
        setTrainingStepIndex(prev => {
          const next = prev + 10;
          if (next >= trainingHistory.length) {
            setIsTraining(false);
            let bestIndex = 0;
            let minErr = Infinity;
            trainingHistory.forEach((h, i) => {
              if (h.error < minErr) {
                minErr = h.error;
                bestIndex = i;
              }
            });
            const best = trainingHistory[bestIndex];

            // Apply best params
            if (best.params) {
                // Generic Trainer
                if (neuralNet.current.setWeights) {
                   const pConfig = simConfig.trainingConfig.params;
                   if (pConfig) {
                       const weights = [];
                       let bias = 0;
                       best.params.forEach((val, idx) => {
                           if (pConfig[idx].name.toLowerCase().includes('bias')) bias = val;
                           else weights.push(val);
                       });
                       neuralNet.current.setWeights(weights);
                       neuralNet.current.setBias(bias);
                   }
                }
            } else {
                // Legacy
                neuralNet.current.setWeight(best.weight);
                neuralNet.current.setBias(best.bias);
            }

            setStatusMsg(`Training fertig! Error: ${minErr.toFixed(4)}`);
            return bestIndex;
          }

          // Step Update
          const currentPoint = trainingHistory[next];
          if (currentPoint.params) {
              // Generic
               const pConfig = simConfig.trainingConfig.params;
               if (pConfig) {
                   const weights = [];
                   let bias = 0;
                   currentPoint.params.forEach((val, idx) => {
                       if (pConfig[idx].name.toLowerCase().includes('bias')) bias = val;
                       else weights.push(val);
                   });
                   neuralNet.current.setWeights(weights);
                   neuralNet.current.setBias(bias);
               }
          } else {
              // Legacy
              neuralNet.current.setWeight(currentPoint.weight);
              neuralNet.current.setBias(currentPoint.bias);
          }
          return next;
        });
      }, 5);
    }
    return () => clearInterval(intervalId);
  }, [isTraining, trainingHistory, simConfig]);

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

  const handleTrain = () => {
    try {
        if (trainingData.length === 0 || !simConfig) return;

        setIsTraining(true);
        setTrainingStepIndex(0);
        setStatusMsg('Suche optimales Gewicht und Bias...');
        setActiveTab('training');

        let result;
        if (simConfig.trainingConfig.params) {
            // Generic Trainer
            result = trainer.current.train(trainingData, simConfig.trainingConfig.params);
        } else {
            // Legacy Trainer
            result = trainer.current.train(
                trainingData,
                simConfig.trainingConfig.weightRange,
                simConfig.trainingConfig.biasRange
            );
        }
        setTrainingHistory(result.history);
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
            <a href="?sim=physics" style={{ marginRight: '10px', fontWeight: simConfig.id==='physics'?'bold':'normal' }}>Phase 1 (Physik)</a>
            <a href="?sim=spam" style={{ marginRight: '10px', fontWeight: simConfig.id==='spam'?'bold':'normal' }}>Phase 2 (Spam)</a>
            <a href="?sim=spam_advanced" style={{ fontWeight: simConfig.id==='spam_advanced'?'bold':'normal' }}>Phase 3 (Spam Extended)</a>
        </div>
      </header>

      <main>
        <div className="top-section" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'start' }}>
            <div className="simulation-wrapper" style={{ flex: '1 1 500px' }}>
                <div className="simulation-section">
                  <div className="tabs" role="tablist" aria-label="Ansichten">
                    <button
                      role="tab"
                      id="tab-simulation"
                      aria-selected={activeTab === 'simulation'}
                      aria-controls="panel-simulation"
                      className={`tab-button ${activeTab === 'simulation' ? 'active' : ''}`}
                      onClick={() => setActiveTab('simulation')}
                    >
                      Simulation
                    </button>
                    <button
                      role="tab"
                      id="tab-data"
                      aria-selected={activeTab === 'data'}
                      aria-controls="panel-data"
                      className={`tab-button ${activeTab === 'data' ? 'active' : ''}`}
                      onClick={() => setActiveTab('data')}
                    >
                      Trainingsdaten
                    </button>
                    <button
                      role="tab"
                      id="tab-training"
                      aria-selected={activeTab === 'training'}
                      aria-controls="panel-training"
                      className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
                      onClick={() => setActiveTab('training')}
                    >
                      Training
                    </button>
                  </div>

                  {activeTab === 'simulation' && (
                    <div role="tabpanel" id="panel-simulation" aria-labelledby="tab-simulation">
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
                    </div>
                  )}

                  {activeTab === 'data' && (
                    <div
                      role="tabpanel"
                      id="panel-data"
                      aria-labelledby="tab-data"
                      className="data-content"
                    >
                      {trainingData.length > 0 ? (
                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#eee' }}>
                                <th style={{ padding: '5px' }}>Input ({Array.isArray(vizProps.inputLabels) ? 'Vektor' : vizProps.inputLabel})</th>
                                <th style={{ padding: '5px' }}>Target ({vizProps.outputLabel})</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trainingData.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '5px' }}>
                                    {Array.isArray(d.input)
                                        ? `[${d.input.map(v => v.toFixed(0)).join(', ')}]`
                                        : d.input.toFixed(2)}
                                  </td>
                                  <td style={{ padding: '5px' }}>{d.target.toFixed(2)}</td>
                                </tr>
                              ))}
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
                    <div
                      role="tabpanel"
                      id="panel-training"
                      aria-labelledby="tab-training"
                      className="training-content"
                    >
                      {trainingHistory.length > 0 ? (
                        <TrainingVisualizer
                          history={trainingHistory}
                          currentStepIndex={trainingStepIndex}
                          isTraining={isTraining}
                          // Only 2D visualizer works for now.
                          // If generic params, we can't visualize 5D space easily.
                          // Maybe show Error over Time graph instead?
                          showGraph={!simConfig.trainingConfig.params}
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

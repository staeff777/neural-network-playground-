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

    // Initialize Logic
    groundTruth.current = new config.GroundTruth(...(config.groundTruthDefaults || []));
    neuralNet.current = new config.Model();
    // Defaults
    if(config.defaultParams) {
        if (config.defaultParams.weight !== undefined) neuralNet.current.setWeight(config.defaultParams.weight);
        if (config.defaultParams.bias !== undefined) neuralNet.current.setBias(config.defaultParams.bias);
    }

    trainer.current = new ExhaustiveTrainer(neuralNet.current);

    setSimConfig(config);
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
            neuralNet.current.setWeight(best.weight);
            neuralNet.current.setBias(best.bias);
            setStatusMsg(`Training fertig! w: ${best.weight}, b: ${best.bias}`);
            return bestIndex;
          }
          const currentPoint = trainingHistory[next];
          neuralNet.current.setWeight(currentPoint.weight);
          neuralNet.current.setBias(currentPoint.bias);
          return next;
        });
      }, 5);
    }
    return () => clearInterval(intervalId);
  }, [isTraining, trainingHistory]);

  const handleGenerateData = () => {
    if (!simConfig) return;
    const data = simConfig.generateData(groundTruth.current);
    setTrainingData(data);
    setStatusMsg(`${data.length} Trainingsdaten generiert.`);
    setActiveTab('data');
  };

  const handleTrain = () => {
    if (trainingData.length === 0 || !simConfig) return;

    setIsTraining(true);
    setTrainingStepIndex(0);
    setStatusMsg('Suche optimales Gewicht und Bias...');
    setActiveTab('training');

    const { history } = trainer.current.train(
        trainingData,
        simConfig.trainingConfig.weightRange,
        simConfig.trainingConfig.biasRange
    );
    setTrainingHistory(history);
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
    if (neuralNet.current && simConfig?.defaultParams) {
        neuralNet.current.setWeight(simConfig.defaultParams.weight || 0);
        neuralNet.current.setBias(simConfig.defaultParams.bias || 0);
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
            <a href="?sim=spam" style={{ fontWeight: simConfig.id==='spam'?'bold':'normal' }}>Phase 2 (Spam)</a>
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
                      <CanvasComponent
                          time={time}
                          input={currentInput}
                          groundTruth={groundTruth.current}
                          neuralNet={neuralNet.current}
                      />
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
                          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#eee' }}>
                                <th style={{ padding: '5px' }}>Input ({vizProps.inputLabel})</th>
                                <th style={{ padding: '5px' }}>Target ({vizProps.outputLabel})</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trainingData.map((d, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '5px' }}>{d.input.toFixed(2)}</td>
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
                    <div className="training-content">
                      {trainingHistory.length > 0 ? (
                        <TrainingVisualizer
                          history={trainingHistory}
                          currentStepIndex={trainingStepIndex}
                          isTraining={isTraining}
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
                    weight={neuralNet.current ? neuralNet.current.weight : 0}
                    bias={neuralNet.current ? neuralNet.current.bias : 0}
                    output={neuralNet.current ? neuralNet.current.predict(currentInput) : 0}
                    formula={vizProps.formula}
                    inputLabel={vizProps.inputLabel}
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

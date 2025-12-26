import { useState, useEffect, useRef } from 'preact/hooks';
import { GroundTruth } from './lib/physics';
import { SimpleNeuralNet, ExhaustiveTrainer } from './lib/model';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TrainingVisualizer } from './components/TrainingVisualizer';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { ControlPanel } from './components/ControlPanel';
import './app.css';

export function App() {
  // Logic Objects
  const groundTruth = useRef(new GroundTruth(30, 50)).current; // Velocity 30, Start Pos 50
  const neuralNet = useRef(new SimpleNeuralNet()).current;
  const trainer = useRef(new ExhaustiveTrainer(neuralNet)).current;

  // App State
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [trainingData, setTrainingData] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [trainingStepIndex, setTrainingStepIndex] = useState(-1);
  const [isTraining, setIsTraining] = useState(false);
  const [activeTab, setActiveTab] = useState('simulation');
  const [statusMsg, setStatusMsg] = useState('Bereit.');

  // Animation Loop for Simulation
  useEffect(() => {
    let animationFrameId;

    const loop = (timestamp) => {
      if (isRunning) {
        setTime(t => t + 0.05);
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    if (isRunning) {
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning]);

  // Animation Loop for Training Visualization
  useEffect(() => {
    let intervalId;
    if (isTraining && trainingHistory.length > 0) {
      intervalId = setInterval(() => {
        setTrainingStepIndex(prev => {
          const next = prev + 10; // Speed up visualization as there are many steps now
          if (next >= trainingHistory.length) {
            // Training Done
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
            neuralNet.setWeight(best.weight);
            neuralNet.setBias(best.bias);
            setStatusMsg(`Training fertig! w: ${best.weight}, b: ${best.bias}`);
            return bestIndex;
          }
          // Update model visualization
          const currentPoint = trainingHistory[next];
          neuralNet.setWeight(currentPoint.weight);
          neuralNet.setBias(currentPoint.bias);
          return next;
        });
      }, 5); // Faster updates
    }
    return () => clearInterval(intervalId);
  }, [isTraining, trainingHistory, neuralNet]);

  const handleGenerateData = () => {
    const times = Array.from({ length: 20 }, (_, i) => i * 0.5);
    const data = trainer.generateData(groundTruth, times);
    setTrainingData(data);
    setStatusMsg(`${data.length} Trainingsdaten generiert.`);
  };

  const handleTrain = () => {
    if (trainingData.length === 0) return;

    setIsTraining(true);
    setTrainingStepIndex(0);
    setStatusMsg('Suche optimales Gewicht und Bias...');

    // Run training with both ranges
    // Weight: 0 to 60, step 1
    // Bias: 0 to 100, step 2 (to keep iterations reasonable for demo ~60*50=3000 steps)
    const { history } = trainer.train(
        trainingData,
        { min: 0, max: 60, step: 1 },
        { min: 0, max: 100, step: 2 }
    );
    setTrainingHistory(history);
  };

  const handleRun = () => {
    setTime(0);
    setIsRunning(true);
    setStatusMsg('Simulation läuft...');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setTrainingData([]);
    setTrainingHistory([]);
    setTrainingStepIndex(-1);
    neuralNet.setWeight(0);
    neuralNet.setBias(0);
    setStatusMsg('Reset durchgeführt.');
  };

  return (
    <div className="container">
      <header>
        <h1>Neural Network Demonstrator</h1>
        <p>Phase 1: Lineare Regression (Exhaustive Search 2D)</p>
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
                  </div>

                  {activeTab === 'simulation' && (
                    <>
                      <SimulationCanvas
                          time={time}
                          groundTruth={groundTruth}
                          neuralNet={neuralNet}
                      />
                      <div className="stats" style={{ marginTop: '10px' }}>
                          <p><strong>Ziel (Ground Truth):</strong> Vel={groundTruth.velocity}, Pos0={groundTruth.initialPosition}</p>
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
                                <th style={{ padding: '5px' }}>Input (Zeit)</th>
                                <th style={{ padding: '5px' }}>Target (Position)</th>
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
                </div>
            </div>

            <div className="network-wrapper" style={{ flex: '0 0 350px' }}>
                <NetworkVisualizer
                    input={time}
                    weight={neuralNet.weight}
                    bias={neuralNet.bias}
                    output={neuralNet.predict(time)}
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

        {trainingHistory.length > 0 && (
          <div className="training-section">
            <TrainingVisualizer
              history={trainingHistory}
              currentStepIndex={trainingStepIndex}
              isTraining={isTraining}
            />
          </div>
        )}
      </main>
    </div>
  );
}

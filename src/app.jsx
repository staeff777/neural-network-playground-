import { useState, useEffect, useRef } from 'preact/hooks';
import { ExhaustiveTrainer } from './lib/trainer';
import { TrainingVisualizer } from './components/TrainingVisualizer';
import { NetworkVisualizer } from './components/NetworkVisualizer';
import { PositionTimeGraph } from './components/simulations/PositionTimeGraph';
import { ControlPanel } from './components/ControlPanel';
import { ArchitectureGallery } from './components/debug/ArchitectureGallery';
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
  const [dataViewMode, setDataViewMode] = useState('table'); // 'plot' or 'table'
  const [trainerType, setTrainerType] = useState('exhaustive');
  const [statusMsg, setStatusMsg] = useState('Bereit.');

  // Ref for tracking time delta
  const lastTimeRef = useRef(0);

  // Initialize Simulation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const simId = params.get('sim') || 'physics';

    if (simId === 'gallery') {
      setSimConfig({ id: 'gallery', type: 'gallery' });
      return;
    }

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

      // Auto-generate data on load
      if (groundTruth.current) {
        try {
          const data = config.generateData(groundTruth.current);
          setTrainingData(data);
          // Not setting active tab to 'data' or message here to avoid visual jarring on load, 
          // but we could set a silent status if needed.
          // setStatusMsg(`${data.length} Trainingsdaten automatisch generiert.`);
        } catch (e) {
          console.error("Auto-generate data error:", e);
        }
      }
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

        if (bestSoFar && bestSoFar.message) {
          setStatusMsg(bestSoFar.message);
        } else {
          // Only revert to generic message if NO message is passed, to avoid flickering?
          // Actually, trainer only sends message transiently or sticky?
          // Let's rely on standard status if no message.
          // Or better: Let "statusMsg" stick for a bit.
          // Simpler: Just set it if present.
          if (bestSoFar && bestSoFar.message) setStatusMsg(bestSoFar.message);
        }

        // Optional: Live update of the model to the "Best So Far"
        // This is cool because the user sees the model getting better in the "Neural Network" view instantly
        if (bestSoFar && bestSoFar.bestParams) {
          if (neuralNet.current.setParams) {
            neuralNet.current.setParams(bestSoFar.bestParams);
          } else if (neuralNet.current.setWeights) {
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
      if (trainerType === 'random') {
        // Adaptive Random Trainer
        setStatusMsg('Suche optimales Gewicht und Bias (Random Search)...');
        result = await trainer.trainRandomAsync(trainingData, simConfig.trainingConfig.params, handleProgress);
      } else if (simConfig.trainingConfig.params) {
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

  if (simConfig.type === 'gallery') {
    return (
      <div className="container">
        <header>
          <h1>Neural Network Demonstrator</h1>
          <p>Architecture Gallery (Debug)</p>
          <div className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href="?sim=physics" style={{ marginRight: '10px' }}>Back to App</a>
          </div>
        </header>
        <main>
          <ArchitectureGallery />
        </main>
      </div>
    )
  }

  const CanvasComponent = simConfig.CanvasComponent;
  const vizProps = simConfig.networkViz || {};

  const currentInput = simConfig.getInput ? simConfig.getInput(time) : time;

  const [maximizedPanel, setMaximizedPanel] = useState(null); // 'simulation', 'network', or null

  const toggleMaximize = (panel) => {
    setMaximizedPanel(prev => prev === panel ? null : panel);
  };

  // Styles for the maximize button
  const maximizeBtnStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 10,
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '4px',
    cursor: 'pointer',
    fontSize: '12px', // Keep for icon sizing if needed, though icon has explicit size
    display: 'flex',
    alignItems: 'center',
    gap: '0px',
    // boxShadow removed
  };

  // Helper helper config for panels
  const panelTransition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <div className="container">
      <header>
        <h1>Neural Network Demonstrator</h1>
        <p>{simConfig.title}</p>
        <div className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
          <a href="?sim=physics" style={{ marginRight: '10px', fontWeight: simConfig.id === 'physics' ? 'bold' : 'normal' }}>Phase 1 (Physik)</a>
          <a href="?sim=spam" style={{ marginRight: '10px', fontWeight: simConfig.id === 'spam' ? 'bold' : 'normal' }}>Phase 2 (Spam)</a>
          <a href="?sim=spam_advanced" style={{ marginRight: '10px', fontWeight: simConfig.id === 'spam_advanced' ? 'bold' : 'normal' }}>Phase 3 (Spam Extended)</a>
          <a href="?sim=spam_nonlinear" style={{ marginRight: '10px', fontWeight: simConfig.id === 'spam_nonlinear' ? 'bold' : 'normal' }}>Phase 4 (Nonlinear)</a>
          <a href="?sim=spam_hidden" style={{ fontWeight: simConfig.id === 'spam_hidden' ? 'bold' : 'normal' }}>Phase 5 (Deep)</a>
        </div>
      </header>

      <main>
        <div className="top-section" style={{
          display: 'flex',
          gap: maximizedPanel ? '0px' : '20px', // Remove gap when maximized to avoid jumping
          flexWrap: 'nowrap', // Prevent wrapping
          alignItems: 'stretch', // Ensure equal height
          height: maximizedPanel ? 'calc(100vh - 200px)' : 'auto', // Give more height when maximized if needed, or let content dictate
          minHeight: '500px', // Base height
          transition: panelTransition
        }}>

          {/* Simulation Wrapper */}
          <div className="simulation-wrapper" style={{
            flex: maximizedPanel === 'simulation' ? '1 0 100%' : (maximizedPanel === 'network' ? '0 0 0%' : '1 1 500px'),
            opacity: maximizedPanel === 'network' ? 0 : 1,
            overflow: 'hidden',
            // Hiding it completely when other is maximized to remove it from flow if needed, 
            // but animating width/flex is smoother.
            // We need 'width: 0' effectively.
            maxWidth: maximizedPanel === 'network' ? '0px' : '100%',
            transition: panelTransition,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button
              onClick={() => toggleMaximize('simulation')}
              style={maximizeBtnStyle}
              title={maximizedPanel === 'simulation' ? "Originalgröße" : "Maximieren"}
            >
              {maximizedPanel === 'simulation' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                </>
              )}
            </button>

            <div className="simulation-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="tabs" style={{ paddingRight: '120px' /* Space for button */ }}>
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
                  Daten
                </button>
                <button
                  className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
                  onClick={() => setActiveTab('training')}
                >
                  Training
                </button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}> {/* Content container grows */}
                {activeTab === 'simulation' && (
                  <>
                    {/* Phase 2: Empty as requested */}
                    {simConfig.id === 'spam' ? (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '2px dashed #ddd', borderRadius: '8px', minHeight: '300px' }}>
                        <p style={{ color: '#999' }}>Daten-Visualisierung jetzt im "Daten" Tab</p>
                      </div>
                    ) : (
                      /* Phase 1 or 3/4 */
                      (() => {
                        let pred = 0;
                        try {
                          if (neuralNet.current) {
                            pred = neuralNet.current.predict(currentInput);
                          }
                        } catch (e) { console.error("Predict Error", e); }

                        // Props for Phase 3/4 to only show text
                        const extraProps = {};
                        if (['spam_advanced', 'spam_hidden', 'spam_nonlinear'].includes(simConfig.id)) {
                          extraProps.allowedModes = ['text'];
                          extraProps.hideControls = true;
                        }

                        if (simConfig.featuresConfig) {
                          extraProps.features = simConfig.featuresConfig;
                        }

                        return (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                            <CanvasComponent
                              time={time}
                              data={trainingData} // Some sims need data for visualization (like spam)
                              currentInput={currentInput}
                              currentPrediction={pred}
                              groundTruth={groundTruth.current}
                              neuralNet={neuralNet.current}
                              {...extraProps}
                            />
                          </div>
                        );
                      })()
                    )}

                    <div className="stats" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                      <p>{simConfig.description}</p>
                      <p style={{ color: '#646cff', fontWeight: 'bold' }}>Status: {statusMsg}</p>
                    </div>
                  </>
                )}

                {activeTab === 'data' && (
                  <div className="data-content" style={{ flex: 1, overflowY: 'auto' }}>
                    {/* View Toggle Logic */}
                    {(() => {
                      const ViewToggle = (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <div style={{ background: '#eee', borderRadius: '4px', padding: '2px', display: 'flex', gap: '2px' }}>
                            <button
                              onClick={() => setDataViewMode('table')}
                              style={{
                                background: dataViewMode === 'table' ? '#fff' : 'transparent',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '5px 15px',
                                cursor: 'pointer',
                                boxShadow: dataViewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: dataViewMode === 'table' ? 'bold' : 'normal',
                                color: dataViewMode === 'table' ? '#333' : '#666'
                              }}
                            >
                              Tabelle
                            </button>
                            <button
                              onClick={() => setDataViewMode('plot')}
                              style={{
                                background: dataViewMode === 'plot' ? '#fff' : 'transparent',
                                border: 'none',
                                borderRadius: '3px',
                                padding: '5px 15px',
                                cursor: 'pointer',
                                boxShadow: dataViewMode === 'plot' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                fontWeight: dataViewMode === 'plot' ? 'bold' : 'normal',
                                color: dataViewMode === 'plot' ? '#333' : '#666'
                              }}
                            >
                              Graph
                            </button>
                          </div>
                        </div>
                      );

                      const isAdvanced = ['spam_advanced', 'spam_hidden', 'spam_nonlinear'].includes(simConfig.id);

                      return (
                        <>
                          {/* For non-advanced phases (Physics, Spam Basic), show toggle here */}
                          {(!isAdvanced || dataViewMode === 'table') && (
                            <div style={{ marginBottom: '15px' }}>
                              {ViewToggle}
                            </div>
                          )}

                          {/* Visualization Area in Data Tab */}
                          {(trainingData.length > 0 || simConfig.id !== 'physics') && dataViewMode === 'plot' && (
                            <div style={{ marginBottom: '20px' }}>
                              {simConfig.id === 'physics' ? (
                                <PositionTimeGraph
                                  data={trainingData}
                                  groundTruth={groundTruth.current}
                                  neuralNet={trainingHistory.length > 0 ? neuralNet.current : null}
                                />
                              ) : (
                                /* Spam Phases */
                                (() => {
                                  const extraProps = {};

                                  if (isAdvanced) {
                                    extraProps.allowedModes = ['scatter', '3d', 'features']; // No text
                                    extraProps.showModel = trainingHistory.length > 0;
                                    // Pass the toggle control to be rendered inside the canvas controls row
                                    extraProps.additionalControls = ViewToggle;
                                  } else {
                                    // Phase 2
                                    extraProps.staticMode = true;
                                    extraProps.showGroundTruth = true; // Always show GT
                                    extraProps.showModel = trainingHistory.length > 0; // Show model only after training
                                  }

                                  if (simConfig.featuresConfig) {
                                    extraProps.features = simConfig.featuresConfig;
                                  }

                                  return (
                                    <CanvasComponent
                                      time={0} // Not used in static/plot mode usually
                                      data={trainingData}
                                      groundTruth={groundTruth.current}
                                      neuralNet={neuralNet.current}
                                      {...extraProps}
                                    />
                                  )
                                })()
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}



                    {dataViewMode === 'table' && (
                      <>
                        {trainingData.length > 0 ? (
                          <div style={{ maxHeight: maximizedPanel ? 'calc(100vh - 350px)' : '400px', overflowY: 'auto' }}>
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
                                  {trainingData.length > 0 && trainingData[0].text && (
                                    <th style={{ padding: '8px' }}>E-Mail Text</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {trainingData.map((d, i) => {
                                  // Determine display mode based on simConfig
                                  const isClassification = ['spam', 'spam_advanced'].includes(simConfig.id);

                                  // Color coding (only for classification)
                                  let rowColor = 'transparent';
                                  let displayTarget = d.target;
                                  let targetStyle = { padding: '8px' };

                                  if (isClassification) {
                                    const isSpam = d.target === 1;
                                    rowColor = isSpam ? '#ffebee' : '#e8f5e9'; // Light Red / Light Green
                                    displayTarget = isSpam ? 'SPAM' : 'HAM';
                                    targetStyle = {
                                      ...targetStyle,
                                      fontWeight: 'bold',
                                      color: isSpam ? '#c0392b' : '#27ae60'
                                    };
                                  } else {
                                    // Regression / Physics
                                    displayTarget = typeof d.target === 'number' ? d.target.toFixed(2) : d.target;
                                  }

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

                                      <td style={targetStyle}>
                                        {displayTarget}
                                      </td>
                                      {d.text && (
                                        <td style={{ padding: '8px', color: '#555', fontStyle: 'italic', maxWidth: '300px' }}>
                                          {d.text}
                                        </td>
                                      )}
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
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'training' && (
                  <div className="training-content" style={{ flex: 1 }}>
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
          </div>

          {/* Network Wrapper */}
          <div className="network-wrapper" style={{
            flex: maximizedPanel === 'network' ? '1 0 100%' : (maximizedPanel === 'simulation' ? '0 0 0%' : `0 0 ${simConfig.id === 'spam_hidden' ? '500px' : '350px'}`),
            opacity: maximizedPanel === 'simulation' ? 0 : 1,
            overflow: 'hidden',
            maxWidth: maximizedPanel === 'simulation' ? '0px' : '100%',
            transition: panelTransition,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <button
              onClick={() => toggleMaximize('network')}
              style={maximizeBtnStyle}
              title={maximizedPanel === 'network' ? "Originalgröße" : "Maximieren"}
            >
              {maximizedPanel === 'network' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                </>
              )}
            </button>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <NetworkVisualizer
                input={currentInput}
                weight={neuralNet.current ? (neuralNet.current.weights || neuralNet.current.weight) : 0}
                bias={neuralNet.current ? neuralNet.current.bias : 0}
                output={neuralNet.current ? neuralNet.current.predict(currentInput) : 0}
                model={neuralNet.current}
                formula={vizProps.formula}
                inputLabel={vizProps.inputLabels || vizProps.inputLabel}
                outputLabel={vizProps.outputLabel}
                biasLabel={vizProps.biasLabel}
                decimals={simConfig.id.includes('spam') ? 0 : 1}
              />
            </div>
          </div>
        </div >

        <ControlPanel

          onTrain={handleTrain}
          onRun={handleRun}
          onReset={handleReset}
          isTraining={isTraining}
          trainingStep={trainingStepIndex}
          dataCount={trainingData.length}
          trainerType={trainerType}
          onTrainerTypeChange={setTrainerType}
        />
      </main >
    </div >
  );
}

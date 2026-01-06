import { useState } from 'preact/hooks';
import { TrainingVisualizer } from '../TrainingVisualizer';
import { NetworkVisualizer } from '../NetworkVisualizer';
import { ControlPanel } from '../ControlPanel';

export function SimulationLayout({
    hookState,
    renderSimulationView,
    renderDataView,
    // Optional overrides
    networkVizProps = {}
}) {
    const {
        simConfig,
        activeTab,
        setActiveTab,
        trainingHistory,
        trainingStepIndex,
        isTraining,
        dataViewMode,
        setDataViewMode,
        trainingData,
        groundTruth,
        neuralNet,
        time,
        statusMsg,
        handleTrain,
        handleRun,

        isRunning,
        trainerType,
        setTrainerType,
        currentInput, // We might need to ensure this is passed or derived
    } = hookState;

    // Maximize Logic
    const [maximizedPanel, setMaximizedPanel] = useState(null);
    const toggleMaximize = (panel) => {
        setMaximizedPanel(prev => prev === panel ? null : panel);
    };

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
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '0px',
    };

    const panelTransition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

    // Derived values
    const inputToUse = currentInput !== undefined ? currentInput : (simConfig.getInput ? simConfig.getInput(time) : time);
    const vizProps = simConfig.networkViz || {};

    return (
        <div className="nn-demonstrator layout-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Section: Simulation & Network */}
            <div className="top-section" style={{
                display: 'flex',
                gap: maximizedPanel ? '0px' : '20px',
                flexWrap: 'nowrap',
                alignItems: 'stretch',
                height: maximizedPanel ? 'calc(100vh - 200px)' : 'auto',
                minHeight: '500px',
                transition: panelTransition,
                marginBottom: '20px'
            }}>

                {/* --- Simulation Wrapper --- */}
                <div className="simulation-wrapper" style={{
                    flex: maximizedPanel === 'simulation' ? '1 0 100%' : (maximizedPanel === 'network' ? '0 0 0%' : '1 1 500px'),
                    opacity: maximizedPanel === 'network' ? 0 : 1,
                    overflow: 'hidden',
                    maxWidth: maximizedPanel === 'network' ? '0px' : '100%',
                    transition: panelTransition,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <button
                        onClick={() => toggleMaximize('simulation')}
                        style={maximizeBtnStyle}
                        title={maximizedPanel === 'simulation' ? "Original Size" : "Maximize"}
                    >
                        {maximizedPanel === 'simulation' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                        )}
                    </button>

                    <div className="simulation-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div className="tabs" style={{ paddingRight: '120px' }}>
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
                                Data
                            </button>
                            <button
                                className={`tab-button ${activeTab === 'training' ? 'active' : ''}`}
                                onClick={() => setActiveTab('training')}
                            >
                                Training
                            </button>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {activeTab === 'simulation' && (
                                <>
                                    {renderSimulationView()}
                                    <div className="stats" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                                        <p>{simConfig.description}</p>
                                        <p style={{ color: '#646cff', fontWeight: 'bold' }}>Status: {statusMsg}</p>
                                    </div>
                                </>
                            )}

                            {activeTab === 'data' && (
                                <div className="data-content" style={{ flex: 1, overflowY: 'auto' }}>
                                    {/* View Toggle */}
                                    {(!['gallery'].includes(simConfig.id)) && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
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
                                                    Table
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
                                    )}

                                    {/* Content */}
                                    {dataViewMode === 'plot' && (
                                        <div style={{ marginBottom: '20px' }}>
                                            {renderDataView ? renderDataView() : <p>No graph available.</p>}
                                        </div>
                                    )}

                                    {dataViewMode === 'table' && (
                                        <>
                                            {trainingData.length > 0 ? (
                                                <div style={{ maxHeight: maximizedPanel ? 'calc(100vh - 350px)' : '400px', overflowY: 'auto' }}>
                                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                        <thead>
                                                            <tr style={{ background: '#eee', borderBottom: '2px solid #ddd' }}>
                                                                {Array.isArray(vizProps.inputLabels) ? (
                                                                    vizProps.inputLabels.map((lbl, idx) => (
                                                                        <th key={idx} style={{ padding: '8px' }}>{lbl}</th>
                                                                    ))
                                                                ) : (
                                                                    <th style={{ padding: '8px' }}>Input ({vizProps.inputLabel})</th>
                                                                )}
                                                                <th style={{ padding: '8px' }}>Target</th>
                                                                {trainingData.length > 0 && trainingData[0].text && (
                                                                    <th style={{ padding: '8px' }}>Email Text</th>
                                                                )}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {trainingData.map((d, i) => {
                                                                const isClassification = ['spam', 'spam_advanced', 'spam_hidden', 'spam_nonlinear'].includes(simConfig.id);
                                                                let rowColor = 'transparent';
                                                                let displayTarget = d.target;
                                                                let targetStyle = { padding: '8px' };

                                                                if (isClassification) {
                                                                    const isSpam = d.target === 1;
                                                                    rowColor = isSpam ? '#ffebee' : '#e8f5e9';
                                                                    displayTarget = isSpam ? 'SPAM' : 'HAM';
                                                                    targetStyle = {
                                                                        ...targetStyle,
                                                                        fontWeight: 'bold',
                                                                        color: isSpam ? '#c0392b' : '#27ae60'
                                                                    };
                                                                } else {
                                                                    displayTarget = typeof d.target === 'number' ? d.target.toFixed(2) : d.target;
                                                                }

                                                                return (
                                                                    <tr key={i} style={{ background: rowColor, borderBottom: '1px solid #ddd' }}>
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
                                                    No training data generated yet.
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
                                            No training started yet.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Network Wrapper --- */}
                <div className="network-wrapper" style={{
                    flex: maximizedPanel === 'network' ? '1 0 100%' : (maximizedPanel === 'simulation' ? '0 0 0%' : `0 0 ${simConfig.id === 'spam_hidden' ? '500px' : '500px'}`),
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
                        title={maximizedPanel === 'network' ? "Original Size" : "Maximize"}
                    >
                        {maximizedPanel === 'network' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></svg>
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>
                        )}
                    </button>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <NetworkVisualizer
                            input={inputToUse}
                            weight={neuralNet.current ? (neuralNet.current.weights || neuralNet.current.weight) : 0}
                            bias={neuralNet.current ? neuralNet.current.bias : 0}
                            output={neuralNet.current ? neuralNet.current.predict(inputToUse) : 0}
                            model={neuralNet.current}
                            formula={vizProps.formula}
                            inputLabel={vizProps.inputLabels || vizProps.inputLabel}
                            outputLabel={vizProps.outputLabel}
                            biasLabel={vizProps.biasLabel}
                            decimals={simConfig.id.includes('spam') ? 0 : 1}
                        />
                    </div>
                </div>

            </div>

            <ControlPanel
                onTrain={handleTrain}
                onRun={handleRun}

                isTraining={isTraining}
                trainingStep={trainingStepIndex}
                dataCount={trainingData.length}
                trainerType={trainerType}
                onTrainerTypeChange={setTrainerType}
                simConfig={simConfig}
                isRunning={isRunning}
            />
        </div>
    );
}

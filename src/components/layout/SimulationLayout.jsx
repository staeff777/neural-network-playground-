import { useState, useEffect } from 'preact/hooks';
import { TrainingVisualizer } from '../TrainingVisualizer';
import { NetworkVisualizer } from '../NetworkVisualizer';
import { ControlPanel } from '../ControlPanel';

import { DataViewSwitcher } from '../common/DataViewSwitcher';
import { DataTableView } from '../common/DataTableView';

export function SimulationLayout({
    hookState,
    renderSimulationView,
    renderDataView,
    // Optional overrides
    networkVizProps = {},
    simulationEnabled = true,
    customDataHandling = false // New prop
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

    // Force switch away from simulation tab if disabled
    useEffect(() => {
        if (!simulationEnabled && activeTab === 'simulation') {
            setActiveTab('data');
        }
    }, [simulationEnabled, activeTab, setActiveTab]);

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
                            {simulationEnabled && (
                                <button
                                    className={`tab-button ${activeTab === 'simulation' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('simulation')}
                                >
                                    Simulation
                                </button>
                            )}
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
                                    {customDataHandling ? (
                                        renderDataView ? renderDataView() : <p>No data view available.</p>
                                    ) : (
                                        <>
                                            {/* Standard View Toggle */}
                                            {(!['gallery'].includes(simConfig.id)) && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                                                    <DataViewSwitcher viewMode={dataViewMode} onChange={setDataViewMode} />
                                                </div>
                                            )}

                                            {/* Standard Content */}
                                            <div style={{ marginTop: '15px' }}>
                                                {dataViewMode === 'plot' && (
                                                    <div style={{ marginBottom: '20px' }}>
                                                        {renderDataView ? renderDataView() : <p>No graph available.</p>}
                                                    </div>
                                                )}

                                                {dataViewMode === 'table' && (
                                                    <DataTableView
                                                        data={trainingData}
                                                        vizProps={vizProps}
                                                        simConfig={simConfig}
                                                        maximizedPanel={maximizedPanel}
                                                    />
                                                )}
                                            </div>
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
                simulationEnabled={simulationEnabled}
            />
        </div>
    );
}

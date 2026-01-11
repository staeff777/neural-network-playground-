import { useState, useEffect, useRef } from 'preact/hooks';
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
    collapseModelArchitectureByDefault,
    simulationEnabled = true,
    customDataHandling = false // New prop
}) {
    const TOP_SECTION_MIN_HEIGHT_PX = 500;
    const TOP_SECTION_BOTTOM_GAP_PX = 20;

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
    const layoutRef = useRef(null);
    const topSectionRef = useRef(null);
    const controlPanelRef = useRef(null);
    const [lockedTopSectionHeight, setLockedTopSectionHeight] = useState(null);
    const [controlPanelHeight, setControlPanelHeight] = useState(0);
    const [layoutHeight, setLayoutHeight] = useState(0);

    useEffect(() => {
        const measure = () => {
            const nextLayoutH = layoutRef.current?.offsetHeight ?? 0;
            const nextControlH = controlPanelRef.current?.offsetHeight ?? 0;
            setLayoutHeight(nextLayoutH);
            setControlPanelHeight(nextControlH);
        };
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, []);

    const toggleMaximize = (panel) => {
        setMaximizedPanel(prev => {
            const next = prev === panel ? null : panel;
            // Lock the current pixel height while a panel is maximized so embedding contexts
            // (e.g., Reveal.js slides that auto-size/scale based on content) don't reflow vertically.
            if (next && !prev) {
                const measuredTopH = topSectionRef.current?.offsetHeight;
                const measuredLayoutH = layoutRef.current?.offsetHeight;
                const measuredControlH = controlPanelRef.current?.offsetHeight;
                const availableTopH =
                    typeof measuredLayoutH === 'number' && measuredLayoutH > 0
                        ? Math.max(0, measuredLayoutH - (measuredControlH || 0) - TOP_SECTION_BOTTOM_GAP_PX)
                        : null;

                if (typeof measuredTopH === 'number' && measuredTopH > 0) {
                    const nextLocked = typeof availableTopH === 'number'
                        ? Math.min(measuredTopH, availableTopH)
                        : measuredTopH;
                    setLockedTopSectionHeight(nextLocked);
                }
            } else if (!next) {
                setLockedTopSectionHeight(null);
            }
            return next;
        });
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
    const collapseModelArchitectureResolved =
        typeof collapseModelArchitectureByDefault === 'boolean'
            ? collapseModelArchitectureByDefault
            : simConfig.collapseModelArchitectureByDefault;

    const computedTopSectionHeight =
        lockedTopSectionHeight
            ? `${lockedTopSectionHeight}px`
            : (layoutHeight > 0 ? `calc(${layoutHeight}px - ${controlPanelHeight}px - ${TOP_SECTION_BOTTOM_GAP_PX}px)` : 'auto');

    const topSectionHeight = maximizedPanel ? computedTopSectionHeight : 'auto';

    return (
        <div
            ref={layoutRef}
            className="nn-demonstrator layout-container"
            style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}
        >
            {/* Top Section: Simulation & Network */}
            <div ref={topSectionRef} className="top-section" style={{
                display: 'flex',
                gap: maximizedPanel ? '0px' : '20px',
                flexWrap: 'nowrap',
                alignItems: 'stretch',
                height: topSectionHeight,
                minHeight: lockedTopSectionHeight ? 0 : `${TOP_SECTION_MIN_HEIGHT_PX}px`,
                overflow: maximizedPanel ? 'hidden' : 'visible',
                transition: panelTransition,
                marginBottom: `${TOP_SECTION_BOTTOM_GAP_PX}px`
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
                    flexDirection: 'column',
                    minHeight: 0,
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

                    <div className="simulation-section" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
                                <div className="data-content" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
                                                    />
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {activeTab === 'training' && (
                                <div className="training-content" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                                    {trainingHistory.length > 0 ? (
                                        <TrainingVisualizer
                                            history={trainingHistory}
                                            currentStepIndex={trainingStepIndex}
                                            isTraining={isTraining}
                                            paramsConfig={simConfig.trainingConfig.params}
                                            showAccuracyPlot={simConfig.trainingConfig?.showAccuracyPlot ?? true}
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
                    flexDirection: 'column',
                    minHeight: 0,
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
                            showActivation={vizProps.showActivation}
                            collapseModelArchitectureByDefault={collapseModelArchitectureResolved}
                        />
                    </div>
                </div>

            </div>

            <div ref={controlPanelRef} style={{ flex: '0 0 auto' }}>
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
        </div>
    );
}

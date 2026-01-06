import { useSimulationRunner } from '../../hooks/useSimulationRunner';
import { SimulationLayout } from '../layout/SimulationLayout';
import { DataViewSwitcher } from '../common/DataViewSwitcher';
import { DataTableView } from '../common/DataTableView';

export function BaseSpamAdvancedPhase({ simId }) {
    const hookState = useSimulationRunner(simId);
    const { simConfig, trainingData, groundTruth, trainingHistory, neuralNet, time, currentInput, dataViewMode, setDataViewMode } = hookState;

    if (!simConfig) return <div className="loading">Loading Simulation...</div>;

    const CanvasComponent = simConfig.CanvasComponent;

    // View Toggle is now passed as a component instance to additionalControls
    const viewToggleControl = (
        <DataViewSwitcher viewMode={dataViewMode} onChange={setDataViewMode} />
    );

    const renderSimulationView = () => {
        let pred = 0;
        try {
            if (neuralNet.current && currentInput) {
                pred = neuralNet.current.predict(currentInput);
            }
        } catch (e) {
            console.error("Predict Error", e);
        }

        const extraProps = {
            allowedModes: ['text'],
            hideControls: true,
            features: simConfig.featuresConfig
        };

        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                <CanvasComponent
                    time={time}
                    data={trainingData}
                    currentInput={currentInput}
                    currentPrediction={pred}
                    groundTruth={groundTruth.current}
                    neuralNet={neuralNet.current}
                    {...extraProps}
                />
            </div>
        );
    };

    const renderDataView = () => {
        const extraProps = {
            allowedModes: ['scatter', '3d', 'features'],
            showModel: trainingHistory.length > 0,
            additionalControls: viewToggleControl, // Pass toggle to canvas
            features: simConfig.featuresConfig
        };

        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px', width: '100%' }}>
                {dataViewMode === 'table' ? (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <DataViewSwitcher viewMode={dataViewMode} onChange={setDataViewMode} />
                        </div>
                        <DataTableView
                            data={trainingData}
                            vizProps={simConfig.networkViz || {}}
                            simConfig={simConfig}
                        />
                    </>
                ) : (
                    /* Plot Mode: Switcher passed as additionalControls */
                    <CanvasComponent
                        time={0}
                        data={trainingData}
                        groundTruth={groundTruth.current}
                        neuralNet={neuralNet.current}
                        {...extraProps}
                    />
                )}
            </div>
        );
    };

    return (
        <SimulationLayout
            hookState={hookState}
            renderSimulationView={renderSimulationView}
            renderDataView={renderDataView}
            customDataHandling={true}
        />
    );
}

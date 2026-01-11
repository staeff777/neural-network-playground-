import { useSimulationRunner } from '../../hooks/useSimulationRunner';
import { SimulationLayout } from '../layout/SimulationLayout';
import { PositionTimeGraph } from '../simulations/PositionTimeGraph';
import { DataViewSwitcher } from '../common/DataViewSwitcher';
import { DataTableView } from '../common/DataTableView';

export function PhysicsPhase({ collapseModelArchitectureByDefault } = {}) {
    const hookState = useSimulationRunner('linear_regression');
    const { simConfig, trainingData, groundTruth, trainingHistory, neuralNet, time, currentInput } = hookState;

    if (!simConfig) return <div className="loading">Loading Simulation...</div>;

    const CanvasComponent = simConfig.CanvasComponent;

    // Render Logic for Simulation Tab
    const renderSimulationView = () => {
        let pred = 0;
        try {
            if (neuralNet.current) {
                // Default input for physics is time
                const input = currentInput !== undefined ? currentInput : time;
                pred = neuralNet.current.predict(input);
            }
        } catch (e) {
            console.error("Predict Error", e);
        }

        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
                <CanvasComponent
                    time={time}
                    data={trainingData}
                    currentInput={currentInput !== undefined ? currentInput : time}
                    currentPrediction={pred}
                    groundTruth={groundTruth.current}
                    neuralNet={neuralNet.current}
                />
            </div>
        );
    };

    // Render Logic for Data Tab (Plot)
    const renderDataView = () => {
        const { dataViewMode, setDataViewMode } = hookState;

        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
                {dataViewMode === 'table' ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                            <DataViewSwitcher viewMode={dataViewMode} onChange={setDataViewMode} />
                        </div>
                        <DataTableView
                            data={trainingData}
                            vizProps={simConfig.networkViz || {}}
                            simConfig={simConfig}
                        />
                    </>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '15px' }}>
                            <DataViewSwitcher viewMode={dataViewMode} onChange={setDataViewMode} />
                        </div>
                        <PositionTimeGraph
                            data={trainingData}
                            groundTruth={groundTruth.current}
                            neuralNet={trainingHistory.length > 0 ? neuralNet.current : null}
                        />
                    </>
                )}
            </div>
        );
    };

    return (
        <SimulationLayout
            hookState={hookState}
            renderSimulationView={renderSimulationView}
            renderDataView={renderDataView}
            collapseModelArchitectureByDefault={collapseModelArchitectureByDefault}
            customDataHandling={true}
        />
    );
}

import { useState } from 'preact/hooks';
import { useSimulationRunner } from '../../hooks/useSimulationRunner';
import { SimulationLayout } from '../layout/SimulationLayout';
import { DataViewSwitcher } from '../common/DataViewSwitcher';
import { DataTableView } from '../common/DataTableView';

export function SpamPhase({ collapseModelArchitectureByDefault } = {}) {
    const hookState = useSimulationRunner('logistic_regression');
    const { simConfig, trainingData, groundTruth, trainingHistory, neuralNet } = hookState;

    if (!simConfig) return <div className="loading">Loading Simulation...</div>;

    const CanvasComponent = simConfig.CanvasComponent;

    // Phase 2: Simulation tab is a placeholder
    const renderSimulationView = () => {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '2px dashed #ddd', borderRadius: '8px', minHeight: '300px' }}>
                <p style={{ color: '#999' }}>Data visualization is now in the "Data" tab</p>
            </div>
        );
    };

    // Phase 2: Data tab shows static canvas
    const renderDataView = () => {
        const { dataViewMode, setDataViewMode } = hookState;

        const extraProps = {
            staticMode: true,
            showGroundTruth: true,
            showModel: trainingHistory.length > 0
        };

        if (simConfig.featuresConfig) {
            extraProps.features = simConfig.featuresConfig;
        }

        return (
            <div style={{ padding: '10px 0', display: 'flex', flexDirection: 'column', width: '100%' }}>
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
                        <CanvasComponent
                            time={0}
                            data={trainingData}
                            groundTruth={groundTruth.current}
                            neuralNet={neuralNet.current}
                            showProbabilities={true}
                            {...extraProps}
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
            simulationEnabled={false}
            customDataHandling={true}
        />
    );
}

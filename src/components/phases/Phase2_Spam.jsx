import { useSimulationRunner } from '../../hooks/useSimulationRunner';
import { SimulationLayout } from '../layout/SimulationLayout';

export function SpamPhase() {
    const hookState = useSimulationRunner('spam');
    const { simConfig, trainingData, groundTruth, trainingHistory, neuralNet } = hookState;

    if (!simConfig) return <div className="loading">Lade Simulation...</div>;

    const CanvasComponent = simConfig.CanvasComponent;

    // Phase 2: Simulation tab is a placeholder
    const renderSimulationView = () => {
        return (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', border: '2px dashed #ddd', borderRadius: '8px', minHeight: '300px' }}>
                <p style={{ color: '#999' }}>Daten-Visualisierung jetzt im "Daten" Tab</p>
            </div>
        );
    };

    // Phase 2: Data tab shows static canvas
    const renderDataView = () => {
        const extraProps = {
            staticMode: true,
            showGroundTruth: true,
            showModel: trainingHistory.length > 0
        };

        if (simConfig.featuresConfig) {
            extraProps.features = simConfig.featuresConfig;
        }

        return (
            <CanvasComponent
                time={0}
                data={trainingData}
                groundTruth={groundTruth.current}
                neuralNet={neuralNet.current}
                {...extraProps}
            />
        );
    };

    return (
        <SimulationLayout
            hookState={hookState}
            renderSimulationView={renderSimulationView}
            renderDataView={renderDataView}
        />
    );
}

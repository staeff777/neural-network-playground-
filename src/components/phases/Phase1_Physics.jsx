import { useSimulationRunner } from '../../hooks/useSimulationRunner';
import { SimulationLayout } from '../layout/SimulationLayout';
import { PositionTimeGraph } from '../simulations/PositionTimeGraph';

export function PhysicsPhase() {
    const hookState = useSimulationRunner('physics');
    const { simConfig, trainingData, groundTruth, trainingHistory, neuralNet, time, currentInput } = hookState;

    if (!simConfig) return <div className="loading">Lade Simulation...</div>;

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
        return (
            <PositionTimeGraph
                data={trainingData}
                groundTruth={groundTruth.current}
                neuralNet={trainingHistory.length > 0 ? neuralNet.current : null}
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

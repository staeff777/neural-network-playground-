import { useSimulationRunner } from '../../hooks/useSimulationRunner';
import { SimulationLayout } from '../layout/SimulationLayout';

export function BaseSpamAdvancedPhase({ simId }) {
    const hookState = useSimulationRunner(simId);
    const { simConfig, trainingData, groundTruth, trainingHistory, neuralNet, time, currentInput, dataViewMode, setDataViewMode } = hookState;

    if (!simConfig) return <div className="loading">Lade Simulation...</div>;

    const CanvasComponent = simConfig.CanvasComponent;

    // View Toggle for Data Tab (embedded in controls)
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

    const renderSimulationView = () => {
        let pred = 0;
        try {
            if (neuralNet.current) {
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
            additionalControls: ViewToggle, // Pass toggle to canvas
            features: simConfig.featuresConfig
        };

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

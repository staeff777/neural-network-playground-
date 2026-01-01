import { useState } from 'preact/hooks';
import { NetworkVisualizer } from '../NetworkVisualizer';

export function ArchitectureGallery() {
    const [modelIndex, setModelIndex] = useState(0);

    const models = [
        {
            name: "Simple Perceptron",
            input: 0.5,
            weight: 0.8,
            bias: 0.2,
            output: 0.6,
            inputLabel: "Input",
            formula: "y = w * x + b"
        },
        {
            name: "Spam Filter (2 Inputs)",
            input: [1, 0],
            weight: [0.5, -0.2],
            bias: 0.1,
            output: 0.8,
            inputLabel: ["Spam Word", "Suspicious Link"],
            formula: "y = w1*x1 + w2*x2 + b"
        },
        {
            name: "Complex Model (5 Inputs)",
            input: [1, 0.5, -1, 0, 0.2],
            weight: [0.1, 0.2, 0.3, 0.4, 0.5],
            bias: -0.5,
            output: 0.1,
            inputLabel: ["F1", "F2", "F3", "F4", "F5"],
            formula: "y = Σ(wi*xi) + b"
        },
        {
            name: "Many Inputs (8 Inputs)",
            input: [1, 0, 1, 0, 1, 0, 1, 0],
            weight: [0.1, -0.1, 0.1, -0.1, 0.1, -0.1, 0.1, -0.1],
            bias: 0,
            output: 0.5,
            inputLabel: ["I1", "I2", "I3", "I4", "I5", "I6", "I7", "I8"],
            formula: "y = ... "
        }
    ];

    const currentModel = models[modelIndex];

    return (
        <div style={{ padding: '20px' }}>
            <h2>Architecture Gallery</h2>
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => setModelIndex((modelIndex - 1 + models.length) % models.length)}>Previous</button>
                <span style={{ margin: '0 10px' }}>{currentModel.name} ({modelIndex + 1}/{models.length})</span>
                <button onClick={() => setModelIndex((modelIndex + 1) % models.length)}>Next</button>
            </div>

            <div style={{ width: '400px', border: '1px dashed #ccc', padding: '10px' }}>
                <NetworkVisualizer
                    input={currentModel.input}
                    weight={currentModel.weight}
                    bias={currentModel.bias}
                    output={currentModel.output}
                    formula={currentModel.formula}
                    inputLabel={currentModel.inputLabel}
                />
            </div>
        </div>
    );
}

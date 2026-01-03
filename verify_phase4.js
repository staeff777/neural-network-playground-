import { HiddenLayerModel } from './src/lib/simulations/spam_hidden/model.js';

try {
    console.log("Initializing Model...");
    const model = new HiddenLayerModel();

    console.log("Testing Predict with default params (all 0)...");
    // Expect sigmoid(0) = 0.5 everywhere -> output 0.5
    const out = model.predict([1, 0, 1, 0]);
    console.log("Prediction (expect 0.5):", out);

    if (Math.abs(out - 0.5) > 0.001) throw new Error("Incorrect prediction for zero weights");

    console.log("Testing setParams...");
    // Set bias2 to big number -> output should be close to 1
    model.setParams({ b2: 10 });
    const out2 = model.predict([1, 0, 1, 0]);
    console.log("Prediction with b2=10 (expect ~1):", out2);

    if (out2 < 0.99) throw new Error("Param setting failed (b2)");

    console.log("Verification Passed!");
} catch (e) {
    console.error("Verification Failed:", e);
    process.exit(1);
}

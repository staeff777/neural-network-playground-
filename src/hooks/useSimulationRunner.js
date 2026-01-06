import { useState, useEffect, useRef } from 'preact/hooks';
import { ExhaustiveTrainer } from '../lib/trainer';
import { getSimulationConfig } from '../lib/simulations/registry';

export function useSimulationRunner(simId) {
    const [simConfig, setSimConfig] = useState(null);

    // Logic Objects
    const groundTruth = useRef(null);
    const neuralNet = useRef(null);

    // App State
    const [time, setTime] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [trainingData, setTrainingData] = useState([]);
    const [trainingHistory, setTrainingHistory] = useState([]);
    const [trainingStepIndex, setTrainingStepIndex] = useState(-1);
    const [isTraining, setIsTraining] = useState(false);
    const [activeTab, setActiveTab] = useState('simulation');
    const [dataViewMode, setDataViewMode] = useState('table'); // 'plot' or 'table'
    const [trainerType, setTrainerType] = useState('random');
    const [statusMsg, setStatusMsg] = useState('Ready.');

    // Ref for tracking time delta
    const lastTimeRef = useRef(0);

    // Initialize Simulation
    useEffect(() => {
        if (!simId) return;

        if (simId === 'gallery') {
            setSimConfig({ id: 'gallery', type: 'gallery' });
            return;
        }

        const config = getSimulationConfig(simId);

        if (!config) {
            setStatusMsg('Error: Simulation not found.');
            return;
        }

        // Initialize Logic
        try {
            groundTruth.current = new config.GroundTruth(...(config.groundTruthDefaults || []));
            neuralNet.current = new config.Model();
            // Defaults
            if (config.defaultParams) {
                if (config.defaultParams.weight !== undefined) neuralNet.current.setWeight(config.defaultParams.weight);
                if (config.defaultParams.weights !== undefined && neuralNet.current.setWeights) neuralNet.current.setWeights(config.defaultParams.weights);
                if (config.defaultParams.bias !== undefined) neuralNet.current.setBias(config.defaultParams.bias);
            }

            setSimConfig(config);

            // Auto-generate data on load
            if (groundTruth.current) {
                try {
                    const data = config.generateData(groundTruth.current);
                    setTrainingData(data);
                } catch (e) {
                    console.error("Auto-generate data error:", e);
                }
            }
        } catch (e) {
            console.error("Initialization Error:", e);
            setStatusMsg(`Init Error: ${e.message}`);
        }
    }, [simId]);

    // Animation Loop for Simulation
    useEffect(() => {
        let animationFrameId;

        const loop = (timestamp) => {
            if (!isRunning) return;

            if (lastTimeRef.current === 0) {
                lastTimeRef.current = timestamp;
            }

            const dt = (timestamp - lastTimeRef.current) / 1000; // Delta time in seconds
            lastTimeRef.current = timestamp;

            // Cap dt to prevent huge jumps if tab was backgrounded
            const safeDt = Math.min(dt, 0.1);

            setTime(prevTime => {
                const speedMultiplier = 3.0;
                const newTime = prevTime + (safeDt * speedMultiplier);

                // Check for auto-stop
                if (simConfig && simConfig.isFinished && simConfig.isFinished(newTime)) {
                    setIsRunning(false);
                    setStatusMsg('Simulation finished.');
                    return newTime;
                }

                return newTime;
            });

            animationFrameId = requestAnimationFrame(loop);
        };

        if (isRunning) {
            lastTimeRef.current = 0; // Reset timer start
            animationFrameId = requestAnimationFrame(loop);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isRunning, simConfig]);

    // Toggle Logic
    const handleRun = () => {
        setTime(0); // Reset time on run
        setIsRunning(true);
        setStatusMsg('Simulation running...');
        setActiveTab('simulation');
    };

    const handleStop = () => {
        setIsRunning(false);
        setStatusMsg('Simulation paused.');
    };

    const toggleRun = () => {
        if (isRunning) {
            handleStop();
        } else {
            handleRun();
        }
    };

    const handleTrain = async () => {
        try {
            if (trainingData.length === 0 || !simConfig) return;

            setIsTraining(true);
            setTrainingStepIndex(0); // Will visually track the latest added point
            setTrainingHistory([]); // Start fresh
            setStatusMsg('Searching for optimal weight and bias (Live Visualization)...');
            setActiveTab('training');

            const trainingModel = new simConfig.Model();
            const trainer = new ExhaustiveTrainer(trainingModel);

            // Progress Callback
            const handleProgress = (newChunk, bestSoFar) => {
                // Append new points
                setTrainingHistory(prev => {
                    const updated = [...prev, ...newChunk];
                    // Update Step Index to the end of the list to mimic "scanning cursor"
                    setTrainingStepIndex(updated.length - 1);
                    return updated;
                });

                if (bestSoFar && bestSoFar.message) setStatusMsg(bestSoFar.message);

                // Optional: Live update of the model to the "Best So Far"
                if (bestSoFar && bestSoFar.bestParams) {
                    if (neuralNet.current.setParams) {
                        neuralNet.current.setParams(bestSoFar.bestParams);
                    } else if (neuralNet.current.setWeights) {
                        const { weights, bias } = bestSoFar.bestParams;
                        neuralNet.current.setWeights(weights);
                        neuralNet.current.setBias(bias);
                    } else if (neuralNet.current.setWeight && bestSoFar.bestParams && bestSoFar.bestParams.weights && bestSoFar.bestParams.weights.length >= 1) {
                        // Fallback: Model has setWeight but we got weights array (e.g. Phase 1 with Adaptive Random)
                        neuralNet.current.setWeight(bestSoFar.bestParams.weights[0]);
                        neuralNet.current.setBias(bestSoFar.bestParams.bias);
                    }
                } else if (bestSoFar && bestSoFar.bestWeight !== undefined) {
                    // Legacy
                    neuralNet.current.setWeight(bestSoFar.bestWeight);
                    neuralNet.current.setBias(bestSoFar.bestBias);
                }
            };

            let result;
            if (trainerType === 'random') {
                setStatusMsg('Searching for optimal weight and bias (Random Search)...');
                const trainOptions = {
                    seed: simConfig.trainingConfig.seed,
                    maxSteps: simConfig.trainingConfig.maxSteps,
                    initialRadius: simConfig.trainingConfig.initialRadius,
                    phase1Ratio: simConfig.trainingConfig.phase1Ratio
                };
                result = await trainer.trainRandomAsync(trainingData, simConfig.trainingConfig.params, handleProgress, trainOptions);
            } else if (simConfig.trainingConfig.params) {
                result = await trainer.trainAsync(trainingData, simConfig.trainingConfig.params, handleProgress);
            } else {
                result = await trainer.trainAsync(
                    trainingData,
                    simConfig.trainingConfig.weightRange,
                    simConfig.trainingConfig.biasRange,
                    handleProgress
                );
            }

            setStatusMsg(`Training finished! Min Error: ${result.minError.toFixed(5)}`);
            setIsTraining(false);
        } catch (e) {
            console.error("Training Error:", e);
            setIsTraining(false);
            setStatusMsg(`Training Error: ${e.message}`);
        }
    };



    // Derived State for Current Input (Live)
    const currentInput = (simConfig && simConfig.getInput) ? simConfig.getInput(time) : undefined;

    return {
        simConfig,
        groundTruth,
        neuralNet,
        time,
        currentInput,
        isRunning,
        trainingData,
        trainingHistory,
        trainingStepIndex,
        isTraining,
        activeTab,
        dataViewMode,
        trainerType,
        statusMsg,
        handleTrain,
        handleRun: toggleRun,
        handleStop,
        toggleRun,


        setTrainerType,
        setActiveTab,
        setDataViewMode
    };
}

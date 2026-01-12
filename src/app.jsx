import { useState, useEffect } from 'preact/hooks';
import { PhysicsPhase } from './components/phases/Phase1_Physics';
import { SpamPhase } from './components/phases/Phase2_Spam';
import { SpamAdvancedPhase } from './components/phases/Phase3_SpamAdvanced';
import { SpamNonlinearPhase } from './components/phases/Phase4_SpamNonlinear';
import { SpamHiddenPhase } from './components/phases/Phase5_SpamHidden';
import { ArchitectureGallery } from './components/debug/ArchitectureGallery';
import './app.css';

const PHASES = [
  { id: 'linear_regression', label: 'Phase 1 (Linear)', title: 'Phase 1: Linear Regression' },
  { id: 'logistic_regression', label: 'Phase 2 (Logistic)', title: 'Phase 2: Logistic Regression' },
  { id: 'multiple_inputs', label: 'Phase 3 (Multi)', title: 'Phase 3: Multiple Inputs' },
  { id: 'single_layer_nonlinear', label: 'Phase 4 (Nonlinear 1)', title: 'Phase 4: Single Layer Nonlinear Data' },
  { id: 'double_layer_nonlinear', label: 'Phase 5 (Nonlinear 2)', title: 'Phase 5: Double Layer Nonlinear Data' },
];

export function App() {
  const [simId, setSimId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sim') || 'linear_regression';
    setSimId(id);
  }, []);

  if (!simId) return <div>Loading App...</div>;

  if (simId === 'gallery') {
    return (
      <div className="container">
        <header>
          <h1>Neural Network Demonstrator</h1>
          <p>Architecture Gallery (Debug)</p>
          <nav className="sim-selector" aria-label="Phase Navigation" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href="?sim=linear_regression" style={{ marginRight: '10px' }}>Back to App</a>
          </nav>
        </header>
        <main>
          <ArchitectureGallery />
        </main>
      </div>
    );
  }

  const currentPhase = PHASES.find(p => p.id === simId);
  const title = currentPhase ? currentPhase.title : 'Neural Network Demonstrator';

  return (
    <div className="container">
      <header>
        <h1>Neural Network Demonstrator</h1>
        <p>{title}</p>
        <nav className="sim-selector" aria-label="Phase Navigation" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
          {PHASES.map((phase, index) => (
            <a
              key={phase.id}
              href={`?sim=${phase.id}`}
              aria-current={simId === phase.id ? 'page' : undefined}
              style={{
                marginRight: index === PHASES.length - 1 ? 0 : '10px',
                fontWeight: simId === phase.id ? 'bold' : 'normal',
              }}
            >
              {phase.label}
            </a>
          ))}
        </nav>
      </header>

      <main style={{ height: '100%' }}>
        {simId === 'linear_regression' && <PhysicsPhase />}
        {simId === 'logistic_regression' && <SpamPhase />}
        {simId === 'multiple_inputs' && <SpamAdvancedPhase />}
        {simId === 'single_layer_nonlinear' && <SpamNonlinearPhase />}
        {simId === 'double_layer_nonlinear' && <SpamHiddenPhase />}
      </main>
    </div>
  );
}

import { useState, useEffect } from 'preact/hooks';
import { PhysicsPhase } from './components/phases/Phase1_Physics';
import { SpamPhase } from './components/phases/Phase2_Spam';
import { SpamAdvancedPhase } from './components/phases/Phase3_SpamAdvanced';
import { SpamNonlinearPhase } from './components/phases/Phase4_SpamNonlinear';
import { SpamHiddenPhase } from './components/phases/Phase5_SpamHidden';
import { ArchitectureGallery } from './components/debug/ArchitectureGallery';
import './app.css';

const phases = [
  { id: 'linear_regression', label: 'Phase 1 (Linear)', title: 'Phase 1: Linear Regression' },
  { id: 'logistic_regression', label: 'Phase 2 (Logistic)', title: 'Phase 2: Logistic Regression' },
  { id: 'multiple_inputs', label: 'Phase 3 (Multi)', title: 'Phase 3: Multiple Inputs' },
  { id: 'single_layer_nonlinear', label: 'Phase 4 (Nonlinear 1)', title: 'Phase 4: Single Layer Nonlinear Data' },
  { id: 'double_layer_nonlinear', label: 'Phase 5 (Nonlinear 2)', title: 'Phase 5: Double Layer Nonlinear Data' },
];

export function App() {
  const [simId, setSimId] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSimId(params.get('sim') || 'linear_regression');
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (e, id) => {
    e.preventDefault();
    if (simId === id) return;

    const url = new URL(window.location);
    url.searchParams.set('sim', id);
    window.history.pushState({}, '', url);
    setSimId(id);
  };

  if (!simId) return <div>Loading App...</div>;

  if (simId === 'gallery') {
    return (
      <div className="container">
        <header>
          <h1>Neural Network Demonstrator</h1>
          <p>Architecture Gallery (Debug)</p>
          <nav aria-label="Debug Navigation" className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href="?sim=linear_regression" onClick={(e) => navigate(e, 'linear_regression')} style={{ marginRight: '10px' }}>Back to App</a>
          </nav>
        </header>
        <main>
          <ArchitectureGallery />
        </main>
      </div>
    );
  }

  const currentPhase = phases.find(p => p.id === simId) || phases[0];

  return (
    <div className="container">
      <header>
        <h1>Neural Network Demonstrator</h1>
        <p>{currentPhase.title}</p>
        <nav aria-label="Phase Navigation" className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
          {phases.map(phase => (
            <a
              key={phase.id}
              href={`?sim=${phase.id}`}
              onClick={(e) => navigate(e, phase.id)}
              aria-current={simId === phase.id ? 'page' : undefined}
              style={{
                marginRight: '10px',
                fontWeight: simId === phase.id ? 'bold' : 'normal',
                cursor: 'pointer'
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

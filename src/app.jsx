import { useState, useEffect } from 'preact/hooks';
import { PhysicsPhase } from './components/phases/Phase1_Physics';
import { SpamPhase } from './components/phases/Phase2_Spam';
import { SpamAdvancedPhase } from './components/phases/Phase3_SpamAdvanced';
import { SpamNonlinearPhase } from './components/phases/Phase4_SpamNonlinear';
import { SpamHiddenPhase } from './components/phases/Phase5_SpamHidden';
import { ArchitectureGallery } from './components/debug/ArchitectureGallery';
import './app.css';

const PHASES = [
  { id: 'physics', label: 'Phase 1 (Physik)' },
  { id: 'spam', label: 'Phase 2 (Spam)' },
  { id: 'spam_advanced', label: 'Phase 3 (Spam Extended)' },
  { id: 'spam_nonlinear', label: 'Phase 4 (Nonlinear)' },
  { id: 'spam_hidden', label: 'Phase 5 (Deep)' }
];

export function App() {
  const [simId, setSimId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sim') || 'physics';
    setSimId(id);
  }, []);

  if (!simId) return <div role="status">Lade App...</div>;

  if (simId === 'gallery') {
    return (
      <div className="container">
        <header>
          <h1>Neural Network Demonstrator</h1>
          <p>Architecture Gallery (Debug)</p>
          <nav className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href="?sim=physics" style={{ marginRight: '10px' }}>Back to App</a>
          </nav>
        </header>
        <main>
          <ArchitectureGallery />
        </main>
      </div>
    );
  }

  const getValidationTitle = (id) => {
    switch (id) {
      case 'physics': return 'Phase 1: Physik Simulation';
      case 'spam': return 'Phase 2: Spam Klassifikation (Basic)';
      case 'spam_advanced': return 'Phase 3: Spam Klassifikation (Erweitert)';
      case 'spam_nonlinear': return 'Phase 4: Nicht-Lineare Klassifikation';
      case 'spam_hidden': return 'Phase 5: Deep Learning (Hidden Layers)';
      default: return 'Neural Network Demonstrator';
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Neural Network Demonstrator</h1>
        <p>{getValidationTitle(simId)}</p>
        <nav
          className="sim-selector"
          aria-label="Phasen-Auswahl"
          style={{ fontSize: '0.8rem', marginTop: '5px' }}
        >
          {PHASES.map(phase => (
            <a
              key={phase.id}
              href={`?sim=${phase.id}`}
              style={{
                marginRight: '10px',
                fontWeight: simId === phase.id ? 'bold' : 'normal',
                textDecoration: simId === phase.id ? 'underline' : 'none'
              }}
              aria-current={simId === phase.id ? 'page' : undefined}
            >
              {phase.label}
            </a>
          ))}
        </nav>
      </header>

      <main style={{ height: '100%' }}>
        {simId === 'physics' && <PhysicsPhase />}
        {simId === 'spam' && <SpamPhase />}
        {simId === 'spam_advanced' && <SpamAdvancedPhase />}
        {simId === 'spam_nonlinear' && <SpamNonlinearPhase />}
        {simId === 'spam_hidden' && <SpamHiddenPhase />}
      </main>
    </div>
  );
}

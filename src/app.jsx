import { useState, useEffect } from 'preact/hooks';
import { PhysicsPhase } from './components/phases/Phase1_Physics';
import { SpamPhase } from './components/phases/Phase2_Spam';
import { SpamAdvancedPhase } from './components/phases/Phase3_SpamAdvanced';
import { SpamNonlinearPhase } from './components/phases/Phase4_SpamNonlinear';
import { SpamHiddenPhase } from './components/phases/Phase5_SpamHidden';
import { ArchitectureGallery } from './components/debug/ArchitectureGallery';
import './app.css';

export function App() {
  const [simId, setSimId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('sim') || 'physics';
    setSimId(id);
  }, []);

  if (!simId) return <div>Lade App...</div>;

  if (simId === 'gallery') {
    return (
      <div className="container">
        <header>
          <h1>Neural Network Demonstrator</h1>
          <p>Architecture Gallery (Debug)</p>
          <div className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href="?sim=physics" style={{ marginRight: '10px' }}>Back to App</a>
          </div>
        </header>
        <main>
          <ArchitectureGallery />
        </main>
      </div>
    );
  }

  // Common Header for Phases
  // Note: simConfig title was used in original header. Use a map or dynamic title?
  // Since we don't have simConfig here (it's in the Phase), we can just use the generic header or pass title.
  // Actually, original App had global navigation. Let's keep it.

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
        <div className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
          <a href="?sim=physics" style={{ marginRight: '10px', fontWeight: simId === 'physics' ? 'bold' : 'normal' }}>Phase 1 (Physik)</a>
          <a href="?sim=spam" style={{ marginRight: '10px', fontWeight: simId === 'spam' ? 'bold' : 'normal' }}>Phase 2 (Spam)</a>
          <a href="?sim=spam_advanced" style={{ marginRight: '10px', fontWeight: simId === 'spam_advanced' ? 'bold' : 'normal' }}>Phase 3 (Spam Extended)</a>
          <a href="?sim=spam_nonlinear" style={{ marginRight: '10px', fontWeight: simId === 'spam_nonlinear' ? 'bold' : 'normal' }}>Phase 4 (Nonlinear)</a>
          <a href="?sim=spam_hidden" style={{ fontWeight: simId === 'spam_hidden' ? 'bold' : 'normal' }}>Phase 5 (Deep)</a>
        </div>
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

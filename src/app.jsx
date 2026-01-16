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
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('sim') || 'linear_regression';
      setSimId(id);
    };

    window.addEventListener('popstate', handlePopState);

    // Initial load
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigation = (event, id) => {
    event.preventDefault();
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
          <div className="sim-selector" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
            <a href="?sim=linear_regression" onClick={(e) => handleNavigation(e, 'linear_regression')} style={{ marginRight: '10px' }}>Back to App</a>
          </div>
        </header>
        <main>
          <ArchitectureGallery />
        </main>
      </div>
    );
  }

  // Common Header for Phases
  const getValidationTitle = (id) => {
    switch (id) {
      case 'linear_regression': return 'Phase 1: Linear Regression';
      case 'logistic_regression': return 'Phase 2: Logistic Regression';
      case 'multiple_inputs': return 'Phase 3: Multiple Inputs';
      case 'single_layer_nonlinear': return 'Phase 4: Single Layer Nonlinear Data';
      case 'double_layer_nonlinear': return 'Phase 5: Double Layer Nonlinear Data';
      default: return 'Neural Network Demonstrator';
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Neural Network Demonstrator</h1>
        <p>{getValidationTitle(simId)}</p>
        <nav className="sim-selector" aria-label="Phase Navigation" style={{ fontSize: '0.8rem', marginTop: '5px' }}>
          <a href="?sim=linear_regression" onClick={(e) => handleNavigation(e, 'linear_regression')} aria-current={simId === 'linear_regression' ? 'page' : undefined} style={{ marginRight: '10px', fontWeight: simId === 'linear_regression' ? 'bold' : 'normal' }}>Phase 1 (Linear)</a>
          <a href="?sim=logistic_regression" onClick={(e) => handleNavigation(e, 'logistic_regression')} aria-current={simId === 'logistic_regression' ? 'page' : undefined} style={{ marginRight: '10px', fontWeight: simId === 'logistic_regression' ? 'bold' : 'normal' }}>Phase 2 (Logistic)</a>
          <a href="?sim=multiple_inputs" onClick={(e) => handleNavigation(e, 'multiple_inputs')} aria-current={simId === 'multiple_inputs' ? 'page' : undefined} style={{ marginRight: '10px', fontWeight: simId === 'multiple_inputs' ? 'bold' : 'normal' }}>Phase 3 (Multi)</a>
          <a href="?sim=single_layer_nonlinear" onClick={(e) => handleNavigation(e, 'single_layer_nonlinear')} aria-current={simId === 'single_layer_nonlinear' ? 'page' : undefined} style={{ marginRight: '10px', fontWeight: simId === 'single_layer_nonlinear' ? 'bold' : 'normal' }}>Phase 4 (Nonlinear 1)</a>
          <a href="?sim=double_layer_nonlinear" onClick={(e) => handleNavigation(e, 'double_layer_nonlinear')} aria-current={simId === 'double_layer_nonlinear' ? 'page' : undefined} style={{ fontWeight: simId === 'double_layer_nonlinear' ? 'bold' : 'normal' }}>Phase 5 (Nonlinear 2)</a>
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

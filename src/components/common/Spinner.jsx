import './Spinner.css';

export function Spinner({ className = '', ...props }) {
  return <span className={`spinner ${className}`} role="status" aria-label="loading" {...props} />;
}

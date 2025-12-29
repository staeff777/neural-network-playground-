import { useState, useEffect } from 'preact/hooks';
import { emails, scanEmail } from '../../lib/simulations/spam/emails';

export function EmailVisualizer({ neuralNet }) {
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0);
  const email = emails[currentEmailIndex];

  // Calculate live prediction
  // The 'scanEmail' gives us the raw counts.
  const features = scanEmail(email.text); // [spam, link, caps, exclam]
  // In a real app we might pass this to the model, but here the model is trained on these counts.
  // Wait, does the model take raw counts? Yes, LogisticModel.predict(inputs).

  const probability = neuralNet.predict(features);
  const isSpam = probability > 0.5;

  const nextEmail = () => setCurrentEmailIndex((currentEmailIndex + 1) % emails.length);
  const prevEmail = () => setCurrentEmailIndex((currentEmailIndex - 1 + emails.length) % emails.length);

  // Helper to highlight text
  const renderHighlightedText = (text, highlights) => {
    if (!highlights || highlights.length === 0) return text;

    // Simple replacement approach (careful with overlaps, but demo emails are simple)
    // We split by segments.
    // Actually, let's just use a simple regex replacer for the demo keywords if they exist in the highlight list.

    // Better: Sort highlights by position... but we stored just text/type.
    // Let's iterate and replace for display.
    // Warning: replacing "win" inside "winner" might be tricky if not careful.
    // But scanEmail logic was simple `includes`.

    // Let's split text by spaces and check?
    // User wants "Spam-Words, Links, Großbuchstaben" hervorgehoben.

    const parts = text.split(/(\s+)/); // Split keep delimiters
    return parts.map((part, i) => {
        // Check matches
        const lower = part.toLowerCase();
        // Check highlight rules from our email data
        const match = highlights.find(h => part.includes(h.text) || (h.type === 'caps' && part === h.text));

        // Or re-run the "scan" logic locally to determine color?
        // Let's stick to the manual highlights in data for robustness in display
        const highlightObj = highlights.find(h => part.includes(h.text));

        let style = {};
        if (highlightObj) {
            if (highlightObj.type === 'spam') style = { backgroundColor: '#ffcccc', color: '#d00' }; // Reddish
            if (highlightObj.type === 'link') style = { backgroundColor: '#ccf', color: '#00d', textDecoration: 'underline' }; // Blueish
            if (highlightObj.type === 'caps') style = { fontWeight: 'bold', color: '#e67e22' }; // Orange
        }

        return <span key={i} style={style}>{part}</span>;
    });
  };

  return (
    <div style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '20px',
        background: '#f9f9f9',
        height: '300px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    }}>
      {/* Header / Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <button onClick={prevEmail}>&lt; Prev</button>
        <strong style={{ fontSize: '1.1em' }}>Email {currentEmailIndex + 1} / {emails.length}: {email.subject}</strong>
        <button onClick={nextEmail}>Next &gt;</button>
      </div>

      {/* Email Body */}
      <div style={{
          flex: 1,
          background: '#fff',
          border: '1px solid #eee',
          padding: '15px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          overflowY: 'auto'
      }}>
        {renderHighlightedText(email.text, email.highlights)}
      </div>

      {/* Analysis Footer */}
      <div style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', fontSize: '0.9em', color: '#555', marginBottom: '5px' }}>
            <span>Spam-Wörter: <strong>{features[0]}</strong></span>
            <span>Links: <strong>{features[1]}</strong></span>
            <span>CAPS: <strong>{features[2]}</strong></span>
            <span>!!!: <strong>{features[3]}</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
                Modell-Bias: <strong>{neuralNet.bias.toFixed(2)}</strong>
            </span>
            <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '0.8em', color: '#888' }}>Wahrscheinlichkeit</span>
                <span style={{
                    fontSize: '1.5em',
                    fontWeight: 'bold',
                    color: isSpam ? '#c0392b' : '#27ae60'
                }}>
                    {(probability * 100).toFixed(1)}% ({isSpam ? 'SPAM' : 'OK'})
                </span>
            </div>
        </div>
      </div>
    </div>
  );
}

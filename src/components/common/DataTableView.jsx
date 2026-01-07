export function DataTableView({ data, vizProps, simConfig, maximizedPanel }) {
    if (!data || data.length === 0) {
        return (
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No training data generated yet.
            </p>
        );
    }

    const isClassification = [
        'logistic_regression',
        'spam',
        'spam_advanced',
        'spam_hidden',
        'spam_nonlinear',
        // Phases 3–5 spam sims
        'multiple_inputs',
        'single_layer_nonlinear',
        'double_layer_nonlinear',
    ].includes(simConfig?.id);

    return (
        <div style={{ maxHeight: maximizedPanel ? 'calc(100vh - 350px)' : '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#eee', borderBottom: '2px solid #ddd' }}>
                        {Array.isArray(vizProps.inputLabels) ? (
                            vizProps.inputLabels.map((lbl, idx) => (
                                <th key={idx} style={{ padding: '8px' }}>{lbl}</th>
                            ))
                        ) : (
                            <th style={{ padding: '8px' }}>Input ({vizProps.inputLabel})</th>
                        )}
                        <th style={{ padding: '8px' }}>{isClassification ? 'Spam?' : 'Target'}</th>
                        {data.length > 0 && data[0].text && (
                            <th style={{ padding: '8px' }}>Email Text</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {data.map((d, i) => {
                        let rowColor = 'transparent';
                        let displayTarget = d.target;
                        let targetStyle = { padding: '8px' };

                        if (isClassification) {
                            const isSpam = d.target === 1;
                            rowColor = isSpam ? '#ffebee' : '#e8f5e9';
                            displayTarget = isSpam ? 'SPAM' : 'HAM';
                            targetStyle = {
                                ...targetStyle,
                                fontWeight: 'bold',
                                color: isSpam ? '#c0392b' : '#27ae60'
                            };
                        } else {
                            displayTarget = typeof d.target === 'number' ? d.target.toFixed(2) : d.target;
                        }

                        return (
                            <tr key={i} style={{ background: rowColor, borderBottom: '1px solid #ddd' }}>
                                {Array.isArray(d.input) ? (
                                    d.input.map((v, idx) => (
                                        <td key={idx} style={{ padding: '8px' }}>{v.toFixed(0)}</td>
                                    ))
                                ) : (
                                    <td style={{ padding: '8px' }}>{d.input.toFixed(2)}</td>
                                )}

                                <td style={targetStyle}>
                                    {displayTarget}
                                </td>
                                {d.text && (
                                    <td style={{ padding: '8px', color: '#555', fontStyle: 'italic', maxWidth: '300px' }}>
                                        {d.text}
                                    </td>
                                )}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}

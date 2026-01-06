export function DataViewSwitcher({ viewMode, onChange }) {
    return (
        <div style={{ display: 'flex' }}>
            <div style={{ background: '#eee', borderRadius: '4px', padding: '2px', display: 'flex', gap: '2px' }}>
                <button
                    onClick={() => onChange('table')}
                    style={{
                        background: viewMode === 'table' ? '#fff' : 'transparent',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '5px 15px',
                        cursor: 'pointer',
                        boxShadow: viewMode === 'table' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        fontWeight: viewMode === 'table' ? 'bold' : 'normal',
                        color: viewMode === 'table' ? '#333' : '#666'
                    }}
                >
                    Table
                </button>
                <button
                    onClick={() => onChange('plot')}
                    style={{
                        background: viewMode === 'plot' ? '#fff' : 'transparent',
                        border: 'none',
                        borderRadius: '3px',
                        padding: '5px 15px',
                        cursor: 'pointer',
                        boxShadow: viewMode === 'plot' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                        fontWeight: viewMode === 'plot' ? 'bold' : 'normal',
                        color: viewMode === 'plot' ? '#333' : '#666'
                    }}
                >
                    Graph
                </button>
            </div>
        </div>
    );
}

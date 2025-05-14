import React from 'react';

const SettingsView: React.FC = () => {
  const handleDeleteDatabase = () => {
    if (window.confirm('Are you sure you want to delete the local database? This action cannot be undone.')) {
      // Logic to delete the local database
      console.log('Local database deleted');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Settings</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Setting</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {/* Example settings row */}
          <tr>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Example Setting</td>
            <td style={{ border: '1px solid #ddd', padding: '8px' }}>Enabled</td>
          </tr>
        </tbody>
      </table>
      <button 
        onClick={handleDeleteDatabase} 
        style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Delete Local Database
      </button>
    </div>
  );
};

export default SettingsView;

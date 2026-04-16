import React from 'react';

const TestPage = () => {
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      marginTop: '50px'
    }}>
      <h1 style={{ color: '#333' }}>🎉 React is Working! 🎉</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        If you can see this page, React is successfully rendering!
      </p>
      <div style={{ 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '8px',
        display: 'inline-block'
      }}>
        <h3>Admin Panel Status:</h3>
        <p>✅ React Components: Working</p>
        <p>✅ TypeScript: Working</p>
        <p>✅ Development Server: Running on port 5173</p>
        <p>✅ Build Process: Successful</p>
      </div>
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#999' }}>
        Server: localhost:5173 | Time: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
};

export default TestPage;

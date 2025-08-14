import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './App.css';
import KontrollavgiftForm from './components/KontrollavgiftForm';
import BotList from './components/BotList';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'form' | 'list'>('form');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Laddar...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="App">
      <div className="navigation">
        <button 
          className={`nav-button ${currentView === 'form' ? 'active' : ''}`}
          onClick={() => setCurrentView('form')}
        >
          📝 Skapa kontrollavgift
        </button>
        <button 
          className={`nav-button ${currentView === 'list' ? 'active' : ''}`}
          onClick={() => setCurrentView('list')}
        >
          📋 Visa alla böter
        </button>
        <button onClick={handleLogout} className="logout-button">
          Logga ut
        </button>
      </div>

      {currentView === 'form' ? (
        <KontrollavgiftForm user={user} onLogout={handleLogout} />
      ) : (
        <BotList user={user} />
      )}
    </div>
  );
}

export default App;

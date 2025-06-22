import { useEffect, useState } from 'react';
import './App.css';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import SettingsDialog from './components/SettingsDialog';
import ProjectList from './components/ProjectList';
import { fetchProjects, fetchClients } from './services/tickApi';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#1e1e1e',
      paper: '#252526',
    },
    primary: {
      main: '#007acc',
    },
    secondary: {
      main: '#ff4081',
    },
  },
});

interface Settings {
  token: string;
  email: string;
  subscriptionId: string;
}

const SETTINGS_KEY = 'tick_settings';

function getSettings(): Settings | null {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Settings;
  } catch {
    return null
  }
}

function saveSettings(settings: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function App() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [projects, setProjects] = useState<any[] | null>(null);
  const [clients, setClients] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = getSettings();
    if (!s) {
      setIsSettingsOpen(true);
    } else {
      setSettings(s);
    }
  }, []);

  useEffect(() => {
    if (settings) {
      setLoading(true);
      setError(null);
      Promise.all([
        fetchProjects(settings),
        fetchClients(settings)
      ])
        .then(([projects, clients]) => {
          setProjects(projects);
          setClients(clients);
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [settings]);

  const handleSaveSettings = (newSettings: Settings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
    setIsSettingsOpen(false);
  };

  const handleOpenSettings = () => {
    setIsSettingsOpen(true);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <IconButton 
        onClick={handleOpenSettings} 
        aria-label="settings"
        style={{ 
          position: 'fixed', 
          top: 5, 
          left: 5, 
          zIndex: 1000 
        }}
      >
        <SettingsIcon />
      </IconButton>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SettingsDialog
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          initialSettings={settings || undefined}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
          <h1 style={{ margin: 0 }}>Tick Tracker</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <CircularProgress />
            </div>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {projects && clients && settings && (
            <ProjectList clients={clients} projects={projects} settings={settings} />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
} 
import { useEffect, useState } from 'react';
import './App.css';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import SettingsIcon from '@mui/icons-material/Settings';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import SettingsDialog from './components/SettingsDialog';
import GeneralSettingsDialog from './components/GeneralSettingsDialog';
import ProjectList from './components/ProjectList';
import { fetchProjects, fetchClients, getSystemTheme, onSystemThemeChange, removeSystemThemeListener } from './services/tickApi';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Create theme based on dark mode preference
const createAppTheme = (isDarkMode: boolean): Theme => {
  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: isDarkMode ? {
        default: '#1e1e1e',
        paper: '#252526',
      } : {
        default: '#ffffff',
        paper: '#f5f5f5',
      },
      primary: {
        main: '#007acc',
      },
      secondary: {
        main: '#ff4081',
      },
    },
  });
};

// Fallback theme (current implementation)
const fallbackTheme = createAppTheme(true);

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
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState<boolean>(false);
  const [projects, setProjects] = useState<any[] | null>(null);
  const [clients, setClients] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>(fallbackTheme);

  // Initialize system theme
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        const systemTheme = await getSystemTheme();
        const theme = createAppTheme(systemTheme.shouldUseDarkColors);
        setCurrentTheme(theme);
      } catch (error) {
        console.warn('Failed to get system theme, using fallback:', error);
        setCurrentTheme(fallbackTheme);
      }
    };

    initializeTheme();

    // Set up system theme change listener
    const handleThemeChange = (event: any, themeInfo: { shouldUseDarkColors: boolean }) => {
      try {
        const theme = createAppTheme(themeInfo.shouldUseDarkColors);
        setCurrentTheme(theme);
      } catch (error) {
        console.warn('Failed to update theme, using fallback:', error);
        setCurrentTheme(fallbackTheme);
      }
    };

    onSystemThemeChange(handleThemeChange);

    // Cleanup listener on unmount
    return () => {
      removeSystemThemeListener(handleThemeChange);
    };
  }, []);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleApiConfig = () => {
    setIsSettingsOpen(true);
    handleMenuClose();
  };

  const handleGeneralSettings = () => {
    setIsGeneralSettingsOpen(true);
    handleMenuClose();
  };

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

  const handleSaveGeneralSettings = () => {
    setIsGeneralSettingsOpen(false);
  };

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <IconButton 
        onClick={handleMenuClick}
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
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleApiConfig}>API Configurations</MenuItem>
        <MenuItem onClick={handleGeneralSettings}>Settings</MenuItem>
      </Menu>
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <SettingsDialog
          open={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          initialSettings={settings || undefined}
        />
        <GeneralSettingsDialog
          open={isGeneralSettingsOpen}
          onClose={() => setIsGeneralSettingsOpen(false)}
          onSave={handleSaveGeneralSettings}
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
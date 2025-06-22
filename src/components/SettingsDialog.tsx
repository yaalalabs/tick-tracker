import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

interface Settings {
  token: string;
  email: string;
  subscriptionId: string;
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  initialSettings?: Settings;
}

export default function SettingsDialog({ open, onClose, onSave, initialSettings }: SettingsDialogProps) {
  const [token, setToken] = useState(initialSettings?.token || '');
  const [email, setEmail] = useState(initialSettings?.email || '');
  const [subscriptionId, setSubscriptionId] = useState(initialSettings?.subscriptionId || '');

  useEffect(() => {
    if (initialSettings) {
      setToken(initialSettings.token);
      setEmail(initialSettings.email);
      setSubscriptionId(initialSettings.subscriptionId);
    }
  }, [initialSettings]);

  const handleSave = () => {
    onSave({ token, email, subscriptionId });
    onClose();
  };

  return (
    <Dialog open={open} disableEscapeKeyDown>
      <DialogTitle>Tick API Settings</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="API Token"
          type="text"
          fullWidth
          value={token}
          onChange={e => setToken(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Email (for User-Agent)"
          type="email"
          fullWidth
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Subscription ID"
          type="text"
          fullWidth
          value={subscriptionId}
          onChange={e => setSubscriptionId(e.target.value)}
          helperText="Find this in your Tick account URL."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave} disabled={!token || !email || !subscriptionId} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
} 
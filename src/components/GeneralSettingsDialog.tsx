import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

interface GeneralSettings {
  notificationTime: number;
}

interface GeneralSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (settings: GeneralSettings) => void;
  initialSettings?: GeneralSettings;
}

const NOTIFICATION_TIME_KEY = 'notification_time_hours';

function getNotificationTime(): number {
  const raw = localStorage.getItem(NOTIFICATION_TIME_KEY);
  return raw ? parseFloat(raw) : 6;
}

export default function GeneralSettingsDialog({ open, onClose, onSave, initialSettings }: GeneralSettingsDialogProps) {
  const [notificationTime, setNotificationTime] = useState(initialSettings?.notificationTime || 6);

  useEffect(() => {
    if (open) {
      setNotificationTime(getNotificationTime());
    }
  }, [open]);

  const handleSave = () => {
    const newSettings = { notificationTime };
    localStorage.setItem(NOTIFICATION_TIME_KEY, notificationTime.toString());
    onSave(newSettings);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Notification Time (in hours)"
          type="number"
          fullWidth
          variant="outlined"
          value={notificationTime}
          onChange={(e) => setNotificationTime(parseFloat(e.target.value))}
          InputProps={{ inputProps: { min: 0.1, step: 0.5 } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
} 
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tickApi', {
  fetchProjects: (settings) => ipcRenderer.invoke('fetch-projects', settings),
  fetchTasks: (settings, projectId) => ipcRenderer.invoke('fetch-tasks', settings, projectId),
  logTimeToTick: (settings, projectId, taskId, hours, date) => ipcRenderer.invoke('log-time', settings, projectId, taskId, hours, date),
  fetchClients: (settings) => ipcRenderer.invoke('fetch-clients', settings),
  timerStarted: () => ipcRenderer.invoke('timer-started'),
  timerStopped: () => ipcRenderer.invoke('timer-stopped'),
  notifyTimerExceeded: () => ipcRenderer.invoke('notify-timer-exceeded'),
  startTimer: (notificationTimeHours) => ipcRenderer.invoke('start-timer', notificationTimeHours),
  stopTimer: () => ipcRenderer.invoke('stop-timer'),
  getTimerState: () => ipcRenderer.invoke('get-timer-state'),
  onTimerUpdate: (callback) => ipcRenderer.on('timer-update', callback),
  onTimerStopped: (callback) => ipcRenderer.on('timer-stopped', callback),
});

window.addEventListener('DOMContentLoaded', () => {
  // You can expose APIs here if needed
}); 
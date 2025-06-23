import { useState, useEffect, useRef } from 'react';
import IconButton from '@mui/material/IconButton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Button from '@mui/material/Button';
import { logTimeToTick, fetchTasks } from '../services/tickApi';

interface Client {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
  client_id: number;
}

interface Task {
  id: number;
  name: string;
}

interface ProjectListProps {
  clients: Client[];
  projects: Project[];
  settings: {
    token: string;
    email: string;
    subscriptionId: string;
  };
}

const SELECTED_CLIENT_KEY = 'selected_client';
const SELECTED_PROJECT_KEY = 'selected_project';
const SELECTED_TASK_KEY = 'selected_task';
const NOTIFICATION_TIME_KEY = 'notification_time_hours';

function getNotificationTime(): number {
  const raw = localStorage.getItem(NOTIFICATION_TIME_KEY);
  return raw ? parseFloat(raw) : 6;
}

function getSelectedClient(): number | null {
  const raw = localStorage.getItem(SELECTED_CLIENT_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function getSelectedProject(): number | null {
  const raw = localStorage.getItem(SELECTED_PROJECT_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function getSelectedTask(): number | null {
  const raw = localStorage.getItem(SELECTED_TASK_KEY);
  return raw ? parseInt(raw, 10) : null;
}

function saveSelectedClient(clientId: number) {
  localStorage.setItem(SELECTED_CLIENT_KEY, clientId.toString());
}

function saveSelectedProject(projectId: number) {
  localStorage.setItem(SELECTED_PROJECT_KEY, projectId.toString());
}

function saveSelectedTask(taskId: number) {
  localStorage.setItem(SELECTED_TASK_KEY, taskId.toString());
}

export default function ProjectList({ clients, projects, settings }: ProjectListProps) {
  const [selectedClient, setSelectedClient] = useState<number | null>(getSelectedClient());
  const [selectedProject, setSelectedProject] = useState<number | null>(getSelectedProject());
  const [selectedTask, setSelectedTask] = useState<number | null>(getSelectedTask());
  const [tasks, setTasks] = useState<{ [projectId: number]: Task[] }>({});
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const [active, setActive] = useState<{ projectId: number | null; taskId: number | null }>({ projectId: null, taskId: null });
  const [lastCompletedTask, setLastCompletedTask] = useState<{ projectId: number | null; taskId: number | null; time: number } | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  // Mark data as loaded when clients and projects are available
  useEffect(() => {
    if (clients.length > 0 && projects.length > 0) {
      setDataLoaded(true);
    }
  }, [clients, projects]);

  // Validate and fix selections only after data is loaded and user has interacted
  useEffect(() => {
    if (!dataLoaded || !userInteracted) return;

    // Validate client selection
    if (selectedClient !== null && !clients.find(c => c.id === selectedClient)) {
      setSelectedClient(null);
      localStorage.removeItem(SELECTED_CLIENT_KEY);
    }

    // Validate project selection
    if (selectedProject !== null) {
      const project = projects.find(p => p.id === selectedProject);
      if (!project || (selectedClient !== null && project.client_id !== selectedClient)) {
        setSelectedProject(null);
        localStorage.removeItem(SELECTED_PROJECT_KEY);
      }
    }

    // Validate task selection
    if (selectedTask !== null && selectedProject !== null) {
      const projectTasks = tasks[selectedProject];
      // Only validate if tasks are loaded and user has interacted
      if (projectTasks && userInteracted && !projectTasks.find(t => t.id === selectedTask)) {
        console.log('Invalidating task selection:', selectedTask, 'available tasks:', projectTasks);
        setSelectedTask(null);
        localStorage.removeItem(SELECTED_TASK_KEY);
      }
    }
  }, [dataLoaded, userInteracted, clients, projects, tasks, selectedClient, selectedProject, selectedTask]);

  // Load tasks for restored project on initial load
  useEffect(() => {
    if (selectedProject && !tasks[selectedProject] && !userInteracted) {
      fetchTasks(settings, selectedProject).then((t) => {
        setTasks((prev) => ({ ...prev, [selectedProject]: t }));
      });
    }
  }, [selectedProject, settings, tasks, userInteracted]);

  useEffect(() => {
    if (selectedProject && !tasks[selectedProject]) {
      fetchTasks(settings, selectedProject).then((t) => {
        setTasks((prev) => ({ ...prev, [selectedProject]: t }));
      });
    }
  }, [selectedProject, settings, tasks]);

  useEffect(() => {
    if (selectedClient !== null) {
      saveSelectedClient(selectedClient);
      // Only reset project and task when client changes (not during initial load)
      if (dataLoaded && userInteracted) {
        setSelectedProject(null);
        setSelectedTask(null);
        localStorage.removeItem(SELECTED_PROJECT_KEY);
        localStorage.removeItem(SELECTED_TASK_KEY);
      }
    }
  }, [selectedClient, dataLoaded, userInteracted]);

  useEffect(() => {
    if (selectedProject !== null) {
      saveSelectedProject(selectedProject);
      // Only reset task when user changes project (not during initial load)
      if (userInteracted) {
        setSelectedTask(null);
        localStorage.removeItem(SELECTED_TASK_KEY);
      }
    }
  }, [selectedProject, userInteracted]);

  useEffect(() => {
    if (selectedTask !== null) {
      saveSelectedTask(selectedTask);
    }
  }, [selectedTask]);

  // Timer management using main process
  useEffect(() => {
    if (active.projectId && active.taskId) {
      const notificationTimeHours = getNotificationTime();
      window.tickApi.startTimer(notificationTimeHours);
      
      // Listen for timer updates from main process
      const handleTimerUpdate = (event: any, seconds: number) => {
        setTimers((prev) => {
          const key = `${active.projectId}_${active.taskId}`;
          return { ...prev, [key]: seconds };
        });
      };
      
      const handleTimerStopped = () => {
        setActive({ projectId: null, taskId: null });
        setNotificationSent(false);
      };
      
      window.tickApi.onTimerUpdate(handleTimerUpdate);
      window.tickApi.onTimerStopped(handleTimerStopped);
      
      return () => {
        // Cleanup listeners
        window.tickApi.onTimerUpdate(() => {});
        window.tickApi.onTimerStopped(() => {});
      };
    } else {
      window.tickApi.stopTimer();
    }
  }, [active]);

  // Restore timer state on component mount
  useEffect(() => {
    const restoreTimerState = async () => {
      try {
        const timerState = await window.tickApi.getTimerState();
        if (timerState.isActive) {
          // If there's an active timer, we need to restore the UI state
          // This would require storing the active project/task in localStorage
          // For now, we'll just stop any existing timer
          window.tickApi.stopTimer();
        }
      } catch (error) {
        console.error('Failed to restore timer state:', error);
      }
    };
    
    restoreTimerState();
  }, []);

  const handleStart = () => {
    if (selectedProject && selectedTask) {
      setActive({ projectId: selectedProject, taskId: selectedTask });
      setNotificationSent(false); // Reset notification sent flag
      // Update app icon to show timer is active
      window.tickApi.timerStarted();
    }
  };

  const handleStop = async () => {
    if (active.projectId && active.taskId) {
      const key = `${active.projectId}_${active.taskId}`;
      const seconds = timers[key] || 0;
      if (seconds > 0) {
        const hours = seconds / 3600;
        const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        try {
          await logTimeToTick(settings, active.projectId, active.taskId, hours, date);
        } catch (e) {
          console.error('logTimeToTick failed', e);
        }
        setTimers((prev) => ({ ...prev, [key]: 0 }));
      }
      // Set the last completed task
      setLastCompletedTask({ projectId: active.projectId, taskId: active.taskId, time: seconds });
      setActive({ projectId: null, taskId: null });
      setNotificationSent(false);
      // Update app icon to show timer is inactive
      window.tickApi.timerStopped();
    }
  };

  // Filter projects by selected client
  const filteredProjects = selectedClient !== null ? projects.filter(p => p.client_id === selectedClient) : [];

  function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}
          disabled={!!(active.projectId && active.taskId)}>
          <InputLabel>Client</InputLabel>
          <Select
            value={selectedClient || ''}
            onChange={e => {
              setUserInteracted(true);
              setSelectedClient(e.target.value as number);
            }}
            label="Client"
          >
            {clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}
          disabled={!selectedClient || !!(active.projectId && active.taskId)}>
          <InputLabel>Project</InputLabel>
          <Select
            value={selectedProject || ''}
            onChange={e => {
              setUserInteracted(true);
              setSelectedProject(e.target.value as number);
            }}
            label="Project"
          >
            {filteredProjects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}
          disabled={!selectedProject || !!(active.projectId && active.taskId)}>
          <InputLabel>Task</InputLabel>
          <Select
            value={selectedTask || ''}
            onChange={e => {
              setUserInteracted(true);
              setSelectedTask(e.target.value as number);
            }}
            label="Task"
          >
            {(selectedProject && tasks[selectedProject] ? tasks[selectedProject] : []).map((task) => (
              <MenuItem key={task.id} value={task.id}>
                {task.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 12 }}>
        {active.projectId && active.taskId ? (
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleStop}
            startIcon={<StopIcon />}
            style={{ minWidth: 200 }}
          >
            Stop
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleStart} 
            disabled={!selectedProject || !selectedTask}
            startIcon={<PlayArrowIcon />}
            style={{ minWidth: 200 }}
          >
            Start
          </Button>
        )}
        
        {active.projectId && active.taskId && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <strong>Timer:</strong> {formatTime(timers[`${active.projectId}_${active.taskId}`] || 0)}
          </div>
        )}
      </div>
      
      {lastCompletedTask && !active.projectId && !active.taskId && (
        <div style={{ marginTop: 16, padding: 8, backgroundColor: '#2d2d2d', borderRadius: 4, textAlign: 'center' }}>
          <strong>Last completed task:</strong><br />
          {(() => {
            const project = projects.find(p => p.id === lastCompletedTask.projectId);
            const task = lastCompletedTask.taskId && lastCompletedTask.projectId && tasks[lastCompletedTask.projectId] 
              ? tasks[lastCompletedTask.projectId].find(t => t.id === lastCompletedTask.taskId)
              : null;
            return (
              <span>
                {project?.name} - {task?.name}<br />
                <strong>Time:</strong> {formatTime(lastCompletedTask.time)}
              </span>
            );
          })()}
        </div>
      )}
    </div>
  );
} 
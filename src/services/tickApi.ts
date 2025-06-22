interface Settings {
    token: string;
    email: string;
    subscriptionId: string;
}

declare global {
    interface Window {
        tickApi: {
            fetchProjects: (settings: Settings) => Promise<any>;
            fetchTasks: (settings: Settings, projectId: number) => Promise<any>;
            logTimeToTick: (settings: Settings, projectId: number, taskId: number, hours: number, date: string) => Promise<any>;
            fetchClients: (settings: Settings) => Promise<any>;
            timerStarted: () => Promise<void>;
            timerStopped: () => Promise<void>;
            notifyTimerExceeded: () => Promise<void>;
        };
    }
}

export const fetchProjects = async (settings: Settings) => {
    const projects = await window.tickApi.fetchProjects(settings);
    console.log('Received projects:', projects);
    return projects;
};

export const fetchTasks = async (settings: Settings, projectId: number) => {
    return window.tickApi.fetchTasks(settings, projectId);
};

export const logTimeToTick = async (settings: Settings, projectId: number, taskId: number, hours: number, date: string) => {
    return window.tickApi.logTimeToTick(settings, projectId, taskId, hours, date);
};

export const fetchClients = async (settings: Settings) => {
    return window.tickApi.fetchClients(settings);
};

export const notifyTimerExceeded = async () => {
    return window.tickApi.notifyTimerExceeded();
};
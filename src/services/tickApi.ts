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
            startTimer: (notificationTimeHours: number) => Promise<void>;
            stopTimer: () => Promise<void>;
            getTimerState: () => Promise<{
                isActive: boolean;
                seconds: number;
                notificationTimeSeconds: number;
            }>;
            onTimerUpdate: (callback: (event: any, seconds: number) => void) => void;
            onTimerStopped: (callback: (event: any) => void) => void;
            getSystemTheme: () => Promise<{
                shouldUseDarkColors: boolean;
                shouldUseHighContrastColors: boolean;
                shouldUseInvertedColorScheme: boolean;
            }>;
            onSystemThemeChange: (callback: (event: any, theme: {
                shouldUseDarkColors: boolean;
                shouldUseHighContrastColors: boolean;
                shouldUseInvertedColorScheme: boolean;
            }) => void) => void;
            removeSystemThemeListener: (callback: (event: any, theme: {
                shouldUseDarkColors: boolean;
                shouldUseHighContrastColors: boolean;
                shouldUseInvertedColorScheme: boolean;
            }) => void) => void;
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

export const getSystemTheme = async () => {
    return window.tickApi.getSystemTheme();
};

export const onSystemThemeChange = (callback: (event: any, theme: { shouldUseDarkColors: boolean; shouldUseHighContrastColors: boolean; shouldUseInvertedColorScheme: boolean; }) => void) => {
    return window.tickApi.onSystemThemeChange(callback);
};

export const removeSystemThemeListener = (callback: (event: any, theme: { shouldUseDarkColors: boolean; shouldUseHighContrastColors: boolean; shouldUseInvertedColorScheme: boolean; }) => void) => {
    return window.tickApi.removeSystemThemeListener(callback);
};
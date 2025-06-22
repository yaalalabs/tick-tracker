# Tick Tracker

A desktop time tracking application built with Electron, React, and TypeScript that integrates with the TickSpot API for seamless time logging and project management.

## Features

### 🕒 Time Tracking
- **Start/Stop Timer**: Simple one-click timer control with visual feedback
- **Time Display**: Real-time display of elapsed time in hours and minutes
- **Timer State Persistence**: Timer state is maintained even when the app is minimized

### 📊 TickSpot Integration
- **Project Management**: Fetch and display projects from your TickSpot account
- **Task Management**: Browse tasks within selected projects
- **Time Logging**: Automatically log time entries to TickSpot with project and task selection
- **Client Management**: View and manage clients associated with projects

### 🖥️ Desktop Features
- **System Tray Integration**: Minimize to system tray with persistent icon
- **Taskbar Integration**: Pin to taskbar with dynamic overlay icon showing timer status
- **Global Shortcuts**: Use `Ctrl+Shift+T` to toggle window visibility
- **Single Instance**: Only one instance can run at a time, preventing duplicate launches
- **Window Management**: Smart window restoration and focus handling

### 🎨 User Interface
- **Modern UI**: Built with Material-UI components for a clean, professional look
- **Responsive Design**: Optimized for the desktop window size (400x450)
- **Visual Feedback**: 
  - Timer status indicated by icon changes (default vs. active state)
  - Taskbar overlay icon shows when timer is running
  - System tray icon reflects current timer state

### ⚙️ Settings & Configuration
- **API Configuration**: Secure storage of TickSpot API credentials
- **General Settings**: Customizable application preferences
- **Persistent Settings**: Settings are saved and restored between sessions

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Development Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd tick-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. In a separate terminal, start Electron:
   ```bash
   npm run electron
   ```

### Building for Production
To create a distributable package:

```bash
npm run build
```

This will create:
- Windows installer in `dist/` directory
- Portable executable in `dist/win-unpacked/`

## Configuration

### TickSpot API Setup
1. Get your TickSpot API token from your account settings
2. Note your subscription ID from the TickSpot URL
3. Configure these in the app's settings dialog

### Required TickSpot Permissions
- Read access to projects and tasks
- Write access for time entries
- Access to client information

## Usage

### Basic Time Tracking
1. **Start Timer**: Click the start button to begin tracking time
2. **Select Project**: Choose a project from the dropdown
3. **Select Task**: Choose a specific task within the project
4. **Stop Timer**: Click stop when finished
5. **Log Time**: The time will be automatically logged to TickSpot

### Window Management
- **Minimize**: Window minimizes to system tray
- **Close**: Window hides to system tray (use tray menu to quit)
- **Restore**: Click tray icon or taskbar icon to restore window
- **Global Shortcut**: Press `Ctrl+Shift+T` to toggle window visibility

### System Tray
- **Left Click**: Toggle window visibility
- **Right Click**: Context menu with options:
  - Show App
  - Hide App
  - Quit

## Technical Details

### Architecture
- **Frontend**: React 19 with TypeScript
- **Backend**: Electron main process
- **UI Framework**: Material-UI (MUI)
- **Build Tool**: Vite
- **Package Manager**: npm

### Key Components
- `main.js`: Electron main process with window and tray management
- `App.tsx`: Main React application component
- `tickApi.ts`: TickSpot API integration service
- `SettingsDialog.tsx`: Application settings interface
- `ProjectList.tsx`: Project and task selection component

### File Structure
```
tick-tracker/
├── src/
│   ├── components/          # React components
│   ├── services/           # API services
│   └── assets/            # Static assets
├── public/                # Public assets (icons)
├── dist/                  # Built application
├── main.js               # Electron main process
├── preload.js            # Electron preload script
└── package.json          # Project configuration
```

### Build Configuration
- **Vite**: Configured for React with relative asset paths
- **Electron Builder**: Windows installer with proper resource handling
- **Single Instance Lock**: Prevents multiple app instances
- **Icon Management**: Proper handling of tray and taskbar icons

## Development

### Available Scripts
- `npm run dev`: Start Vite development server
- `npm run electron`: Start Electron in development mode
- `npm run build`: Build for production
- `npm run lint`: Run ESLint

### Development Notes
- The app uses relative paths for assets in production builds
- Icons are properly packaged and accessible in both dev and production
- Single instance lock prevents multiple app launches
- Timer state is preserved across window operations

## Troubleshooting

### Common Issues
1. **Timer not starting**: Check TickSpot API credentials in settings
2. **Icons not showing**: Ensure icon files are in the `public/` directory
3. **Multiple instances**: The app enforces single instance - close existing instances first
4. **Taskbar overlay not updating**: Restart the app to refresh icon states

### API Issues
- Verify your TickSpot API token is valid
- Check your subscription ID is correct
- Ensure you have proper permissions for the projects/tasks

## License

[Add your license information here]

## Contributing

[Add contribution guidelines if applicable]

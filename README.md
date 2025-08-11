# Directory Explorer

A modern web-based file system browser with search capabilities and file viewer functionality. Built with Node.js and Express, featuring a clean responsive interface for exploring directories, searching files, and viewing content.

## Features

- **Browse directories** - Navigate through the file system with an intuitive interface
- **Search functionality** - Find files and folders with support for regular expressions
- **File viewer** - Preview text files, code, and images directly in the browser
- **Responsive design** - Works on desktop and mobile devices
- **Syntax highlighting** - Code files are displayed with proper syntax coloring
- **Breadcrumb navigation** - Easy navigation through directory hierarchy

## Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/that-guy-scott/directory-explorer.git
cd directory-explorer
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node server.js
```

4. Open your browser and navigate to:
```
http://localhost:10000
```

## Usage

1. **Browse directories**: Enter a directory path in the input field and click "Browse" or press Enter
2. **Search files**: Use the search box to find files and folders. Toggle the regex mode (.*) for advanced pattern matching
3. **View files**: Click on any file to open it in the built-in viewer
4. **Navigate**: Use the breadcrumb navigation to move between directories

## API Endpoints

The application provides a REST API for programmatic access:

- `GET /api/files/*` - List files in a directory
- `GET /api/search/*` - Search files and folders
- `GET /api/file/*` - Get file content
- `GET /api/health` - Health check endpoint

## Configuration

The server runs on port 10000 by default. You can modify the `PORT` variable in `server.js` to change this.

## Security Notes

- The application allows browsing the entire file system where it has permissions
- Consider running with restricted user permissions in production environments
- Be cautious when exposing this service to external networks

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **UI Icons**: Lucide Icons
- **Syntax Highlighting**: Prism.js
- **Fonts**: Inter (Google Fonts)

## License

MIT License - feel free to use this project for personal or commercial purposes.
# MCP Puppeteer Custom

A Model Context Protocol (MCP) server for browser automation using Puppeteer. This server provides a comprehensive set of tools for web testing, debugging, and automation through a simple HTTP API.

## What is Model Context Protocol (MCP)?

The Model Context Protocol (MCP) is an open standard developed by Anthropic that enables AI assistants to interact with external tools and data sources. It acts as a bridge between AI models and various data sources, including APIs, databases, and local files.

This MCP server specifically provides browser automation capabilities through Puppeteer, allowing AI assistants in tools like Cursor IDE to control a browser, take screenshots, interact with web pages, and more.

## Features

- **Web Navigation**: Navigate to URLs, take screenshots, and retrieve page content
- **Element Interaction**: Click elements, type text, and extract content from the page
- **JavaScript Execution**: Run custom JavaScript on the page with proper return value handling
- **Console Monitoring**: Capture and retrieve console logs from the browser
- **Network Monitoring**: Track network requests and responses
- **Performance Metrics**: Collect detailed performance data from the page
- **Cookie Management**: Get, set, and delete cookies
- **LocalStorage Access**: Read and write to the browser's localStorage
- **HTTP Authentication**: Set credentials for HTTP authentication

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/mcp-puppeteer-custom.git
cd mcp-puppeteer-custom
```

2. Install dependencies:
```
npm install
```

3. Start the server:
```
node index.js
```

The server will run on http://localhost:3025 by default.

## API Usage

The server exposes a single endpoint at `/mcp` that accepts POST requests with a JSON body containing:

```json
{
  "tool": "toolName",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

### Available Tools

#### Navigation
- **navigateTo**: Navigate to a URL
- **takeScreenshot**: Take a screenshot of the current page
- **getPageContent**: Get the HTML content of the current page

#### Element Interaction
- **clickElement**: Click an element on the page
- **typeText**: Type text into an input field
- **getElementText**: Get text content from an element
- **waitForSelector**: Wait for an element to appear on the page

#### JavaScript Execution
- **evaluateScript**: Run JavaScript code on the page

#### Console Monitoring
- **captureConsoleLog**: Start capturing console logs from the page
- **getConsoleLogs**: Get captured console logs

#### Network Monitoring
- **monitorNetwork**: Start monitoring network requests
- **getNetworkRequests**: Get captured network requests

#### Performance Metrics
- **getPerformanceMetrics**: Get performance metrics for the current page

#### Cookie Management
- **getCookies**: Get cookies for the current page
- **setCookie**: Set a cookie
- **deleteCookies**: Delete cookies

#### Authentication
- **authenticate**: Set HTTP authentication credentials

#### LocalStorage
- **getLocalStorage**: Get localStorage data
- **setLocalStorage**: Set localStorage data

## Examples

### Navigate to a URL
```bash
curl -X POST http://localhost:3025/mcp -H "Content-Type: application/json" -d '{"tool": "navigateTo", "parameters": {"url": "https://example.com"}}'
```

### Take a Screenshot
```bash
curl -X POST http://localhost:3025/mcp -H "Content-Type: application/json" -d '{"tool": "takeScreenshot", "parameters": {}}'
```

### Run JavaScript
```bash
curl -X POST http://localhost:3025/mcp -H "Content-Type: application/json" -d '{"tool": "evaluateScript", "parameters": {"script": "return document.title"}}'
```

## Integration with Cursor

This MCP server can be integrated with Cursor IDE by adding it to your Cursor MCP configuration. This allows the AI assistant in Cursor to interact with web pages, debug web applications, and automate browser tasks.

## Attribution

This project uses the following open-source software:

- [Puppeteer](https://github.com/puppeteer/puppeteer) - A Node.js library which provides a high-level API to control Chrome/Chromium over the DevTools Protocol (Apache-2.0 License)
- [Express](https://expressjs.com/) - Fast, unopinionated, minimalist web framework for Node.js (MIT License)
- [CORS](https://github.com/expressjs/cors) - CORS middleware for Express (MIT License)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 
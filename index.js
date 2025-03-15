const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');

const app = express();
const PORT = 3025;

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('screenshots'));

// Global browser instance
let browser;
let page;

// Global variables for storing captured data
let consoleLogs = [];
let networkRequests = [];
let isConsoleMonitoring = false;
let isNetworkMonitoring = false;

// Initialize browser
async function initBrowser() {
  if (!browser) {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched successfully');
  }
  
  // Always create a fresh page for each request
  if (page) {
    try {
      await page.close();
    } catch (e) {
      console.log('Error closing existing page:', e.message);
    }
  }
  
  page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  console.log('Page created successfully');
  
  return { browser, page };
}

// MCP Schema
const schema = {
  name: 'puppeteer-mcp',
  description: 'A simple Puppeteer MCP server for browser automation',
  tools: [
    {
      name: 'takeScreenshot',
      description: 'Take a screenshot of the current page',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          screenshotPath: {
            type: 'string',
            description: 'Path to the saved screenshot'
          }
        }
      }
    },
    {
      name: 'navigateTo',
      description: 'Navigate to a URL',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to navigate to'
          }
        },
        required: ['url']
      },
      returns: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the page'
          },
          url: {
            type: 'string',
            description: 'Current URL'
          }
        }
      }
    },
    {
      name: 'getPageContent',
      description: 'Get the HTML content of the current page',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'HTML content of the page'
          }
        }
      }
    },
    {
      name: 'clickElement',
      description: 'Click an element on the page',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the element to click'
          }
        },
        required: ['selector']
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the click was successful'
          }
        }
      }
    },
    {
      name: 'typeText',
      description: 'Type text into an input field',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the input field'
          },
          text: {
            type: 'string',
            description: 'Text to type'
          }
        },
        required: ['selector', 'text']
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the typing was successful'
          }
        }
      }
    },
    {
      name: 'getElementText',
      description: 'Get text content from an element',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of the element'
          }
        },
        required: ['selector']
      },
      returns: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text content of the element'
          }
        }
      }
    },
    {
      name: 'waitForSelector',
      description: 'Wait for an element to appear on the page',
      parameters: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector to wait for'
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 5000)'
          }
        },
        required: ['selector']
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the element appeared before timeout'
          }
        }
      }
    },
    {
      name: 'evaluateScript',
      description: 'Run JavaScript code on the page',
      parameters: {
        type: 'object',
        properties: {
          script: {
            type: 'string',
            description: 'JavaScript code to execute'
          }
        },
        required: ['script']
      },
      returns: {
        type: 'object',
        properties: {
          result: {
            type: 'string',
            description: 'Result of the script execution (stringified)'
          }
        }
      }
    },
    {
      name: 'captureConsoleLog',
      description: 'Start capturing console logs from the page',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether console log capture was started successfully'
          }
        }
      }
    },
    {
      name: 'getConsoleLogs',
      description: 'Get captured console logs',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          logs: {
            type: 'array',
            description: 'Array of console log entries'
          }
        }
      }
    },
    {
      name: 'monitorNetwork',
      description: 'Start monitoring network requests',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether network monitoring was started successfully'
          }
        }
      }
    },
    {
      name: 'getNetworkRequests',
      description: 'Get captured network requests',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          requests: {
            type: 'array',
            description: 'Array of network request data'
          }
        }
      }
    },
    {
      name: 'getPerformanceMetrics',
      description: 'Get performance metrics for the current page',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          metrics: {
            type: 'object',
            description: 'Performance metrics'
          }
        }
      }
    },
    {
      name: 'getCookies',
      description: 'Get cookies for the current page',
      parameters: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            description: 'URLs to get cookies for (optional)'
          }
        },
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          cookies: {
            type: 'array',
            description: 'Array of cookies'
          }
        }
      }
    },
    {
      name: 'setCookie',
      description: 'Set a cookie',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Cookie name'
          },
          value: {
            type: 'string',
            description: 'Cookie value'
          },
          domain: {
            type: 'string',
            description: 'Cookie domain (optional)'
          },
          path: {
            type: 'string',
            description: 'Cookie path (optional)'
          },
          expires: {
            type: 'number',
            description: 'Cookie expiration timestamp (optional)'
          }
        },
        required: ['name', 'value']
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether the cookie was set successfully'
          }
        }
      }
    },
    {
      name: 'deleteCookies',
      description: 'Delete cookies',
      parameters: {
        type: 'object',
        properties: {
          names: {
            type: 'array',
            description: 'Names of cookies to delete (optional, deletes all if not specified)'
          },
          url: {
            type: 'string',
            description: 'URL to delete cookies for (optional)'
          }
        },
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether cookies were deleted successfully'
          }
        }
      }
    },
    {
      name: 'authenticate',
      description: 'Set HTTP authentication credentials',
      parameters: {
        type: 'object',
        properties: {
          username: {
            type: 'string',
            description: 'Username for HTTP authentication'
          },
          password: {
            type: 'string',
            description: 'Password for HTTP authentication'
          }
        },
        required: ['username', 'password']
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether authentication was set successfully'
          }
        }
      }
    },
    {
      name: 'getLocalStorage',
      description: 'Get localStorage data',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Specific localStorage key to get (optional)'
          }
        },
        required: []
      },
      returns: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            description: 'localStorage data'
          }
        }
      }
    },
    {
      name: 'setLocalStorage',
      description: 'Set localStorage data',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'localStorage key'
          },
          value: {
            type: 'string',
            description: 'localStorage value'
          }
        },
        required: ['key', 'value']
      },
      returns: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Whether localStorage was set successfully'
          }
        }
      }
    }
  ]
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Puppeteer MCP Server is running' });
});

app.get('/schema', (req, res) => {
  res.json(schema);
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { tool, parameters } = req.body;
    
    // Initialize browser if not already initialized or if connection is closed
    try {
      if (!browser || !page || !browser.isConnected()) {
        await initBrowser();
      }
    } catch (error) {
      console.error('Error initializing browser:', error);
      await initBrowser();
    }
    
    let result;
    
    switch (tool) {
      case 'takeScreenshot':
        result = await takeScreenshot();
        break;
      case 'navigateTo':
        result = await navigateTo(parameters.url);
        break;
      case 'getPageContent':
        result = await getPageContent();
        break;
      case 'clickElement':
        result = await clickElement(parameters.selector);
        break;
      case 'typeText':
        result = await typeText(parameters.selector, parameters.text);
        break;
      case 'getElementText':
        result = await getElementText(parameters.selector);
        break;
      case 'waitForSelector':
        result = await waitForSelector(parameters.selector, parameters.timeout);
        break;
      case 'evaluateScript':
        result = await evaluateScript(parameters.script);
        break;
      case 'captureConsoleLog':
        result = await captureConsoleLog();
        break;
      case 'getConsoleLogs':
        result = await getConsoleLogs();
        break;
      case 'monitorNetwork':
        result = await monitorNetwork();
        break;
      case 'getNetworkRequests':
        result = await getNetworkRequests();
        break;
      case 'getPerformanceMetrics':
        result = await getPerformanceMetrics();
        break;
      case 'getCookies':
        result = await getCookies(parameters.urls);
        break;
      case 'setCookie':
        result = await setCookie(parameters);
        break;
      case 'deleteCookies':
        result = await deleteCookies(parameters.names, parameters.url);
        break;
      case 'authenticate':
        result = await authenticate(parameters.username, parameters.password);
        break;
      case 'getLocalStorage':
        result = await getLocalStorage(parameters.key);
        break;
      case 'setLocalStorage':
        result = await setLocalStorage(parameters.key, parameters.value);
        break;
      default:
        return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Tool implementations
async function takeScreenshot() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const screenshotPath = path.join(screenshotsDir, `screenshot-${timestamp}.png`);
  
  await page.screenshot({ path: screenshotPath, fullPage: true });
  
  return {
    screenshotPath: `/screenshot-${timestamp}.png`
  };
}

async function navigateTo(url) {
  // Add http:// if not present
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  await page.goto(url, { waitUntil: 'networkidle2' });
  
  const title = await page.title();
  const currentUrl = page.url();
  
  return {
    title,
    url: currentUrl
  };
}

async function getPageContent() {
  const content = await page.content();
  
  return {
    content
  };
}

async function clickElement(selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.click(selector);
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error clicking element ${selector}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function typeText(selector, text) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.type(selector, text);
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error typing text into ${selector}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getElementText(selector) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    const text = await page.$eval(selector, el => el.textContent);
    return {
      text: text.trim()
    };
  } catch (error) {
    console.error(`Error getting text from ${selector}:`, error);
    return {
      text: '',
      error: error.message
    };
  }
}

async function waitForSelector(selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error waiting for selector ${selector}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function evaluateScript(script) {
  try {
    // Wrap the script in an IIFE to handle return statements
    const wrappedScript = `(() => { ${script} })()`;
    const result = await page.evaluate(wrappedScript);
    
    return {
      result: typeof result === 'object' ? JSON.stringify(result) : String(result || '')
    };
  } catch (error) {
    console.error(`Error evaluating script:`, error);
    return {
      result: '',
      error: error.message
    };
  }
}

async function captureConsoleLog() {
  try {
    // Clear previous logs
    consoleLogs = [];
    isConsoleMonitoring = true;
    
    // Set up console log listener if not already set
    if (!page.listenerCount('console')) {
      page.on('console', message => {
        if (isConsoleMonitoring) {
          consoleLogs.push({
            type: message.type(),
            text: message.text(),
            timestamp: new Date().toISOString()
          });
        }
      });
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error capturing console logs:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getConsoleLogs() {
  return {
    logs: consoleLogs
  };
}

async function monitorNetwork() {
  try {
    // Clear previous requests
    networkRequests = [];
    isNetworkMonitoring = true;
    
    // Create a CDP session to monitor network
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    
    // Listen for request events
    client.on('Network.requestWillBeSent', request => {
      if (isNetworkMonitoring) {
        networkRequests.push({
          requestId: request.requestId,
          url: request.request.url,
          method: request.request.method,
          headers: request.request.headers,
          timestamp: new Date().toISOString(),
          type: request.type
        });
      }
    });
    
    // Listen for response events
    client.on('Network.responseReceived', response => {
      if (isNetworkMonitoring) {
        const requestIndex = networkRequests.findIndex(req => req.requestId === response.requestId);
        
        if (requestIndex !== -1) {
          networkRequests[requestIndex].response = {
            status: response.response.status,
            headers: response.response.headers,
            mimeType: response.response.mimeType,
            timestamp: new Date().toISOString()
          };
        }
      }
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error monitoring network:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getNetworkRequests() {
  return {
    requests: networkRequests
  };
}

async function getPerformanceMetrics() {
  try {
    // Get metrics from Chrome DevTools Protocol
    const client = await page.target().createCDPSession();
    await client.send('Performance.enable');
    const metrics = await client.send('Performance.getMetrics');
    
    // Get navigation timing data
    const timingData = await page.evaluate(() => {
      const timing = performance.timing || {};
      const navigation = performance.navigation || {};
      
      // Get all performance entries
      const entries = performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        entryType: entry.entryType,
        startTime: entry.startTime,
        duration: entry.duration,
        initiatorType: entry.initiatorType
      }));
      
      return {
        timing: {
          navigationStart: timing.navigationStart,
          unloadEventStart: timing.unloadEventStart,
          unloadEventEnd: timing.unloadEventEnd,
          redirectStart: timing.redirectStart,
          redirectEnd: timing.redirectEnd,
          fetchStart: timing.fetchStart,
          domainLookupStart: timing.domainLookupStart,
          domainLookupEnd: timing.domainLookupEnd,
          connectStart: timing.connectStart,
          connectEnd: timing.connectEnd,
          secureConnectionStart: timing.secureConnectionStart,
          requestStart: timing.requestStart,
          responseStart: timing.responseStart,
          responseEnd: timing.responseEnd,
          domLoading: timing.domLoading,
          domInteractive: timing.domInteractive,
          domContentLoadedEventStart: timing.domContentLoadedEventStart,
          domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
          domComplete: timing.domComplete,
          loadEventStart: timing.loadEventStart,
          loadEventEnd: timing.loadEventEnd
        },
        navigation: {
          type: navigation.type,
          redirectCount: navigation.redirectCount
        },
        entries
      };
    });
    
    return {
      metrics: {
        chrome: metrics.metrics,
        timing: timingData
      }
    };
  } catch (error) {
    console.error(`Error getting performance metrics:`, error);
    return {
      metrics: {},
      error: error.message
    };
  }
}

async function getCookies(urls) {
  try {
    // Make sure urls is an array if provided
    const cookieUrls = urls ? (Array.isArray(urls) ? urls : [urls]) : [];
    const cookies = await page.cookies(...cookieUrls);
    return {
      cookies
    };
  } catch (error) {
    console.error(`Error getting cookies:`, error);
    return {
      cookies: [],
      error: error.message
    };
  }
}

async function setCookie(cookieData) {
  try {
    await page.setCookie(cookieData);
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error setting cookie:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function deleteCookies(names, url) {
  try {
    if (names && names.length > 0) {
      // Delete specific cookies by name
      await page.evaluate((cookieNames) => {
        for (const name of cookieNames) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        }
      }, names);
    } else {
      // Delete all cookies
      const cookies = await page.cookies();
      const cookieNames = cookies.map(cookie => cookie.name);
      
      await page.evaluate((cookieNames) => {
        for (const name of cookieNames) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname}`;
        }
      }, cookieNames);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error deleting cookies:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function authenticate(username, password) {
  try {
    await page.authenticate({ username, password });
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error setting authentication:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function getLocalStorage(key) {
  try {
    const data = await page.evaluate((k) => {
      if (k) {
        return { [k]: localStorage.getItem(k) };
      } else {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          items[key] = localStorage.getItem(key);
        }
        return items;
      }
    }, key);
    
    return {
      data
    };
  } catch (error) {
    console.error(`Error getting localStorage:`, error);
    return {
      data: {},
      error: error.message
    };
  }
}

async function setLocalStorage(key, value) {
  try {
    await page.evaluate((k, v) => {
      localStorage.setItem(k, v);
    }, key, value);
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error setting localStorage:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Puppeteer MCP Server running on http://localhost:${PORT}`);
  
  // Initialize browser on startup
  try {
    await initBrowser();
    console.log('Browser initialized successfully');
  } catch (error) {
    console.error('Failed to initialize browser:', error);
  }
});

// Handle shutdown
process.on('SIGINT', async () => {
  if (browser) {
    console.log('Closing browser...');
    await browser.close();
  }
  process.exit();
}); 
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Log to file and console
const logger = {
  info: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [INFO] ${message}`;
    
    console.log(logMessage);
    appendToLogFile(logMessage);
  },
  
  warn: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [WARN] ${message}`;
    
    console.warn(logMessage);
    appendToLogFile(logMessage);
  },
  
  error: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [ERROR] ${message}`;
    
    console.error(logMessage);
    appendToLogFile(logMessage);
  },
  
  debug: (message) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [DEBUG] ${message}`;
      
      console.debug(logMessage);
      appendToLogFile(logMessage);
    }
  }
};

// Append log to file
function appendToLogFile(message) {
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `${today}.log`);
  
  fs.appendFile(logFile, message + '\n', (err) => {
    if (err) {
      console.error(`Error writing to log file: ${err.message}`);
    }
  });
}

module.exports = logger;
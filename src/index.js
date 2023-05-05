var debug = require("debug");
var logger = debug("logger");

var isNode;
if (
  typeof process === "undefined" ||
  process.type === "renderer" ||
  process.browser === true ||
  process.__nwjs
) {
  isNode = false;
} else {
  isNode = true;
}

// These are the Bunyan log levels
var logLevelsByName = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

/**
 * List of known (previously created) instances
 */
var loggerInstances = {};
/**
 * @type {int}
 */
var currentLogLevelNum = _determineInitialLogLevel();

// Prepare helper maps to save some performance during operation
var paddedLogLevelNamesByName = {};
var paddedLogLevelNamesByNum = {};
var logLevelsByNum = {};

var _padLength = Object.keys(logLevelsByName)
  .map(function (item) {
    return item.length;
  })
  .sort()
  .pop();
for (var logLevelName in logLevelsByName) {
  logLevelsByNum[parseInt(logLevelsByName[logLevelName])] = logLevelName;

  var padded = "";
  for (var i = 0; i < _padLength - logLevelName.length; i++) {
    padded += " ";
  }
  padded += logLevelName.toUpperCase();

  paddedLogLevelNamesByName[logLevelName] = padded;
  paddedLogLevelNamesByNum[logLevelsByName[logLevelName]] = padded;
}

/**
 *
 * @param {string} namespace The namespace for this logger (passed to debug)
 * @returns {{namespace, trace, debug, info, warn, error, fatal, createLogger: (function(*): {namespace, trace, debug, info, warn, error, fatal, createLogger})}}
 */
function createLogger(namespace) {
  if (namespace in loggerInstances) {
    return loggerInstances[namespace];
  }

  var level = 0;

  // Convenience; the logger itself is the 'log' level logging function
  var logger = _createLevelLogger(logLevelsByName.info, namespace, "log");

  logger.namespace = logger.debug.namespace;

  logger.fatal = _createLevelLogger(logLevelsByName.fatal, namespace, "error");
  logger.error = _createLevelLogger(logLevelsByName.error, namespace, "error");
  logger.warn = _createLevelLogger(logLevelsByName.warn, namespace, "warn");
  logger.info = logger;
  logger.debug = _createLevelLogger(logLevelsByName.debug, namespace, "debug");
  logger.trace = _createLevelLogger(logLevelsByName.trace, namespace, "debug");

  logger.createLogger = function (subEnv) {
    return createLogger(namespace + ":" + subEnv);
  };

  Object.defineProperty(logger, "level", {
    get() {
      return logger.getLevel();
    },
    set(levelName) {
      logger.setLevel(levelName);
    },
  });
  logger.getLevel = function () {
    return logLevelsByNum[level];
  };
  logger.setLevel = function (levelName) {
    if (!levelName) {
      level = 0;
      return;
    }

    if (!(levelName in logLevelsByName)) {
      throw new Error(
        "Invalid logLevel " +
          levelName +
          ", can be one of: " +
          Object.keys(logLevelsByName).join(", ")
      );
    }

    level = logLevelsByName[levelName];
  };

  // For easy destructuring during assignment/creation.
  // This allows you to do {logger, createLogger} = require('logger')('my-namespace');
  logger.logger = logger;

  loggerInstances[namespace] = logger;

  return logger;

  function _createLevelLogger(logLevel, namespace, consoleFunc) {
    var debugFn = debug(namespace);

    debugFn.log = function levelLog() {
      if (isNode) {
        // On Node, the output MIGHT be prefixed with a timestamp (if the output is not a tty).
        // In that case, we have to insert the level indication after the timestamp.

        // When the output starts with the namespace, this (currently) indicates the output does not start with a timestamp
        if (arguments[0].substring(0, namespace.length) === namespace) {
          // Output not prefixed by timestamp
          arguments[0] =
            "  " + paddedLogLevelNamesByNum[logLevel] + arguments[0];
        } else {
          // Output prefixed by timestamp, insert level after timestamp
          var idx = arguments[0].indexOf(" ");
          arguments[0] =
            arguments[0].substr(0, idx) +
            " " +
            logLevelsByNum[logLevel].toUpperCase() +
            arguments[0].substr(idx);
        }
      } else {
        arguments[0] = paddedLogLevelNamesByNum[logLevel] + " " + arguments[0];
      }

      return console[consoleFunc].apply(console, arguments);
    };

    function levelLogger() {
      // First check for the level of this individual logger, if set
      if (level) {
        if (logLevel < level) {
          return;
        }
      } else {
        // The check against the global log level
        if (logLevel < currentLogLevelNum) {
          return;
        }
      }

      if (isNode) {
        return debugFn.apply(debugFn, arguments);
      } else {
        // Browser only:
        // Empty value on first argument to make the timediff ("+xxms") be the first string part. This
        // increases readability dramatically.
        var args = new Array(arguments.length + 1);
        args[0] = "";

        for (var i = 0, iz = arguments.length; i < iz; i++) {
          args[i + 1] = arguments[i];
        }

        return debugFn.apply(debugFn, args);
      }
    }

    // Provide easy access to the underlying debug instance
    levelLogger.debug = debugFn;

    return levelLogger;
  }
}

/**
 *
 * @param {string} levelName The log level to display; see the npm log levels
 */
createLogger.setLevel = function (levelName) {
  if (!(levelName in logLevelsByName)) {
    throw new Error(
      "Invalid logLevel " +
        levelName +
        ", can be one of: " +
        Object.keys(logLevelsByName).join(", ")
    );
  }

  currentLogLevelNum = logLevelsByName[levelName];
};

/**
 *
 * @return {string} The loglevel, as a string
 */
createLogger.getLevel = function () {
  return logLevelsByNum[currentLogLevelNum];
};

/**
 *
 * @param {string|int} level The loglevel, either by name (string) or numerical (int)
 * @returns {boolean}
 */
createLogger.levelEnabled = function (level) {
  if (!(level in logLevelsByName) && !(level in logLevelsByNum)) {
    throw new Error(
      '"level" must be either a numeric log level or a log level name.'
    );
  }

  if (typeof level === "number") {
    return currentLogLevelNum <= level;
  } else {
    return currentLogLevelNum <= logLevelsByName[level];
  }
};

// Define "level" as a convenience property on the main createLogger object
Object.defineProperty(createLogger, "level", {
  get() {
    return createLogger.getLevel();
  },
  set(levelName) {
    createLogger.setLevel(levelName);
  },
});

/**
 *
 * @param {string[]|string} namespaces
 */
createLogger.enable = function (namespaces) {
  return debug.enable(
    namespaces instanceof Array ? namespaces.join(",") : namespaces
  );
};

/**
 */
createLogger.disable = function () {
  return debug.disable();
};

/**
 *
 * @param {string} namespace
 */
createLogger.enabled = function (namespace) {
  return debug.enabled(namespace);
};

// Provide access to the underlying global debug instance
createLogger.debug = debug;

/**
 * Determine the initial log level by examining process.env.DEBUG_LEVEL (Node)
 * or localStorage.debugLevel (browser)
 * @private
 */
function _determineInitialLogLevel() {
  try {
    var storedLevel;

    if (isNode) {
      storedLevel = process.env.DEBUG_LEVEL;
    } else {
      storedLevel = window.localStorage.debugLevel;
    }

    // "storedLevel" here should be a string, hence the lack of check for 0
    if (!storedLevel || !(storedLevel in logLevelsByName)) {
      return logLevelsByName.info;
    }

    return logLevelsByName[storedLevel];
  } catch (ex) {
    logger("Could not determine initial log level.", ex);
    return logLevelsByName.info;
  }
}

module.exports = createLogger;

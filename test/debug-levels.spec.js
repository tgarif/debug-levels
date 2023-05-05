const sinon = require("sinon");
const debuglevels = require("../src/");

describe("debuglevels", function () {
  let logger;
  let childLogger;
  let sandbox;
  let fakeConsole;

  beforeEach(function () {
    debuglevels.enable("*");
    debuglevels.setLevel("info");

    logger = debuglevels("testingnamespace");

    childLogger = logger.createLogger("child");
    childLogger.setLevel(null);

    sandbox = sinon.createSandbox();

    fakeConsole = {};
    for (const method of ["debug", "log", "warn", "error"]) {
      fakeConsole[method] = sandbox.fake();
      sandbox.replace(console, method, fakeConsole[method]);
    }
  });

  afterEach(function () {
    sandbox.restore();
  });

  it("should create an object with namespace test", function () {
    expect(logger.namespace).toEqual("testingnamespace");
  });

  it("should create an object with level methods", function () {
    for (const level of ["fatal", "error", "warn", "info", "debug", "trace"]) {
      expect(typeof logger[level]).toEqual("function");
    }

    expect(typeof logger.createLogger).toEqual("function");
  });

  it("should set new levels correctly", function () {
    expect(fakeConsole.error.callCount).toEqual(0);

    debuglevels.setLevel("fatal");

    logger.fatal("hello855498");
    expect(fakeConsole.error.callCount).toEqual(1);

    debuglevels.setLevel("error");

    logger.fatal("hello855498");
    expect(fakeConsole.error.callCount).toEqual(2);
    expect(fakeConsole.warn.callCount).toEqual(0);
  });

  it("should have created a child logger with the correct namespace", function () {
    expect(childLogger.namespace).toEqual("testingnamespace:child");
  });

  it(`should prefix the output with FATAL when calling logger.fatal`, function () {
    debuglevels.setLevel("fatal");

    logger.fatal("hello855498");

    expect(fakeConsole.error.getCall(0).args[0]).toMatch(/^\s*FATAL/);
  });

  it(`should prefix the output with ERROR when calling logger.error`, function () {
    debuglevels.setLevel("error");

    logger.error("hello855498");

    expect(fakeConsole.error.getCall(0).args[0]).toMatch(/^\s*ERROR/);
  });

  it(`should prefix the output with WARN when calling logger.warn`, function () {
    debuglevels.setLevel("warn");

    logger.warn("hello855498");

    expect(fakeConsole.warn.getCall(0).args[0]).toMatch(/^\s*WARN/);
  });

  it(`should prefix the output with INFO when calling logger.info`, function () {
    debuglevels.setLevel("info");

    logger.info("hello855498");

    expect(fakeConsole.log.getCall(0).args[0]).toMatch(/^\s*INFO/);
  });

  it(`should prefix the output with DEBUG when calling logger.debug`, function () {
    debuglevels.setLevel("debug");

    logger.debug("hello855498");

    expect(fakeConsole.debug.getCall(0).args[0]).toMatch(/^\s*DEBUG/);
  });

  it(`should prefix the output with TRACE when calling logger.trace`, function () {
    debuglevels.setLevel("trace");

    logger.trace("hello855498");

    expect(fakeConsole.debug.getCall(0).args[0]).toMatch(/^\s*TRACE/);
  });

  describe("console method callCounts for different logLevels", function () {
    const testMatrix = {
      fatal: {
        fatal: { error: 1, warn: 0, log: 0, debug: 0 },
        error: { error: 0, warn: 0, log: 0, debug: 0 },
        warn: { error: 0, warn: 0, log: 0, debug: 0 },
        info: { error: 0, warn: 0, log: 0, debug: 0 },
        debug: { error: 0, warn: 0, log: 0, debug: 0 },
        trace: { error: 0, warn: 0, log: 0, debug: 0 },
      },
      error: {
        fatal: { error: 1, warn: 0, log: 0, debug: 0 },
        error: { error: 1, warn: 0, log: 0, debug: 0 },
        warn: { error: 0, warn: 0, log: 0, debug: 0 },
        info: { error: 0, warn: 0, log: 0, debug: 0 },
        debug: { error: 0, warn: 0, log: 0, debug: 0 },
        trace: { error: 0, warn: 0, log: 0, debug: 0 },
      },
      warn: {
        fatal: { error: 1, warn: 0, log: 0, debug: 0 },
        error: { error: 1, warn: 0, log: 0, debug: 0 },
        warn: { error: 0, warn: 1, log: 0, debug: 0 },
        info: { error: 0, warn: 0, log: 0, debug: 0 },
        debug: { error: 0, warn: 0, log: 0, debug: 0 },
        trace: { error: 0, warn: 0, log: 0, debug: 0 },
      },
      info: {
        fatal: { error: 1, warn: 0, log: 0, debug: 0 },
        error: { error: 1, warn: 0, log: 0, debug: 0 },
        warn: { error: 0, warn: 1, log: 0, debug: 0 },
        info: { error: 0, warn: 0, log: 1, debug: 0 },
        debug: { error: 0, warn: 0, log: 0, debug: 0 },
        trace: { error: 0, warn: 0, log: 0, debug: 0 },
      },
      debug: {
        fatal: { error: 1, warn: 0, log: 0, debug: 0 },
        error: { error: 1, warn: 0, log: 0, debug: 0 },
        warn: { error: 0, warn: 1, log: 0, debug: 0 },
        info: { error: 0, warn: 0, log: 1, debug: 0 },
        debug: { error: 0, warn: 0, log: 0, debug: 1 },
        trace: { error: 0, warn: 0, log: 0, debug: 0 },
      },
      trace: {
        fatal: { error: 1, warn: 0, log: 0, debug: 0 },
        error: { error: 1, warn: 0, log: 0, debug: 0 },
        warn: { error: 0, warn: 1, log: 0, debug: 0 },
        info: { error: 0, warn: 0, log: 1, debug: 0 },
        debug: { error: 0, warn: 0, log: 0, debug: 1 },
        trace: { error: 0, warn: 0, log: 0, debug: 1 },
      },
    };

    for (const logLevel in testMatrix) {
      describe(`logLevel ${logLevel}`, function () {
        beforeEach(function () {
          debuglevels.setLevel(logLevel);
        });

        for (const loggerMethod in testMatrix[logLevel]) {
          for (const consoleMethod in testMatrix[logLevel][loggerMethod]) {
            it(`should call console.${consoleMethod} ${testMatrix[logLevel][loggerMethod][consoleMethod]} times when calling logger.${loggerMethod}`, function () {
              logger[loggerMethod]("hello855498");

              expect(fakeConsole[consoleMethod].callCount).toEqual(
                testMatrix[logLevel][loggerMethod][consoleMethod]
              );
            });
          }
        }
      });
    }
  });

  it(`should have created a child logger that obeys the global log level`, function () {
    childLogger.trace("hello855498");

    expect(fakeConsole.debug.callCount).toEqual(0);
  });

  it(`should have created a child logger with an individual log level`, function () {
    childLogger.setLevel("trace");
    childLogger.trace("hello855498");

    expect(fakeConsole.debug.callCount).toEqual(1);
  });

  describe("levelEnabled", function () {
    it(`should return false when logLevel is info and the check is for debug`, function () {
      debuglevels.setLevel("info");

      expect(debuglevels.levelEnabled("debug")).toBeFalsy();
    });

    it(`should return true when logLevel is info and the check is for info`, function () {
      debuglevels.setLevel("info");

      expect(debuglevels.levelEnabled("info")).toBeTruthy();
    });

    it(`should return true when logLevel is info and the check is for fatal`, function () {
      debuglevels.setLevel("info");

      expect(debuglevels.levelEnabled("fatal")).toBeTruthy();
    });
  });
});

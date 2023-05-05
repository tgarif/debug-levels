# @tgarif/debug-levels

[![npm](https://img.shields.io/npm/v/@tgarif/debug-levels?color=a1b858&label=)](https://npmjs.com/package/@tgarif/debug-levels)

## Installation

```bash
npm i @tgarif/debug-levels
```

## Usage

```js
const logger = require("@tgarif/debug-levels")("http");

logger("information about regular operation");
// INFO http information about regular operation

logger.fatal(
  "unrecoverable error, an operator should look at this as soon as possible"
);
// FATAL http unrecoverable error, an operator should look at this as soon as possible

logger.error("recoverable error");
// ERROR http recoverable error

logger.warn("warning");
// WARNING http warning

logger.info("information about regular operation");
// INFO http information about regular operation

logger.debug(
  "debug information, perhaps useful during development or troubleshooting"
);
// DEBUG http debug information, perhaps useful during development or troubleshooting

logger.trace("highly detailed information");
// TRACE http highly detailed information
```

## License

[MIT](./LICENSE) License &copy; 2023-PRESENT [Tengku Arif](https://github.com/tgarif)

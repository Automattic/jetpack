"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLogOnce = createLogOnce;
exports.reset = reset;
let loggedMessages;
if (process.env.NODE_ENV !== 'production') {
  loggedMessages = new Set();
}

/** Creates a dev-only logger that writes each unique message to `console[severity]` once. */
function createLogOnce(severity, prefix) {
  return function logOnce(...messages) {
    if (process.env.NODE_ENV !== 'production') {
      const message = messages.join(' ');
      const output = prefix ? `${prefix}: ${message}` : message;
      const key = `${severity}:${output}`;
      if (!loggedMessages.has(key)) {
        loggedMessages.add(key);
        if (severity === 'warn') {
          console.warn(output);
        } else {
          console.error(output);
        }
      }
    }
  };
}
function reset() {
  loggedMessages?.clear();
}
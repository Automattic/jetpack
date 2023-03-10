const noop = () => {};

/**
 * Used to replace `debug` calls in production.
 *
 * @returns {Function} A noop function.
 */
export default () => noop;

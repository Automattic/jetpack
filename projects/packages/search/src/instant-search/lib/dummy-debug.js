const noop = () => {};

/**
 * Used to replace `debug` calls in production.
 *
 * @return {Function} A noop function.
 */
export default () => noop;

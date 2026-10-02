/**
 * Whether the test runs in JSDOM environment
 */
export const isJSDOM = /jsdom/.test(window.navigator.userAgent);

// https://stackoverflow.com/questions/53807517/how-to-test-if-two-types-are-exactly-the-same

/**
 * Issues a type error if `Expected` is not identical to `Actual`.
 *
 * `Expected` should be declared when invoking `expectType`.
 * `Actual` should almost always we be a `typeof value` statement.
 *
 * @example `expectType<number | string, typeof value>(value)`
 * TypeScript issues a type error since `value is not assignable to never`.
 * This means `typeof value` is not identical to `number | string`
 * @param _actual
 */
export function expectType(_actual) {}
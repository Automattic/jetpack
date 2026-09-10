/**
 * Mock for `@wordpress/api-fetch` used in Jest tests.
 *
 * @package
 */
const apiFetch = jest.fn( () => Promise.resolve( {} ) );
module.exports = apiFetch;

/**
 * Returns a mocked version of `tiny-lru`.
 *
 * @returns {object} A mocked LRU cache object.
 */
export default function tinyLruMocked() {
	return {
		get: () => null,
		set: () => {},
	};
}

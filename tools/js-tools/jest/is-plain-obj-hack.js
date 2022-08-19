/*
 * HACK: `is-plain-obj` is ESM-only but Gutenberg's CommonJS build tries to `require()` it.
 * That's ok when running Jest normally because babel-jest transpiles it, but not in ESM mode.
 * https://github.com/WordPress/gutenberg/issues/43434
 *
 * One way to fix it would be to get Jest to use the ESM builds of Gutenberg packages, but that
 * would need either https://github.com/facebook/jest/issues/13148 (then a packageFilter in the
 * resolver) or Gutenberg to start using "exports".
 *
 * Or maybe Gutenberg will just drop the dep. There are other packages to accomplish the same thing
 * that aren't part of one person's crusade to push adoption of ESM by making their many utility
 * modules ESM-only.
 *
 * In the mean time, we can hack around the problem by mocking `is-plain-obj`, which is fortunately
 * pretty trivial.
 */
jest.mock(
	'is-plain-obj',
	() => ( {
		__esModule: true,
		// Code in this function is adapted from https://github.com/sindresorhus/is-plain-obj/blob/68e8cc77/index.js
		// which is released under the MIT license.
		default: value => {
			if ( typeof value !== 'object' || value === null ) {
				return false;
			}

			const prototype = Object.getPrototypeOf( value );
			return (
				( prototype === null ||
					prototype === Object.prototype ||
					Object.getPrototypeOf( prototype ) === null ) &&
				! ( Symbol.toStringTag in value || Symbol.iterator in value )
			);
		},
	} ),
	{ virtual: true }
);

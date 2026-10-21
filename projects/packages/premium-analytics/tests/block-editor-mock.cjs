/**
 * Stands in for `@wordpress/block-editor`, which the dashboard never renders.
 *
 * `@wordpress/core-data` imports it for the editor's own features — the block-editor store,
 * `RichText`, footnote extraction — and pulls a second copy of `@wordpress/components`, DataViews
 * and the animation stack in behind it, for every test file. Every export throws, so a test that
 * does reach the block editor fails here rather than passing against a hollow stub.
 */

const unavailable = name => () => {
	throw new Error(
		`@wordpress/block-editor is not available in Premium Analytics tests, but ${ name } was used. ` +
			'Mock it in the test that needs it, or drop the block-editor mapping in tests/jest.config.cjs.'
	);
};

// The store is read as a value (`select( blockEditorStore )`), so name it rather than throw on
// access: a stray registry lookup then fails on a store nothing registered, naming this file.
const store = { name: '@wordpress/block-editor (not available in tests)' };

module.exports = new Proxy(
	{ __esModule: true, store },
	{
		get: ( target, key ) =>
			key in target || typeof key === 'symbol' ? target[ key ] : unavailable( String( key ) ),
	}
);

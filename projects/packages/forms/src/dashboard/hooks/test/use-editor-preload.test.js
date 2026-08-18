import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

// Same-origin as jsdom's location, which is what the browser sees on a real dashboard.
const ADMIN_URL = `${ window.location.origin }/wp-admin/`;
const configValues = { adminUrl: ADMIN_URL };

await jest.unstable_mockModule( '../../../hooks/use-config-value.ts', () => ( {
	default: key => configValues[ key ],
} ) );

const { default: useEditorPreload, resetEditorPreloadState } = await import(
	'../use-editor-preload.ts'
);

const EDITOR_URL = `${ ADMIN_URL }post-new.php?post_type=jetpack_form`;

const respondWith = html => Promise.resolve( { ok: true, text: () => Promise.resolve( html ) } );

// Testing Library has no query for <head> content, and the prefetch links are the whole point.
// eslint-disable-next-line testing-library/no-node-access
const prefetchLinks = () => Array.from( document.head.querySelectorAll( 'link[rel="prefetch"]' ) );

/**
 * Every URL the hook warmed, whichever mechanism it used.
 *
 * jsdom reports no <link rel="prefetch"> support, so by default this exercises the Safari fallback:
 * a low-priority fetch per asset, which is every fetch call after the discovery request.
 *
 * @return {Array<string>} The warmed asset URLs, in the order requested.
 */
const warmed = () => [
	...prefetchLinks().map( link => link.href ),
	...global.fetch.mock.calls.slice( 1 ).map( ( [ href ] ) => href ),
];

const preload = async () => {
	const { result } = renderHook( () => useEditorPreload() );
	await act( async () => {
		result.current();
	} );
};

describe( 'useEditorPreload', () => {
	beforeEach( () => {
		resetEditorPreloadState();
		// jest.spyOn() needs an existing property, and this environment has no global fetch to wrap.
		// eslint-disable-next-line jest/prefer-spy-on
		global.fetch = jest.fn();
	} );

	afterEach( () => {
		configValues.adminUrl = ADMIN_URL;
		prefetchLinks().forEach( link => link.remove() );
		delete global.fetch;
	} );

	it( 'warms the editor stylesheets and scripts it finds, stylesheets first', async () => {
		global.fetch.mockReturnValue(
			respondWith( `
				<html><head>
					<link rel="stylesheet" href="/wp-includes/css/dist/block-editor/style.css" />
					<link rel="preconnect" href="/ignored" />
				</head><body>
					<script src="/wp-includes/js/dist/block-editor.js"></script>
					<script>inline scripts have no src</script>
				</body></html>
			` )
		);

		await preload();

		expect( global.fetch ).toHaveBeenNthCalledWith( 1, EDITOR_URL, {
			credentials: 'same-origin',
		} );
		expect( warmed() ).toEqual( [
			`${ window.location.origin }/wp-includes/css/dist/block-editor/style.css`,
			`${ window.location.origin }/wp-includes/js/dist/block-editor.js`,
		] );
	} );

	it( 'uses <link rel="prefetch"> when the browser supports it', async () => {
		const supports = jest
			.spyOn( DOMTokenList.prototype, 'supports' )
			.mockImplementation( token => token === 'prefetch' );

		global.fetch.mockReturnValue(
			respondWith( `
				<link rel="stylesheet" href="/style.css" />
				<script src="/editor.js"></script>
			` )
		);

		await preload();

		await waitFor( () => expect( prefetchLinks() ).toHaveLength( 2 ) );
		expect( prefetchLinks().map( link => link.as ) ).toEqual( [ 'style', 'script' ] );
		// Only the discovery request — the assets went through <link>, not fetch.
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );

		supports.mockRestore();
	} );

	it( 'skips cross-origin assets and duplicates', async () => {
		global.fetch.mockReturnValue(
			respondWith( `
				<script src="/wp-includes/js/dist/block-editor.js"></script>
				<script src="/wp-includes/js/dist/block-editor.js"></script>
				<script src="https://cdn.example.net/tracker.js"></script>
			` )
		);

		await preload();

		expect( warmed() ).toEqual( [
			`${ window.location.origin }/wp-includes/js/dist/block-editor.js`,
		] );
	} );

	it( 'only discovers once, however many times it is called', async () => {
		global.fetch.mockReturnValue( respondWith( '<script src="/a.js"></script>' ) );

		const { result } = renderHook( () => useEditorPreload() );
		await act( async () => {
			result.current();
			result.current();
			result.current();
		} );

		expect( global.fetch ).toHaveBeenNthCalledWith( 1, EDITOR_URL, {
			credentials: 'same-origin',
		} );
		expect( warmed() ).toHaveLength( 1 );
	} );

	it( 'warms nothing when the editor page cannot be read', async () => {
		global.fetch.mockResolvedValue( { ok: false, text: () => Promise.resolve( '' ) } );

		await preload();

		expect( warmed() ).toHaveLength( 0 );
	} );

	it( 'does not reach for an admin on another origin', async () => {
		configValues.adminUrl = 'https://elsewhere.example/wp-admin/';

		await preload();

		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	it( 'waits for the admin URL rather than guessing at a relative one', async () => {
		configValues.adminUrl = undefined;

		await preload();

		expect( global.fetch ).not.toHaveBeenCalled();
	} );

	it( 'allows a retry after an attempt that warmed nothing', async () => {
		global.fetch.mockRejectedValueOnce( new Error( 'offline' ) );
		await preload();

		global.fetch.mockReturnValue( respondWith( '<script src="/a.js"></script>' ) );
		await preload();

		expect( global.fetch ).toHaveBeenNthCalledWith( 2, EDITOR_URL, {
			credentials: 'same-origin',
		} );
	} );
} );

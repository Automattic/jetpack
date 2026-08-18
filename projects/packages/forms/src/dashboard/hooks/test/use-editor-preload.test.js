import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

// Same-origin as jsdom's location, which is what the browser sees on a real dashboard.
const ADMIN_URL = `${ window.location.origin }/wp-admin/`;
const configValues = { adminUrl: ADMIN_URL };

await jest.unstable_mockModule( '../../../hooks/use-config-value.ts', () => ( {
	default: key => configValues[ key ],
} ) );

const {
	default: useEditorPreload,
	getNewFormEditorUrl,
	resetEditorPreloadState,
} = await import( '../use-editor-preload.ts' );

const EDITOR_URL = `${ ADMIN_URL }post-new.php?post_type=jetpack_form`;

const respondWith = html => Promise.resolve( { ok: true, text: () => Promise.resolve( html ) } );

const prefetchedLinks = () =>
	// Testing Library has no query for <head> content, and the prefetch links are the whole point.
	// eslint-disable-next-line testing-library/no-node-access
	Array.from( document.head.querySelectorAll( 'link[rel="prefetch"]' ) ).map( link => ( {
		href: link.href,
		as: link.as,
	} ) );

describe( 'getNewFormEditorUrl', () => {
	it( 'omits the title when there is nothing but whitespace', () => {
		expect( getNewFormEditorUrl( ADMIN_URL, '   ' ) ).toBe( EDITOR_URL );
	} );

	it( 'encodes the title so it survives the round trip', () => {
		expect( getNewFormEditorUrl( ADMIN_URL, 'Tea & Coffee' ) ).toBe(
			`${ EDITOR_URL }&post_title=Tea%20%26%20Coffee`
		);
	} );
} );

describe( 'useEditorPreload', () => {
	beforeEach( () => {
		resetEditorPreloadState();
		// jest.spyOn() needs an existing property, and this environment has no global fetch to wrap.
		// eslint-disable-next-line jest/prefer-spy-on
		global.fetch = jest.fn();
	} );

	afterEach( () => {
		resetEditorPreloadState();
		delete global.fetch;
	} );

	it( 'prefetches the editor scripts and stylesheets it finds', async () => {
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

		const { result } = renderHook( () => useEditorPreload() );
		act( () => result.current() );

		await waitFor( () => expect( prefetchedLinks() ).toHaveLength( 2 ) );

		expect( global.fetch ).toHaveBeenCalledWith( EDITOR_URL, { credentials: 'same-origin' } );
		expect( prefetchedLinks() ).toEqual(
			expect.arrayContaining( [
				{
					href: `${ window.location.origin }/wp-includes/js/dist/block-editor.js`,
					as: 'script',
				},
				{
					href: `${ window.location.origin }/wp-includes/css/dist/block-editor/style.css`,
					as: 'style',
				},
			] )
		);
	} );

	it( 'skips cross-origin assets and duplicates', async () => {
		global.fetch.mockReturnValue(
			respondWith( `
				<script src="/wp-includes/js/dist/block-editor.js"></script>
				<script src="/wp-includes/js/dist/block-editor.js"></script>
				<script src="https://cdn.example.net/tracker.js"></script>
			` )
		);

		const { result } = renderHook( () => useEditorPreload() );
		act( () => result.current() );

		await waitFor( () => expect( prefetchedLinks() ).toHaveLength( 1 ) );
		expect( prefetchedLinks()[ 0 ].href ).toBe(
			`${ window.location.origin }/wp-includes/js/dist/block-editor.js`
		);
	} );

	it( 'only fetches once, however many times it is called', async () => {
		global.fetch.mockReturnValue( respondWith( '<script src="/a.js"></script>' ) );

		const { result } = renderHook( () => useEditorPreload() );
		act( () => {
			result.current();
			result.current();
			result.current();
		} );

		await waitFor( () => expect( prefetchedLinks() ).toHaveLength( 1 ) );
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'prefetches nothing when the editor page cannot be read', async () => {
		global.fetch.mockResolvedValue( { ok: false, text: () => Promise.resolve( '' ) } );

		const { result } = renderHook( () => useEditorPreload() );
		await act( async () => {
			result.current();
		} );

		expect( prefetchedLinks() ).toHaveLength( 0 );
	} );

	it( 'allows a retry after a failed attempt', async () => {
		global.fetch.mockRejectedValueOnce( new Error( 'offline' ) );

		const { result } = renderHook( () => useEditorPreload() );
		await act( async () => {
			result.current();
		} );

		global.fetch.mockReturnValue( respondWith( '<script src="/a.js"></script>' ) );
		act( () => result.current() );

		await waitFor( () => expect( prefetchedLinks() ).toHaveLength( 1 ) );
		expect( global.fetch ).toHaveBeenCalledTimes( 2 );
	} );
} );

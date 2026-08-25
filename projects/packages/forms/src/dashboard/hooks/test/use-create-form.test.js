import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const configValues = {};

await jest.unstable_mockModule( '../../../hooks/use-config-value.ts', () => ( {
	default: key => configValues[ key ],
} ) );

const { default: useCreateForm } = await import( '../use-create-form.ts' );

const ADMIN_URL = 'https://example.com/wp-admin/';

/**
 * Resolve to a marker if the promise has not settled by the next macrotask.
 *
 * The handoff to a page navigation is expressed as a promise that never settles, and the busy state
 * of every create entry point depends on that. Asserting it needs a race, since "it never settles"
 * cannot be observed directly.
 *
 * @param {Promise} promise - The promise under test.
 * @return {Promise<string>} 'pending', 'resolved' or 'rejected'.
 */
const settlementOf = promise =>
	Promise.race( [
		promise.then(
			() => 'resolved',
			() => 'rejected'
		),
		new Promise( resolve => setTimeout( () => resolve( 'pending' ), 0 ) ),
	] );

const lastNavigatedUrl = () => {
	const call = document.createElement.mock.results
		.map( r => r.value )
		.filter( el => el.tagName === 'A' )
		.pop();
	return call?.getAttribute( 'href' );
};

describe( 'useCreateForm', () => {
	let clickSpy;

	beforeEach( () => {
		// jest.spyOn() needs an existing property and this environment has no global fetch to wrap,
		// so the ajax cases assign one directly. afterEach deletes it again.
		configValues.adminUrl = ADMIN_URL;
		configValues.ajaxUrl = 'https://example.com/wp-admin/admin-ajax.php';
		configValues.newFormNonce = 'nonce';
		configValues.isCentralFormManagementEnabled = true;

		// Real anchors, but clicking one must not try to navigate jsdom.
		clickSpy = jest.spyOn( HTMLAnchorElement.prototype, 'click' ).mockImplementation( () => {} );
		jest.spyOn( document, 'createElement' );
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
		delete global.fetch;
	} );

	describe( 'with centralized form management', () => {
		it( 'navigates to the new-form editor and never settles, so callers stay busy', async () => {
			const { result } = renderHook( () => useCreateForm() );

			let settlement;
			await act( async () => {
				settlement = await settlementOf( result.current.openNewForm( { formTitle: 'Contact' } ) );
			} );

			expect( clickSpy ).toHaveBeenCalled();
			expect( lastNavigatedUrl() ).toBe(
				`${ ADMIN_URL }post-new.php?post_type=jetpack_form&post_title=Contact`
			);
			expect( settlement ).toBe( 'pending' );
		} );

		it( 'omits an empty title', async () => {
			const { result } = renderHook( () => useCreateForm() );

			await act( async () => {
				await settlementOf( result.current.openNewForm( { formTitle: '   ' } ) );
			} );

			expect( lastNavigatedUrl() ).toBe( `${ ADMIN_URL }post-new.php?post_type=jetpack_form` );
		} );
	} );

	describe( 'without centralized form management', () => {
		beforeEach( () => {
			configValues.isCentralFormManagementEnabled = false;
		} );

		it( 'creates the form over ajax, then navigates and never settles', async () => {
			// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no global fetch to spy on.
			global.fetch = jest.fn().mockResolvedValue( {
				json: () => Promise.resolve( { post_url: 'https://example.com/wp-admin/post.php?post=7' } ),
			} );
			const { result } = renderHook( () => useCreateForm() );

			let settlement;
			await act( async () => {
				settlement = await settlementOf( result.current.openNewForm( {} ) );
			} );

			expect( lastNavigatedUrl() ).toBe( 'https://example.com/wp-admin/post.php?post=7' );
			expect( settlement ).toBe( 'pending' );
		} );

		it( 'sends the typed title, trimmed, so the form is not created untitled', async () => {
			// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no global fetch to spy on.
			global.fetch = jest.fn().mockResolvedValue( {
				json: () => Promise.resolve( { post_url: 'https://example.com/wp-admin/post.php?post=7' } ),
			} );
			const { result } = renderHook( () => useCreateForm() );

			await act( async () => {
				await settlementOf( result.current.openNewForm( { formTitle: '  Contact  ' } ) );
			} );

			expect( global.fetch.mock.calls[ 0 ][ 1 ].body.get( 'formTitle' ) ).toBe( 'Contact' );
		} );

		it( 'omits the title when there is nothing but whitespace', async () => {
			// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no global fetch to spy on.
			global.fetch = jest.fn().mockResolvedValue( {
				json: () => Promise.resolve( { post_url: 'https://example.com/wp-admin/post.php?post=7' } ),
			} );
			const { result } = renderHook( () => useCreateForm() );

			await act( async () => {
				await settlementOf( result.current.openNewForm( { formTitle: '   ' } ) );
			} );

			expect( global.fetch.mock.calls[ 0 ][ 1 ].body.get( 'formTitle' ) ).toBeNull();
		} );

		it( 'rejects when the server reports failure, so the caller can recover', async () => {
			// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no global fetch to spy on.
			global.fetch = jest.fn().mockResolvedValue( {
				json: () => Promise.resolve( { success: false, data: 'Nope' } ),
			} );
			const { result } = renderHook( () => useCreateForm() );

			let settlement;
			await act( async () => {
				settlement = await settlementOf( result.current.openNewForm( {} ) );
			} );

			expect( settlement ).toBe( 'rejected' );
			expect( clickSpy ).not.toHaveBeenCalled();
		} );

		it( 'rejects rather than hanging when no editor URL comes back', async () => {
			// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no global fetch to spy on.
			global.fetch = jest.fn().mockResolvedValue( { json: () => Promise.resolve( {} ) } );
			const { result } = renderHook( () => useCreateForm() );

			let settlement;
			await act( async () => {
				settlement = await settlementOf( result.current.openNewForm( {} ) );
			} );

			expect( settlement ).toBe( 'rejected' );
			expect( clickSpy ).not.toHaveBeenCalled();
		} );
	} );
} );

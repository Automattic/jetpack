// Hoisted mocks — must precede component imports so the component file's own
// dependency chain doesn't pull in the real @wordpress/data store at test time.

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-singleton-template-actions-test' } ), {
	virtual: true,
} );

/* eslint-disable import/order -- mocks above must hoist before imports */
import { useDispatch, useSelect } from '@wordpress/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SingletonTemplateActions from '../singleton-template-actions.jsx';
/* eslint-enable import/order */

const WPCOM_ORIGIN = 'https://example.simple/wp-json/wpcom-origin/';
const NONCE = 'test-nonce-abc';

const baseConfig = {
	enabled: true,
	editorUrl: 'https://example.simple/wp-admin/admin.php?page=jetpack-search&edit_overlay=1',
	postType: 'jp_search_overlay',
	isCustomized: true,
};

const labels = {
	editLabel: 'Edit the Search overlay',
	restoreConfirmMessage: 'Restore the bundled Search overlay template?',
	successMessage: 'The Search overlay template has been restored to the bundled default.',
	errorMessage: 'Could not restore the default Search overlay template. Try again later.',
	linksDisabled: false,
};

describe( 'SingletonTemplateActions', () => {
	let successNotice;
	let errorNotice;

	beforeEach( () => {
		jest.clearAllMocks();
		successNotice = jest.fn();
		errorNotice = jest.fn();
		useDispatch.mockReturnValue( { successNotice, errorNotice } );
		// Mirror the boot-time wiring in wrapped-dashboard.jsx — selectors
		// resolve the wpcom-origin URL + nonce from the dashboard store.
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getWpcomOriginApiUrl: () => WPCOM_ORIGIN,
				getAPINonce: () => NONCE,
			} ) )
		);
		// jsdom doesn't ship `fetch`, so jest.spyOn(global, 'fetch') has
		// no descriptor to wrap. Assigning a jest.fn() directly is the
		// idiomatic stand-in here.
		// eslint-disable-next-line jest/prefer-spy-on -- see above.
		global.fetch = jest.fn( () =>
			Promise.resolve( { ok: true, status: 200, json: async () => ( { deleted: true } ) } )
		);
	} );

	afterEach( () => {
		delete global.fetch;
	} );

	test( 'hides the Restore default link when the singleton is not customized', () => {
		render(
			<SingletonTemplateActions { ...labels } config={ { ...baseConfig, isCustomized: false } } />
		);
		expect( screen.getByText( 'Edit the Search overlay' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Restore default' ) ).not.toBeInTheDocument();
	} );

	test( 'hides the Restore default link when postType is null (non-admin / gate off)', () => {
		render(
			<SingletonTemplateActions { ...labels } config={ { ...baseConfig, postType: null } } />
		);
		expect( screen.queryByText( 'Restore default' ) ).not.toBeInTheDocument();
	} );

	test( 'opens the confirm dialog on Cancel when the Restore default link is clicked', async () => {
		render( <SingletonTemplateActions { ...labels } config={ baseConfig } /> );
		expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByText( 'Restore default' ) );
		await expect(
			screen.findByRole( 'alertdialog', {
				name: 'Restore default',
				description: labels.restoreConfirmMessage,
			} )
		).resolves.toBeInTheDocument();
		await waitFor( () => expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus() );
	} );

	test( 'closes without a DELETE when Enter is pressed on open', async () => {
		render( <SingletonTemplateActions { ...labels } config={ baseConfig } /> );
		await userEvent.click( screen.getByText( 'Restore default' ) );
		await waitFor( () => expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toHaveFocus() );
		await userEvent.keyboard( '{Enter}' );

		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
		expect( global.fetch ).not.toHaveBeenCalled();
		expect( screen.getByText( 'Restore default' ) ).toBeInTheDocument();
	} );

	test( 'DELETEs the wpcom-origin URL + nonce, fires success notice, hides the link', async () => {
		render( <SingletonTemplateActions { ...labels } config={ baseConfig } /> );
		await userEvent.click( screen.getByText( 'Restore default' ) );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Restore default' } ) );

		await waitFor( () => expect( global.fetch ).toHaveBeenCalledTimes( 1 ) );
		const [ url, options ] = global.fetch.mock.calls[ 0 ];
		// The URL contract this whole PR exists to fix — wpcom-origin
		// prefix + jetpack/v4 namespace + CPT slug, not the old
		// `/wp/v2/<rest_base>/<id>?force=true` path.
		expect( url ).toBe(
			'https://example.simple/wp-json/wpcom-origin/jetpack/v4/search/templates/jp_search_overlay'
		);
		expect( options.method ).toBe( 'DELETE' );
		expect( options.credentials ).toBe( 'same-origin' );
		expect( options.headers ).toEqual( { 'X-WP-Nonce': NONCE } );

		await waitFor( () => expect( successNotice ).toHaveBeenCalledWith( labels.successMessage ) );
		await waitFor( () =>
			expect( screen.queryByText( 'Restore default' ) ).not.toBeInTheDocument()
		);
		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
		expect( errorNotice ).not.toHaveBeenCalled();
	} );

	test( 'escapes special characters in postType when building the URL', async () => {
		render(
			<SingletonTemplateActions
				{ ...labels }
				config={ { ...baseConfig, postType: 'a slug/with weird chars' } }
			/>
		);
		await userEvent.click( screen.getByText( 'Restore default' ) );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Restore default' } ) );

		await waitFor( () => expect( global.fetch ).toHaveBeenCalledTimes( 1 ) );
		const [ url ] = global.fetch.mock.calls[ 0 ];
		expect( url ).toBe(
			'https://example.simple/wp-json/wpcom-origin/jetpack/v4/search/templates/a%20slug%2Fwith%20weird%20chars'
		);
	} );

	test( 'surfaces the server error message on non-OK response', async () => {
		// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no native fetch to spy on.
		global.fetch = jest.fn( () =>
			Promise.resolve( {
				ok: false,
				status: 500,
				json: async () => ( { message: 'Template is locked.' } ),
			} )
		);
		render( <SingletonTemplateActions { ...labels } config={ baseConfig } /> );
		await userEvent.click( screen.getByText( 'Restore default' ) );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Restore default' } ) );

		await waitFor( () => expect( errorNotice ).toHaveBeenCalledWith( 'Template is locked.' ) );
		expect( successNotice ).not.toHaveBeenCalled();
		// Failed DELETE leaves the link in place so the admin can retry.
		expect( screen.getByText( 'Restore default' ) ).toBeInTheDocument();
	} );

	test( 'falls back to the prop errorMessage when the response has no JSON body', async () => {
		// eslint-disable-next-line jest/prefer-spy-on -- jsdom has no native fetch to spy on.
		global.fetch = jest.fn( () =>
			Promise.resolve( {
				ok: false,
				status: 502,
				json: () => Promise.reject( new Error( 'no body' ) ),
			} )
		);
		render( <SingletonTemplateActions { ...labels } config={ baseConfig } /> );
		await userEvent.click( screen.getByText( 'Restore default' ) );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Restore default' } ) );

		await waitFor( () => expect( errorNotice ).toHaveBeenCalledWith( labels.errorMessage ) );
	} );

	test( 'does not fire fetch when wpcomOriginApiUrl is missing', async () => {
		useSelect.mockImplementation( callback =>
			callback( () => ( {
				getWpcomOriginApiUrl: () => null,
				getAPINonce: () => NONCE,
			} ) )
		);
		render( <SingletonTemplateActions { ...labels } config={ baseConfig } /> );
		await userEvent.click( screen.getByText( 'Restore default' ) );
		await userEvent.click( await screen.findByRole( 'button', { name: 'Restore default' } ) );
		expect( global.fetch ).not.toHaveBeenCalled();
	} );
} );

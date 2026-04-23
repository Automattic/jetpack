// Mocks must precede module imports so Jest can hoist them above the
// component file's own dependency chain (which would otherwise drag in
// the full `@wordpress/components` + admin-ui stack at test time).
/* eslint-disable testing-library/prefer-user-event -- @testing-library/user-event is not a direct dep of this package; fireEvent is intentional. */
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
} ) );

jest.mock( '@wordpress/components', () => ( {
	__esModule: true,
	ToggleControl: ( { checked, disabled, label, onChange } ) => (
		<input
			type="checkbox"
			checked={ !! checked }
			disabled={ !! disabled }
			aria-label={ label }
			onChange={ event => onChange( event.target.checked ) }
		/>
	),
} ) );

jest.mock( 'store', () => ( { STORE_ID: 'jetpack-search-plugin-test' } ), { virtual: true } );

jest.mock(
	'components/card',
	() => ( { __esModule: true, default: ( { children } ) => <div>{ children }</div> } ),
	{ virtual: true }
);

/* eslint-disable import/order -- mocks above must hoist before imports */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReaderChatControl from '../index.jsx';
/* eslint-enable import/order */

describe( 'ReaderChatControl', () => {
	let dispatchSpies;

	beforeEach( () => {
		jest.clearAllMocks();
		dispatchSpies = {
			updatingNotice: jest.fn(),
			removeUpdatingNotice: jest.fn(),
			successNotice: jest.fn(),
			errorNotice: jest.fn(),
		};
		useDispatch.mockReturnValue( dispatchSpies );
	} );

	test( 'renders nothing when the setting is not exposed by the REST API', async () => {
		apiFetch.mockResolvedValueOnce( { title: 'Site', description: 'desc' } );

		const { container } = render( <ReaderChatControl /> );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( container ).toBeEmptyDOMElement();
	} );

	test( 'renders the toggle reflecting the current stored value (true)', async () => {
		apiFetch.mockResolvedValueOnce( { blog_talks_back: true } );

		render( <ReaderChatControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable Reader Chat/i,
		} );
		expect( toggle ).toBeChecked();
	} );

	test( 'renders the toggle as off when the stored value is false', async () => {
		apiFetch.mockResolvedValueOnce( { blog_talks_back: false } );

		render( <ReaderChatControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable Reader Chat/i,
		} );
		expect( toggle ).not.toBeChecked();
	} );

	test( 'posts the new value and dispatches success notice when toggled', async () => {
		apiFetch
			.mockResolvedValueOnce( { blog_talks_back: false } )
			.mockResolvedValueOnce( { blog_talks_back: true } );

		render( <ReaderChatControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable Reader Chat/i,
		} );
		fireEvent.click( toggle );

		await waitFor( () => {
			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/wp/v2/settings',
				method: 'POST',
				data: { blog_talks_back: true },
			} );
		} );

		expect( dispatchSpies.updatingNotice ).toHaveBeenCalled();
		expect( dispatchSpies.removeUpdatingNotice ).toHaveBeenCalled();
		expect( dispatchSpies.successNotice ).toHaveBeenCalled();
		expect( dispatchSpies.errorNotice ).not.toHaveBeenCalled();
	} );

	test( 'dispatches error notice when the save fails', async () => {
		apiFetch
			.mockResolvedValueOnce( { blog_talks_back: false } )
			.mockRejectedValueOnce( new Error( 'save failed' ) );

		render( <ReaderChatControl /> );

		const toggle = await screen.findByRole( 'checkbox', {
			name: /Enable Reader Chat/i,
		} );
		fireEvent.click( toggle );

		await waitFor( () => {
			expect( dispatchSpies.errorNotice ).toHaveBeenCalled();
		} );
		expect( dispatchSpies.successNotice ).not.toHaveBeenCalled();
	} );

	test( 'renders nothing on REST error (network failure)', async () => {
		apiFetch.mockRejectedValueOnce( new Error( 'boom' ) );

		const { container } = render( <ReaderChatControl /> );

		await waitFor( () => expect( apiFetch ).toHaveBeenCalledTimes( 1 ) );
		expect( container ).toBeEmptyDOMElement();
	} );
} );

import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import { store } from '../../../social-store';
import { setup } from '../../../utils/test-factory';
import { CustomInputs } from '../custom-inputs';

const stubReconnectingAccount = value => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	jest.spyOn( storeSelect, 'getReconnectingAccount' ).mockReturnValue( value );
};

describe( 'CustomInputs', () => {
	beforeEach( () => {
		setup();
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders the Mastodon handle field', () => {
		stubReconnectingAccount( undefined );

		render( <CustomInputs service={ { id: 'mastodon' } } /> );

		expect( screen.getByRole( 'textbox', { name: /Mastodon handle/i } ) ).toBeInTheDocument();
	} );

	test( 'renders the Bluesky handle and app password fields', () => {
		stubReconnectingAccount( undefined );

		render( <CustomInputs service={ { id: 'bluesky' } } /> );

		expect( screen.getByRole( 'textbox', { name: /Bluesky handle/i } ) ).toBeInTheDocument();
		expect( screen.getByLabelText( /App password/i ) ).toBeInTheDocument();
	} );

	test( 'flags an invalid Bluesky handle that contains dots', async () => {
		const user = userEvent.setup();
		stubReconnectingAccount( undefined );

		render( <CustomInputs service={ { id: 'bluesky' } } /> );

		await user.type(
			screen.getByRole( 'textbox', { name: /Bluesky handle/i } ),
			'foo.bar.bsky.social'
		);

		expect( screen.getByText( /Bluesky usernames cannot contain dots/i ) ).toBeInTheDocument();
	} );

	test( 'shows the reconnect notice when reconnecting a Bluesky account', () => {
		stubReconnectingAccount( { service_name: 'bluesky', external_handle: 'me.bsky.social' } );

		render( <CustomInputs service={ { id: 'bluesky' } } /> );

		// The Notice renders the message and @wordpress/a11y mirrors it into a
		// live region, so the copy appears more than once — assert it's present.
		expect(
			screen.getAllByText( 'Please provide an app password to fix the connection.' ).length
		).toBeGreaterThan( 0 );
	} );

	test( 'renders nothing for services without custom inputs', () => {
		stubReconnectingAccount( undefined );

		const { container } = render( <CustomInputs service={ { id: 'facebook' } } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );

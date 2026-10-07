import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { TextSetting } from '../components/text-setting';
import {
	baseSettings,
	baseStatus,
	renderWithData,
	resetNotices,
	snackbarMessages,
} from './helpers';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

/**
 * Whether leaving the page now would prompt.
 *
 * @return Whether the beforeunload event was cancelled.
 */
function leavingPrompts(): boolean {
	const event = new Event( 'beforeunload', { cancelable: true } );
	window.dispatchEvent( event );
	return event.defaultPrevented;
}

beforeEach( () => {
	mockApiFetch.mockReset();
	resetNotices();
} );

describe( 'TextSetting', () => {
	it( 'enables Save and warns before leaving only while the draft differs', async () => {
		const user = userEvent.setup();
		renderWithData( <TextSetting settingKey="twitter_site_tag" label="Twitter Site Tag" /> );
		const save = screen.getByRole( 'button', { name: 'Save' } );

		expect( save ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( leavingPrompts() ).toBe( false );

		await user.type( screen.getByLabelText( 'Twitter Site Tag' ), '@jetpack' );

		expect( save ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( leavingPrompts() ).toBe( true );
	} );

	it( 'shows the value the server stored once saved', async () => {
		const user = userEvent.setup();
		mockApiFetch.mockImplementation( ( { method } ) =>
			Promise.resolve(
				method === 'PUT' ? { ...baseSettings, twitter_site_tag: 'jetpack' } : baseStatus
			)
		);
		renderWithData( <TextSetting settingKey="twitter_site_tag" label="Twitter Site Tag" /> );
		const input = screen.getByLabelText( 'Twitter Site Tag' );

		await user.type( input, '@jetpack' );
		await user.click( screen.getByRole( 'button', { name: 'Save' } ) );

		await waitFor( () => expect( input ).toHaveValue( 'jetpack' ) );
		expect( leavingPrompts() ).toBe( false );
	} );

	it( 'keeps what the user typed when the save is refused', async () => {
		const user = userEvent.setup();
		let refuse!: ( reason: unknown ) => void;
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method === 'PUT' ) {
				return new Promise( ( _, reject ) => {
					refuse = reject;
				} );
			}
			return Promise.resolve( path?.endsWith( '/status' ) ? baseStatus : baseSettings );
		} );
		const { queryClient } = renderWithData(
			<TextSetting settingKey="twitter_site_tag" label="Twitter Site Tag" />
		);
		const input = screen.getByLabelText( 'Twitter Site Tag' );
		const save = screen.getByRole( 'button', { name: 'Save' } );

		await user.type( input, '@jetpack' );
		await user.click( save );
		// Refuse only once the optimistic value has rendered, as over a real network.
		await waitFor( () => expect( save ).toHaveAttribute( 'aria-disabled', 'true' ) );
		await act( async () => refuse( { message: 'Nope.' } ) );
		await waitFor( () => expect( snackbarMessages() ).toContain( 'Nope.' ) );
		await waitFor( () => expect( queryClient.isFetching() ).toBe( 0 ) );

		expect( input ).toHaveValue( '@jetpack' );
		expect( save ).not.toHaveAttribute( 'aria-disabled', 'true' );
		expect( leavingPrompts() ).toBe( true );
	} );
} );

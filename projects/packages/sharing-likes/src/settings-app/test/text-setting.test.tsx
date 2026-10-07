import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { TextSetting } from '../components/text-setting';
import { baseSettings, baseStatus, renderWithData, resetNotices } from './helpers';

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

		expect( save ).toBeDisabled();
		expect( leavingPrompts() ).toBe( false );

		await user.type( screen.getByLabelText( 'Twitter Site Tag' ), '@jetpack' );

		expect( save ).toBeEnabled();
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
} );

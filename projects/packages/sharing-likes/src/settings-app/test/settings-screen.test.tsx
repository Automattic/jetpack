import { act, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { LIKES_ANCHOR } from '../anchors';
import { useSaveSetting } from '../data/use-save-setting';
import { SettingsScreen } from '../settings-screen';
import { baseStatus, renderWithData, resetNotices, setScriptData } from './helpers';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const scrollIntoView = jest.fn();

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
	mockApiFetch.mockImplementation( () => new Promise( () => {} ) );
	resetNotices();
	setScriptData();
	window.location.hash = '';
	scrollIntoView.mockReset();
	Element.prototype.scrollIntoView = scrollIntoView;
} );

afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'SettingsScreen', () => {
	it( 'shows an error when the script data is missing', () => {
		( window as unknown as { JetpackScriptData: unknown } ).JetpackScriptData = { site: {} };
		renderWithData( <SettingsScreen /> );

		expect(
			screen.getByText( 'Sharing settings could not be loaded. Reload the page to try again.', {
				// Notice also announces its text through this live region.
				ignore: '.a11y-speak-region',
			} )
		).toBeInTheDocument();
	} );

	it( 'warns when PHP has no multibyte support', () => {
		setScriptData( { multibyte_supported: false } );
		renderWithData( <SettingsScreen /> );

		expect( screen.getByText( 'Warning! Multibyte support missing!' ) ).toBeInTheDocument();
	} );

	it( 'scrolls to the section the URL hash names once it has rendered', () => {
		window.location.hash = `#${ LIKES_ANCHOR }`;
		renderWithData( <SettingsScreen /> );

		expect( scrollIntoView ).toHaveBeenCalledTimes( 1 );
		expect( scrollIntoView.mock.contexts[ 0 ] ).toHaveProperty( 'id', LIKES_ANCHOR );
	} );

	it.each( [ '#jetpack-sharing-placement', '#100%' ] )(
		'ignores a hash with no matching element: %s',
		hash => {
			window.location.hash = hash;
			renderWithData( <SettingsScreen />, { status: { ...baseStatus, placement: false } } );

			expect( scrollIntoView ).not.toHaveBeenCalled();
			expect( screen.getByText( 'Other settings' ) ).toBeInTheDocument();
		}
	);

	it( 'warns before leaving while a save is in flight', async () => {
		let save: ReturnType< typeof useSaveSetting > | undefined;
		/**
		 * Renders the screen and exposes a save to the test.
		 *
		 * @return Screen.
		 */
		function WithSave() {
			save = useSaveSetting();
			return <SettingsScreen />;
		}
		renderWithData( <WithSave /> );

		expect( leavingPrompts() ).toBe( false );
		act( () => {
			save?.( 'likes_enabled', false );
		} );

		await waitFor( () => expect( leavingPrompts() ).toBe( true ) );
	} );
} );

import { act, screen, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { LIKES_ANCHOR } from '../anchors';
import { useFeatureAction } from '../data/use-feature-action';
import { useSaveSetting } from '../data/use-save-setting';
import { SettingsScreen } from '../settings-screen';
import { baseSettings, baseStatus, renderWithData, setScriptData } from './helpers';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <div>{ children }</div>,
} ) );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const scrollIntoView = jest.fn();

interface Writes {
	save: ReturnType< typeof useSaveSetting >;
	action: ReturnType< typeof useFeatureAction >[ 'run' ];
}

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

	it.each( [
		[ 'a save', ( write: Writes ) => write.save( 'likes_enabled', false ), baseSettings ],
		[
			'a feature action',
			( write: Writes ) => write.action( 'sharing', 'switch-to-block' ),
			baseStatus,
		],
	] )( 'warns before leaving only while %s is in flight', async ( _, start, response ) => {
		let finish!: ( value: unknown ) => void;
		mockApiFetch.mockImplementation( ( { method, path } ) => {
			if ( method ) {
				return new Promise( resolve => ( finish = resolve ) );
			}
			if ( path?.endsWith( '/services' ) ) {
				return Promise.resolve( { visible: [], hidden: [], services: [] } );
			}
			return Promise.resolve( path?.endsWith( '/status' ) ? baseStatus : baseSettings );
		} );
		let writes: Writes | undefined;
		/**
		 * Renders the screen and exposes its writes to the test.
		 *
		 * @return Screen.
		 */
		function WithWrites() {
			writes = { save: useSaveSetting(), action: useFeatureAction().run };
			return <SettingsScreen />;
		}
		renderWithData( <WithWrites /> );

		expect( leavingPrompts() ).toBe( false );
		act( () => {
			start( writes! );
		} );

		await waitFor( () => expect( leavingPrompts() ).toBe( true ) );

		act( () => finish( response ) );
		await waitFor( () => expect( leavingPrompts() ).toBe( false ) );
	} );
} );

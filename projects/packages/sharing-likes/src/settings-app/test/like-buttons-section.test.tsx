import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { LIKES_ANCHOR } from '../anchors';
import { LikeButtonsSection } from '../sections/like-buttons-section';
import {
	apiCalls,
	baseSettings,
	baseStatus,
	renderWithData,
	resetNotices,
	setScriptData,
	snackbarMessages,
} from './helpers';
import type { Settings } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

beforeEach( () => {
	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( { method } ) =>
		Promise.resolve( method === 'PUT' ? baseSettings : baseStatus )
	);
	resetNotices();
	setScriptData();
} );

afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'LikeButtonsSection', () => {
	it( 'only explains offline mode when Like buttons cannot run', () => {
		const { container } = renderWithData( <LikeButtonsSection />, {
			status: { ...baseStatus, likes: { state: 'configure', supported: false } },
		} );

		expect(
			screen.getByText(
				'Like buttons need a connection to WordPress.com, which is unavailable while your site is in offline mode.'
			)
		).toBeInTheDocument();
		expect( screen.queryByRole( 'radio' ) ).not.toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- An anchor ID is not reachable by any query.
		expect( container.querySelector( `#${ LIKES_ANCHOR }` ) ).not.toBeNull();
	} );

	it( 'saves the sitewide default when a radio is picked', async () => {
		const user = userEvent.setup();
		renderWithData( <LikeButtonsSection /> );

		await user.click( screen.getByRole( 'radio', { name: 'Turned on per post' } ) );

		await waitFor( () =>
			expect( apiCalls( 'PUT' )[ 0 ]?.data ).toEqual( { likes_enabled: false } )
		);
	} );

	it.each( [
		[ 'offers', { ...baseSettings, reblogs_enabled: true }, true ],
		[ 'withholds', baseSettings, false ],
	] as [ string, Settings, boolean ][] )(
		'%s the Reblog button as settings carries it or not',
		( _verb, settings, offered ) => {
			renderWithData( <LikeButtonsSection />, { settings } );

			expect(
				screen.queryByRole( 'radio', { name: 'Show the Reblog button on posts' } ) !== null
			).toBe( offered );
		}
	);

	it( 'confirms "Turn on" and moves focus to the options that replace the button', async () => {
		mockApiFetch.mockImplementation( ( { path } ) =>
			Promise.resolve( path?.endsWith( '/settings' ) ? baseSettings : baseStatus )
		);
		renderWithData( <LikeButtonsSection />, {
			status: { ...baseStatus, likes: { state: 'off', supported: true } },
		} );

		await userEvent.click( screen.getByRole( 'button', { name: 'Turn on Like buttons' } ) );

		await waitFor( () => expect( snackbarMessages() ).toContain( 'Settings have been saved' ) );
		const radio = await screen.findByRole( 'radio', { name: 'On for all posts' } );
		// eslint-disable-next-line testing-library/no-node-access -- The focus target is a plain container no query can reach.
		const variant = radio.closest( '.jetpack-sharing-likes__variant' );
		await waitFor( () => expect( variant ).toHaveFocus() );
	} );
} );

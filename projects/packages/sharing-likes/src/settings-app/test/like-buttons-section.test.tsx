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
} from './helpers';

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

	it( 'offers the Reblog button only where settings carries it', () => {
		renderWithData( <LikeButtonsSection />, {
			settings: { ...baseSettings, reblogs_enabled: true },
		} );

		expect(
			screen.getByRole( 'radio', { name: 'Show the Reblog button on posts' } )
		).toBeChecked();
	} );
} );

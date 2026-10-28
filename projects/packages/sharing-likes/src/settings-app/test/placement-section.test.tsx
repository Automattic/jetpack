import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { PlacementSection } from '../sections/placement-section';
import { apiCalls, baseSettings, baseStatus, renderWithData, setScriptData } from './helpers';
import type { Status } from '../types';

jest.mock( '@wordpress/api-fetch' );
const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

beforeEach( () => {
	mockApiFetch.mockReset();
	mockApiFetch.mockImplementation( ( { method } ) =>
		Promise.resolve( method === 'PUT' ? baseSettings : baseStatus )
	);
	setScriptData();
} );

afterEach( () => {
	delete ( window as unknown as { JetpackScriptData?: unknown } ).JetpackScriptData;
} );

describe( 'PlacementSection', () => {
	it( 'checks the selected places under the heading status calls for', () => {
		renderWithData( <PlacementSection /> );

		const group = screen.getByRole( 'group', { name: 'Where sharing and Like buttons appear' } );
		expect( within( group ).getByLabelText( 'Posts' ) ).toBeChecked();
		expect(
			within( group ).getByLabelText( 'Front Page, Archive Pages, and Search Results' )
		).not.toBeChecked();
	} );

	// Unticking Pages here doesn't keep the Sharing Buttons or Like block off pages.
	it.each( [
		[ 'sharing', { ...baseStatus, sharing: { state: 'block_call_to_action' } }, true ],
		[ 'likes', { ...baseStatus, likes: { state: 'block_call_to_action', supported: true } }, true ],
		[
			'offline likes',
			{ ...baseStatus, likes: { state: 'block_call_to_action', supported: false } },
			false,
		],
		[ 'no', baseStatus, false ],
	] as [ string, Status, boolean ][] )(
		'with %s section on the block, says blocks are not affected: %s',
		( _section, status, shown ) => {
			renderWithData( <PlacementSection />, { status } );

			expect(
				screen.queryByText( /Blocks you add to your templates aren’t affected\./ ) !== null
			).toBe( shown );
		}
	);

	it( 'saves the whole list when one place changes', async () => {
		const user = userEvent.setup();
		renderWithData( <PlacementSection /> );

		await user.click( screen.getByLabelText( 'Front Page, Archive Pages, and Search Results' ) );

		await waitFor( () =>
			expect( apiCalls( 'PUT' )[ 0 ]?.data ).toEqual( { show: [ 'post', 'page', 'index' ] } )
		);
	} );
} );

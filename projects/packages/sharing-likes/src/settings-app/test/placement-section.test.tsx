import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { PlacementSection } from '../sections/placement-section';
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

describe( 'PlacementSection', () => {
	it( 'checks the selected places under the heading status calls for', () => {
		renderWithData( <PlacementSection /> );

		const group = screen.getByRole( 'group', { name: 'Where sharing and Like buttons appear' } );
		expect( within( group ).getByLabelText( 'Posts' ) ).toBeChecked();
		expect(
			within( group ).getByLabelText( 'Front Page, Archive Pages, and Search Results' )
		).not.toBeChecked();
	} );

	it( 'saves the whole list when one place changes', async () => {
		const user = userEvent.setup();
		renderWithData( <PlacementSection /> );

		await user.click( screen.getByLabelText( 'Front Page, Archive Pages, and Search Results' ) );

		await waitFor( () =>
			expect( apiCalls( 'PUT' )[ 0 ]?.data ).toEqual( { show: [ 'post', 'page', 'index' ] } )
		);
	} );
} );

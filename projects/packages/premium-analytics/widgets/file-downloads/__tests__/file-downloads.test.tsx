/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import FileDownloadsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'FileDownloadsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( { date: '2026-06-22', days: {} } );
	} );

	it( 'declares View all to the Downloads report', () => {
		const { declaredLink } = renderWithActionsHost( <FileDownloadsWidget attributes={ {} } /> );

		expect( declaredLink( 'view-all' )?.href ).toContain( '%2Freports%2Fdownloads' );
	} );
} );

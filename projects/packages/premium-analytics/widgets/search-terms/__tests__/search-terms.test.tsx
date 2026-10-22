/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import SearchTermsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'SearchTermsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( { date: '2026-06-22', days: {} } );
	} );

	it( 'declares View all to the Search Terms report', () => {
		const { declaredLink } = renderWithActionsHost( <SearchTermsWidget attributes={ {} } /> );

		expect( declaredLink( 'view-all' )?.href ).toContain( '%2Freports%2Fsearch-terms' );
	} );
} );

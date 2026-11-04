/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import AllTimeStatsWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const SITE_PAYLOAD = {
	stats: { views: 2068, visitors: 47, posts: 29, comments: 1 },
};

const renderWidget = ( attributes: Record< string, unknown > = {} ) =>
	render(
		<AllTimeStatsWidget attributes={ { ...attributes, reportParams: getDefaultQueryParams() } } />
	);

describe( 'AllTimeStatsWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( SITE_PAYLOAD );
	} );

	it( 'shows every lifetime total, requesting only those fields', async () => {
		const { container } = renderWidget();

		await expect( screen.findByText( 'Views' ) ).resolves.toBeInTheDocument();
		expect( String( mockApiFetch.mock.calls[ 0 ][ 0 ].path ) ).toMatch(
			/proxy\/v1\.1\/stats\?stat_fields=views%2Cvisitors%2Cposts%2Ccomments$/
		);
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
		// A single-figure widget: the exact figure, with no compact one beside it.
		expect( container ).toHaveTextContent( 'Views2,068' );
		expect( screen.queryByText( '2.1K' ) ).not.toBeInTheDocument();
		expect( container ).toHaveTextContent( 'Comments1' );
	} );

	it( 'shows every total as zero, not an empty state, when the payload has no totals', async () => {
		mockApiFetch.mockResolvedValue( {} );
		renderWidget();

		await expect( screen.findByText( 'Views' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByText( '0' ) ).toHaveLength( 4 );
	} );

	it( 'ignores a metrics subset persisted by an earlier version', async () => {
		renderWidget( { metrics: [ 'views' ] } );

		await expect( screen.findByText( 'Views' ) ).resolves.toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 4 );
	} );
} );

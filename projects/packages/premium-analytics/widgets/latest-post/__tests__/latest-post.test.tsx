/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import LatestPostWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

const REPORT_PARAMS = { ...getDefaultQueryParams( false ), preset: undefined };

describe( 'LatestPostWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( [] );
	} );

	it( 'shows the scopeless empty state, and makes no request, when author-scoped without an author', async () => {
		render(
			<LatestPostWidget attributes={ { reportParams: REPORT_PARAMS, authorScoped: true } } />
		);

		await expect(
			screen.findByText( 'Open an author to see their latest post here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch ).not.toHaveBeenCalled();
	} );

	it( 'picks across the site when the instance is not author-scoped', async () => {
		render(
			<LatestPostWidget attributes={ { reportParams: { ...REPORT_PARAMS, author_id: 7 } } } />
		);

		await expect(
			screen.findByText( 'Publish a post to see its stats here.' )
		).resolves.toBeInTheDocument();
		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).not.toContain( 'author=' );
	} );
} );

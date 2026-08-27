/**
 * External dependencies
 */
import { getDefaultQueryParams, queryClient } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import SharesWidget from '../render';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'SharesWidget', () => {
	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		mockApiFetch.mockResolvedValue( {
			stats: {
				shares: 15,
				shares_facebook: 10,
				shares_twitter: 5,
			},
		} );
	} );

	function renderWidget() {
		return render(
			<SharesWidget attributes={ { reportParams: getDefaultQueryParams( false ) } } />
		);
	}

	it( 'ranks the sharing networks by share count', async () => {
		renderWidget();

		await expect( screen.findByText( 'Facebook' ) ).resolves.toBeInTheDocument();
		expect( screen.getByText( 'Twitter' ) ).toBeInTheDocument();
	} );

	// Share counts are a running total per post and no share date is ever
	// recorded, so this widget can never follow a date range and says so.
	it( 'states that the counts are all-time', () => {
		renderWidget();

		expect( screen.getByText( 'All time' ) ).toBeInTheDocument();
	} );
} );

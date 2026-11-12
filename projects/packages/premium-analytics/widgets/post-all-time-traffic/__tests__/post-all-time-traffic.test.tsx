/**
 * External dependencies
 */
import { queryClient } from '@jetpack-premium-analytics/data';
import { screen } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import { captureCsvDownloads } from '../../test-utils';
import PostAllTimeTrafficWidget from '../render';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

const mockApiFetch = apiFetch as jest.MockedFunction< typeof apiFetch >;

const STATS_POST_RESPONSE = {
	years: { '2026': { total: 45, months: { '1': 5, '3': 40 } } },
	averages: { '2026': { overall: 0.5, months: { '1': 0.16, '3': 1.29 } } },
	post: { ID: 779, post_date: '2026-01-10 16:27:32' },
};

const REPORT_PARAMS = {
	from: '2026-03-01T00:00:00',
	to: '2026-03-15T23:59:59',
	post_id: 779,
};

// The current year closes the table, so the clock is pinned to the fixture's year.
const NOW = new Date( '2026-03-15T12:00:00.000Z' );

class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}

function renderWidget( attributes: Record< string, unknown > = {} ) {
	return renderWithActionsHost(
		<PostAllTimeTrafficWidget attributes={ { reportParams: REPORT_PARAMS, ...attributes } } />
	);
}

describe( 'PostAllTimeTrafficWidget CSV download', () => {
	let downloads: ReturnType< typeof captureCsvDownloads > | undefined;

	beforeAll( () => {
		( globalThis as { ResizeObserver?: unknown } ).ResizeObserver = ResizeObserverStub;
	} );

	beforeEach( () => {
		queryClient.clear();
		mockApiFetch.mockReset();
		jest.useFakeTimers();
		jest.setSystemTime( NOW );
	} );

	afterEach( () => {
		downloads?.restore();
		downloads = undefined;
		jest.useRealTimers();
	} );

	it.each( [
		[
			'monthly views',
			{},
			'post-779-all-time-traffic.csv',
			'"2026","5","0","40","","","","","","","","","","45"',
		],
		[
			'daily averages',
			{ metric: 'average' },
			'post-779-daily-average-all-time-traffic.csv',
			'"2026","0.16","0","1.29","","","","","","","","","","0.5"',
		],
	] )( 'saves the table of %s', async ( _, attributes, filename, row ) => {
		downloads = captureCsvDownloads();
		mockApiFetch.mockResolvedValue( STATS_POST_RESPONSE );

		const { findDeclaredAction } = renderWidget( attributes );
		await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );

		expect( downloads.files[ 0 ].filename ).toBe( filename );
		await expect( downloads.lines() ).resolves.toEqual( [
			'"Year","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Totals"',
			row,
		] );
	} );

	it( 'offers no download for a post without views', async () => {
		mockApiFetch.mockResolvedValue( {
			...STATS_POST_RESPONSE,
			years: { '2026': { total: 0, months: {} } },
		} );

		const { declaredAction } = renderWidget();
		await expect( screen.findByText( 'No views yet.' ) ).resolves.toBeInTheDocument();

		expect( declaredAction( 'download-csv' ) ).toBeUndefined();
	} );
} );

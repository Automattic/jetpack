/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import StatsWidget from '..';
import { mockApiFetch } from '../../../test-utils/mock-api-fetch';
import {
	VIDEO_PLAYS_REPORT_PARAMS,
	VIDEO_PLAYS_RESPONSE,
} from '../../../test-utils/video-plays-response';
import { getQueryClient } from '../../../utils/query-client';

// Hoisted here too: the component is imported before the helper that installs this mock.
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isSimpleSite: () => false,
} ) );

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () =>
	jest
		.requireActual< typeof import( '../../../test-utils/fake-widget-root' ) >(
			'../../../test-utils/fake-widget-root'
		)
		.fakeWidgetRoot( () => ( {} ) )
);

describe( 'StatsWidget', () => {
	beforeEach( () => {
		getQueryClient().setDefaultOptions( { queries: { retry: false } } );
	} );

	afterEach( () => {
		getQueryClient().clear();
	} );

	it( 'fetches the period the dashboard hands over, and the one before it', async () => {
		const apiFetch = mockApiFetch( () => VIDEO_PLAYS_RESPONSE );

		render(
			<StatsWidget attributes={ { reportParams: VIDEO_PLAYS_REPORT_PARAMS } }>
				{ ( { stats } ) => <p>{ `Views: ${ stats.views.current }` }</p> }
			</StatsWidget>
		);

		await expect( screen.findByText( 'Views: 15' ) ).resolves.toBeInTheDocument();
		expect( apiFetch.mock.calls.map( ( [ options ] ) => options.path ) ).toEqual( [
			expect.stringContaining( 'num=7&date=2026-06-07' ),
			expect.stringContaining( 'num=7&date=2026-05-31' ),
		] );
	} );

	it( 'shows the fetch error when there are no stats to fall back on', async () => {
		mockApiFetch( () => {
			throw new Error( 'offline' );
		} );

		render(
			<StatsWidget attributes={ { reportParams: VIDEO_PLAYS_REPORT_PARAMS } }>
				{ () => <p>Stats</p> }
			</StatsWidget>
		);

		await expect(
			screen.findByText( /We couldn’t load your video stats\./ )
		).resolves.toBeInTheDocument();
		expect( screen.queryByText( 'Stats' ) ).not.toBeInTheDocument();
	} );
} );

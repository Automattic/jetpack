import { getRedirectUrl } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { TRACKS_EVENT_NAME_PREFIX } from '../src/constants';
import {
	formatAxisTickDate,
	formatDate,
	getXAxisTickValues,
	transformData,
	DashboardLink,
	getNewsletterSettingsUrl,
	buildJPRedirectSource,
	getSubscriberStatsUrl,
	formatNumber,
	calcLeftAxisMargin,
} from '../src/helpers';
import type { SubscriberTotalsByDate, ChartSubscriptionDataPoint } from '../src/types';

// Mock the useAnalytics hook
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: jest.fn(),
} ) );

// Mock WordPress element hooks
jest.mock( '@wordpress/element', () => ( {
	...jest.requireActual( '@wordpress/element' ),
	useEffect: jest.fn( cb => cb() ), // Execute the callback immediately
} ) );

describe( 'helpers', () => {
	describe( 'DashboardLink', () => {
		const testHref = 'https://example.com';
		const testText = 'Click me';
		const testEventName = 'test_click';
		const mockRecordEvent = jest.fn();

		beforeEach( () => {
			( useAnalytics as jest.Mock ).mockReturnValue( {
				tracks: { recordEvent: mockRecordEvent },
			} );
			mockRecordEvent.mockClear();
		} );

		it( 'renders as a regular anchor tag for links that stay within the platform', () => {
			const link = DashboardLink( true, testHref, testEventName, testText );
			expect( link.type ).toBe( 'a' );
			expect( link.props.href ).toBe( testHref );
			expect( link.props.children ).toBe( testText );
		} );

		it( 'renders as ExternalLink for links that point to external resources', () => {
			const link = DashboardLink( false, testHref, testEventName, testText );
			expect( link.type ).toBe( ExternalLink );
			expect( link.props.href ).toBe( testHref );
			expect( link.props.children ).toBe( testText );
		} );

		it( 'handles not being passed a text prop', () => {
			const link = DashboardLink( true, testHref, testEventName );
			expect( link.props.children ).toBeUndefined();
		} );

		it( 'sets up click tracking with the provided event name', () => {
			const link = DashboardLink( true, testHref, testEventName, testText );
			expect( link.props.onClick ).toBeDefined();

			// Clear any previous calls (like the view event)
			mockRecordEvent.mockClear();

			// Simulate clicking the link
			link.props.onClick();

			// Verify that the tracking event was recorded with empty object as second parameter
			expect( mockRecordEvent ).toHaveBeenCalledWith(
				`${ TRACKS_EVENT_NAME_PREFIX }${ testEventName }`,
				{}
			);
		} );

		it( 'records view event on mount', () => {
			DashboardLink( true, testHref, testEventName, testText );
			expect( mockRecordEvent ).toHaveBeenCalledWith( `${ TRACKS_EVENT_NAME_PREFIX }_view` );
		} );
	} );

	describe( 'getNewsletterSettingsUrl', () => {
		const testSite = 'example.com';
		const testAdminUrl = 'https://example.com/wp-admin/';

		it( 'returns WordPress.com URL for WordPress.com sites', () => {
			const url = getNewsletterSettingsUrl( testSite, true, testAdminUrl );
			expect( url ).toBe(
				getRedirectUrl( 'https://wordpress.com/settings/newsletter/' + testSite )
			);
		} );

		it( 'returns WP-admin URL for self-hosted sites', () => {
			const url = getNewsletterSettingsUrl( testSite, false, testAdminUrl );
			expect( url ).toBe( `${ testAdminUrl }admin.php?page=jetpack#newsletter` );
		} );
	} );

	describe( 'formatDate', () => {
		const testDate = new Date( '2025-03-01' );

		it( 'formats date in short format by default', () => {
			const formatted = formatDate( testDate );

			// Test for parts of the string rather than the exact string to handle locale differences
			expect( formatted ).toContain( 'Mar' );
			expect( formatted ).toContain( '1' );
			expect( formatted ).not.toContain( '2025' );
		} );

		it( 'formats date in full format when specified', () => {
			const formatted = formatDate( testDate, 'full' );

			expect( formatted ).toContain( 'Mar' );
			expect( formatted ).toContain( '1' );
			expect( formatted ).toContain( '2025' );
		} );
	} );

	describe( 'formatAxisTickDate', () => {
		it( 'formats dates for axis ticks', () => {
			const testDate = new Date( '2025-03-01' );
			const formatted = formatAxisTickDate( testDate );

			expect( formatted ).toBeDefined();
			expect( typeof formatted ).toBe( 'string' );
			expect( formatted ).toContain( 'Mar' );
			expect( formatted ).toContain( '1' );
		} );

		it( 'uses short date format', () => {
			const testDate = new Date( '2025-03-01' );
			const formatted = formatAxisTickDate( testDate );
			const shortFormatted = formatDate( testDate, 'short' );

			expect( formatted ).toEqual( shortFormatted );
		} );
	} );

	describe( 'getXAxisTickValues', () => {
		it( 'returns all dates when there are fewer than 2 data points', () => {
			const data: ChartSubscriptionDataPoint[] = [
				{ date: new Date( '2025-03-05' ), all: 10, paid: 5 },
			];

			const tickValues = getXAxisTickValues( data );
			expect( tickValues ).toHaveLength( 1 );
			expect( tickValues[ 0 ] ).toEqual( data[ 0 ].date );
		} );

		it( 'returns empty array for empty input', () => {
			const tickValues = getXAxisTickValues( [] );
			expect( tickValues ).toEqual( [] );
		} );

		it( 'returns 5 evenly spaced dates across the time range', () => {
			const startDate = new Date( '2025-01-04' );
			const endDate = new Date( '2025-03-05' );

			const data: ChartSubscriptionDataPoint[] = [
				{ date: startDate, all: 10, paid: 5 },
				{ date: endDate, all: 30, paid: 5 },
			];

			const tickValues = getXAxisTickValues( data );

			// Should have 5 tick values
			expect( tickValues ).toHaveLength( 5 );

			// First and last should match the bounds
			expect( tickValues[ 0 ].getTime() ).toEqual( startDate.getTime() );
			expect( tickValues[ 4 ].getTime() ).toEqual( endDate.getTime() );

			expect( tickValues[ 1 ].getTime() ).toBeCloseTo( new Date( '2025-01-19' ).getTime() );
			expect( tickValues[ 2 ].getTime() ).toBeCloseTo( new Date( '2025-02-03' ).getTime() );
			expect( tickValues[ 3 ].getTime() ).toBeCloseTo( new Date( '2025-02-18' ).getTime() );
		} );
	} );

	describe( 'transformData', () => {
		it( 'returns empty array for empty input', () => {
			const transformedData = transformData( {} );
			expect( transformedData ).toEqual( [] );
		} );

		it( 'sorts data by date', () => {
			const countsByDay: SubscriberTotalsByDate = {
				'2025-03-03': { all: 20, paid: 5 },
				'2025-03-01': { all: 10, paid: 5 },
				'2025-03-02': { all: 15, paid: 5 },
			};

			const transformedData = transformData( countsByDay );

			// Should be sorted by date regardless of input order
			expect( transformedData[ 0 ].date ).toEqual( new Date( '2025-03-01' ) );
			expect( transformedData[ 1 ].date ).toEqual( new Date( '2025-03-02' ) );
			expect( transformedData[ 2 ].date ).toEqual( new Date( '2025-03-03' ) );
		} );
	} );

	describe( 'buildJPRedirectSource', () => {
		const testUrl = 'test/path';

		it( 'returns WordPress.com URL for WordPress.com sites', () => {
			const url = buildJPRedirectSource( testUrl, true );
			expect( url ).toBe( 'https://wordpress.com/test/path' );
		} );

		it( 'returns cloud.jetpack.com URL for self-hosted sites', () => {
			const url = buildJPRedirectSource( testUrl, false );
			expect( url ).toBe( 'https://cloud.jetpack.com/test/path' );
		} );

		it( 'defaults to WordPress.com URL when isWpcomSite is not provided', () => {
			const url = buildJPRedirectSource( testUrl );
			expect( url ).toBe( 'https://wordpress.com/test/path' );
		} );
	} );

	describe( 'getSubscriberStatsUrl', () => {
		const testSite = 'example.com';
		const testAdminUrl = 'https://example.com/wp-admin/';

		it( 'returns WordPress.com URL for WordPress.com sites', () => {
			const url = getSubscriberStatsUrl( testSite, true, testAdminUrl );
			expect( url ).toBe( getRedirectUrl( 'https://wordpress.com/stats/subscribers/' + testSite ) );
		} );

		it( 'returns WP-admin URL for self-hosted sites', () => {
			const url = getSubscriberStatsUrl( testSite, false, testAdminUrl );
			expect( url ).toBe(
				`${ testAdminUrl }admin.php?page=stats#!/stats/subscribers/${ testSite }`
			);
		} );
	} );

	describe( 'formatNumber', () => {
		it( 'formats numbers with locale-specific formatting', () => {
			expect( formatNumber( 1234 ) ).toBe( '1,234' );
			expect( formatNumber( 1234567 ) ).toBe( '1,234,567' );
			expect( formatNumber( 0 ) ).toBe( '0' );
		} );
	} );

	describe( 'calcLeftAxisMargin', () => {
		it( 'returns default margin for empty data', () => {
			expect( calcLeftAxisMargin( [] ) ).toBe( 30 ); // DEFAULT_MARGIN
		} );

		it( 'calculates margin based on largest number length', () => {
			const data: ChartSubscriptionDataPoint[] = [
				{ date: new Date(), all: 1000, paid: 100 },
				{ date: new Date(), all: 100, paid: 10000 },
			];
			// For 10000 (5 digits): 5 * 8 + 10 = 50
			expect( calcLeftAxisMargin( data ) ).toBe( 50 );
		} );

		it( 'handles null or undefined values', () => {
			const data: ChartSubscriptionDataPoint[] = [
				{ date: new Date(), all: undefined, paid: null },
				{ date: new Date(), all: 100, paid: undefined },
			];
			// For 100 (3 digits): 3 * 8 + 10 = 34
			expect( calcLeftAxisMargin( data ) ).toBe( 34 );
		} );
	} );
} );

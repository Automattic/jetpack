/**
 * External dependencies
 */
import { useStatsDevices, useStatsSite } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { renderWithActionsHost } from '../../../tests/js/widget-host-test-utils';
import { captureCsvDownloads } from '../../test-utils';
import TopPlatformsWidget from '../render';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsDevices: jest.fn(),
	useStatsSite: jest.fn(),
} ) );

const mockUseStatsDevices = jest.mocked( useStatsDevices );

const REPORT_PARAMS = {
	from: '2026-07-01',
	to: '2026-07-31',
	interval: 'day',
} as unknown as ReportParams;

function platformsResult( rows: unknown[], overrides: Record< string, unknown > = {} ) {
	return {
		primary: { data: {}, isError: false },
		comparisonRows: { rows, hasComparison: false },
		hasComparison: false,
		isLoading: false,
		isFetching: false,
		isError: false,
		error: null,
		refetch: jest.fn(),
		...overrides,
	} as unknown as ReturnType< typeof useStatsDevices >;
}

function renderWidget( platformDimension?: 'browser' | 'platform' ) {
	return renderWithActionsHost(
		<TopPlatformsWidget attributes={ { reportParams: REPORT_PARAMS, platformDimension } } />
	);
}

describe( 'TopPlatformsWidget CSV download', () => {
	let downloads: ReturnType< typeof captureCsvDownloads > | undefined;

	beforeEach( () => {
		jest.useFakeTimers();
		mockUseStatsDevices.mockReset();
		jest.mocked( useStatsSite ).mockReturnValue( {
			isLoading: false,
			isError: false,
			data: undefined,
		} as unknown as ReturnType< typeof useStatsSite > );
	} );

	afterEach( () => {
		downloads?.restore();
		downloads = undefined;
		jest.useRealTimers();
	} );

	it.each( [
		[
			'default browser',
			undefined,
			[ { label: 'chrome', value: 1200 } ],
			'top-browsers-2026-07-01_2026-07-31.csv',
			[ '"Browser","Views"', '"Chrome","1200"' ],
		],
		[
			'operating system',
			'platform' as const,
			[ { label: 'mac', value: 800 } ],
			'top-operating-systems-2026-07-01_2026-07-31.csv',
			[ '"Operating system","Views"', '"macOS","800"' ],
		],
	] )(
		'saves the listed platforms for the %s view',
		async ( _, platformDimension, rows, filename, lines ) => {
			downloads = captureCsvDownloads();
			mockUseStatsDevices.mockReturnValue( platformsResult( rows ) );

			const { findDeclaredAction } = renderWidget( platformDimension );
			await downloads.runAndSave( await findDeclaredAction( 'download-csv' ) );

			expect( downloads.files[ 0 ].filename ).toBe( filename );
			await expect( downloads.lines() ).resolves.toEqual( lines );
		}
	);

	it.each( [
		[ 'no platform recorded a view', platformsResult( [] ) ],
		[
			'a refetch failed behind the rows on screen',
			platformsResult( [ { label: 'chrome', value: 1200 } ], {
				isError: true,
				primary: { data: {}, isError: true },
			} ),
		],
	] )( 'offers no download when %s', ( _, result ) => {
		mockUseStatsDevices.mockReturnValue( result );

		const { declaredAction } = renderWidget();

		expect( declaredAction( 'download-csv' ) ).toBeUndefined();
	} );
} );

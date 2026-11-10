/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { useReportDateFilters } from '@jetpack-premium-analytics/routing';
import { act, renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { useNormalizedReportParams } from '../use-normalized-report-params';
import type { ReactNode } from 'react';

// One object, as the router hands back, so only a real dependency recomputes the memo.
let mockSearch: Record< string, unknown > = {};

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
	useSearch: () => mockSearch,
} ) );

setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

describe( 'useNormalizedReportParams', () => {
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'reads a long range on days when the scope locks the longer buckets', () => {
		mockSearch = { from: '2026-01-01', to: '2026-06-30', interval: 'week' };
		const wrapper = ( { children }: { children: ReactNode } ) => (
			<ReportScopeProvider
				dateLimits={ { lockedPresetIds: [], lockedIntervals: [ 'week', 'month', 'year' ] } }
			>
				{ children }
			</ReportScopeProvider>
		);

		const { result } = renderHook( () => useNormalizedReportParams(), { wrapper } );

		expect( result.current.interval ).toBe( 'day' );
	} );

	it( 'moves a preset to the new day in the widgets and the date controls alike', () => {
		jest.useFakeTimers().setSystemTime( Date.parse( '2026-08-20T23:59:30.000Z' ) );
		mockSearch = {
			from: '2026-08-14T00:00:00.000+00:00',
			to: '2026-08-20T23:59:59.999+00:00',
			preset: 'last-7-days',
			interval: 'day',
		};
		const { result } = renderHook( () => ( {
			widgets: useNormalizedReportParams(),
			controls: useReportDateFilters( '/' ),
		} ) );

		act( () => {
			jest.advanceTimersByTime( 60 * 1000 );
		} );

		expect( result.current.widgets ).toMatchObject( {
			from: '2026-08-15T00:00:00.000+00:00',
			to: '2026-08-21T23:59:59.999+00:00',
		} );
		expect( result.current.controls.appliedRange.from?.getTime() ).toBe(
			Date.parse( '2026-08-15T00:00:00.000Z' )
		);
		expect( result.current.controls.appliedRange.to?.getTime() ).toBe(
			Date.parse( '2026-08-21T23:59:59.999Z' )
		);
	} );
} );

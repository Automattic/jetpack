/**
 * External dependencies
 */
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { renderHook } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import { WidgetRootContext } from '../../components/widget-root';
import { useOpenChartBucket } from '../use-open-chart-bucket';
import type { ClickedBucket } from '../../components/metric-tabs-chart/metric-tabs-chart';
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

const OCTOBER = {
	from: '2026-10-01T00:00:00',
	to: '2026-10-31T23:59:59',
	interval: 'week',
	compare_from: '2026-09-01T00:00:00',
	compare_to: '2026-09-30T23:59:59',
} as ReportParams;

// A store week, cut Sunday to Saturday where an ISO week runs Monday to Sunday.
const SUNDAY = new Date( '2026-10-18T00:00:00Z' );
const SATURDAY_END = new Date( '2026-10-24T23:59:59Z' );

function renderOpenChartBucket( initialParams: ReportParams ) {
	const openPeriod = jest.fn();
	let reportParams = initialParams;

	function wrapper( { children }: { children: ReactNode } ) {
		return (
			<ReportScopeProvider openPeriod={ openPeriod }>
				<WidgetRootContext.Provider value={ { reportParams } }>
					{ children }
				</WidgetRootContext.Provider>
			</ReportScopeProvider>
		);
	}

	const view = renderHook( () => useOpenChartBucket( 'week' ), { wrapper } );
	const setReportParams = ( params: ReportParams ) => {
		reportParams = params;
		view.rerender();
	};

	return {
		openPeriod,
		setReportParams,
		click: ( clicked: ClickedBucket ) => view.result.current?.( clicked ),
	};
}

describe( 'useOpenChartBucket', () => {
	it( 'opens the week the report stated, not the ISO week holding the date', () => {
		const { openPeriod, click } = renderOpenChartBucket( OCTOBER );

		click( { date: SUNDAY, endDate: SATURDAY_END, isComparison: false } );

		expect( openPeriod ).toHaveBeenCalledWith( {
			from: new Date( '2026-10-18T00:00:00.000Z' ),
			to: new Date( '2026-10-24T23:59:59.999Z' ),
		} );
	} );

	it( 'cuts the bucket to the window of the current period after the period changes', () => {
		const { openPeriod, setReportParams, click } = renderOpenChartBucket( OCTOBER );

		setReportParams( { ...OCTOBER, from: '2026-10-20T00:00:00' } );
		click( { date: SUNDAY, endDate: SATURDAY_END, isComparison: false } );

		expect( openPeriod ).toHaveBeenCalledWith( {
			from: new Date( '2026-10-20T00:00:00.000Z' ),
			to: new Date( '2026-10-24T23:59:59.999Z' ),
		} );
	} );

	// The store week of Sep 27 runs into October, so the window it is cut to shows which period opened it.
	it.each( [
		[
			'cuts a previous-period bucket to the comparison range',
			true,
			{ from: '2026-09-27T00:00:00.000Z', to: '2026-09-30T23:59:59.000Z' },
		],
		[
			'cuts a current-period bucket to the report range',
			false,
			{ from: '2026-10-01T00:00:00.000Z', to: '2026-10-03T23:59:59.999Z' },
		],
	] )( '%s', ( _label, isComparison, expected ) => {
		const { openPeriod, click } = renderOpenChartBucket( OCTOBER );

		click( {
			date: new Date( '2026-09-27T00:00:00Z' ),
			endDate: new Date( '2026-10-03T23:59:59Z' ),
			isComparison,
		} );

		expect( openPeriod ).toHaveBeenCalledWith( {
			from: new Date( expected.from ),
			to: new Date( expected.to ),
		} );
	} );
} );

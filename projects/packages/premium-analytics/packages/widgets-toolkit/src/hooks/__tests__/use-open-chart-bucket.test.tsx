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
import type { ReportParams } from '@jetpack-premium-analytics/data';
import type { ReactNode } from 'react';

setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

const OCTOBER = { from: '2026-10-01', to: '2026-10-31', interval: 'week' } as ReportParams;

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
		click: ( ...args: [ Date, Date? ] ) => view.result.current?.( ...args ),
	};
}

describe( 'useOpenChartBucket', () => {
	it( 'opens the week the report stated, not the ISO week holding the date', () => {
		const { openPeriod, click } = renderOpenChartBucket( OCTOBER );

		click( SUNDAY, SATURDAY_END );

		expect( openPeriod ).toHaveBeenCalledWith( {
			from: new Date( '2026-10-18T00:00:00.000Z' ),
			to: new Date( '2026-10-24T23:59:59.999Z' ),
		} );
	} );

	it( 'cuts the bucket to the window of the current period after the period changes', () => {
		const { openPeriod, setReportParams, click } = renderOpenChartBucket( OCTOBER );

		setReportParams( { ...OCTOBER, from: '2026-10-20' } );
		click( SUNDAY, SATURDAY_END );

		expect( openPeriod ).toHaveBeenCalledWith( {
			from: new Date( '2026-10-20T00:00:00.000Z' ),
			to: new Date( '2026-10-24T23:59:59.999Z' ),
		} );
	} );
} );

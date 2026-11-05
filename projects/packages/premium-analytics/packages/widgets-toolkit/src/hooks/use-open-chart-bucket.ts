/**
 * External dependencies
 */
import { useReportScope } from '@jetpack-premium-analytics/data';
import {
	parseSiteDateTime,
	reportingTimeZone,
	type IntervalType,
} from '@jetpack-premium-analytics/datetime';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../components/widget-root/context';
import { bucketRange } from '../helpers/period-range';

/**
 * Opens the chart bucket holding a date as the surface's period, cut to the widget's report window.
 *
 * @param interval - The bucket size the chart draws, which may differ from the saved one.
 * @return The `MetricTabsChart` `onDatumClick` handler, or undefined where the host sets no period.
 */
export function useOpenChartBucket( interval: IntervalType ) {
	const { reportParams } = useWidgetRootContext();
	const { openPeriod } = useReportScope();

	return useMemo( () => {
		if ( ! openPeriod ) {
			return undefined;
		}

		const window = {
			from: parseSiteDateTime( reportParams.from ),
			to: parseSiteDateTime( reportParams.to ),
		};

		return ( date: Date ) => {
			const range = bucketRange( date, interval, window, { timeZone: reportingTimeZone() } );

			if ( range ) {
				openPeriod( range );
			}
		};
	}, [ openPeriod, interval, reportParams.from, reportParams.to ] );
}

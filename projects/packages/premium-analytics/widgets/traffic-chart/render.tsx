/**
 * External dependencies
 */
import {
	MetricTabsChart,
	WidgetRoot,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './traffic-chart.module.css';
import useTrafficChart from './use-traffic-chart';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const DATA_FORMAT = {
	type: 'number' as const,
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * Traffic chart inner component. Reads the dashboard report params and hands the
 * per-metric tabs (Views, Visitors, Likes, Comments) to the shared
 * `MetricTabsChart`.
 *
 * @return The widget body.
 */
function TrafficChartInner() {
	const { reportParams } = useWidgetRootContext();
	const { metrics, isFetching, isError } = useTrafficChart( reportParams );

	if ( isError ) {
		return (
			<div className={ styles.root }>
				<Text>{ __( 'Unable to load traffic.', 'jetpack-premium-analytics' ) }</Text>
			</div>
		);
	}

	return (
		<div className={ styles.root }>
			<MetricTabsChart
				metrics={ metrics }
				dataFormat={ DATA_FORMAT }
				loading={ isFetching }
				groupLabel={ __( 'Traffic metric', 'jetpack-premium-analytics' ) }
			/>
		</div>
	);
}

/**
 * Widget render entry point.
 *
 * `WidgetRoot` provides the analytics query client and resolves the dashboard's
 * report params (date range + comparison); the inner component reads them from
 * context and fetches the traffic series.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes; the date range/comparison arrive here from the host.
 * @return The rendered widget.
 */
export default function TrafficChart( {
	attributes = {},
}: WidgetRenderProps< Partial< ReportParamsFieldAttributes > > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TrafficChartInner />
		</WidgetRoot>
	);
}

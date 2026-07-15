/**
 * External dependencies
 */
import { useReportVisitors } from '@jetpack-premium-analytics/data';
import {
	ReportMetricWidget,
	useWidgetRootContext,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';

/**
 * Visitor metric widget component.
 *
 * Fetches and displays visitor trends for the report params provided by the
 * shared WidgetRoot.
 */
export function VisitorMetricWidget() {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricWidget
			metricKey="visitors"
			data={ useReportVisitors( reportParams ) }
			dataFormat={ {
				type: 'number',
				options: { useMultipliers: true, decimals: 0 },
			} }
			emptyStateText={ __( 'No visitors in this period.', 'jetpack-premium-analytics' ) }
			errorText={ __(
				"We couldn't load visitors. Please try again in a moment.",
				'jetpack-premium-analytics'
			) }
		/>
	);
}

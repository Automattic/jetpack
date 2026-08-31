/**
 * External dependencies
 */
import { useReportVisitors } from '@jetpack-premium-analytics/data';
import {
	ReportMetricWidget,
	useWidgetRootContext,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';

export function VisitorMetricWidget() {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricWidget
			metricKey="visitors"
			seriesLabel={ __( 'Visitors', 'jetpack-premium-analytics-pkg' ) }
			data={ useReportVisitors( reportParams ) }
			dataFormat={ {
				type: 'number',
				options: { useMultipliers: true, decimals: 0 },
			} }
			emptyStateText={ __( 'No visitors in this period.', 'jetpack-premium-analytics-pkg' ) }
			errorText={ __(
				"We couldn't load visitors. Please try again in a moment.",
				'jetpack-premium-analytics-pkg'
			) }
		/>
	);
}

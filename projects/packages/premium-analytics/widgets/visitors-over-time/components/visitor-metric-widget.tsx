/**
 * External dependencies
 */
import { useReportVisitors } from '@jetpack-premium-analytics/data';
import {
	ReportMetricWidget,
	useWidgetRootContext,
	type CountLabel,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, _n } from '@wordpress/i18n';

const visitorsCountLabel: CountLabel = count =>
	/* translators: %s: number of visitors. */
	_n( '%s visitor', '%s visitors', count, 'jetpack-premium-analytics-pkg' );

export function VisitorMetricWidget() {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricWidget
			metricKey="visitors"
			seriesLabel={ __( 'Visitors', 'jetpack-premium-analytics-pkg' ) }
			seriesCountLabel={ visitorsCountLabel }
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

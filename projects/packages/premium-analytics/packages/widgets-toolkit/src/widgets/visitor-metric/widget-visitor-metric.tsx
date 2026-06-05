/**
 * External dependencies
 */
import { useReportVisitors } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { ReportMetricWidget } from '../../components/report-metric';
import { useWidgetRootContext } from '../../components/widget-root';

/**
 * Visitor Metric Widget Component
 *
 * A widget that displays visitor metrics over time with comparison support.
 * This component must be used within a WidgetRoot which provides reportParams
 * via context.
 *
 * @example
 * ```tsx
 * <WidgetRoot attributes={ attributes }>
 *     <VisitorMetricWidget />
 * </WidgetRoot>
 * ```
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
		/>
	);
}

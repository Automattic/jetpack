/**
 * External dependencies
 */
import { useReportOrders } from '@jetpack-premium-analytics/data';
/**
 * Internal dependencies
 */
import { ReportMetricWidget } from '../../components/report-metric';
import { useWidgetRootContext } from '../../components/widget-root';
import { getFormatByMetricKey } from '../../helpers';
import type { OrderMetricKey } from '../../types';

export type OrderMetricWidgetProps = {
	metricKey: OrderMetricKey;

	emptyStateText?: string;

	errorText?: string;

	/** The metric's name, for the chart legend. */
	seriesLabel?: string;
};

/**
 * Order-related metrics over time, with comparison support.
 *
 * Must render within a WidgetRoot, which provides reportParams via context.
 */
export function OrderMetricWidget( {
	metricKey,
	emptyStateText,
	errorText,
	seriesLabel,
}: OrderMetricWidgetProps ) {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricWidget
			metricKey={ metricKey }
			data={ useReportOrders( reportParams ) }
			dataFormat={ getFormatByMetricKey( metricKey ) }
			emptyStateText={ emptyStateText }
			errorText={ errorText }
			seriesLabel={ seriesLabel }
		/>
	);
}

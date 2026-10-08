/**
 * External dependencies
 */
import {
	useWidgetRootContext,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { ReportMetricChart } from '../../src/components/report-metric-chart';
import { useReportOrders } from '../../src/reports';
import type { GrossSalesOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type GrossSalesOverTimeRenderAttributes = GrossSalesOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Gross sales of the orders report, read under the widget root for its report params.
 *
 * @return {JSX.Element} The chart.
 */
function GrossSalesOverTime() {
	const { reportParams } = useWidgetRootContext();

	return (
		<ReportMetricChart
			report={ useReportOrders( reportParams ) }
			field="orders_value_gross"
			label={ __( 'Gross sales', 'jetpack-woocommerce-stats-pkg' ) }
			dataFormat={ { type: 'currency' } }
			emptyText={ __( 'No sales in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load gross sales. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * The Gross sales over time widget.
 *
 * @param {WidgetRenderProps< GrossSalesOverTimeRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function GrossSalesOverTimeRender( {
	attributes = {},
}: WidgetRenderProps< GrossSalesOverTimeRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<GrossSalesOverTime />
		</WidgetRoot>
	);
}

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
import { ReportExecutionCard } from '../../src/components/report-execution-card';
import { useExecutedReport } from '../../src/reports/hooks/use-executed-report';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

export type PrototypeOrdersLocalAttributes = Record< never, never >;

type PrototypeOrdersLocalRenderAttributes = PrototypeOrdersLocalAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * `orders/by-date` with `execution=local`, read under the widget root for its report params.
 *
 * @return {JSX.Element} The card.
 */
function PrototypeOrdersLocal() {
	const { reportParams } = useWidgetRootContext();
	const report = useExecutedReport( reportParams, {
		route: 'orders/by-date',
		execution: 'local',
		send: [ 'from', 'to', 'interval' ],
		fields: [ 'orders_no', 'orders_value_net', 'total_sales', 'average_order_value' ],
	} );

	return (
		<ReportExecutionCard
			report={ report }
			metrics={ [
				{ field: 'orders_no', label: __( 'Orders', 'jetpack-woocommerce-stats-pkg' ) },
				{
					field: 'orders_value_net',
					label: __( 'Net sales', 'jetpack-woocommerce-stats-pkg' ),
					format: 'currency',
				},
				{
					field: 'total_sales',
					label: __( 'Total sales', 'jetpack-woocommerce-stats-pkg' ),
					format: 'currency',
				},
				{
					field: 'average_order_value',
					label: __( 'Average order value', 'jetpack-woocommerce-stats-pkg' ),
					format: 'currency',
				},
				{ field: 'paid_orders_count', label: __( 'Paid orders', 'jetpack-woocommerce-stats-pkg' ) },
				{
					field: 'profit_margin',
					label: __( 'Profit margin', 'jetpack-woocommerce-stats-pkg' ),
					format: 'currency',
				},
			] }
		/>
	);
}

/**
 * The Orders (local) prototype widget.
 *
 * @param {WidgetRenderProps< PrototypeOrdersLocalRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function PrototypeOrdersLocalRender( {
	attributes = {},
}: WidgetRenderProps< PrototypeOrdersLocalRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PrototypeOrdersLocal />
		</WidgetRoot>
	);
}

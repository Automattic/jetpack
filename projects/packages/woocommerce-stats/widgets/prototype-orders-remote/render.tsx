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

export type PrototypeOrdersRemoteAttributes = Record< never, never >;

type PrototypeOrdersRemoteRenderAttributes = PrototypeOrdersRemoteAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * `orders/by-date` with `execution=remote`, read under the widget root for its report params.
 *
 * @return {JSX.Element} The card.
 */
function PrototypeOrdersRemote() {
	const { reportParams } = useWidgetRootContext();
	const report = useExecutedReport( reportParams, {
		route: 'orders/by-date',
		execution: 'remote',
		send: [ 'from', 'to', 'interval' ],
		fields: [
			'orders_no',
			'orders_value_net',
			'total_sales',
			'average_order_value',
			'paid_orders_count',
			'profit_margin',
		],
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
 * The Orders (remote) prototype widget.
 *
 * @param {WidgetRenderProps< PrototypeOrdersRemoteRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function PrototypeOrdersRemoteRender( {
	attributes = {},
}: WidgetRenderProps< PrototypeOrdersRemoteRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PrototypeOrdersRemote />
		</WidgetRoot>
	);
}

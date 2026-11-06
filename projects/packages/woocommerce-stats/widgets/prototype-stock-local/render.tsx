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
import type { ReportExecution } from '../../src/reports/fetch-report';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * @property execution - The provider to force. Defaults to `auto`.
 */
export type PrototypeStockLocalAttributes = {
	execution?: ReportExecution;
};

type PrototypeStockLocalRenderAttributes = PrototypeStockLocalAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * `stock.summary` with the `execution` attribute, read under the widget root for its report params.
 *
 * @param {object}          props             - The component props.
 * @param {ReportExecution} [props.execution] - The provider to force.
 * @return {JSX.Element} The card.
 */
function PrototypeStockLocal( { execution = 'auto' }: { execution?: ReportExecution } ) {
	const { reportParams } = useWidgetRootContext();
	const report = useExecutedReport( reportParams, {
		route: 'stock.summary',
		execution,
		send: [],
		fields: [ 'products', 'instock', 'lowstock', 'outofstock', 'onbackorder' ],
	} );

	return (
		<ReportExecutionCard
			report={ report }
			metrics={ [
				{ field: 'products', label: __( 'Products', 'jetpack-woocommerce-stats-pkg' ) },
				{ field: 'instock', label: __( 'In stock', 'jetpack-woocommerce-stats-pkg' ) },
				{ field: 'lowstock', label: __( 'Low stock', 'jetpack-woocommerce-stats-pkg' ) },
				{ field: 'outofstock', label: __( 'Out of stock', 'jetpack-woocommerce-stats-pkg' ) },
				{ field: 'onbackorder', label: __( 'On backorder', 'jetpack-woocommerce-stats-pkg' ) },
			] }
		/>
	);
}

/**
 * The Stock (local only) prototype widget.
 *
 * @param {WidgetRenderProps< PrototypeStockLocalRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function PrototypeStockLocalRender( {
	attributes = {},
}: WidgetRenderProps< PrototypeStockLocalRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PrototypeStockLocal execution={ attributes.execution } />
		</WidgetRoot>
	);
}

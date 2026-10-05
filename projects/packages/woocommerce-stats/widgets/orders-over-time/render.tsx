/**
 * External dependencies
 */
import {
	ReportCsvDownloadButton,
	ReportMetricWidget,
	useWidgetRootContext,
	WidgetFooter,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __, _n } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { useOrdersReport } from './use-orders-report';
import type { OrdersOverTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

type OrdersOverTimeRenderAttributes = OrdersOverTimeAttributes &
	Partial< ReportParamsFieldAttributes >;

type OrdersOverTimeWidgetProps = WidgetRenderProps< OrdersOverTimeRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

const ORDERS_FORMAT = { type: 'number' as const };

const ordersCountLabel = ( count: number ) =>
	/* translators: %s: number of orders. */
	_n( '%s Order', '%s Orders', count, 'jetpack-woocommerce-stats-pkg' );

/**
 * Order count over the host's date range.
 */
function OrdersOverTimeReport() {
	const { reportParams } = useWidgetRootContext();
	const report = useOrdersReport( reportParams );

	return (
		<ReportMetricWidget
			metricKey="orders_no"
			data={ report }
			dataFormat={ ORDERS_FORMAT }
			seriesLabel={ __( 'Orders', 'jetpack-woocommerce-stats-pkg' ) }
			seriesCountLabel={ ordersCountLabel }
			emptyStateText={ __( 'No orders in this period.', 'jetpack-woocommerce-stats-pkg' ) }
			errorText={ __(
				"We couldn't load orders. Please try again in a moment.",
				'jetpack-woocommerce-stats-pkg'
			) }
		/>
	);
}

/**
 * Orders over time.
 *
 * @param props            - Host props.
 * @param props.attributes - Widget attributes, including report params when the host passes them.
 * @param props.setError   - Host error setter.
 */
export default function OrdersOverTimeRender( {
	attributes = {},
	setError,
}: OrdersOverTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<div className={ styles.root }>
				<OrdersOverTimeReport />
				<WidgetFooter>
					<ReportCsvDownloadButton reportType="ordersovertime" />
				</WidgetFooter>
			</div>
		</WidgetRoot>
	);
}

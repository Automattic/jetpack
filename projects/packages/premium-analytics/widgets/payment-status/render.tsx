/**
 * External dependencies
 */
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';
/**
 * Internal dependencies
 */
import { PaymentStatusWidget } from './payment-status-widget';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

type PaymentStatusRenderProps = Pick< WidgetRootProps, 'attributes' > & {
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * Payment status widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client,
 * chart theme, and resolved report params; PaymentStatusWidget renders the
 * paid vs unpaid order revenue donut chart.
 */
export default function PaymentStatusRender( { attributes, setError }: PaymentStatusRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<PaymentStatusWidget />
		</WidgetRoot>
	);
}

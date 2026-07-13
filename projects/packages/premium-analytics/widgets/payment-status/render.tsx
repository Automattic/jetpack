/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import { PaymentStatusWidget } from './payment-status-widget';
import type { PaymentStatusAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type PaymentStatusRenderAttributes = PaymentStatusAttributes &
	Partial< ReportParamsFieldAttributes >;

type PaymentStatusWidgetProps = WidgetRenderProps< PaymentStatusRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Payment status widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client,
 * chart theme, and resolved report params; PaymentStatusWidget renders the
 * paid vs unpaid order revenue donut chart.
 *
 * @param {PaymentStatusWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PaymentStatusRender( {
	attributes = {},
	setError,
}: PaymentStatusWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<PaymentStatusWidget />
		</WidgetRoot>
	);
}

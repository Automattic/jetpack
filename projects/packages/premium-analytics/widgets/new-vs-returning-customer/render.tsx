/**
 * External dependencies
 */
import {
	NewVsReturningCustomerWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { NewVsReturningCustomerAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type NewVsReturningCustomerRenderAttributes = NewVsReturningCustomerAttributes &
	Partial< ReportParamsFieldAttributes >;

type NewVsReturningCustomerWidgetProps =
	WidgetRenderProps< NewVsReturningCustomerRenderAttributes > & {
		setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
	};

/**
 * New vs returning customer widget.
 *
 * Thin composition over WidgetRoot: WidgetRoot provides the query client, chart
 * theme, and resolved report params; NewVsReturningCustomerWidget renders the
 * customer breakdown donut chart.
 *
 * @param {NewVsReturningCustomerWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function NewVsReturningCustomerRender( {
	attributes = {},
	setError,
}: NewVsReturningCustomerWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<NewVsReturningCustomerWidget />
		</WidgetRoot>
	);
}

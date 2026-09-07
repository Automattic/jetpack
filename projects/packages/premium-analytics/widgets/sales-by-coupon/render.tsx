/**
 * External dependencies
 */
import {
	SalesByCouponWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { SalesByCouponAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByCouponRenderAttributes = SalesByCouponAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByCouponWidgetProps = WidgetRenderProps< SalesByCouponRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

export default function SalesByCouponRender( {
	attributes = {},
	setError,
}: SalesByCouponWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByCouponWidget />
		</WidgetRoot>
	);
}

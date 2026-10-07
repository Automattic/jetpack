/**
 * External dependencies
 */
import {
	SalesByCouponWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { SalesByCouponUsageAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByCouponUsageRenderAttributes = SalesByCouponUsageAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByCouponUsageWidgetProps = WidgetRenderProps< SalesByCouponUsageRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

export default function SalesByCouponUsageRender( {
	attributes = {},
	setError,
}: SalesByCouponUsageWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByCouponWidget
				chartTitle={ __( 'Sales by coupon usage', 'jetpack-premium-analytics-pkg' ) }
			/>
		</WidgetRoot>
	);
}

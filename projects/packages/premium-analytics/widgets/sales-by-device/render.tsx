/**
 * External dependencies
 */
import {
	SalesByDeviceWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { SalesByDeviceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type SalesByDeviceRenderAttributes = SalesByDeviceAttributes &
	Partial< ReportParamsFieldAttributes >;

type SalesByDeviceWidgetProps = WidgetRenderProps< SalesByDeviceRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by device widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByDeviceWidget fetches
 * the order-attribution report and renders the device revenue breakdown.
 *
 * @param {SalesByDeviceWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function SalesByDeviceRender( {
	attributes = {},
	setError,
}: SalesByDeviceWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByDeviceWidget />
		</WidgetRoot>
	);
}

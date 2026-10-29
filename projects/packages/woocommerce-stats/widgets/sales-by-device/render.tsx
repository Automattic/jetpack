/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { SalesByDevice } from '../../src/components/sales-by-device';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type SalesByDeviceAttributes = Record< never, never >;

type SalesByDeviceRenderAttributes = SalesByDeviceAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * The Sales by device widget.
 *
 * @param {WidgetRenderProps< SalesByDeviceRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function SalesByDeviceRender( {
	attributes = {},
}: WidgetRenderProps< SalesByDeviceRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SalesByDevice chartTitle={ __( 'Sales by device', 'jetpack-woocommerce-stats-pkg' ) } />
		</WidgetRoot>
	);
}

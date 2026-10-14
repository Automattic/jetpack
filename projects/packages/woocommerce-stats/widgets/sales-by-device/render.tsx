/**
 * External dependencies
 */
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
/**
 * Internal dependencies
 */
import { SalesByDevice } from '../../src/components/sales-by-device';
import type { SalesByDeviceAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

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
			<SalesByDevice />
		</WidgetRoot>
	);
}

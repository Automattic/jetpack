import {
	RevenueByCustomerTypeWidget,
	WidgetRoot,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

type RevenueByCustomerTypeRenderProps = {
	attributes?: WidgetRootProps[ 'attributes' ];
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * Revenue by customer type widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; RevenueByCustomerTypeWidget
 * fetches the customers report and renders the revenue breakdown.
 */
export default function RevenueByCustomerTypeRender( {
	attributes,
	setError,
}: RevenueByCustomerTypeRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<RevenueByCustomerTypeWidget />
		</WidgetRoot>
	);
}

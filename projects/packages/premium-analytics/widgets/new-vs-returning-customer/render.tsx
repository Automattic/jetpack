import {
	NewVsReturningCustomerWidget,
	WidgetRoot,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type WidgetRootProps = ComponentProps< typeof WidgetRoot >;

export type NewVsReturningCustomerRenderProps = {
	attributes?: WidgetRootProps[ 'attributes' ];
	setError?: WidgetRootProps[ 'setError' ];
};

/**
 * New vs returning customer widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; NewVsReturningCustomerWidget
 * renders the customer breakdown donut chart.
 *
 * @param props            - Dashboard render props.
 * @param props.attributes - Widget attributes from the dashboard.
 * @param props.setError   - Dashboard error callback.
 * @return Widget render output.
 */
export default function NewVsReturningCustomerRender( props: NewVsReturningCustomerRenderProps ) {
	const { attributes, setError } = props;

	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<NewVsReturningCustomerWidget />
		</WidgetRoot>
	);
}

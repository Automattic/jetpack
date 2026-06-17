import {
	SalesByUtmWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { ComponentProps } from 'react';

type SalesByUtmCampaignRenderProps = Pick< ComponentProps< typeof WidgetRoot >, 'attributes' > & {
	attributes?: Partial< ReportParamsFieldAttributes >;
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Sales by UTM campaign widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; SalesByUtmWidget fetches
 * the order-attribution report and renders the campaign leaderboard.
 *
 * @param root0            - Render props from the widget dashboard.
 * @param root0.attributes - Widget attributes, including report params.
 * @param root0.setError   - Dashboard error reporter.
 * @return The rendered widget.
 */
export default function SalesByUtmCampaignRender( {
	attributes,
	setError,
}: SalesByUtmCampaignRenderProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<SalesByUtmWidget view="campaign" />
		</WidgetRoot>
	);
}

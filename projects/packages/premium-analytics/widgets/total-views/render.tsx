/**
 * External dependencies
 */
import {
	StatsTotalMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { TotalViewsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but the host
// and Storybook may also pass them via `attributes`.
type TotalViewsRenderAttributes = TotalViewsAttributes & Partial< ReportParamsFieldAttributes >;

type TotalViewsWidgetProps = WidgetRenderProps< TotalViewsRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Total views widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report params;
 * the shared StatsTotalMetricWidget fetches the report and renders the card.
 *
 * @param {TotalViewsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TotalViewsRender( { attributes = {}, setError }: TotalViewsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<StatsTotalMetricWidget
				field="views"
				emptyIcon={ seen }
				emptyDescription={ __( 'No views in this period.', 'jetpack-premium-analytics-pkg' ) }
				retryDescription={ __(
					"We couldn't load your views. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				) }
			/>
		</WidgetRoot>
	);
}

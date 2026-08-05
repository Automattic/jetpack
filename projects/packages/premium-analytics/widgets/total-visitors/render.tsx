/**
 * External dependencies
 */
import {
	StatsTotalMetricWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import type { TotalVisitorsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but the host
// and Storybook may also pass them via `attributes`.
type TotalVisitorsRenderAttributes = TotalVisitorsAttributes &
	Partial< ReportParamsFieldAttributes >;

type TotalVisitorsWidgetProps = WidgetRenderProps< TotalVisitorsRenderAttributes > & {
	setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
};

/**
 * Total visitors widget.
 *
 * WidgetRoot provides the query client, chart theme, and resolved report
 * params; the shared StatsTotalMetricWidget fetches the traffic report and
 * renders the total with its sparkline.
 *
 * @param {TotalVisitorsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TotalVisitorsRender( {
	attributes = {},
	setError,
}: TotalVisitorsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError }>
			<StatsTotalMetricWidget
				field="visitors"
				emptyIcon={ people }
				emptyDescription={ __( 'No visitors in this period.', 'jetpack-premium-analytics-pkg' ) }
				retryDescription={ __(
					"We couldn't load your visitors. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				) }
			/>
		</WidgetRoot>
	);
}

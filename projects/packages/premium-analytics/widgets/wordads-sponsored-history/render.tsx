/**
 * External dependencies
 */
import {
	WidgetRoot,
	WordAdsEarningsHistoryWidget,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { WordAdsSponsoredHistoryAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the earnings
// endpoint ignores them, but WidgetRoot still expects them on `attributes`.
type RenderAttributes = WordAdsSponsoredHistoryAttributes & Partial< ReportParamsFieldAttributes >;
type WordAdsSponsoredHistoryProps = WidgetRenderProps< RenderAttributes >;

/**
 * WordAds "Sponsored Content History" widget. WidgetRoot provides the query
 * client and report-param context; the shared component renders the
 * `sponsored` breakdown.
 *
 * @param {WordAdsSponsoredHistoryProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function WordAdsSponsoredHistory( {
	attributes = {},
}: WordAdsSponsoredHistoryProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsEarningsHistoryWidget breakdown="sponsored" />
		</WidgetRoot>
	);
}

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
import type { WordAdsEarningsHistoryAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the earnings
// endpoint ignores them, but WidgetRoot still expects them on `attributes`.
type RenderAttributes = WordAdsEarningsHistoryAttributes & Partial< ReportParamsFieldAttributes >;
type WordAdsEarningsHistoryProps = WidgetRenderProps< RenderAttributes >;

/**
 * WordAds "Earnings History" widget. WidgetRoot provides the query client and
 * report-param context; the shared component renders the `wordads` breakdown.
 *
 * @param {WordAdsEarningsHistoryProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function WordAdsEarningsHistory( { attributes = {} }: WordAdsEarningsHistoryProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsEarningsHistoryWidget breakdown="wordads" />
		</WidgetRoot>
	);
}

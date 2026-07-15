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
import type { WordAdsAdjustmentsHistoryAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the earnings
// endpoint ignores them, but WidgetRoot still expects them on `attributes`.
type RenderAttributes = WordAdsAdjustmentsHistoryAttributes &
	Partial< ReportParamsFieldAttributes >;
type WordAdsAdjustmentsHistoryProps = WidgetRenderProps< RenderAttributes >;

/**
 * WordAds "Adjustments History" widget. WidgetRoot provides the query
 * client and report-param context; the shared component renders the
 * `adjustment` breakdown.
 *
 * @param {WordAdsAdjustmentsHistoryProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function WordAdsAdjustmentsHistory( {
	attributes = {},
}: WordAdsAdjustmentsHistoryProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsEarningsHistoryWidget breakdown="adjustment" />
		</WidgetRoot>
	);
}

/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import {
	EARNINGS_HISTORY_VIEW,
	WidgetDataTable,
	WidgetRoot,
	WidgetState,
	flattenEarningsBreakdown,
	getWordAdsHistoryFields,
	type EarningsHistoryRow,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
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

const getRowId = ( item: EarningsHistoryRow ) => item.id;

/**
 * Fetches WordAds earnings and renders the `adjustment` breakdown as a history
 * table. The earnings module is not period-scoped, so nothing is read from
 * report params. Ported from the `earningsTable()` helper on the Jetpack Stats
 * WordAds page (wp-calypso client/my-sites/stats/wordads/earnings.jsx).
 *
 * @return The widget content.
 */
function WordAdsAdjustmentsHistoryReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsWordAdsEarnings();

	const rows = useMemo( () => flattenEarningsBreakdown( data?.adjustment ), [ data ] );
	const fields = useMemo( () => getWordAdsHistoryFields(), [] );

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
			isEmpty={ rows.length === 0 }
			error={ {
				description: __(
					"We couldn't load WordAds earnings. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				description: __( 'No earnings adjustments to show yet.', 'jetpack-premium-analytics-pkg' ),
			} }
		>
			<WidgetDataTable< EarningsHistoryRow >
				data={ rows }
				fields={ fields }
				getItemId={ getRowId }
				initialView={ EARNINGS_HISTORY_VIEW }
			/>
		</WidgetState>
	);
}

/**
 * WordAds "Adjustments History" widget. WidgetRoot provides the query client and
 * report-param context; the inner report renders the `adjustment` breakdown.
 *
 * @param {WordAdsAdjustmentsHistoryProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function WordAdsAdjustmentsHistory( {
	attributes = {},
}: WordAdsAdjustmentsHistoryProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsAdjustmentsHistoryReport />
		</WidgetRoot>
	);
}

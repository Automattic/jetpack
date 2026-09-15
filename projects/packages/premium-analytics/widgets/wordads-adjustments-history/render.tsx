/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import {
	EarningsHistoryList,
	WidgetRoot,
	WidgetState,
	flattenEarningsBreakdown,
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

/**
 * Fetches WordAds earnings and renders the `adjustment` breakdown as a history
 * list. The earnings module is not period-scoped, so nothing is read from
 * report params. Ported from the `earningsTable()` helper on the Jetpack Stats
 * WordAds page (wp-calypso client/my-sites/stats/wordads/earnings.jsx).
 */
function WordAdsAdjustmentsHistoryReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsWordAdsEarnings();

	const rows = useMemo( () => flattenEarningsBreakdown( data?.adjustment ), [ data ] );

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
			<EarningsHistoryList rows={ rows } />
		</WidgetState>
	);
}

export default function WordAdsAdjustmentsHistory( {
	attributes = {},
}: WordAdsAdjustmentsHistoryProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsAdjustmentsHistoryReport />
		</WidgetRoot>
	);
}

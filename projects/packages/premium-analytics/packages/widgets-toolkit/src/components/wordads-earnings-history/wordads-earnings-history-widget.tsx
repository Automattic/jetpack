/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { ReportRecordsTable } from '../report-page';
import { useWidgetRootContext } from '../widget-root';
import { WidgetState } from '../widget-state';
import {
	EARNINGS_HISTORY_VIEW,
	flattenEarningsBreakdown,
	getWordAdsHistoryFields,
	type EarningsHistoryRow,
} from './fields';

/** Which earnings breakdown a history widget renders. */
export type WordAdsEarningsBreakdownKey = 'wordads' | 'sponsored' | 'adjustment';

type WordAdsEarningsHistoryWidgetProps = {
	/** The earnings breakdown to render as a history table. */
	breakdown: WordAdsEarningsBreakdownKey;
};

/**
 * WordAds earnings-history table, shared by the Earnings / Sponsored Content /
 * Adjustments history widgets. Ported from the `earningsTable()` helper on the
 * Jetpack Stats WordAds page (wp-calypso client/my-sites/stats/wordads/earnings.jsx),
 * which renders all three breakdowns of the `/wordads/earnings` payload with the
 * same Period / Earnings / Ads Served / Status columns.
 *
 * Earnings is not period-scoped, so nothing is read from report params; the
 * component still mounts under `WidgetRoot` for the query client and widget
 * contract.
 *
 * @param {WordAdsEarningsHistoryWidgetProps} props - The component props.
 * @return The rendered history table.
 */
export function WordAdsEarningsHistoryWidget( { breakdown }: WordAdsEarningsHistoryWidgetProps ) {
	useWidgetRootContext();

	const { data, isLoading, isFetching, isError, refetch } = useStatsWordAdsEarnings();

	const rows = useMemo(
		() => flattenEarningsBreakdown( data?.[ breakdown ] ),
		[ data, breakdown ]
	);
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
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				description: __( 'No earnings history to show yet.', 'jetpack-premium-analytics' ),
			} }
		>
			<ReportRecordsTable< EarningsHistoryRow >
				data={ rows }
				fields={ fields }
				getItemId={ item => item.id }
				initialView={ EARNINGS_HISTORY_VIEW }
				isLoading={ isLoading }
			/>
		</WidgetState>
	);
}

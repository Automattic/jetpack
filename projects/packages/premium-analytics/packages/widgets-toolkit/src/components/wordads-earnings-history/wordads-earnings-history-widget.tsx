/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { WidgetDataTable } from '../widget-data-table';
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
 * The empty-state copy per breakdown. All three widgets share one endpoint and
 * one table, but "nothing to show" means something different in each, so each
 * names the rows it would have listed.
 *
 * @param breakdown - The breakdown being rendered.
 * @return The empty-state description.
 */
function getEmptyDescription( breakdown: WordAdsEarningsBreakdownKey ): string {
	switch ( breakdown ) {
		case 'sponsored':
			return __( 'No sponsored content earnings to show yet.', 'jetpack-premium-analytics' );
		case 'adjustment':
			return __( 'No earnings adjustments to show yet.', 'jetpack-premium-analytics' );
		default:
			return __( 'No earnings history to show yet.', 'jetpack-premium-analytics' );
	}
}

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
			empty={ { description: getEmptyDescription( breakdown ) } }
		>
			<WidgetDataTable< EarningsHistoryRow >
				data={ rows }
				fields={ fields }
				getItemId={ item => item.id }
				initialView={ EARNINGS_HISTORY_VIEW }
			/>
		</WidgetState>
	);
}

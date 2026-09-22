/**
 * External dependencies
 */
import { useStatsWordAdsEarnings } from '@jetpack-premium-analytics/data';
import { Stack } from '@jetpack-premium-analytics/externals';
import {
	EarningsHistoryList,
	ReportLink,
	WidgetFooter,
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
import styles from './style.module.css';
import type { WordAdsEarningsHistoryAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the earnings
// endpoint ignores them, but WidgetRoot still expects them on `attributes`.
type RenderAttributes = WordAdsEarningsHistoryAttributes & Partial< ReportParamsFieldAttributes >;
type WordAdsEarningsHistoryProps = WidgetRenderProps< RenderAttributes >;

/**
 * Fetches WordAds earnings and renders the `wordads` breakdown as a history
 * list. The earnings module is not period-scoped, so nothing is read from
 * report params. Ported from the `earningsTable()` helper on the Jetpack Stats
 * WordAds page (wp-calypso client/my-sites/stats/wordads/earnings.jsx).
 */
function WordAdsEarningsHistoryReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsWordAdsEarnings();

	const rows = useMemo( () => flattenEarningsBreakdown( data?.wordads ), [ data ] );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
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
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						description: __( 'No earnings history to show yet.', 'jetpack-premium-analytics-pkg' ),
					} }
				>
					<EarningsHistoryList rows={ rows } />
				</WidgetState>
			</div>
			<WidgetFooter>
				<ReportLink
					report="earnings"
					ariaLabel={ __( 'View all earnings history', 'jetpack-premium-analytics-pkg' ) }
				/>
			</WidgetFooter>
		</Stack>
	);
}

export default function WordAdsEarningsHistory( { attributes = {} }: WordAdsEarningsHistoryProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<WordAdsEarningsHistoryReport />
		</WidgetRoot>
	);
}

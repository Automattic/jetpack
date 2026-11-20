/**
 * External dependencies
 */
import {
	EarningsHistoryList,
	flattenEarningsBreakdown,
	type ReportParamsFieldAttributes,
	Stack,
	useReportActions,
	useStatsWordAdsEarnings,
	WidgetRoot,
	WidgetState,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type WordAdsEarningsHistoryAttributes = Record< never, never >;

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
	// Adjustments are why the all-time balance can differ from the WordAds rows,
	// and the report is their only home now; most sites have none.
	const adjustmentCount = Object.keys( data?.adjustment ?? {} ).length;

	// Trailing, so View all keeps its place.
	useReportActions(
		adjustmentCount > 0
			? {
					id: 'adjustments',
					report: 'earnings',
					section: 'adjustments',
					label: sprintf(
						/* translators: %d: number of earnings adjustments. */
						__( 'Adjustments (%d)', 'jetpack-ads-pkg' ),
						adjustmentCount
					),
					relevance: 'medium',
				}
			: {}
	);

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
							'jetpack-ads-pkg'
						),
						actions: [ { label: __( 'Retry', 'jetpack-ads-pkg' ), onClick: refetch } ],
					} }
					empty={ {
						description: __(
							'No earnings yet. Once your ads have run for a full month, they will show up here.',
							'jetpack-ads-pkg'
						),
					} }
				>
					<EarningsHistoryList rows={ rows } />
				</WidgetState>
			</div>
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

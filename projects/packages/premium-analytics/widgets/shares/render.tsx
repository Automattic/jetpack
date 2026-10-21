/**
 * External dependencies
 */
import {
	LeaderboardChart,
	LeaderboardSkeleton,
	WIDGET_ROW_LIMIT,
	WidgetRoot,
	WidgetState,
	buildLeaderboardRow,
	sharePercentage,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import useShareViews from './use-share-views';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type SharesAttributes = Record< never, never >;

type SharesRenderAttributes = Partial< ReportParamsFieldAttributes > & SharesAttributes;
type SharesWidgetProps = WidgetRenderProps< SharesRenderAttributes >;

/**
 * Shares widget inner component. The share counts come from the all-time site
 * summary, so there is no date range or comparison period to read from context.
 */
function SharesInner() {
	const { data, isLoading, isFetching, isError, refetch } = useShareViews( {
		max: WIDGET_ROW_LIMIT,
	} );

	const leaderboardData = useMemo< LeaderboardChartData >( () => {
		const maxValue = Math.max( ...data.map( s => s.value ), 0 );

		return data.map( ( service, index ) => ( {
			id: `${ index }-${ service.service }`,
			...buildLeaderboardRow( {
				label: service.label,
				media: { kind: 'none' },
				action: { kind: 'static' },
			} ),
			currentValue: service.value,
			currentShare: sharePercentage( service.value, maxValue ),
		} ) );
	}, [ data ] );

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ data.length === 0 }
					error={ {
						description: __(
							"We couldn't load shares. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					empty={ {
						description: __(
							'You don’t have shares recorded yet. Social can help you reach readers where they already are.',
							'jetpack-premium-analytics-pkg'
						),
						action: {
							label: __( 'Learn more', 'jetpack-premium-analytics-pkg' ),
							href: 'https://jetpack.com/social/',
							openInNewTab: true,
						},
					} }
					renderLoading={ <LeaderboardSkeleton rows={ WIDGET_ROW_LIMIT } /> }
				>
					<LeaderboardChart
						chartTitle={ __( 'All-time top social media shares', 'jetpack-premium-analytics-pkg' ) }
						data={ leaderboardData }
						withOverlayLabel
						showLegend={ false }
						dataFormat={ {
							type: 'number',
							options: { useMultipliers: true, decimals: 0 },
						} }
						columns={ {
							label: __( 'Platforms', 'jetpack-premium-analytics-pkg' ),
							metric: 'shares',
						} }
					/>
				</WidgetState>
			</div>
		</Stack>
	);
}

/**
 * Shares widget: the number of times the site's content was shared to each social
 * network, ranked by share count. Ported from the Jetpack Stats "Shares" module.
 */
export default function Shares( { attributes = {} }: SharesWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SharesInner />
		</WidgetRoot>
	);
}

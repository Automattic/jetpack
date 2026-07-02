/**
 * External dependencies
 */
import {
	useStatsPublicize,
	type StatsNormalizedReport,
	type StatsPublicizeItem,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	LeaderboardLabel,
	WidgetLoadingOverlay,
	WidgetRoot,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './shares.module.css';
import type { SharesAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const DEFAULT_MAX = 0;

// The dashboard injects its date range through `reportParams`, but the Publicize
// endpoint takes no period — the widget always reports current follower counts.
// `reportParams` are still forwarded to `WidgetRoot` so the dashboard chrome
// behaves like the other Stats widgets.
type SharesRenderAttributes = SharesAttributes & Partial< ReportParamsFieldAttributes >;

// Resolve the `max` attribute to a row count. Per the Stats widget contract
// `max = 0` means "all rows", so it passes through; only negative or non-numeric
// values fall back to the default.
const toMaxRows = ( value: string | number | undefined, fallback: number ) => {
	const parsed = typeof value === 'number' ? value : Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed >= 0 ? parsed : fallback;
};

/**
 * Maps the normalized Publicize services onto the shape `LeaderboardChart`
 * expects. Each row is a connected social account labelled with its icon and
 * name; the value is that account's follower count. The Publicize endpoint has
 * no comparison period, so no previous-period shares or deltas are produced.
 *
 * @param items - The normalized Publicize service rows.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData( items: StatsPublicizeItem[] ): LeaderboardChartData {
	// `1` guards against division by zero when every follower count is 0.
	const maxFollowers = Math.max( ...items.map( item => item.value ), 1 );

	return items.map( ( item, index ) => {
		const label = String( item.label ?? item.service );

		return {
			id: `${ index }-${ item.service }`,
			label: (
				<div className={ styles.label }>
					<LeaderboardLabel
						label={ label }
						imageUrl={ item.icon ?? undefined }
						imageAlt={ sprintf(
							/* translators: %s is the connected social account name. */
							__( '%s icon', 'jetpack-premium-analytics' ),
							label
						) }
						imageClassName={ styles.icon }
					/>
				</div>
			),
			currentValue: item.value,
			currentShare: ( item.value / maxFollowers ) * 100,
			previousValue: 0,
			previousShare: 0,
			delta: 0,
		};
	} );
}

type SharesLeaderboardProps = {
	/**
	 * Connected-account rows to render. When omitted the empty state is shown
	 * (unless `isLoading` is set).
	 */
	items?: StatsPublicizeItem[];
	/**
	 * When `true` and there are no rows yet, render the loading overlay.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, render an error message instead of the leaderboard.
	 */
	isError?: boolean;
};

/**
 * Presentational leaderboard for the Shares widget, handling the loading,
 * error, empty, and populated states. The card title ("Shares") is rendered by
 * the dashboard host from the widget's `title`, so this body renders the
 * leaderboard only.
 *
 * @param {SharesLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const SharesLeaderboard = ( {
	items = [],
	isLoading = false,
	isError = false,
}: SharesLeaderboardProps ) => {
	return (
		<div className={ styles.root }>
			{ isError && (
				<Text>{ __( 'Unable to load connected accounts.', 'jetpack-premium-analytics' ) }</Text>
			) }
			{ ! isError && isLoading && items.length === 0 && <WidgetLoadingOverlay /> }
			{ ! isError && ! ( isLoading && items.length === 0 ) && (
				<LeaderboardChart
					data={ buildLeaderboardData( items ) }
					loading={ isLoading }
					withOverlayLabel
					showLegend={ false }
					emptyStateText={ __(
						'Connect a social account to track its followers here.',
						'jetpack-premium-analytics'
					) }
					dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
				/>
			) }
		</div>
	);
};

/**
 * Fetches the Publicize report through the designated `useStatsPublicize` Stats
 * hook and hands the normalized rows to the presentational leaderboard. The
 * endpoint has no date range or comparison period, so `reportParams` are not
 * read here; the `max` setting trims the row count client-side.
 *
 * @param props     - Component props.
 * @param props.max - Maximum number of accounts to display; `0` means all.
 * @return The widget content.
 */
function SharesReport( { max }: { max: number } ) {
	const { data, isLoading, isError } = useStatsPublicize();

	const report = data as StatsNormalizedReport< StatsPublicizeItem > | undefined;
	const items = useMemo( () => {
		const rows = report?.data?.[ 0 ]?.items ?? [];
		return rows.slice( 0, max > 0 ? max : undefined );
	}, [ report, max ] );

	return <SharesLeaderboard items={ items } isLoading={ isLoading } isError={ isError } />;
}

/**
 * Widget render entry point.
 *
 * Mirrors the other Stats widgets: `WidgetRoot` provides the analytics query
 * client and chart theme, and the widget's own `max` setting is forwarded to
 * the inner component. The Publicize endpoint has no period, so the inner
 * component does not read `reportParams` from context.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function Shares( { attributes = {} }: WidgetRenderProps< SharesRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SharesReport max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}

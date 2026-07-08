/**
 * External dependencies
 */
import {
	useStatsFollowers,
	useStatsPublicize,
	type StatsFollowersResponse,
	type StatsPublicizeResponse,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	type DataFormat,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { ReachAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const VALUE_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

/**
 * A single subscriber-source row: one channel (WordPress.com, Email, or a
 * connected social service) and its follower count. Exported so Storybook and
 * tests can build fixtures for `ReachLeaderboard`.
 */
export type ReachRow = {
	/**
	 * Stable identifier for the channel (`wpcom`, `email`, `publicize-<service>`).
	 */
	key: string;
	/**
	 * Human-readable channel name.
	 */
	label: string;
	/**
	 * Follower count for the channel.
	 */
	value: number;
};

// The follower and Publicize modules report lifetime totals and are not
// period-scoped, so this widget ignores the dashboard date range. Report params
// are still accepted at the WidgetRoot boundary (and Storybook may inject them)
// so the host contract holds.
type ReachRenderAttributes = ReachAttributes & Partial< ReportParamsFieldAttributes >;
type ReachWidgetProps = WidgetRenderProps< ReachRenderAttributes >;

/**
 * Maps the normalized reach rows onto the shape `LeaderboardChart` expects.
 * Shares are computed relative to the highest-count channel so the overlay bars
 * are proportional. There is no comparison period, so the comparison fields are
 * zeroed and the comparison UI stays off.
 *
 * @param rows - The ranked reach rows.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData( rows: ReachRow[] ): LeaderboardChartData {
	// `1` guards against division by zero when every value is 0.
	const maxValue = Math.max( ...rows.map( row => row.value ), 1 );

	return rows.map( ( row, index ) => ( {
		id: `${ index }-${ row.key }`,
		label: (
			<Text className={ styles.label } title={ row.label }>
				{ row.label }
			</Text>
		),
		currentValue: row.value,
		currentShare: ( row.value / maxValue ) * 100,
		previousValue: 0,
		previousShare: 0,
		delta: 0,
	} ) );
}

type ReachLeaderboardProps = {
	/**
	 * Ranked reach rows to render. When omitted, the empty state is shown
	 * (unless `isLoading` is set).
	 */
	rows?: ReachRow[];
	/**
	 * When `true`, a loading overlay is rendered instead of data.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the chart.
	 */
	isError?: boolean;
};

/**
 * Presentational leaderboard for the "Reach" widget. Renders each subscriber
 * channel — WordPress.com, Email, and every connected social service — ranked
 * by follower count.
 *
 * Takes already-ranked rows via props and owns only the loading, error, empty,
 * and populated states. Exported so Storybook and tests can exercise those
 * states with fixture rows.
 *
 * @param {ReachLeaderboardProps} props - The component props.
 * @return The rendered leaderboard.
 */
export const ReachLeaderboard = ( {
	rows = [],
	isLoading = false,
	isError = false,
}: ReachLeaderboardProps ) => {
	if ( isError ) {
		return <Text>{ __( 'Unable to load your reach.', 'jetpack-premium-analytics' ) }</Text>;
	}

	if ( isLoading && rows.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<LeaderboardChart
			data={ buildLeaderboardData( rows ) }
			loading={ isLoading }
			withOverlayLabel
			showLegend={ false }
			emptyStateText={ __( 'No subscribers yet.', 'jetpack-premium-analytics' ) }
			dataFormat={ VALUE_FORMAT }
		/>
	);
};

/**
 * Flattens the followers summary and Publicize report into ranked reach rows:
 * WordPress.com and email follower totals plus one row per connected social
 * service. Channels with no followers are dropped, and the remaining rows are
 * sorted by follower count, descending.
 *
 * @param followers - The normalized followers report, or undefined while loading.
 * @param publicize - The normalized Publicize report, or undefined while loading.
 * @return The ranked reach rows.
 */
function toReachRows(
	followers: StatsFollowersResponse | undefined,
	publicize: StatsPublicizeResponse | undefined
): ReachRow[] {
	const summary = followers?.summary ?? {};

	const rows: ReachRow[] = [
		{
			key: 'wpcom',
			label: __( 'WordPress.com', 'jetpack-premium-analytics' ),
			value: Number( summary.total_wpcom ?? 0 ),
		},
		{
			key: 'email',
			label: __( 'Email', 'jetpack-premium-analytics' ),
			value: Number( summary.total_email ?? 0 ),
		},
	];

	const services = publicize?.data?.[ 0 ]?.items ?? [];
	services.forEach( service => {
		rows.push( {
			key: `publicize-${ service.service }`,
			label: String( service.label ?? '' ),
			value: service.value,
		} );
	} );

	return rows.filter( row => row.value > 0 ).sort( ( a, b ) => b.value - a.value );
}

/**
 * Fetches the followers summary and the Publicize report through their
 * designated Stats hooks and hands the ranked rows to the presentational
 * `ReachLeaderboard`. Neither module is period-scoped, so the dashboard date
 * range is intentionally ignored.
 *
 * @return The widget content.
 */
function ReachReport() {
	// Only the wpcom/email summary totals are used, so skip fetching the
	// subscriber list the endpoint would otherwise return.
	const followers = useStatsFollowers( { max: 1 } );
	const publicize = useStatsPublicize();

	const rows = useMemo(
		() => toReachRows( followers.data, publicize.data ),
		[ followers.data, publicize.data ]
	);

	return (
		<ReachLeaderboard
			rows={ rows }
			isLoading={ followers.isLoading || publicize.isLoading }
			// Publicize is a supplementary channel: when only it fails, still show
			// the WordPress.com and email reach instead of erroring the whole widget.
			isError={ followers.isError }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme the inner
 * leaderboard relies on. This widget has no own attributes and ignores the
 * dashboard date range, but host attributes are still passed through for the
 * widget contract.
 *
 * @param {ReachWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function Reach( { attributes = {} }: ReachWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<ReachReport />
		</WidgetRoot>
	);
}

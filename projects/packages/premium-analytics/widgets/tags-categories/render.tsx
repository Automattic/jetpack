/**
 * External dependencies
 */
import {
	useStatsTags,
	type StatsNormalizedReport,
	type StatsTagsItem,
} from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	WidgetRoot,
	useWidgetRootContext,
	type LeaderboardChartData,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { category } from '@wordpress/icons';
import { Link, Text } from '@wordpress/ui';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './tags-categories.module.css';
import type { TagsCategoriesAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

const DEFAULT_MAX = 10;

// The dashboard injects its date range through `reportParams`; the widget's own
// settings come from `TagsCategoriesAttributes`. The Stats `tags` endpoint has
// no comparison period, so no comparison attributes are consumed here.
type TagsCategoriesRenderAttributes = TagsCategoriesAttributes &
	Partial< ReportParamsFieldAttributes >;

// Per the Stats widget contract `max = 0` means "all rows", so it passes
// through; only negative or non-numeric values fall back to the default.
const toMaxRows = ( value: string | number | undefined, fallback: number ) => {
	const parsed = typeof value === 'number' ? value : Number.parseInt( value ?? '', 10 );

	return Number.isFinite( parsed ) && parsed >= 0 ? parsed : fallback;
};

/**
 * Maps normalized tags/categories rows onto the shape `LeaderboardChart`
 * expects. Shares are computed relative to the most-viewed row so the overlay
 * bars are proportional. A single tag or category links to its archive; grouped
 * rows (several tags/categories combined on one post) have no single archive
 * URL, so they render as plain text.
 *
 * @param items - The normalized tags/categories rows.
 * @return The leaderboard chart data.
 */
function buildLeaderboardData( items: StatsTagsItem[] ): LeaderboardChartData {
	// `1` guards against division by zero when every value is 0.
	const maxViews = Math.max( ...items.map( item => item.value ), 1 );

	return items.map( ( item, index ) => ( {
		id: `${ index }-${ item.labelText }`,
		label: item.link ? (
			<Link
				className={ styles.labelLink }
				href={ item.link }
				variant="unstyled"
				openInNewTab
				title={ item.labelText }
			>
				{ item.labelText }
			</Link>
		) : (
			<Text className={ styles.label } title={ item.labelText }>
				{ item.labelText }
			</Text>
		),
		currentValue: item.value,
		currentShare: ( item.value / maxViews ) * 100,
		previousValue: 0,
		previousShare: 0,
		delta: 0,
	} ) );
}

/**
 * Fetches the tags/categories report through the Jetpack Stats `useStatsTags`
 * hook and hands the normalized rows to `LeaderboardChart`. The date range comes
 * from the dashboard picker via `reportParams`. The Stats `tags` endpoint has no
 * comparison period, so the leaderboard renders single-period values only.
 *
 * @param props     - Component props.
 * @param props.max - Maximum number of rows to display; `0` means all.
 * @return The widget content.
 */
function TagsCategoriesReport( { max }: { max: number } ) {
	const { reportParams } = useWidgetRootContext();

	// The widget's "Number of results" maps to the WPCOM stats API's `max`; the
	// date range is owned by the dashboard picker and carried in `reportParams`.
	const statsParams = useMemo( () => ( { ...reportParams, max } ), [ reportParams, max ] );

	const { data, isLoading, isError } = useStatsTags( statsParams );

	const items = useMemo( () => {
		const report = data as StatsNormalizedReport< StatsTagsItem > | undefined;
		const allItems = report?.data?.[ 0 ]?.items ?? [];

		return allItems.slice( 0, max > 0 ? max : undefined );
	}, [ data, max ] );

	const chartData = useMemo( () => buildLeaderboardData( items ), [ items ] );

	if ( isError ) {
		return (
			<Text>{ __( 'Unable to load tags and categories.', 'jetpack-premium-analytics' ) }</Text>
		);
	}

	if ( isLoading && items.length === 0 ) {
		return <WidgetLoadingOverlay />;
	}

	return (
		<LeaderboardChart
			data={ chartData }
			loading={ isLoading }
			withOverlayLabel
			showLegend={ false }
			emptyStateIcon={ category }
			emptyStateText={ __(
				'No tag or category views in this period.',
				'jetpack-premium-analytics'
			) }
			dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
		/>
	);
}

/**
 * Tags & categories widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner leaderboard — resolved from the dashboard date
 * range via context, the same way the other Stats widgets read them. The
 * widget's own `max` setting is forwarded to the inner component.
 *
 * @param props            - Render props supplied by the widget host.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function TagsCategories( {
	attributes = {},
}: WidgetRenderProps< TagsCategoriesRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<TagsCategoriesReport max={ toMaxRows( attributes.max, DEFAULT_MAX ) } />
		</WidgetRoot>
	);
}

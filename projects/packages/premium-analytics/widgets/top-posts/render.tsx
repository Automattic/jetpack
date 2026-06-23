/**
 * External dependencies
 */
import {
	computeDateRangeFromPreset,
	localTZDate,
	useStatsTopPosts,
	type PresetType,
	type StatsNormalizedReport,
	type StatsTopPostsItem,
} from '@jetpack-premium-analytics/data';
import { WidgetRoot } from '@jetpack-premium-analytics/widgets-toolkit';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { TopPostsWidget } from './top-posts-widget';
import type { TopPostRow } from './types';

export type TopPostsAttributes = {
	/**
	 * Date-range preset, e.g. `today`, `last-7-days`, `last-30-days`, `last-year`.
	 * Resolved to an absolute window at render time.
	 */
	range?: PresetType;
	num?: number;
	/**
	 * Post type(s) to keep. When undefined, all types are shown.
	 */
	name?: string | string[];
};

type TopPostsProps = {
	attributes?: TopPostsAttributes;
};

/**
 * Flatten the designated `useStatsTopPosts` report into the `{ label, value,
 * href, type }` rows the presentational widget renders, dropping rows without a
 * link and (optionally) filtering by post type.
 *
 * @param report       - The normalized top-posts report, or undefined while loading.
 * @param allowedTypes - Post types to keep, or null to keep all.
 * @return The normalized top-posts rows.
 */
function toTopPostRows(
	report: StatsNormalizedReport< StatsTopPostsItem > | undefined,
	allowedTypes: string[] | null
): TopPostRow[] {
	const items = report?.data.flatMap( point => point.items ) ?? [];

	return items
		.filter( ( item ): item is StatsTopPostsItem & { link: string } => typeof item.link === 'string' )
		.map( item => ( {
			label: String( item.label ?? '' ),
			value: item.views,
			href: item.link,
			type: String( item.type ?? '' ),
		} ) )
		.filter( row => ! allowedTypes || allowedTypes.includes( row.type ) );
}

/**
 * Fetches the top-posts report through the designated `useStatsTopPosts` Stats
 * traffic hook and hands the normalized rows to the presentational
 * `TopPostsWidget`, which owns the loading, error, empty, and populated states.
 *
 * Runs inside `WidgetRoot` so it can reach the analytics query client, keeping
 * the presentational widget prop-driven (and Storybook-friendly).
 *
 * @param props            - Component props.
 * @param props.attributes - Widget attributes.
 * @return The widget content.
 */
function TopPosts( { attributes }: TopPostsProps ) {
	// Default to the trailing 7 days, matching the Jetpack Stats "Top posts &
	// pages" card's default range.
	const range = attributes?.range ?? 'last-7-days';
	const num = attributes?.num ?? 10;
	const name = attributes?.name;

	// Resolve the preset to an absolute window. `computeDateRangeFromPreset`
	// returns ISO strings with a TZ offset; the stats query layer trims them to
	// the date part, so the raw values can be passed straight through.
	const today = format( localTZDate(), 'yyyy-MM-dd' );
	const { from, to } = computeDateRangeFromPreset( range ) ?? {};

	const { primary, isLoading, isError } = useStatsTopPosts( {
		from: from ?? today,
		to: to ?? today,
		interval: 'day',
		period: 'day',
		// The widget's "Number of results" maps to the WPCOM stats API's `max`.
		max: num,
	} );

	const allowedTypes = useMemo( () => {
		if ( name === undefined ) {
			return null;
		}
		return Array.isArray( name ) ? name : [ name ];
	}, [ name ] );

	const rows = useMemo(
		() => toTopPostRows( primary.data as StatsNormalizedReport< StatsTopPostsItem >, allowedTypes ),
		[ primary.data, allowedTypes ]
	);

	return <TopPostsWidget rows={ rows } isLoading={ isLoading } isError={ isError } />;
}

/**
 * Widget render entry point.
 *
 * Attributes flow to the inner component via props rather than
 * `WidgetRootContext` — the context's report params are WC-Analytics-shaped
 * and do not fit stats queries.
 *
 * @param props            - Render props.
 * @param props.attributes - Widget attributes.
 * @return The rendered widget.
 */
export default function TopPostsWidgetRoot( { attributes }: TopPostsProps ) {
	return (
		<WidgetRoot>
			<TopPosts attributes={ attributes } />
		</WidgetRoot>
	);
}

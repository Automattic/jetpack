/**
 * External dependencies
 */
import { localTZDate, useReportTopPosts } from '@jetpack-premium-analytics/data';
import {
	LeaderboardChart,
	WidgetLoadingOverlay,
	type LeaderboardChartData,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { format } from 'date-fns';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { TopPostRow, UseReportTopPostsParams } from '@jetpack-premium-analytics/data';

export type TopPostsAttributes = {
	period?: UseReportTopPostsParams[ 'period' ];
	/**
	 * Reference date, YYYY-MM-DD. Defaults to today in the site timezone.
	 */
	date?: string;
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
 * Leaderboard row label: the post title linking to the published post.
 *
 * @param props       - Component props.
 * @param props.label - Post title.
 * @param props.href  - Post URL.
 * @return The label element.
 */
function TopPostLabel( { label, href }: { label: string; href: string } ) {
	return (
		<a
			className={ styles.labelLink }
			href={ href }
			target="_blank"
			rel="noopener noreferrer"
			title={ label }
		>
			{ label }
		</a>
	);
}

/**
 * Map normalized top-posts rows to leaderboard entries. Bars scale relative
 * to the most-viewed entry; there is no comparison period in v1.
 *
 * @param rows - Normalized top-posts rows.
 * @return Leaderboard chart entries.
 */
function buildLeaderboardData( rows: TopPostRow[] ): LeaderboardChartData {
	const maxViews = Math.max( ...rows.map( row => row.value ), 0 );

	return rows.map( ( row, index ) => ( {
		id: `${ index }-${ row.href }`,
		label: <TopPostLabel label={ row.label } href={ row.href } />,
		currentValue: row.value,
		previousValue: 0,
		currentShare: maxViews > 0 ? ( row.value / maxViews ) * 100 : 0,
		previousShare: 0,
		delta: 0,
	} ) );
}

/**
 * Top posts & pages list.
 *
 * Attributes arrive via props, not WidgetRootContext — the context's report
 * params are WC-Analytics-shaped and do not fit stats queries.
 *
 * @param props            - Component props.
 * @param props.attributes - Widget attributes.
 * @return The widget content.
 */
export function TopPosts( { attributes }: TopPostsProps ) {
	const period = attributes?.period ?? 'day';
	const date = attributes?.date ?? format( localTZDate(), 'yyyy-MM-dd' );
	const num = attributes?.num ?? 10;

	const { rows, isLoading, isError } = useReportTopPosts( {
		period,
		date,
		num,
		name: attributes?.name,
	} );

	const data = useMemo( () => buildLeaderboardData( rows ), [ rows ] );

	if ( isError ) {
		return <Text>{ __( 'Unable to load top posts.', 'jetpack-premium-analytics' ) }</Text>;
	}

	if ( isLoading ) {
		return <WidgetLoadingOverlay />;
	}

	if ( data.length === 0 ) {
		return <Text>{ __( 'No views in this period.', 'jetpack-premium-analytics' ) }</Text>;
	}

	return (
		<LeaderboardChart
			data={ data }
			withComparison={ false }
			showLegend={ false }
			dataFormat={ { type: 'number', options: { useMultipliers: true, decimals: 0 } } }
		/>
	);
}

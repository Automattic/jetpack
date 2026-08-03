/**
 * External dependencies
 */
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { MetricWithComparison, VideoTitleLink } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
import type { StatsVideoPlaysComparisonItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

const METRIC_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

/**
 * Resolve the table label for a complete-stats video row.
 *
 * @param video - The complete-stats summary row.
 * @return The video's display title.
 */
function getVideoTitle( video: StatsVideoPlaysComparisonItem ) {
	return typeof video.label === 'string' && video.label
		? video.label
		: __( 'Untitled video', 'jetpack-premium-analytics-pkg' );
}

/**
 * Render a video row's title. Rows with an attachment ID link to the internal
 * video detail page, carrying the report's current date window so the detail
 * page and its "Stats" breadcrumb keep the range being inspected; the public
 * URL remains the external fallback for rows without an ID.
 *
 * @param props      - Component props.
 * @param props.item - The video report row.
 * @return The linked or plain video title.
 */
function VideoTitle( { item }: { item: StatsVideoPlaysComparisonItem } ) {
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const detailSearch = useMemo( () => pickReportDateParams( search ), [ search ] );
	const title = getVideoTitle( item );

	return (
		<VideoTitleLink id={ item.id } label={ title } link={ item.link } search={ detailSearch } />
	);
}

/**
 * DataViews field config for the Videos records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getVideosFields(
	withComparison = false
): Field< StatsVideoPlaysComparisonItem >[] {
	return [
		{
			id: 'label',
			label: __( 'Video', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getVideoTitle( item ),
			render: ( { item } ) => <VideoTitle item={ item } />,
		},
		{
			id: 'plays',
			label: __( 'Plays', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.plays,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.plays }
					previousValue={ withComparison ? item.previousPlays : undefined }
					dataFormat={ METRIC_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
		{
			id: 'impressions',
			label: __( 'Impressions', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.impressions,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.impressions }
					previousValue={ withComparison ? item.previousImpressions : undefined }
					dataFormat={ METRIC_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}

/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { pickReportDateParams } from '@jetpack-premium-analytics/routing';
import { VideoTitleLink } from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
import type { StatsVideoPlaysItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * Resolve the table label for a complete-stats video row.
 *
 * @param video - The complete-stats summary row.
 * @return The video's display title.
 */
function getVideoTitle( video: StatsVideoPlaysItem ) {
	return typeof video.label === 'string' && video.label
		? video.label
		: __( 'Untitled video', 'jetpack-premium-analytics' );
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
function VideoTitle( { item }: { item: StatsVideoPlaysItem } ) {
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
 * @return The field config.
 */
export function getVideosFields(): Field< StatsVideoPlaysItem >[] {
	return [
		{
			id: 'label',
			label: __( 'Video', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getVideoTitle( item ),
			render: ( { item } ) => <VideoTitle item={ item } />,
		},
		{
			id: 'plays',
			label: __( 'Plays', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.plays,
			render: ( { item } ) => (
				<>{ formatMetricValue( item.plays, 'number', { decimals: 0, useMultipliers: false } ) }</>
			),
		},
		{
			id: 'impressions',
			label: __( 'Impressions', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.impressions,
			render: ( { item } ) => (
				<>
					{ formatMetricValue( item.impressions, 'number', {
						decimals: 0,
						useMultipliers: false,
					} ) }
				</>
			),
		},
	];
}

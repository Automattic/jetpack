/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsVideoPlaysSummaryItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * Resolve the table label for a complete-stats video row.
 *
 * @param video - The complete-stats summary row.
 * @return The video's display title.
 */
function getVideoTitle( video: StatsVideoPlaysSummaryItem ) {
	return video.title || __( 'Untitled video', 'jetpack-premium-analytics' );
}

/**
 * DataViews field config for the Videos records table.
 *
 * @return The field config.
 */
export function getVideosFields(): Field< StatsVideoPlaysSummaryItem >[] {
	return [
		{
			id: 'title',
			label: __( 'Video', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getVideoTitle( item ),
			render: ( { item } ) => {
				const title = getVideoTitle( item );

				if ( ! item.link ) {
					return <>{ title }</>;
				}

				return (
					<a href={ item.link } target="_blank" rel="noopener noreferrer">
						{ title }
					</a>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Plays', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => <>{ item.views.toLocaleString() }</>,
		},
		{
			id: 'impressions',
			label: __( 'Impressions', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.impressions,
			render: ( { item } ) => <>{ item.impressions.toLocaleString() }</>,
		},
	];
}

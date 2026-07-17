/**
 * External dependencies
 */
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
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
			render: ( { item } ) => {
				const title = getVideoTitle( item );
				const href = safeHttpUrl( item.link );

				if ( ! href ) {
					return <>{ title }</>;
				}

				return (
					<a href={ href } target="_blank" rel="noopener noreferrer">
						{ title }
					</a>
				);
			},
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

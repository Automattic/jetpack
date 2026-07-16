/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import type { StatsFileDownloadsItem } from '@jetpack-premium-analytics/data';
import type { Field } from '@wordpress/dataviews';

/**
 * The visible file label, preferring the filename supplied by the endpoint.
 *
 * @param item - A normalized file-download row.
 * @return The file label.
 */
function getFileLabel( item: StatsFileDownloadsItem ): string {
	return item.shortLabel ?? String( item.label ?? '' );
}

/**
 * DataViews fields for the File downloads records table.
 *
 * @return The field config.
 */
export function getDownloadsFields(): Field< StatsFileDownloadsItem >[] {
	return [
		{
			id: 'file',
			label: __( 'File', 'jetpack-premium-analytics' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => getFileLabel( item ),
			render: ( { item } ) => {
				const label = getFileLabel( item );

				if ( ! item.link ) {
					return <>{ label }</>;
				}

				return (
					<a href={ item.link } target="_blank" rel="noopener noreferrer">
						{ label }
					</a>
				);
			},
		},
		{
			id: 'downloads',
			label: __( 'Downloads', 'jetpack-premium-analytics' ),
			getValue: ( { item } ) => item.downloads,
			render: ( { item } ) => <>{ item.downloads.toLocaleString() }</>,
		},
	];
}

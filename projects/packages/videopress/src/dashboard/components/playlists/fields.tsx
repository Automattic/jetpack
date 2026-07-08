import { __, _n, sprintf } from '@wordpress/i18n';
import ArtworkField from './artwork-field';
import type { Playlist } from '../../types/playlist';
import type { Field } from '@wordpress/dataviews';

export const playlistFields: Field< Playlist >[] = [
	{
		id: 'artwork',
		label: __( 'Artwork', 'jetpack-videopress-pkg' ),
		type: 'media',
		render: ArtworkField,
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'name',
		label: __( 'Name', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.name,
		enableSorting: true,
		enableGlobalSearch: true,
	},
	{
		id: 'count',
		label: __( 'Videos', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.count,
		render: ( { item } ) =>
			sprintf(
				/* translators: %d: number of videos in the playlist. */
				_n( '%d video', '%d videos', item.count, 'jetpack-videopress-pkg' ),
				item.count
			),
		enableSorting: true,
	},
];

import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import ArtworkField from './artwork-field';
import type { Playlist, PlaylistType } from '../../types/playlist';
import type { Field, Operator } from '@wordpress/dataviews';

export const PLAYLIST_TYPE_LABELS: Record< PlaylistType, string > = {
	collection: __( 'Collection', 'jetpack-videopress-pkg' ),
	series: __( 'Series', 'jetpack-videopress-pkg' ),
	course: __( 'Course', 'jetpack-videopress-pkg' ),
	season: __( 'Season', 'jetpack-videopress-pkg' ),
};

/**
 * Human-readable label for a playlist type.
 *
 * @param type - The playlist type.
 * @return The translated label.
 */
export function playlistTypeLabel( type: PlaylistType ): string {
	return PLAYLIST_TYPE_LABELS[ type ] ?? PLAYLIST_TYPE_LABELS.collection;
}

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
		id: 'type',
		label: __( 'Type', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.type,
		render: ( { item } ) => <Badge intent="none">{ playlistTypeLabel( item.type ) }</Badge>,
		elements: Object.entries( PLAYLIST_TYPE_LABELS ).map( ( [ value, label ] ) => ( {
			value,
			label,
		} ) ),
		filterBy: { operators: [ 'is' ] as Operator[] },
		enableSorting: false,
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

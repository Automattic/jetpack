import { getSettings as getDateSettings } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/route';
import { useVideoLiveMetadata } from '../../hooks/use-video-live-metadata';
import { formatDuration } from '../../utils/format';
import './style.scss';
import type { PlaylistItem, PlaylistStatus } from '../../types/playlists';
import type { Field } from '@wordpress/dataviews';

const dateSettings = getDateSettings();

/**
 * A playlist's display title, with a fallback for untitled ones.
 *
 * @param item - The playlist.
 * @return The title.
 */
export const playlistTitle = ( item: Pick< PlaylistItem, 'title' > ): string =>
	item.title.trim() || __( 'Untitled playlist', 'jetpack-videopress-pkg' );

/**
 * Count of videos, e.g. "3 videos".
 *
 * @param count - Number of videos.
 * @return The label.
 */
export const videoCountLabel = ( count: number ): string =>
	sprintf(
		/* translators: %d: number of videos in a playlist. */
		_n( '%d video', '%d videos', count, 'jetpack-videopress-pkg' ),
		count
	);

/**
 * The poster of a playlist's first video, with its video count on top.
 *
 * @param props      - Component props.
 * @param props.item - The playlist.
 * @return The thumbnail element.
 */
export const PlaylistThumbnail = ( { item }: { item: PlaylistItem } ) => {
	const { poster } = useVideoLiveMetadata( item.videos[ 0 ]?.guid );

	return (
		<Link to={ `/playlists/${ item.key }` } className="vp-playlists__thumbnail">
			{ poster ? <img className="vp-playlists__thumbnail-image" src={ poster } alt="" /> : null }
			<span className="vp-playlists__thumbnail-count">{ videoCountLabel( item.videoCount ) }</span>
			{ item.status !== 'publish' && (
				<span className="vp-playlists__thumbnail-status">
					<PlaylistStatusBadge item={ item } />
				</span>
			) }
		</Link>
	);
};

/**
 * Human labels for the post statuses a playlist can have.
 *
 * @return Label per status.
 */
export const playlistStatusLabels = (): Record< PlaylistStatus, string > => ( {
	publish: __( 'Published', 'jetpack-videopress-pkg' ),
	future: __( 'Scheduled', 'jetpack-videopress-pkg' ),
	draft: __( 'Draft', 'jetpack-videopress-pkg' ),
	pending: __( 'Pending review', 'jetpack-videopress-pkg' ),
	private: __( 'Private', 'jetpack-videopress-pkg' ),
} );

/**
 * A playlist's status as a small badge; published playlists show none in the grid.
 *
 * @param props      - Component props.
 * @param props.item - The playlist.
 * @return The badge.
 */
export const PlaylistStatusBadge = ( { item }: { item: Pick< PlaylistItem, 'status' > } ) => (
	<span className={ `vp-playlists__status is-${ item.status }` }>
		{ playlistStatusLabels()[ item.status ] ?? item.status }
	</span>
);

export const playlistFields: Field< PlaylistItem >[] = [
	{
		id: 'thumbnail',
		label: __( 'Thumbnail', 'jetpack-videopress-pkg' ),
		type: 'media',
		render: PlaylistThumbnail,
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'title',
		label: __( 'Title', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => playlistTitle( item ),
		render: ( { item } ) => (
			<Link
				to={ `/playlists/${ item.key }` }
				className="vp-playlists__title-link"
				title={ playlistTitle( item ) }
			>
				{ playlistTitle( item ) }
			</Link>
		),
		enableSorting: true,
		enableHiding: false,
		// Only status filtering is supported by the playlists route.
		filterBy: false,
	},
	{
		id: 'description',
		label: __( 'Description', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.description,
		render: ( { item } ) => (
			<span className="vp-playlists__description" title={ item.description }>
				{ item.description }
			</span>
		),
		enableSorting: false,
		// Only status filtering is supported by the playlists route.
		filterBy: false,
	},
	{
		id: 'status',
		label: __( 'Status', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.status,
		render: PlaylistStatusBadge,
		elements: Object.entries( playlistStatusLabels() ).map( ( [ value, label ] ) => ( {
			value,
			label,
		} ) ),
		filterBy: { operators: [ 'isAny' ] },
		enableSorting: false,
	},
	{
		id: 'videoCount',
		label: __( 'Videos', 'jetpack-videopress-pkg' ),
		type: 'integer',
		getValue: ( { item } ) => item.videoCount,
		enableSorting: true,
		// Only status filtering is supported by the playlists route.
		filterBy: false,
	},
	{
		id: 'duration',
		label: __( 'Duration', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.durationMs,
		render: ( { item } ) => ( item.durationMs ? formatDuration( item.durationMs / 1000 ) : '—' ),
		enableSorting: false,
		// Only status filtering is supported by the playlists route.
		filterBy: false,
	},
	{
		id: 'post',
		label: __( 'Appears in', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.post.title,
		render: ( { item } ) =>
			item.post.editUrl ? (
				<a href={ item.post.editUrl } className="vp-playlists__post-link">
					{ item.post.title || __( '(no title)', 'jetpack-videopress-pkg' ) }
				</a>
			) : (
				item.post.title
			),
		enableSorting: false,
		// Only status filtering is supported by the playlists route.
		filterBy: false,
	},
	{
		id: 'updated',
		label: __( 'Updated', 'jetpack-videopress-pkg' ),
		type: 'datetime',
		getValue: ( { item } ) => item.updated,
		format: { datetime: dateSettings.formats.date },
		enableSorting: true,
		// Only status filtering is supported by the playlists route.
		filterBy: false,
	},
];

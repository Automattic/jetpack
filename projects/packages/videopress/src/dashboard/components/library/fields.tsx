import { getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { formatBytes, formatDuration } from '../../utils/format';
import { isStudioEnabled } from '../../utils/studio';
import ThumbnailField from './thumbnail-field';
import { useUploadActions } from './upload-actions-context';
import type { LibraryItem } from '../../types/library';
import type { Playlist } from '../../types/playlist';
import type { Field, Operator } from '@wordpress/dataviews';

const dateSettings = getDateSettings();

type BadgeIntent = React.ComponentProps< typeof Badge >[ 'intent' ];

/**
 * Render a video's title. For idle VideoPress videos it's a link-styled button
 * that opens the video's Details (mirroring Core); for every other state it's a
 * plain span so uploading/failed/local rows stay non-navigable.
 *
 * @param props      - Component props.
 * @param props.item - The library item rendered by this cell.
 * @return The title element.
 */
const TitleText = ( { item }: { item: LibraryItem } ) => {
	const { openVideoDetails } = useUploadActions();
	const { type, upload, title, id } = item;

	// `title` attributes expose the full text on hover; the elements
	// themselves truncate with an ellipsis (see &__title-link /
	// &__title-text in style.scss).
	if ( type === 'videopress' && upload.status === 'idle' ) {
		return (
			<button
				type="button"
				className="vp-library__title-link"
				title={ title }
				onClick={ () => openVideoDetails( id ) }
			>
				{ title }
			</button>
		);
	}

	return (
		<span className="vp-library__title-text" title={ title }>
			{ title }
		</span>
	);
};

const privacyLabel = ( privacy: LibraryItem[ 'privacy' ] ): string => {
	switch ( privacy ) {
		case 'public':
			return __( 'Public', 'jetpack-videopress-pkg' );
		case 'private':
			return __( 'Private', 'jetpack-videopress-pkg' );
		case 'site-default':
			return __( 'Site default', 'jetpack-videopress-pkg' );
	}
};

const TitleCell = ( { item }: { item: LibraryItem } ) => {
	const { upload, type, isProcessing } = item;
	let pill: { intent: BadgeIntent; label: string } | null = null;
	if ( upload.status === 'uploading' ) {
		pill = {
			intent: 'informational',
			label: sprintf(
				/* translators: %d: upload progress percentage */
				__( 'Uploading %d%%', 'jetpack-videopress-pkg' ),
				Math.round( upload.progress )
			),
		};
	} else if ( upload.status === 'promoting' ) {
		pill = {
			intent: 'informational',
			label: __( 'Uploading…', 'jetpack-videopress-pkg' ),
		};
	} else if ( upload.status === 'deleting' ) {
		pill = {
			intent: 'informational',
			label: __( 'Deleting…', 'jetpack-videopress-pkg' ),
		};
	} else if ( upload.status === 'failed' ) {
		pill = {
			intent: 'high',
			label: __( 'Upload failed', 'jetpack-videopress-pkg' ),
		};
	} else if ( isProcessing ) {
		pill = {
			intent: 'informational',
			label: __( 'Processing', 'jetpack-videopress-pkg' ),
		};
	} else if ( type === 'draft' ) {
		pill = {
			intent: 'informational',
			label: __( 'Imported from YouTube — attach video file', 'jetpack-videopress-pkg' ),
		};
	} else if ( type === 'local' ) {
		pill = {
			intent: 'none',
			label: __( 'Local', 'jetpack-videopress-pkg' ),
		};
	}

	if ( ! pill ) {
		return <TitleText item={ item } />;
	}
	return (
		<Stack direction="row" gap="sm" align="center" className="vp-library__title-cell">
			<TitleText item={ item } />
			<Badge intent={ pill.intent }>{ pill.label }</Badge>
		</Stack>
	);
};

// The static fields shared by every configuration. The Studio-gated playlists
// field is appended by buildLibraryFields() because its filter elements come
// from fetched data.
const baseLibraryFields: Field< LibraryItem >[] = [
	{
		id: 'thumbnail',
		label: __( 'Thumbnail', 'jetpack-videopress-pkg' ),
		type: 'media',
		render: ThumbnailField,
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'title',
		label: __( 'Title', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.title,
		render: TitleCell,
		enableSorting: true,
	},
	{
		id: 'filename',
		label: __( 'Filename', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.filename,
		render: ( { item } ) => (
			<Text variant="body-sm" className="vp-library__filename" title={ item.filename }>
				{ item.filename }
			</Text>
		),
		enableSorting: true,
	},
	{
		id: 'type',
		label: __( 'Type', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.type,
		render: ( { item } ) => {
			if ( item.type === 'videopress' ) {
				return 'VideoPress';
			}
			if ( item.type === 'draft' ) {
				return __( 'Draft', 'jetpack-videopress-pkg' );
			}
			return __( 'Local', 'jetpack-videopress-pkg' );
		},
		// No 'draft' filter element: drafts only exist behind the Studio flag
		// and there's no server-side type=draft filter mapping (yet); the cell
		// render above still labels them correctly wherever they appear.
		elements: [
			{ value: 'videopress', label: 'VideoPress' },
			{ value: 'local', label: __( 'Local', 'jetpack-videopress-pkg' ) },
		],
		filterBy: { operators: [ 'is' ] as Operator[] },
		enableSorting: false,
	},
	{
		id: 'uploadDate',
		label: __( 'Uploaded', 'jetpack-videopress-pkg' ),
		type: 'datetime',
		getValue: ( { item } ) => item.uploadDate,
		format: { datetime: dateSettings.formats.date },
		// /wp/v2/media exposes only `before` and `after` for date filtering;
		// surface only the operators we can actually honour so the UI
		// doesn't offer choices that silently no-op (on / notOn / inclusive
		// variants / inThePast / over).
		filterBy: { operators: [ 'before', 'after' ] as Operator[] },
		enableSorting: true,
	},
	{
		id: 'duration',
		label: __( 'Duration', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.durationSeconds,
		render: ( { item } ) => formatDuration( item.durationSeconds ),
		enableSorting: false,
	},
	{
		id: 'privacy',
		label: __( 'Privacy', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.privacy,
		render: ( { item } ) => privacyLabel( item.privacy ),
		elements: [
			{ value: 'public', label: __( 'Public', 'jetpack-videopress-pkg' ) },
			{ value: 'private', label: __( 'Private', 'jetpack-videopress-pkg' ) },
			{ value: 'site-default', label: __( 'Site default', 'jetpack-videopress-pkg' ) },
		],
		filterBy: { operators: [ 'is' ] as Operator[] },
		enableSorting: false,
	},
	{
		id: 'fileSize',
		label: __( 'File size', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.fileSizeBytes,
		render: ( { item } ) => formatBytes( item.fileSizeBytes ),
		enableSorting: false,
	},
];

/**
 * Build the Studio-gated playlists field. Filtering is server-side (see
 * viewToQueryArgs in use-library.ts, which maps the filter to the taxonomy's
 * `videopress-playlists` query arg), so `elements` only drives the filter UI.
 *
 * @param playlists - The playlists used for the cell render and filter elements.
 * @return The playlists field definition.
 */
const buildPlaylistsField = ( playlists: Playlist[] ): Field< LibraryItem > => {
	const nameById = new Map( playlists.map( playlist => [ playlist.id, playlist.name ] ) );
	return {
		id: 'playlists',
		label: __( 'Playlists', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.playlistIds,
		render: ( { item } ) =>
			item.playlistIds
				// Drop IDs the playlists fetch doesn't know about (a term
				// deleted between fetches) rather than render a blank name.
				.map( id => nameById.get( id ) )
				.filter( ( name ): name is string => Boolean( name ) )
				.join( ', ' ),
		elements: playlists.map( playlist => ( { value: playlist.id, label: playlist.name } ) ),
		filterBy: { operators: [ 'is' ] as Operator[] },
		enableSorting: false,
	};
};

/**
 * Build the DataViews fields array for the Library tab.
 *
 * With the Studio flag off this returns exactly the static field list the
 * library has always used. With the flag on, a playlists field (cell render +
 * `is` filter) is appended, with filter elements derived from the fetched
 * playlists.
 *
 * @param options           - Factory options.
 * @param options.playlists - Playlists backing the playlists field; ignored
 *                          when the Studio flag is off.
 * @return The fields array for `<DataViews>`.
 */
export function buildLibraryFields(
	options: { playlists?: Playlist[] } = {}
): Field< LibraryItem >[] {
	if ( ! isStudioEnabled() ) {
		return [ ...baseLibraryFields ];
	}
	return [ ...baseLibraryFields, buildPlaylistsField( options.playlists ?? [] ) ];
}

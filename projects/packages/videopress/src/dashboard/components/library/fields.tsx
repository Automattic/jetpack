import { getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { formatBytes, formatDuration } from '../../utils/format';
import ThumbnailField from './thumbnail-field';
import { useUploadActions } from './upload-actions-context';
import type { LibraryItem } from '../../types/library';
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

export const libraryFields: Field< LibraryItem >[] = [
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
		render: ( { item } ) =>
			item.type === 'videopress' ? 'VideoPress' : __( 'Local', 'jetpack-videopress-pkg' ),
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

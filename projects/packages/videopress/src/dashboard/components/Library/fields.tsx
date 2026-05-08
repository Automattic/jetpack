import { getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Stack, Text } from '@wordpress/ui';
import { formatBytes, formatDuration } from '../../utils/format';
import ThumbnailField from './ThumbnailField';
import type { MockLibraryItem } from '../../types/library';
import type { Field, Operator } from '@wordpress/dataviews';

const dateSettings = getDateSettings();

type BadgeIntent = React.ComponentProps< typeof Badge >[ 'intent' ];

const privacyLabel = ( privacy: MockLibraryItem[ 'privacy' ] ): string => {
	switch ( privacy ) {
		case 'public':
			return __( 'Public', 'jetpack-videopress-pkg' );
		case 'private':
			return __( 'Private', 'jetpack-videopress-pkg' );
		case 'site-default':
			return __( 'Site default', 'jetpack-videopress-pkg' );
	}
};

const TitleCell = ( { item }: { item: MockLibraryItem } ) => {
	const { upload, type, title } = item;
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
	} else if ( upload.status === 'failed' ) {
		pill = {
			intent: 'high',
			label: __( 'Upload failed', 'jetpack-videopress-pkg' ),
		};
	} else if ( type === 'local' ) {
		pill = {
			intent: 'none',
			label: __( 'Local', 'jetpack-videopress-pkg' ),
		};
	}

	if ( ! pill ) {
		return <>{ title }</>;
	}
	return (
		<Stack direction="row" gap="sm" align="center" className="vp-library__title-cell">
			<span>{ title }</span>
			<Badge intent={ pill.intent }>{ pill.label }</Badge>
		</Stack>
	);
};

export const libraryFields: Field< MockLibraryItem >[] = [
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
			<Text variant="body-sm" className="vp-library__filename">
				{ item.filename }
			</Text>
		),
		enableSorting: false,
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
		enableSorting: true,
	},
	{
		id: 'duration',
		label: __( 'Duration', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.durationSeconds,
		render: ( { item } ) => formatDuration( item.durationSeconds ),
		enableSorting: true,
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
		enableSorting: true,
	},
];

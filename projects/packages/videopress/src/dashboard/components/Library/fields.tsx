import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { formatBytes, formatDuration } from '../../utils/format';
import ThumbnailField from './ThumbnailField';
import type { MockLibraryItem } from '../../types/library';
import type { Field, Operator } from '@wordpress/dataviews';

const dateSettings = getDateSettings();

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
		render: ( { item } ) => item.title,
		enableSorting: true,
	},
	{
		id: 'filename',
		label: __( 'Filename', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.filename,
		render: ( { item } ) => <span className="vp-library__filename">{ item.filename }</span>,
		enableSorting: false,
	},
	{
		id: 'type',
		label: __( 'Type', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.type,
		render: ( { item } ) =>
			item.type === 'videopress'
				? __( 'VideoPress', 'jetpack-videopress-pkg' )
				: __( 'Local', 'jetpack-videopress-pkg' ),
		elements: [
			{ value: 'videopress', label: __( 'VideoPress', 'jetpack-videopress-pkg' ) },
			{ value: 'local', label: __( 'Local', 'jetpack-videopress-pkg' ) },
		],
		filterBy: { operators: [ 'is' ] as Operator[], isPrimary: true },
		enableSorting: false,
	},
	{
		id: 'uploadDate',
		label: __( 'Uploaded', 'jetpack-videopress-pkg' ),
		type: 'datetime',
		getValue: ( { item } ) => item.uploadDate,
		render: ( { item } ) => dateI18n( dateSettings.formats.date, item.uploadDate ),
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

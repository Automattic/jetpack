import { getSettings as getDateSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Badge, Stack } from '@wordpress/ui';
import { formatDuration } from '../../utils/format';
import type { YouTubeVideo, YouTubeVideoPrivacy } from '../../hooks/use-youtube-videos';
import type { Field } from '@wordpress/dataviews';

const dateSettings = getDateSettings();

export const IMPORT_PRIVACY_LABELS: Record< YouTubeVideoPrivacy, string > = {
	public: __( 'Public', 'jetpack-videopress-pkg' ),
	unlisted: __( 'Unlisted', 'jetpack-videopress-pkg' ),
	private: __( 'Private', 'jetpack-videopress-pkg' ),
};

/**
 * Render the media slot for one picker row: the video's best thumbnail, or a
 * neutral placeholder block when the listing carried none.
 *
 * @param props      - Component props.
 * @param props.item - The YouTube video rendered by this cell.
 * @return The thumbnail element.
 */
const ThumbnailCell = ( { item }: { item: YouTubeVideo } ) => (
	<div className="vp-import__thumbnail">
		{ item.thumbnailUrl ? (
			<img className="vp-import__thumbnail-image" src={ item.thumbnailUrl } alt={ item.title } />
		) : (
			<span className="vp-import__thumbnail-placeholder" aria-hidden="true" />
		) }
	</div>
);

/**
 * Render a picker row's title, with an "Already imported" badge when a draft
 * placeholder for the video already exists in the library.
 *
 * @param props      - Component props.
 * @param props.item - The YouTube video rendered by this cell.
 * @return The title element.
 */
const TitleCell = ( { item }: { item: YouTubeVideo } ) => {
	const title = (
		<span className="vp-import__title" title={ item.title }>
			{ item.title }
		</span>
	);

	if ( ! item.alreadyImported ) {
		return title;
	}
	return (
		<Stack direction="row" gap="sm" align="center" className="vp-import__title-cell">
			{ title }
			<Badge intent="none">{ __( 'Already imported', 'jetpack-videopress-pkg' ) }</Badge>
		</Stack>
	);
};

// The listing is cursor-paginated by the server and none of these columns
// map to a server-side sort or filter, so sorting and filtering are disabled
// across the board — the fields only shape what each row displays.
export const importPickerFields: Field< YouTubeVideo >[] = [
	{
		id: 'thumbnail',
		label: __( 'Thumbnail', 'jetpack-videopress-pkg' ),
		type: 'media',
		render: ThumbnailCell,
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'title',
		label: __( 'Title', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.title,
		render: TitleCell,
		enableSorting: false,
	},
	{
		id: 'duration',
		label: __( 'Duration', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.durationSeconds,
		render: ( { item } ) => formatDuration( item.durationSeconds ),
		enableSorting: false,
	},
	{
		id: 'published',
		label: __( 'Published', 'jetpack-videopress-pkg' ),
		type: 'datetime',
		getValue: ( { item } ) => item.publishedAt,
		format: { datetime: dateSettings.formats.date },
		filterBy: false,
		enableSorting: false,
	},
	{
		id: 'privacy',
		label: __( 'Privacy', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.privacy,
		render: ( { item } ) => IMPORT_PRIVACY_LABELS[ item.privacy ] ?? item.privacy,
		filterBy: false,
		enableSorting: false,
	},
];

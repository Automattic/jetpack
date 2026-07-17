import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCopyToClipboard } from '@wordpress/compose';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, _n, sprintf } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import { Button, Card, IconButton, InputControl, Stack, Text } from '@wordpress/ui';
import { useState } from 'react';
import { useVideoTracks } from '../../../client/components/caption-manager-modal/use-video-tracks';
import {
	getLanguageDisplayName,
	getManualLanguageTagFromTrackKey,
} from '../../../client/lib/video-tracks/language';
import { useUpdateVideoPoster } from '../../hooks/use-update-video-poster';
import { selectImageFromMediaLibrary } from '../../utils/select-image-from-media-library';
import SelectFrameDialog from './select-frame-dialog';
import ThumbnailUpdateButton from './thumbnail-update-button';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
	onAddToNewPost: () => void;
	onManageSubtitles: () => void;
};

const dateSettings = getDateSettings();

// The Subtitles row lists this many languages before collapsing into "and N more".
const MAX_SUBTITLE_LANGUAGES_SHOWN = 2;

const linkForVideo = ( video: LibraryItem ): string => {
	const host = video.isPrivate ? 'video.wordpress.com' : 'videopress.com';
	return `https://${ host }/v/${ video.guid || video.id }`;
};

/**
 * Icon-only button that copies its `text` prop to the clipboard. Uses
 * `@wordpress/compose`'s `useCopyToClipboard` (clipboard.js under the hood)
 * so it falls back to `document.execCommand('copy')` on non-secure origins —
 * the native `navigator.clipboard` API is undefined on plain HTTP, which
 * the dev environments here run on. Posts a success snackbar via the
 * dashboard's GlobalNotices store on every successful copy.
 *
 * @param props            - Component props.
 * @param props.text       - The string to write to the clipboard on click.
 * @param props.fieldLabel - Human-readable name of the field being copied,
 *                         used in the success snackbar.
 * @return The icon-button element.
 */
const CopyIconButton = ( {
	text,
	fieldLabel,
}: {
	text: string;
	fieldLabel: string;
} ): ReactElement => {
	const { createSuccessNotice } = useGlobalNotices();
	const ref = useCopyToClipboard( text, () =>
		createSuccessNotice(
			sprintf(
				/* translators: %s: name of the copied field, e.g. "Link to video". */
				__( '%s copied to clipboard.', 'jetpack-videopress-pkg' ),
				fieldLabel
			)
		)
	);
	return (
		<IconButton
			ref={ ref }
			label={ __( 'Copy', 'jetpack-videopress-pkg' ) }
			icon={ copy }
			variant="minimal"
		/>
	);
};

const canEditThumbnail = ( video: LibraryItem ): boolean =>
	video.type === 'videopress' && ! video.isProcessing && Boolean( video.sourceUrl || video.guid );

/**
 * Top-of-page card on the Video details screen (below the preview player).
 * Renders the "Update thumbnail" and "Add video to new post" actions, two
 * read-only copy fields (Link to video, Shortcode) using InputControl +
 * IconButton suffix, and metadata rows (File name, Uploaded on, Subtitles
 * with a Manage action).
 *
 * @param props                   - Component props.
 * @param props.video             - The current video record.
 * @param props.onAddToNewPost    - Click handler for the secondary action.
 * @param props.onManageSubtitles - Opens the caption manager.
 * @return The card element.
 */
export default function ThumbnailCard( {
	video,
	onAddToNewPost,
	onManageSubtitles,
}: Props ): ReactElement {
	const link = linkForVideo( video );

	/*
	 * The media REST item omits `tracks`, so the languages come from the same
	 * video-info query the caption manager uses.
	 */
	const { managedTracks, isLoading: isLoadingTracks } = useVideoTracks( {
		guid: video.guid ?? '',
		isOpen: !! video.guid,
		isPrivate: video.isPrivate,
		tracks: video.tracks,
	} );

	const subtitleLanguages = [
		...new Set(
			managedTracks
				.filter( track => track.kind === 'captions' || track.kind === 'subtitles' )
				.map(
					track =>
						track.label ||
						getLanguageDisplayName(
							getManualLanguageTagFromTrackKey( track.srcLang ) || track.srcLang
						)
				)
		),
	];
	const shownLanguages = subtitleLanguages.slice( 0, MAX_SUBTITLE_LANGUAGES_SHOWN ).join( ', ' );
	const moreLanguagesCount = subtitleLanguages.length - MAX_SUBTITLE_LANGUAGES_SHOWN;
	let subtitleSummary = shownLanguages || __( 'None', 'jetpack-videopress-pkg' );
	if ( moreLanguagesCount > 0 ) {
		subtitleSummary = sprintf(
			/* translators: 1: list of subtitle language names. 2: how many further languages exist. */
			_n(
				'%1$s, and %2$d more',
				'%1$s, and %2$d more',
				moreLanguagesCount,
				'jetpack-videopress-pkg'
			),
			shownLanguages,
			moreLanguagesCount
		);
	}
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const updatePoster = useUpdateVideoPoster();
	const [ dialogOpen, setDialogOpen ] = useState( false );

	const notifyResult = {
		onSuccess: () => createSuccessNotice( __( 'Thumbnail updated.', 'jetpack-videopress-pkg' ) ),
		onError: () =>
			createErrorNotice( __( 'Failed to update thumbnail.', 'jetpack-videopress-pkg' ) ),
	};

	const handleConfirmFrame = ( atTimeMs: number ) => {
		setDialogOpen( false );
		updatePoster.mutate(
			{ id: video.id, guid: video.guid, source: 'frame', atTimeMs },
			notifyResult
		);
	};

	const handleUploadImage = async () => {
		const attachment = await selectImageFromMediaLibrary().catch( () => null );
		if ( ! attachment ) {
			return;
		}
		updatePoster.mutate(
			{ id: video.id, guid: video.guid, source: 'attachment', attachmentId: attachment.id },
			notifyResult
		);
	};

	const showUpdateButton = canEditThumbnail( video );
	const isUpdating = updatePoster.isPending;

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Stack direction="row" gap="sm" className="vp-video-details__actions">
						{ showUpdateButton && (
							<ThumbnailUpdateButton
								canSelectFromVideo={ Boolean( video.sourceUrl ) }
								canUploadImage={ Boolean( ( window.wp as WpGlobal | undefined )?.media ) }
								isBusy={ isUpdating }
								onSelectFromVideo={ () => setDialogOpen( true ) }
								onUploadImage={ handleUploadImage }
							/>
						) }
						<Button
							variant="outline"
							onClick={ onAddToNewPost }
							className="vp-video-details__primary-action"
						>
							{ __( 'Add video to new post', 'jetpack-videopress-pkg' ) }
						</Button>
					</Stack>

					<InputControl
						label={ __( 'Link to video', 'jetpack-videopress-pkg' ) }
						value={ link }
						readOnly
						suffix={
							<CopyIconButton
								text={ link }
								fieldLabel={ __( 'Link to video', 'jetpack-videopress-pkg' ) }
							/>
						}
					/>

					<InputControl
						label={ __( 'Shortcode', 'jetpack-videopress-pkg' ) }
						value={ video.shortcode }
						readOnly
						suffix={
							<CopyIconButton
								text={ video.shortcode }
								fieldLabel={ __( 'Shortcode', 'jetpack-videopress-pkg' ) }
							/>
						}
					/>

					<Stack direction="column" gap="xs">
						<Text variant="body-sm" className="vp-video-details__meta-label">
							{ __( 'File name', 'jetpack-videopress-pkg' ) }
						</Text>
						<Text>{ video.filename }</Text>
					</Stack>

					<Stack direction="column" gap="xs">
						<Text variant="body-sm" className="vp-video-details__meta-label">
							{ __( 'Uploaded on', 'jetpack-videopress-pkg' ) }
						</Text>
						<Text>{ dateI18n( dateSettings.formats.date, video.uploadDate ) }</Text>
					</Stack>

					{ video.guid && (
						<Stack direction="column" gap="xs">
							<Text variant="body-sm" className="vp-video-details__meta-label">
								{ __( 'Subtitles', 'jetpack-videopress-pkg' ) }
							</Text>
							<Stack direction="row" gap="sm" align="center">
								<Text>
									{ isLoadingTracks ? __( 'Loading…', 'jetpack-videopress-pkg' ) : subtitleSummary }
								</Text>
								<Button
									variant="minimal"
									size="small"
									className="vp-video-details__manage-subtitles"
									aria-label={ __( 'Manage subtitles', 'jetpack-videopress-pkg' ) }
									onClick={ onManageSubtitles }
								>
									{ __( 'Manage', 'jetpack-videopress-pkg' ) }
								</Button>
							</Stack>
						</Stack>
					) }
				</Stack>
			</Card.Content>
			<SelectFrameDialog
				src={ video.sourceUrl ?? '' }
				isOpen={ dialogOpen }
				onClose={ () => setDialogOpen( false ) }
				onConfirm={ handleConfirmFrame }
			/>
		</Card.Root>
	);
}

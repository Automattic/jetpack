import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { useCopyToClipboard } from '@wordpress/compose';
import { dateI18n, getSettings as getDateSettings } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import { Button, Card, IconButton, InputControl, Stack, Text } from '@wordpress/ui';
import { useCallback, useEffect, useState } from 'react';
import { usePosterUrl } from '../../hooks/use-poster-url';
import { useUpdateVideoPoster } from '../../hooks/use-update-video-poster';
import { selectImageFromMediaLibrary } from '../../utils/select-image-from-media-library';
import SelectFrameDialog from './select-frame-dialog';
import ThumbnailUpdateButton from './thumbnail-update-button';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
	onAddToNewPost: () => void;
};

const dateSettings = getDateSettings();

// Upper bound on how long we keep showing "Updating…" while waiting for the
// freshly generated poster <img> to load. The onLoad handler normally clears
// it sooner; this just guarantees the overlay can't get stuck if onLoad never
// fires (identical URL, cache hit, or a load error).
const POSTER_CONFIRM_TIMEOUT_MS = 5000;

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
 * Top-of-page card on the Video details screen. Renders the thumbnail,
 * the "Add video to new post" outlined action, two read-only copy fields
 * (Link to video, Shortcode) using InputControl + IconButton suffix, and
 * two metadata rows (File name, Uploaded on).
 *
 * @param props                - Component props.
 * @param props.video          - The current video record.
 * @param props.onAddToNewPost - Click handler for the secondary action.
 * @return The card element.
 */
export default function ThumbnailCard( { video, onAddToNewPost }: Props ): ReactElement {
	const link = linkForVideo( video );
	const posterUrl = usePosterUrl( video );
	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();
	const updatePoster = useUpdateVideoPoster();
	const [ dialogOpen, setDialogOpen ] = useState( false );
	// True between a poster mutation resolving and the new thumbnail <img>
	// actually loading. Keeps the "Updating…" overlay up and the success
	// notice held back so the toast lines up with the visible change rather
	// than firing a beat early (while the browser is still fetching the image).
	const [ confirmingPoster, setConfirmingPoster ] = useState( false );

	const finishUpdate = useCallback( () => {
		setConfirmingPoster( false );
		createSuccessNotice( __( 'Thumbnail updated.', 'jetpack-videopress-pkg' ) );
	}, [ createSuccessNotice ] );

	// Safety net: if onLoad never reports back (identical URL, cache hit with no
	// event, or a load error) don't strand the UI in "Updating…".
	useEffect( () => {
		if ( ! confirmingPoster ) {
			return;
		}
		const timer = setTimeout( finishUpdate, POSTER_CONFIRM_TIMEOUT_MS );
		return () => clearTimeout( timer );
	}, [ confirmingPoster, finishUpdate ] );

	const notifyResult = {
		onSuccess: ( { poster }: { poster?: string } ) => {
			// The mutation already wrote the new poster into the cache, so the
			// <img> below is now pointing at it. Wait for that image to load
			// before clearing the overlay and notifying. With no poster (e.g.
			// generation polling exhausted) there's nothing to wait for.
			if ( poster ) {
				setConfirmingPoster( true );
			} else {
				finishUpdate();
			}
		},
		onError: () =>
			createErrorNotice( __( 'Failed to update thumbnail.', 'jetpack-videopress-pkg' ) ),
	};

	const confirmPosterLoad = () => {
		if ( confirmingPoster ) {
			finishUpdate();
		}
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

	let thumbnail: ReactElement | null = null;
	if ( posterUrl ) {
		thumbnail = (
			<img
				src={ posterUrl }
				alt=""
				width={ 240 }
				height={ 135 }
				className="vp-video-details__thumbnail"
				onLoad={ confirmPosterLoad }
				onError={ confirmPosterLoad }
			/>
		);
	} else if ( video.isProcessing ) {
		thumbnail = (
			<div className="vp-video-details__thumbnail vp-video-details__thumbnail-processing">
				<Text>{ __( 'Processing', 'jetpack-videopress-pkg' ) }</Text>
			</div>
		);
	}

	const showUpdateButton = canEditThumbnail( video );
	const isUpdating = updatePoster.isPending || confirmingPoster;

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="row" gap="md" align="start" className="vp-video-details__thumbnail-row">
					<div className="vp-video-details__thumbnail-wrapper">
						{ thumbnail }
						{ showUpdateButton && (
							<ThumbnailUpdateButton
								canSelectFromVideo={ Boolean( video.sourceUrl ) }
								canUploadImage={ Boolean( window.wp?.media ) }
								isBusy={ isUpdating }
								onSelectFromVideo={ () => setDialogOpen( true ) }
								onUploadImage={ handleUploadImage }
							/>
						) }
						{ isUpdating && (
							<div className="vp-video-details__thumbnail-updating">
								<Text>{ __( 'Updating…', 'jetpack-videopress-pkg' ) }</Text>
							</div>
						) }
					</div>
					<Stack direction="column" gap="md" className="vp-video-details__thumbnail-meta">
						<Button
							variant="outline"
							onClick={ onAddToNewPost }
							className="vp-video-details__primary-action"
						>
							{ __( 'Add video to new post', 'jetpack-videopress-pkg' ) }
						</Button>

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
					</Stack>
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

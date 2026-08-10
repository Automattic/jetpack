import { __ } from '@wordpress/i18n';
import { Field, Stack } from '@wordpress/ui';
import { useState } from 'react';
import { useUpdateVideoPoster } from '../../hooks/use-update-video-poster';
import { selectImageFromMediaLibrary } from '../../utils/select-image-from-media-library';
import SelectFrameDialog from './select-frame-dialog';
import ThumbnailUpdateButton from './thumbnail-update-button';
import type { LibraryItem } from '../../types/library';
import type { ReactElement } from 'react';

type Props = {
	video: LibraryItem;
};

// A poster can only be replaced on a transcoded VideoPress item: local
// attachments have no poster endpoint, and one still being processed has no
// stable frame to cut from.
const canEditThumbnail = ( video: LibraryItem ): boolean =>
	video.type === 'videopress' && ! video.isProcessing && Boolean( video.sourceUrl || video.guid );

/**
 * The control proper. Split from the guard below so the poster mutation and
 * its dialog state only exist while the control is actually on screen — a
 * `canEditThumbnail` guard placed after the hooks would change the hook count
 * the moment a video finishes processing.
 *
 * @param props       - Component props.
 * @param props.video - The current video record.
 * @return The menu button and its frame picker.
 */
function EditableThumbnailControl( { video }: Props ): ReactElement {
	const updatePoster = useUpdateVideoPoster();
	const [ dialogOpen, setDialogOpen ] = useState( false );

	const handleConfirmFrame = ( atTimeMs: number ) => {
		setDialogOpen( false );
		updatePoster.mutate( { id: video.id, guid: video.guid, source: 'frame', atTimeMs } );
	};

	const handleUploadImage = async () => {
		const attachment = await selectImageFromMediaLibrary().catch( () => null );
		if ( ! attachment ) {
			return;
		}
		updatePoster.mutate( {
			id: video.id,
			guid: video.guid,
			source: 'attachment',
			attachmentId: attachment.id,
		} );
	};

	return (
		<>
			{ /*
			 * The rule belongs to this control, not to the card, so a video
			 * that can't take a new poster doesn't leave a hairline dangling
			 * at the bottom of the card with nothing under it.
			 */ }
			<div className="vp-video-details__rule" />
			<Field.Root>
				{ /*
				 * `nativeLabel={ false }` with a <span>: the control below is a
				 * menu button, and a native <label> would hand it the label's
				 * hover and click behaviour.
				 */ }
				<Field.Label nativeLabel={ false } render={ <span /> }>
					{ __( 'Thumbnail', 'jetpack-videopress-pkg' ) }
				</Field.Label>
				<Stack direction="row" gap="sm" className="vp-video-details__actions">
					<ThumbnailUpdateButton
						canSelectFromVideo={ Boolean( video.sourceUrl ) }
						canUploadImage={ Boolean( ( window.wp as WpGlobal | undefined )?.media ) }
						isBusy={ updatePoster.isPending }
						onSelectFromVideo={ () => setDialogOpen( true ) }
						onUploadImage={ handleUploadImage }
					/>
				</Stack>
				<Field.Description>
					{ __(
						'Applies immediately — everything else on this page waits for Save.',
						'jetpack-videopress-pkg'
					) }
				</Field.Description>
			</Field.Root>
			<SelectFrameDialog
				src={ video.sourceUrl ?? '' }
				isOpen={ dialogOpen }
				onClose={ () => setDialogOpen( false ) }
				onConfirm={ handleConfirmFrame }
			/>
		</>
	);
}

/**
 * The Thumbnail row at the foot of the Video details card: its own leading
 * rule, a "Thumbnail" label, the "Update thumbnail" menu (Select from video /
 * Upload image), the frame picker it opens, and the poster mutation both
 * modes drive.
 *
 * Why it is fenced off rather than sitting flush with the fields above: this
 * is the one control in that card that does NOT go through Save. The poster
 * endpoint is keyed by GUID while the meta patch is keyed by attachment id,
 * and the mutation polls for up to 60s — folding it into Save would mean a
 * Save button that either spins for a minute or claims success while the
 * poster is still generating. Two honest save models beat one dishonest one,
 * so the rule and the caption say so out loud.
 *
 * Renders nothing at all — rule included, so no hairline is left dangling at
 * the bottom of the card — when the video can't take a new poster. A disabled
 * control would be wrong: there is no user action that would enable it.
 *
 * @param props       - Component props.
 * @param props.video - The current video record.
 * @return The row, or null when the video can't take a new poster.
 */
export default function ThumbnailControl( { video }: Props ): ReactElement | null {
	if ( ! canEditThumbnail( video ) ) {
		return null;
	}

	return <EditableThumbnailControl video={ video } />;
}

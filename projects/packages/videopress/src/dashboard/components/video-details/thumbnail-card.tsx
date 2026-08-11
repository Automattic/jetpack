import { __ } from '@wordpress/i18n';
import { Card, Field, Skeleton, Stack } from '@wordpress/ui';
import { useState } from 'react';
import { usePosterUrl } from '../../hooks/use-poster-url';
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
 * The card proper. Split from the guard below so the poster query, the
 * mutation and the dialog state only exist while the card is actually on
 * screen — a `canEditThumbnail` guard placed after the hooks would change the
 * hook count the moment a video finishes processing.
 *
 * @param props       - Component props.
 * @param props.video - The current video record.
 * @return The card element.
 */
function EditableThumbnailCard( { video }: Props ): ReactElement {
	const updatePoster = useUpdateVideoPoster();
	const posterUrl = usePosterUrl( video );
	const [ dialogOpen, setDialogOpen ] = useState( false );

	/*
	 * `usePosterUrl` returns null both when there is no poster at all and
	 * while a private video's playback token is still being minted — it can't
	 * tell the caller which. A stored `thumbnailUrl` with no resolved URL is
	 * the second case, and the only one worth a loading state.
	 */
	const isPosterPending = Boolean( video.thumbnailUrl ) && ! posterUrl;

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
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Thumbnail', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ /*
				 * No Field.Label — the card title already names this, and a
				 * second "Thumbnail" above the same control would be noise. The
				 * Field.Root/Field.Description pair is kept so the caption gets
				 * the same treatment as the help text under every other control
				 * on the page.
				 */ }
				<Field.Root>
					<Stack direction="row" gap="md" align="center" className="vp-video-details__thumbnail">
						<div className="vp-video-details__poster">
							{ posterUrl && (
								<img
									src={ posterUrl }
									alt={ __( 'Current thumbnail', 'jetpack-videopress-pkg' ) }
								/>
							) }
							{ isPosterPending && <Skeleton /> }
						</div>
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

/**
 * The Thumbnail card: the still this video is currently represented by, and
 * the "Update thumbnail" menu (Select from video / Upload image) that
 * replaces it, plus the frame picker that menu opens and the poster mutation
 * both modes drive.
 *
 * It is a card of its own rather than a row inside Video details for two
 * reasons. The obvious one is that showing the current poster next to the
 * control that changes it is the whole job, and a labelled row with a single
 * button in it — which is what this was — showed nothing at all. The other is
 * that this is the one control on the screen that does NOT go through Save:
 * the poster endpoint is keyed by GUID while the meta patch is keyed by
 * attachment id, and the mutation polls for up to 60s, so folding it into
 * Save would mean a button that either spins for a minute or claims success
 * while the poster is still generating. Two honest save models beat one
 * dishonest one, and a card boundary says so more clearly than the hairline
 * rule this used to draw for itself.
 *
 * Renders nothing when the video can't take a new poster. A disabled control
 * would be wrong: there is no user action that would enable it.
 *
 * @param props       - Component props.
 * @param props.video - The current video record.
 * @return The card, or null when the video can't take a new poster.
 */
export default function ThumbnailCard( { video }: Props ): ReactElement | null {
	if ( ! canEditThumbnail( video ) ) {
		return null;
	}

	return <EditableThumbnailCard video={ video } />;
}

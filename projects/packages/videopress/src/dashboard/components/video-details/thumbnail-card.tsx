import { __ } from '@wordpress/i18n';
import { media, upload } from '@wordpress/icons';
import { Card, Field, Skeleton, Stack, Text } from '@wordpress/ui';
import { useState } from 'react';
import { usePosterUrl } from '../../hooks/use-poster-url';
import { useUpdateVideoPoster } from '../../hooks/use-update-video-poster';
import { selectImageFromMediaLibrary } from '../../utils/select-image-from-media-library';
import SelectFrameDialog from './select-frame-dialog';
import ThumbnailTile from './thumbnail-tile';
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

	const isBusy = updatePoster.isPending;

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Thumbnail', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ /*
				 * No Field.Label — the card title already names this. The
				 * Field.Root/Field.Description pair is kept so the caption gets
				 * the same treatment as the help text under every other control
				 * on the page.
				 */ }
				<Field.Root>
					<Text className="vp-thumbnail-picker__intro">
						{ __( 'Pick the still that represents this video.', 'jetpack-videopress-pkg' ) }
					</Text>
					<Stack direction="row" gap="md" className="vp-thumbnail-picker">
						{ /*
						 * The current poster, shown at the same 16:9 size as the
						 * two actions so the row reads as a set. Solid-bordered
						 * rather than dashed: it is content, not an affordance.
						 */ }
						<div className="vp-thumbnail-picker__current">
							{ posterUrl && (
								<img
									src={ posterUrl }
									alt={ __( 'Current thumbnail', 'jetpack-videopress-pkg' ) }
								/>
							) }
							{ isPosterPending && <Skeleton /> }
							{ ! posterUrl && ! isPosterPending && (
								<span className="vp-thumbnail-picker__empty">
									{ __( 'No thumbnail yet', 'jetpack-videopress-pkg' ) }
								</span>
							) }
						</div>
						<ThumbnailTile
							icon={ upload }
							label={
								isBusy
									? __( 'Updating…', 'jetpack-videopress-pkg' )
									: __( 'Upload image', 'jetpack-videopress-pkg' )
							}
							disabled={ isBusy || ! ( window.wp as WpGlobal | undefined )?.media }
							onClick={ handleUploadImage }
						/>
						<ThumbnailTile
							icon={ media }
							label={ __( 'Select from video', 'jetpack-videopress-pkg' ) }
							disabled={ isBusy || ! video.sourceUrl }
							onClick={ () => setDialogOpen( true ) }
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
 * the two ways to replace it — Upload image (WP media modal) and Select from
 * video (frame scrubber) — as a row of 16:9 tiles.
 *
 * Tiles rather than a dropdown because the choice is visual. Both actions
 * produce an image, the current one is sitting right there to compare
 * against, and a menu hides all of that behind a label. This is the shape
 * YouTube Studio uses for the same two actions.
 *
 * It is a card of its own rather than a row inside Video details because this
 * is the one control on the screen that does NOT go through Save: the poster
 * endpoint is keyed by GUID while the meta patch is keyed by attachment id,
 * and the mutation polls for up to 60s. Folding it into Save would mean a
 * button that either spins for a minute or claims success while the poster is
 * still generating. Two honest save models beat one dishonest one, and a card
 * boundary says so more clearly than a hairline rule.
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

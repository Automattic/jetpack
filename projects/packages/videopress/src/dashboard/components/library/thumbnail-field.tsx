import { ProgressBar } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { usePosterUrl } from '../../hooks/use-poster-url';
import { formatDuration } from '../../utils/format';
import { useUploadActions } from './upload-actions-context';
import type { LibraryItem } from '../../types/library';

type Props = { item: LibraryItem };

/**
 * Render the media-area for one DataViews grid card. Layers (priority order):
 * 1. uploading / promoting / deleting → ProgressBar overlay
 * 2. failed    → red overlay with Retry
 * 3. local     → "Local video" placeholder + hover-revealed Upload button
 * 4. videopress → thumbnail image + duration badge + click/hover "Edit details"
 *
 * For idle VideoPress videos the whole thumbnail is a button that opens the
 * video's Details (mirroring Core, where clicking the media opens it), and the
 * shared `.vp-library__hover-action` overlay reveals an "Edit details" label on
 * hover/focus. Local videos keep their existing "Upload to VideoPress" button.
 *
 * @param props      - Component props.
 * @param props.item - The library item rendered by this card.
 * @return The thumbnail element.
 */
export default function ThumbnailField( { item }: Props ) {
	const { promoteLocal, retryUpload, openVideoDetails } = useUploadActions();
	const { type, upload, durationSeconds, id, title, isProcessing } = item;
	const posterUrl = usePosterUrl( item );

	const isVideoPressIdle = type === 'videopress' && upload.status === 'idle';

	return (
		<div className="vp-library__thumbnail">
			{ posterUrl ? (
				<img className="vp-library__thumbnail-image" src={ posterUrl } alt={ title } />
			) : null }

			{ isVideoPressIdle && isProcessing ? (
				<Stack
					direction="column"
					align="center"
					justify="center"
					className="vp-library__processing"
				>
					<Text>{ __( 'Processing', 'jetpack-videopress-pkg' ) }</Text>
				</Stack>
			) : null }

			{ isVideoPressIdle && durationSeconds > 0 ? (
				<span className="vp-library__thumbnail-duration-badge">
					{ formatDuration( durationSeconds ) }
				</span>
			) : null }

			{ isVideoPressIdle ? (
				<button
					type="button"
					className="vp-library__open-details"
					onClick={ () => openVideoDetails( id ) }
					aria-label={ sprintf(
						/* translators: %s: video title. */
						__( 'Edit details for %s', 'jetpack-videopress-pkg' ),
						title
					) }
				>
					{ /* Reuses the shared hover-action overlay; revealed on
					     hover/focus by the thumbnail's :hover / :focus-within. The
					     overlay is non-interactive (pointer-events: none) so the
					     whole thumbnail stays a single keyboard-reachable button. */ }
					<span className="vp-library__hover-action">
						<span className="vp-library__hover-action-label">
							{ __( 'Edit details', 'jetpack-videopress-pkg' ) }
						</span>
					</span>
				</button>
			) : null }

			{ type === 'local' && upload.status === 'idle' ? (
				<>
					<Stack
						direction="column"
						align="center"
						justify="center"
						className="vp-library__placeholder"
					>
						<Text>{ __( 'Local video', 'jetpack-videopress-pkg' ) }</Text>
					</Stack>
					<Stack
						direction="row"
						align="center"
						justify="center"
						className="vp-library__hover-action"
					>
						<Button variant="outline" size="compact" onClick={ () => promoteLocal( id ) }>
							{ __( 'Upload to VideoPress', 'jetpack-videopress-pkg' ) }
						</Button>
					</Stack>
				</>
			) : null }

			{ upload.status === 'uploading' ? (
				<Stack
					direction="column"
					gap="sm"
					align="center"
					justify="center"
					className="vp-library__progress"
				>
					<Text className="vp-library__progress-percent">{ Math.round( upload.progress ) }%</Text>
					<ProgressBar className="vp-library__progress-bar" value={ upload.progress } />
				</Stack>
			) : null }

			{ upload.status === 'promoting' || upload.status === 'deleting' ? (
				<Stack
					direction="column"
					gap="sm"
					align="center"
					justify="center"
					className="vp-library__progress"
				>
					<Text>
						{ upload.status === 'deleting'
							? __( 'Deleting…', 'jetpack-videopress-pkg' )
							: __( 'Uploading…', 'jetpack-videopress-pkg' ) }
					</Text>
					<ProgressBar className="vp-library__progress-bar" />
				</Stack>
			) : null }

			{ upload.status === 'failed' ? (
				<Stack
					direction="column"
					gap="xs"
					align="center"
					justify="center"
					className="vp-library__failed"
				>
					<Text>{ __( 'Upload failed', 'jetpack-videopress-pkg' ) }</Text>
					<Button size="compact" onClick={ () => retryUpload( id ) }>
						{ __( 'Retry', 'jetpack-videopress-pkg' ) }
					</Button>
				</Stack>
			) : null }
		</div>
	);
}

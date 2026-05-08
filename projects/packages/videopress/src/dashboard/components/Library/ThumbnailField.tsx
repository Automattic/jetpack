import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { formatDuration } from '../../utils/format';
import { useUploadActions } from './upload-actions-context';
import type { MockLibraryItem } from '../../types/library';

type Props = { item: MockLibraryItem };

/**
 * Render the media-area for one DataViews grid card. Layers (priority order):
 * 1. uploading → ProgressBar overlay
 * 2. failed    → red overlay with Retry
 * 3. local     → "Local video" placeholder + hover-revealed Upload button
 * 4. videopress → thumbnail image + duration badge
 *
 * @param props      - Component props.
 * @param props.item - The library item rendered by this card.
 * @return The thumbnail element.
 */
export default function ThumbnailField( { item }: Props ) {
	const { promoteLocal, retryUpload } = useUploadActions();
	const { type, upload, thumbnailUrl, durationSeconds, id, title } = item;

	return (
		<div className="vp-library__thumbnail">
			{ thumbnailUrl ? (
				<img className="vp-library__thumbnail-image" src={ thumbnailUrl } alt={ title } />
			) : null }

			{ type === 'videopress' && upload.status === 'idle' ? (
				<span className="vp-library__thumbnail-duration-badge">
					{ formatDuration( durationSeconds ) }
				</span>
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

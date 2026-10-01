import AdminPage from '@automattic/jetpack-components/admin-page';
import useConnectionErrorNotice, {
	ConnectionError,
} from '@automattic/jetpack-connection/use-connection-error-notice';
import { Breadcrumbs } from '@wordpress/admin-ui';
import { Notice, ProgressBar } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { useUpload } from '../../hooks/use-upload';
import { formatBytes } from '../../utils/format';
import { uploadToLibraryItem } from '../../utils/upload-to-library-item';
import PrivacySharingCard from './privacy-sharing-card';
import RatingCard from './rating-card';
import VideoDetailsCard from './video-details-card';
import type { UploadItem } from '../../hooks/use-upload';
import type { VideoDetailsPatch } from '../../types/library';

/**
 * Edit metadata locally until the upload creates its server-side attachment.
 *
 * @param props        - Component props.
 * @param props.upload - The current upload and its draft.
 * @return The upload details page.
 */
export default function UploadDetails( { upload }: { upload: UploadItem } ) {
	const { updateUploadDetails, retryUpload, retryUploadDetails } = useUpload();
	const { hasConnectionError } = useConnectionErrorNotice();
	const [ previewUrl, setPreviewUrl ] = useState< string >();
	const video = uploadToLibraryItem( upload );
	const update = ( patch: VideoDetailsPatch ) => updateUploadDetails( upload.id, patch );

	useEffect( () => {
		const url = URL.createObjectURL( upload.file );
		setPreviewUrl( url );
		return () => URL.revokeObjectURL( url );
	}, [ upload.file ] );

	let status: string = __( 'Waiting to upload…', 'jetpack-videopress-pkg' );
	if ( upload.status === 'uploading' ) {
		status =
			upload.progress >= 1
				? __( 'Finishing upload…', 'jetpack-videopress-pkg' )
				: sprintf(
						/* translators: %d: upload progress percentage. */
						__( 'Uploading %d%%', 'jetpack-videopress-pkg' ),
						Math.round( upload.progress * 100 )
					);
	} else if ( upload.status === 'success' ) {
		status = __( 'Saving video details…', 'jetpack-videopress-pkg' );
	}

	return (
		<AdminPage
			breadcrumbs={
				<div className="vp-video-details__breadcrumbs">
					<Breadcrumbs
						items={ [
							{ label: 'VideoPress', to: '/' },
							{ label: video.title.trim() || __( 'Untitled', 'jetpack-videopress-pkg' ) },
						] }
					/>
				</div>
			}
		>
			{ hasConnectionError && <ConnectionError trackingContext="videopress" /> }
			<div className="vp-video-details">
				<div className="vp-video-details__layout">
					<div className="vp-video-details__canvas">
						{ upload.detailsError && (
							<Notice status="error" isDismissible={ false }>
								<p>
									{ __(
										'Your video uploaded, but its details couldn’t be saved. Your edits are still here.',
										'jetpack-videopress-pkg'
									) }
								</p>
								<Button onClick={ () => retryUploadDetails( upload.id ) }>
									{ __( 'Retry saving details', 'jetpack-videopress-pkg' ) }
								</Button>
							</Notice>
						) }
						{ upload.status === 'failed' && (
							<Notice status="error" isDismissible={ false }>
								<p>
									{ __(
										'The upload failed. Retry to continue uploading with your edits.',
										'jetpack-videopress-pkg'
									) }
								</p>
								<Button onClick={ () => retryUpload( upload.id ) }>
									{ __( 'Retry upload', 'jetpack-videopress-pkg' ) }
								</Button>
							</Notice>
						) }
						{ ! upload.detailsError && upload.status !== 'failed' && (
							<Card.Root>
								<Card.Content>
									<Stack direction="column" gap="sm">
										<Text role="status">{ status }</Text>
										<ProgressBar value={ Math.round( upload.progress * 100 ) } />
										<Text>
											{ __(
												'Start editing now. Your details will be saved when the upload finishes. Keep this browser tab open.',
												'jetpack-videopress-pkg'
											) }
										</Text>
									</Stack>
								</Card.Content>
							</Card.Root>
						) }
						<VideoDetailsCard
							video={ video }
							title={ video.title }
							description={ video.description }
							onChange={ update }
							onOpenChapters={ () => {} }
							showChapters={ false }
						/>
						<Text>
							{ __(
								'Thumbnails, subtitles, and the video editor will be available after uploading.',
								'jetpack-videopress-pkg'
							) }
						</Text>
					</div>
					<div className="vp-video-details__upload-preview">
						{ /* This previews the local file before subtitles can be uploaded. */ }
						<video
							src={ previewUrl }
							controls
							preload="metadata"
							aria-label={ __( 'Video preview', 'jetpack-videopress-pkg' ) }
						/>
					</div>
					<aside
						className="vp-video-details__inspector"
						aria-label={ __( 'Video settings', 'jetpack-videopress-pkg' ) }
					>
						<Card.Root>
							<Card.Content>
								<Stack direction="column" gap="sm">
									<Text>{ video.filename }</Text>
									<Text>{ formatBytes( video.fileSizeBytes ) }</Text>
								</Stack>
							</Card.Content>
						</Card.Root>
						<PrivacySharingCard
							privacy={ video.privacy }
							displayEmbed={ video.displayEmbed }
							allowDownloads={ video.allowDownloads }
							onChange={ update }
						/>
						<RatingCard value={ video.rating } onChange={ rating => update( { rating } ) } />
					</aside>
				</div>
			</div>
		</AdminPage>
	);
}

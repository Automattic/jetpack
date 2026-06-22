/**
 * External dependencies
 */
import { ThemeProvider } from '@automattic/jetpack-components';
import { Button, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, media, trash, download, formatListBullets } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import CaptionManagerModal from '../../../components/caption-manager-modal';
import useVideo from '../../hooks/use-video';
import DeleteVideoConfirmationModal from '../delete-video-confirmation-modal';
import styles from './style.module.scss';
import type { VideoTextTrack } from '../../../lib/video-tracks/types';

const VideoDetailsActions = ( {
	disabled = false,
	videoId,
	onDelete,
}: {
	disabled?: boolean;
	videoId: string | number;
	onDelete: () => void;
} ) => {
	const [ showDeleteModal, setShowDeleteModal ] = useState( false );
	const [ showCaptionManagerModal, setShowCaptionManagerModal ] = useState( false );
	const [ captionTracks, setCaptionTracks ] = useState< VideoTextTrack[] >( [] );

	const {
		data: { guid, poster, posterImage, thumbnail, title, url },
		deleteVideo,
	} = useVideo( videoId );

	const nonce = window.jetpackVideoPressInitialState?.contentNonce ?? '';
	const newPostURL = addQueryArgs( 'post-new.php', {
		videopress_guid: guid,
		_wpnonce: nonce,
	} );

	const handleDelete = useCallback( async () => {
		setShowDeleteModal( false );
		await deleteVideo();
		onDelete();
	}, [ deleteVideo, onDelete ] );

	return (
		<>
			<Dropdown
				placement="bottom center"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						size="compact"
						variant="tertiary"
						disabled={ disabled }
						icon={ moreVertical }
						onClick={ onToggle }
						aria-expanded={ isOpen }
					/>
				) }
				renderContent={ ( { onClose } ) => (
					<ThemeProvider>
						<div className={ styles.dropdown }>
							<Button
								variant="tertiary"
								icon={ media }
								href={ newPostURL }
								target="_blank"
								disabled={ disabled }
								onClick={ onClose }
							>
								{ __( 'Add to new post', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="tertiary"
								icon={ download }
								href={ url }
								target="_blank"
								disabled={ disabled }
								onClick={ onClose }
							>
								{ __( 'Download file', 'jetpack-videopress-pkg' ) }
							</Button>
							<Button
								variant="tertiary"
								icon={ formatListBullets }
								disabled={ disabled || ! guid }
								onClick={ () => {
									setShowCaptionManagerModal( true );
									onClose();
								} }
							>
								{ __( 'Manage captions', 'jetpack-videopress-pkg' ) }
							</Button>
							<hr className={ styles.separator } />
							<Button
								variant="tertiary"
								icon={ trash }
								className={ styles.delete }
								disabled={ disabled }
								onClick={ () => {
									setShowDeleteModal( true );
									onClose();
								} }
							>
								{ __( 'Delete video', 'jetpack-videopress-pkg' ) }
							</Button>
						</div>
					</ThemeProvider>
				) }
			/>
			{ showDeleteModal && (
				<DeleteVideoConfirmationModal
					onClose={ () => setShowDeleteModal( false ) }
					onDelete={ handleDelete }
				/>
			) }
			{ showCaptionManagerModal && guid && (
				<CaptionManagerModal
					isOpen
					guid={ guid }
					title={ title }
					videoSrc={ url }
					poster={ posterImage ?? thumbnail ?? poster?.src ?? null }
					tracks={ captionTracks }
					onClose={ () => setShowCaptionManagerModal( false ) }
					onTracksChange={ setCaptionTracks }
				/>
			) }
		</>
	);
};

export default VideoDetailsActions;

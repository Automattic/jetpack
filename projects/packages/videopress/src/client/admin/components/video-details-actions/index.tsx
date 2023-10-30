/**
 * External dependencies
 */
import { Button, ThemeProvider } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, media, trash, download } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
import { useCallback, useState } from 'react';
/**
 * Internal dependencies
 */
import useVideo from '../../hooks/use-video';
import DeleteVideoConfirmationModal from '../delete-video-confirmation-modal';
import styles from './style.module.scss';

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

	const {
		data: { guid, url },
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
								weight="regular"
								fullWidth
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
								weight="regular"
								fullWidth
								variant="tertiary"
								icon={ download }
								href={ url }
								target="_blank"
								disabled={ disabled }
								onClick={ onClose }
							>
								{ __( 'Download file', 'jetpack-videopress-pkg' ) }
							</Button>
							<hr className={ styles.separator } />
							<Button
								weight="regular"
								fullWidth
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
		</>
	);
};

export default VideoDetailsActions;

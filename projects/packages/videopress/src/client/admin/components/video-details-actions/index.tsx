/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { moreVertical, media, trash } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
/**
 * Types
 */
import type { VideoGUID } from '../../../block-editor/blocks/video/types';

const VideoDetailsActions = ( {
	disabled = false,
	guid = null,
}: {
	disabled?: boolean;
	guid: VideoGUID;
} ) => {
	const nonce = window.jetpackVideoPressInitialState?.contentNonce ?? '';
	const newPostURL = addQueryArgs( 'post-new.php', {
		videopress_guid: guid,
		_wpnonce: nonce,
	} );

	return (
		<Dropdown
			position="bottom center"
			className={ styles.dropdown }
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
				<>
					<Button
						weight="regular"
						fullWidth
						variant="tertiary"
						icon={ media }
						href={ newPostURL }
						target="_blank"
						onClick={ onClose }
					>
						{ __( 'Add to new post', 'jetpack-videopress-pkg' ) }
					</Button>
					<hr className={ styles.separator } />
					<Button
						weight="regular"
						fullWidth
						variant="tertiary"
						icon={ trash }
						className={ styles.delete }
						onClick={ () => {
							onClose();
						} }
					>
						{ __( 'Delete video', 'jetpack-videopress-pkg' ) }
					</Button>
				</>
			) }
		/>
	);
};

export default VideoDetailsActions;

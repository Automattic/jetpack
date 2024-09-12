import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { doAction, hasAction } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import draftPostImage from '../../../../assets/images/draft-post.svg';
import { wpcomTrackEvent } from '../../../../common/tracks';
import NuxModal from '../nux-modal';
import './style.scss';

const CLOSE_EDITOR_ACTION = 'a8c.wpcom-block-editor.closeEditor';

const DraftPostModal = () => {
	const homeUrl = `/home/${ window.location.hostname }`;
	const [ isOpen, setIsOpen ] = useState( true );
	const closeModal = () => setIsOpen( false );
	const closeEditor = () => {
		if ( hasAction( CLOSE_EDITOR_ACTION ) ) {
			doAction( CLOSE_EDITOR_ACTION, homeUrl );
		} else {
			window.location.href = `https://wordpress.com${ homeUrl }`;
		}
	};

	return (
		<NuxModal
			isOpen={ isOpen }
			className="wpcom-block-editor-draft-post-modal"
			title={ __( 'Write your first post', 'jetpack-mu-wpcom' ) }
			description={ __(
				'It’s time to flex those writing muscles and start drafting your first post!',
				'jetpack-mu-wpcom'
			) }
			imageSrc={ draftPostImage }
			actionButtons={
				<>
					<Button isPrimary onClick={ closeModal }>
						{ __( 'Start writing', 'jetpack-mu-wpcom' ) }
					</Button>
					<Button isSecondary onClick={ closeEditor }>
						{ __( "I'm not ready", 'jetpack-mu-wpcom' ) }
					</Button>
				</>
			}
			onRequestClose={ closeModal }
			onOpen={ () => wpcomTrackEvent( 'calypso_editor_wpcom_draft_post_modal_show' ) }
		/>
	);
};

export default DraftPostModal;

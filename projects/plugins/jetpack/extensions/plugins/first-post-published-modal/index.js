import { Modal, Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';

export const name = 'first-post-published-modal';

export const settings = {
	render: function FirstPostPublishedModal() {
		// First Post Published Modal Logic
		const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
		const { link } = useSelect( select => select( 'core/editor' ).getCurrentPost() );
		const isCurrentPostPublished = useSelect(
			select => select( editorStore ).isCurrentPostPublished(),
			[]
		);
		const shouldShowFirstPostPublishedModal = useSelect( select =>
			select( 'automattic/wpcom-welcome-guide' ).getShouldShowFirstPostPublishedModal()
		);
		const {
			fetchShouldShowFirstPostPublishedModal,
			setShouldShowFirstPostPublishedModal,
		} = useDispatch( 'automattic/wpcom-welcome-guide' );
		const prevIsCurrentPostPublished = useRef( isCurrentPostPublished );
		const [ displayFirstPostPublishedModal, setDisplayFirstPostPublishedModal ] = useState( false );
		// We use this state as a flag to manually handle the modal close on first post publish
		const [ isInitialPostPublish, setIsInitialPostPublish ] = useState( false );

		useEffect( () => {
			fetchShouldShowFirstPostPublishedModal();
		}, [ fetchShouldShowFirstPostPublishedModal ] );

		useEffect( () => {
			// If the user is set to see the first post modal and current post status changes to publish,
			// open the post publish modal
			if (
				shouldShowFirstPostPublishedModal &&
				! prevIsCurrentPostPublished.current &&
				isCurrentPostPublished &&
				postType === 'post'
			) {
				prevIsCurrentPostPublished.current = isCurrentPostPublished;
				setShouldShowFirstPostPublishedModal( false );

				// When the post published panel shows, it is focused automatically.
				// Thus, we need to delay open the modal so that the modal would not be close immediately
				// because the outside of modal is focused
				window.setTimeout( () => {
					setDisplayFirstPostPublishedModal( true );
				} );
			}
		}, [
			postType,
			shouldShowFirstPostPublishedModal,
			isCurrentPostPublished,
			setShouldShowFirstPostPublishedModal,
		] );

		return (
			displayFirstPostPublishedModal && (
				<Modal
					isDismissible={ true }
					className="post__publish-modal"
					onRequestClose={ () => {
						// bypass the onRequestClose function the first time it's called when you publish a post because
						// it closes the modal immediately
						if ( isInitialPostPublish ) {
							setIsInitialPostPublish( false );
							return;
						}
						setDisplayFirstPostPublishedModal( false );
						// TODO: Record new tracks event
						// recordTracksEvent( 'jetpack_launchpad_save_modal_close' );
					} }
				>
					<div className="post__publish-modal-body">
						<div className="post__publish-modal-text">
							<h1 className="post__publish-modal-heading">
								{ ' ' }
								{ __( 'Great progress!', 'jetpack' ) }{ ' ' }
							</h1>
							<p className="post__publish-modal-message">
								{ __(
									'Congratulations! You did it. View your post to see how it will look on your site.',
									'jetpack'
								) }
							</p>
						</div>
						<div className="post__publish-modal-controls">
							<div className="post__publish-modal-buttons">
								<Button
									variant="secondary"
									onClick={ () => {
										setDisplayFirstPostPublishedModal( false );
										// TODO: Record new tracks event
										// recordTracksEvent( 'jetpack_launchpad_save_modal_back_to_edit' );
									} }
								>
									{ __( 'Back to Edit', 'jetpack' ) }
								</Button>
								<Button variant="primary" href={ link } target="_top">
									{ __( 'View Post', 'jetpack' ) }
								</Button>
							</div>
						</div>
					</div>
				</Modal>
			)
		);
	},
};

import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Modal, Button, CheckboxControl } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';

export const name = 'launchpad-save-modal';

export const settings = {
	// TODO: Rename LaunchpadSaveModal to something more generic
	render: function LaunchpadSaveModal() {
		// First Post Published Modal
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

		// Launchpad Modal
		const isSavingSite = useSelect(
			select => select( editorStore ).isSavingNonPostEntityChanges(),
			[]
		);
		const isSavingPost = useSelect( select => select( editorStore ).isSavingPost(), [] );
		const prevIsSavingSite = usePrevious( isSavingSite );
		const prevIsSavingPost = usePrevious( isSavingPost );

		// We use this state as a flag to manually handle the modal close on first post publish
		const [ isInitialPostPublish, setIsInitialPostPublish ] = useState( false );

		const [ displayLaunchpadModal, setDisplayLaunchpadModal ] = useState( false );
		const [ dontShowAgain, setDontShowAgain ] = useState( false );
		const [ isChecked, setIsChecked ] = useState( false );

		const { launchpadScreenOption, siteIntentOption } = window?.Jetpack_LaunchpadSaveModal || {};
		const isInsideSiteEditor = document.getElementById( 'site-editor' ) !== null;
		const isInsidePostEditor = document.querySelector( '.block-editor' ) !== null;

		const siteFragment = getSiteFragment();
		const launchPadUrl = getRedirectUrl( `wpcom-launchpad-setup-${ siteIntentOption }`, {
			query: `siteSlug=${ siteFragment }`,
		} );

		const { tracks } = useAnalytics();

		const recordTracksEvent = eventName =>
			tracks.recordEvent( eventName, {
				site_intent: siteIntentOption,
				launchpad_screen: launchpadScreenOption,
				dont_show_again: isChecked,
				editor_type: isInsideSiteEditor ? 'site' : 'post',
			} );

		useEffect( () => {
			if (
				( prevIsSavingSite === true && isSavingSite === false ) ||
				( prevIsSavingPost === true && isSavingPost === false )
			) {
				setDisplayLaunchpadModal( true );
			}
		}, [ isSavingSite, prevIsSavingSite, isSavingPost, prevIsSavingPost ] );

		useEffect( () => {
			// if the isCurrentPostPublished is ever false it means this current post hasn't been published yet so we set the initialPostPublish state
			if ( isCurrentPostPublished === false ) {
				setIsInitialPostPublish( true );
			}
		}, [ isCurrentPostPublished ] );

		const showModal =
			( ( isInsidePostEditor && isCurrentPostPublished ) || isInsideSiteEditor ) &&
			launchpadScreenOption === 'full' &&
			! dontShowAgain &&
			displayLaunchpadModal;

		const firstPostPublishedModal = (
			<Modal
				isDismissible={ true }
				className="post__publish-modal"
				onRequestClose={ () => {
					// bypass the onRequestClose function the first time it's called when you publish a post because it closes the modal immediately
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
		);

		const launchpadModal = (
			<Modal
				isDismissible={ true }
				className="launchpad__save-modal"
				onRequestClose={ () => {
					// bypass the onRequestClose function the first time it's called when you publish a post because it closes the modal immediately
					if ( isInitialPostPublish ) {
						setIsInitialPostPublish( false );
						return;
					}
					setDisplayLaunchpadModal( false );
					setDontShowAgain( isChecked );
					recordTracksEvent( 'jetpack_launchpad_save_modal_close' );
				} }
			>
				<div className="launchpad__save-modal-body">
					<div className="launchpad__save-modal-text">
						<h1 className="launchpad__save-modal-heading">
							{ __( 'Great progress!', 'jetpack' ) }
						</h1>
						<p className="launchpad__save-modal-message">
							{ __(
								'You are one step away from bringing your site to life. Check out the next steps that will help you to launch your site.',
								'jetpack'
							) }
						</p>
					</div>
					<div className="launchpad__save-modal-controls">
						<CheckboxControl
							label={ __( "Don't show this again.", 'jetpack' ) }
							checked={ isChecked }
							onChange={ () => setIsChecked( ! isChecked ) }
						/>
						<div className="launchpad__save-modal-buttons">
							<Button
								variant="secondary"
								onClick={ () => {
									setDontShowAgain( isChecked );
									setDisplayLaunchpadModal( false );
									recordTracksEvent( 'jetpack_launchpad_save_modal_back_to_edit' );
								} }
							>
								{ __( 'Back to Edit', 'jetpack' ) }
							</Button>
							<Button
								variant="primary"
								href={ launchPadUrl }
								onClick={ () => recordTracksEvent( 'jetpack_launchpad_save_modal_next_steps' ) }
								target="_top"
							>
								{ __( 'Next Steps', 'jetpack' ) }
							</Button>
						</div>
					</div>
				</div>
			</Modal>
		);

		if ( displayFirstPostPublishedModal ) {
			return firstPostPublishedModal;
		} else if ( showModal ) {
			return launchpadModal;
		}

		return null;
	},
};

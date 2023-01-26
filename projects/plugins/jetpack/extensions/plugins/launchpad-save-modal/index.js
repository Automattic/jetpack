import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Modal, Button, CheckboxControl } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';

export const name = 'launchpad-save-modal';

export const settings = {
	render: function LaunchpadSaveModal() {
		const isSavingSite = useSelect(
			select => select( editorStore ).isSavingNonPostEntityChanges(),
			[]
		);
		const isSavingPost = useSelect( select => select( editorStore ).isSavingPost(), [] );
		const isCurrentPostPublished = useSelect(
			select => select( editorStore ).isCurrentPostPublished(),
			[]
		);

		const prevIsSavingSite = usePrevious( isSavingSite );
		const prevIsSavingPost = usePrevious( isSavingPost );

		// We use this state as a flag to manually handle the modal close on first post publish
		const [ isInitialPostPublish, setIsInitialPostPublish ] = useState( false );

		const [ isModalOpen, setIsModalOpen ] = useState( false );
		const [ dontShowAgain, setDontShowAgain ] = useState( false );
		const [ isChecked, setIsChecked ] = useState( false );

		const { launchpadScreenOption, siteIntentOption } = window?.Jetpack_LaunchpadSaveModal || {};
		const isInsideSiteEditor = document.getElementById( 'site-editor' ) !== null;
		const isInsidePostEditor = document.querySelector( '.block-editor' ) !== null;

		const siteFragment = getSiteFragment();
		const launchPadUrl = getRedirectUrl( `wpcom-launchpad-setup`, {
			siteIntent: siteIntentOption,
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
				setIsModalOpen( true );
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
			isModalOpen;

		return (
			showModal && (
				<Modal
					isDismissible={ true }
					className="launchpad__save-modal"
					onRequestClose={ () => {
						// bypass the onRequestClose function the first time it's called when you publish a post because it closes the modal immediately
						if ( isInitialPostPublish ) {
							setIsInitialPostPublish( false );
							return;
						}
						setIsModalOpen( false );
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
										setIsModalOpen( false );
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
			)
		);
	},
};

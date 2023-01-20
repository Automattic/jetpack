import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment, useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Modal, Button, CheckboxControl } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isModalSupportedByFlow } from './util';
import './editor.scss';

export const name = 'launchpad-save-modal';

export const settings = {
	render: function LaunchpadSaveModal() {
		const isSavingSite = useSelect(
			select => select( editorStore ).isSavingNonPostEntityChanges(),
			[]
		);
		const isSavingPost = useSelect( select => select( editorStore ).isSavingPost(), [] );

		const prevIsSavingSite = usePrevious( isSavingSite );
		const prevIsSavingPost = usePrevious( isSavingPost );
		const [ isModalOpen, setIsModalOpen ] = useState( false );
		const [ dontShowAgain, setDontShowAgain ] = useState( false );
		const [ isChecked, setIsChecked ] = useState( false );

		const { launchpadScreenOption, siteIntentOption } = window?.Jetpack_LaunchpadSaveModal || {};
		const isInsidePostEditor = document.querySelector( '.block-editor' ) !== null;
		const isInsideSiteEditor = document.getElementById( 'site-editor' ) !== null;

		const siteFragment = getSiteFragment();
		const launchPadUrl = getRedirectUrl( 'wpcom-launchpad-setup-link-in-bio', {
			query: `siteSlug=${ siteFragment }`,
		} );
		const { tracks } = useAnalytics();

		const recordTracksEvent = eventName =>
			tracks.recordEvent( eventName, {
				launchpad_screen: launchpadScreenOption,
				site_intent: siteIntentOption,
			} );

		useEffect( () => {
			const siteEditorSaved = prevIsSavingSite === true && isSavingSite === false;
			const postEditorSaved = prevIsSavingPost === true && isSavingPost === false;

			if ( siteEditorSaved || postEditorSaved ) {
				/* When the user publishes their first post in the post editor, for some reason it triggers the onRequestClose function which immediately closes the modal
				 * It might have to do with the URL changing from /post-new.php to /post.php and potentially unmounting the component
				 * A simple workaround I found to be working is to delay the rendering of the modal so the URL has already been changed by then
				 */
				setTimeout( () => {
					setIsModalOpen( true );
				}, 200 );
			}
		}, [ isSavingSite, prevIsSavingSite, isSavingPost, prevIsSavingPost ] );

		const showModal =
			isModalSupportedByFlow( siteIntentOption ) &&
			( isInsidePostEditor || isInsideSiteEditor ) &&
			launchpadScreenOption === 'full' &&
			! dontShowAgain &&
			isModalOpen;

		return (
			showModal && (
				<Modal
					isDismissible={ true }
					className="launchpad__save-modal"
					onRequestClose={ () => {
						if ( ! window.location.href.includes( 'post-new' ) ) {
							setIsModalOpen( false );
							setDontShowAgain( isChecked );
							const eventName = isInsidePostEditor
								? 'wpcom_block_editor_launchpad_modal_close'
								: 'site_editor_launchpad_modal_close';
							recordTracksEvent( eventName );
						}
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
										const eventName = isInsidePostEditor
											? 'wpcom_block_editor_launchpad_modal_back_to_edit'
											: 'site_editor_launchpad_modal_back_to_edit';
										recordTracksEvent( eventName );
									} }
								>
									{ __( 'Back to Edit', 'jetpack' ) }
								</Button>
								<Button
									variant="primary"
									onClick={ () => {
										const eventName = isInsidePostEditor
											? 'wpcom_block_editor_launchpad_modal_next_steps'
											: 'site_editor_launchpad_modal_next_steps';
										recordTracksEvent( eventName );
										window.location.assign( launchPadUrl );
									} }
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

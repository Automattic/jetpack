import { getRedirectUrl } from '@automattic/jetpack-components';
import { getSiteFragment } from '@automattic/jetpack-shared-extension-utils';
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
		const isSaving = useSelect(
			select => select( editorStore ).isSavingNonPostEntityChanges(),
			[]
		);
		const prevIsSaving = usePrevious( isSaving );
		const [ isModalOpen, setIsModalOpen ] = useState( false );
		const [ dontShowAgain, setDontShowAgain ] = useState( false );
		const [ isChecked, setIsChecked ] = useState( false );

		const { launchpadScreenOption, siteIntentOption } = window?.Jetpack_LaunchpadSaveModal || {};
		const isInsideSiteEditor = window.location.href.includes( 'site-editor' );

		const siteFragment = getSiteFragment();
		const launchPadUrl = getRedirectUrl( 'wpcom-launchpad-setup-link-in-bio', {
			query: `siteSlug=${ siteFragment }`,
		} );

		useEffect( () => {
			if ( prevIsSaving === true && isSaving === false ) {
				setIsModalOpen( true );
			}
		}, [ isSaving, prevIsSaving ] );

		const showModal =
			isInsideSiteEditor &&
			launchpadScreenOption === 'full' &&
			siteIntentOption === 'link-in-bio' &&
			! dontShowAgain &&
			isModalOpen;

		return (
			showModal && (
				<Modal
					isDismissible={ true }
					className="launchpad__save-modal"
					onRequestClose={ () => {
						setIsModalOpen( false );
						setDontShowAgain( isChecked );
					} }
				>
					<div className="launchpad__save-modal-body">
						<div className="launchpad__save-modal-text">
							<h1 className="launchpad__save-modal-heading">
								{ __( 'Your site is ready to launch!', 'jetpack' ) }
							</h1>
							<p className="launchpad__save-modal-message">
								{ __(
									'Launching your Link in Bio will allow you to share a link with others and promote your site.',
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
									} }
								>
									{ __( 'Back to Edit', 'jetpack' ) }
								</Button>
								<Button variant="primary" href={ launchPadUrl } target="_top">
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

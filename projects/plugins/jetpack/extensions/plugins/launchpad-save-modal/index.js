/* global currentSite */

import { Modal, Button } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
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
		const [ , siteSlug ] = currentSite.siteUrlOption.split( '//' );

		useEffect( () => {
			if ( prevIsSaving === true && isSaving === false ) {
				setIsModalOpen( true );
			}
		}, [ isSaving, prevIsSaving ] );

		const showModal =
			currentSite.launchpadScreenOption === 'full' &&
			currentSite.siteIntentOption === 'link-in-bio' &&
			isModalOpen;

		return (
			showModal && (
				<Modal
					isDismissible={ true }
					className="launchpad__save-modal"
					onRequestClose={ () => setIsModalOpen( false ) }
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
						<div className="launchpad__save-modal-buttons">
							<Button size="normal" variant="secondary" onClick={ () => setIsModalOpen( false ) }>
								{ __( 'Back to Edit', 'jetpack' ) }
							</Button>
							<Button
								size="normal"
								variant="primary"
								onClick={ () => {
									window.top.location.href = `https://www.wordpress.com/setup/link-in-bio/launchpad?siteSlug=${ siteSlug }`;
								} }
							>
								{ __( 'Launch Site', 'jetpack' ) }
							</Button>
						</div>
					</div>
				</Modal>
			)
		);
	},
};

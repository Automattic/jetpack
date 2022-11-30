/**
 * External dependencies
 */
import { Modal, Button } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import './editor.scss';

export const name = 'launchpad-post-save-modal';

export const settings = {
	render: function LaunchpadPostSaveModal() {
		const isSaving = useSelect(
			select => select( editorStore ).isSavingNonPostEntityChanges(),
			[]
		);
		const prevIsSaving = usePrevious( isSaving );
		const [ showModal, setShowModal ] = useState( false );
		const siteSlug = window.location.hostname;

		useEffect( () => {
			if ( prevIsSaving === true && isSaving === false ) {
				setShowModal( true );
			}
		}, [ isSaving, prevIsSaving ] );

		return (
			showModal && (
				<Modal
					isDismissible={ true }
					className="launchpad__post-save-modal"
					onRequestClose={ () => setShowModal( false ) }
				>
					<div className="launchpad__post-save-modal-body">
						<div className="launchpad__post-save-modal-text">
							<h1 className="launchpad__post-save-modal-heading">
								{ __( 'Your site is ready to launch!', 'jetpack' ) }
							</h1>
							<p className="launchpad__post-save-modal-message">
								{ __(
									'Launching your Link in Bio will allow you to share a link with others and promote your site.',
									'jetpack'
								) }
							</p>
						</div>
						<div className="launchpad__post-save-modal-buttons">
							<Button size="normal" variant="secondary" onClick={ () => setShowModal( false ) }>
								{ ' ' }
								Back to Edit{ ' ' }
							</Button>
							<Button
								size="normal"
								variant="primary"
								onClick={ () => {
									window.top.location.href = `https://www.wordpress.com/setup/link-in-bio/launchpad?siteSlug=${ siteSlug }`;
								} }
							>
								{ ' ' }
								Launch Site{ ' ' }
							</Button>
						</div>
					</div>
				</Modal>
			)
		);
	},
};

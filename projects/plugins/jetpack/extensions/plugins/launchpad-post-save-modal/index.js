/**
 * External dependencies
 */
import { Modal, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from 'react';
import './editor.scss';

export const name = 'launchpad-post-save-modal';

export const settings = {
	render: function LaunchpadPostSaveModal() {
		const isPostPublished = useSelect(
			select => select( editorStore ).isCurrentPostPublished(),
			[]
		);
		const [ showModal, setShowModal ] = useState( false );

		useEffect( () => {
			setShowModal( true );
		}, [ isPostPublished ] );

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
							<Button size="normal" variant="secondary" onClick={ () => {} }>
								{ ' ' }
								Back to Edit{ ' ' }
							</Button>
							<Button size="normal" variant="primary" onClick={ () => {} }>
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

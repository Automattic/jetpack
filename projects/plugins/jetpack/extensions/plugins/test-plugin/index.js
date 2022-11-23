/**
 * External dependencies
 */
import { Modal, Button } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from 'react';

export const name = 'test-plugin';

export const settings = {
	render: function PluginPostPublishPanelQRPost() {
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
					className="learn-how-modal"
					onRequestClose={ () => setShowModal( false ) }
				>
					<h1>{ __( 'Your site is ready to launch!', 'jetpack' ) }</h1>
					<p>
						{ __(
							'Launching your Link in Bio will allow you to share a link with others and promote your site.',
							'jetpack'
						) }
					</p>
					<div>
						<Button size="normal" variant="primary" onClick={ () => {} }>
							{ ' ' }
							Back to Edit{ ' ' }
						</Button>
						<Button size="normal" variant="secondary" onClick={ () => {} }>
							{ ' ' }
							Launch Site{ ' ' }
						</Button>
					</div>
				</Modal>
			)
		);
	},
};

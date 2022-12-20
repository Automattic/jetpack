import { Modal } from '@wordpress/components';
import { useState } from '@wordpress/element';

export default function MembershipsModal( props ) {
	const { text = '', url = null } = props;

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => {
		setOpen( true );
		// Listen for messages from the iframe.
		window.addEventListener( 'message', handleIframeResult );
	};

	const closeModal = evt => {
		// If the user clicks on the iframe, don't close the modal. (Loop through all the iframes
		// and check if the user clicked on one of them.)
		if ( evt && evt.type === 'blur' ) {
			for ( const el of document.querySelectorAll( '.jetpack-memberships-modal iframe' ) ) {
				if ( document.activeElement === el ) {
					return;
				}
			}
		}
		setOpen( false );
		window.removeEventListener( 'message', handleIframeResult );
	};

	function handleIframeResult( evt ) {
		if ( evt.origin !== 'https://subscribe.wordpress.com' || ! evt.data ) {
			return;
		}

		const data = JSON.parse( evt.data );
		if ( data && data.action === 'close' ) {
			closeModal();
		}
	}

	return (
		<>
			<button onClick={ openModal }>{ text }</button>
			{ isOpen && (
				<Modal
					onRequestClose={ closeModal }
					__experimentalHideHeader={ true }
					isFullScreen={ true }
					className="jetpack-memberships-modal"
				>
					{ url && <iframe title="subscribe-iframe" src={ url } /> }
				</Modal>
			) }
		</>
	);
}

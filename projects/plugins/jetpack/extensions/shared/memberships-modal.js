import { Modal } from '@wordpress/components';
import { createRef, useState } from '@wordpress/element';
import { useEffect } from 'react';

export default function MembershipsModal( props ) {
	const { text = '', uniqueId = '', url = null } = props;

	const modalRef = createRef();

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	// Listen for messages from the iframe & close the modal if the user clicks off it.
	useEffect( () => {
		const ref = modalRef.current;
		const clickCallback = e => {
			// Close the modal if the user clicks outside of the iframe.
			if ( e.target === ref ) {
				closeModal();
			}
		};
		if ( isOpen ) {
			window.addEventListener( 'message', handleIframeResult );
			ref?.addEventListener( 'click', clickCallback );
		}
		return () => {
			window.removeEventListener( 'message', handleIframeResult );
			ref?.removeEventListener( 'click', clickCallback );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isOpen ] );

	/**
	 * Handle different messages from iframe.
	 *
	 * @param {*} evt
	 */
	function handleIframeResult( evt ) {
		if ( evt.origin !== 'https://subscribe.wordpress.com' || ! evt.data ) {
			return;
		}

		// Handle the close action.
		const data = JSON.parse( evt.data );
		if ( data && data.action === 'close' ) {
			closeModal();
		}

		// Handle the resize action.
		if ( data && data.action === 'resize' && data.height ) {
			modalRef.current.querySelector( 'iframe' ).setAttribute( 'height', data.height );
		}
	}

	const iframeLoaded = () => {
		modalRef?.current.classList.add( 'loaded' );
	};

	return (
		<>
			<button id={ uniqueId } onClick={ openModal }>
				{ text }
			</button>
			{ isOpen && (
				<Modal
					ref={ modalRef }
					onRequestClose={ closeModal }
					shouldCloseOnClickOutside={ false }
					__experimentalHideHeader={ true }
					// isFullScreen={ true }
					className="jetpack-memberships-modal"
				>
					<div class="lds-ring">
						<div></div>
						<div></div>
						<div></div>
						<div></div>
					</div>
					{ url && <iframe title="subscribe-iframe" src={ url } onLoad={ iframeLoaded } /> }
				</Modal>
			) }
		</>
	);
}

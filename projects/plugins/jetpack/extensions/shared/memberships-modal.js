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
		const clickCallback = (e) => {
			// Close the modal if the user clicks outside of the iframe.
			if ( e.target === modalRef.current ) {
				closeModal();
			}
		};
		if ( isOpen ) {
			window.addEventListener( 'message', handleIframeResult );
			modalRef?.current?.addEventListener( 'click', clickCallback );
		}
		return () => {
			window.removeEventListener( 'message', handleIframeResult );
			modalRef?.current?.removeEventListener( 'click', clickCallback );
		};
	}, [ isOpen ] );

	function handleIframeResult( evt ) {
		if ( evt.origin !== 'https://subscribe.wordpress.com' || ! evt.data ) {
			return;
		}

		const data = JSON.parse( evt.data );
		if ( data && data.action === 'close' ) {
			closeModal();
		}
	}

	const iframeLoaded = ( evt ) => {
		modalRef?.current.classList.add( 'loaded' );
	}

	return (
		<>
			<button id={ uniqueId } onClick={ openModal }>{ text }</button>
			{ isOpen && (
				<Modal
					ref={ modalRef }
					onRequestClose={ closeModal }
					shouldCloseOnClickOutside={ false }
					__experimentalHideHeader={ true }
					// isFullScreen={ true }
					className="jetpack-memberships-modal"
				>
					<div class="lds-ring"><div></div><div></div><div></div><div></div></div>
					{ url && <iframe scrolling="yes" title="subscribe-iframe" src={ url } onLoad={ iframeLoaded }/> }
				</Modal>
			) }
		</>
	);
}

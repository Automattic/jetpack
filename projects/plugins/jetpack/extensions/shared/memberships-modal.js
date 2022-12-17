import { useState } from '@wordpress/element';
import { Modal } from '@wordpress/components';


export default function MembershipsModal( props ) {
	console.info( props );
	const { text = '', url = null } = props;

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = ( evt ) => {
		// If the user clicks on the iframe, don't close the modal.
		if ( document.activeElement == document.querySelectorAll( '.jetpack-memberships-modal iframe' )[ 0 ] ) {
			return;
		}
		console.log( 'closing modal', evt );
		setOpen( false );
	};

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
					{ url && (
						<iframe src={ url } />
					) }
				</Modal>
			) }
		</>
	);
}

import { Modal } from '@wordpress/components';
import React, { useState, useCallback } from 'react';
import styles from './styles.module.scss';

/**
 * Wrapper for the IDC Screen to display it in a modal.
 *
 * @returns {React.Component|null} The IDC Screen modal component.
 */
function IDCModal() {
	const [ isOpen, setOpen ] = useState( true );

	const closeModal = useCallback( () => setOpen( false ), [] );

	if ( ! isOpen ) {
		return null;
	}

	if ( ! window.hasOwnProperty( 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
		return null;
	}

	const { containerID, isSafeModeConfirmed } = window.JP_IDENTITY_CRISIS__INITIAL_STATE;

	if ( ! containerID || isSafeModeConfirmed ) {
		return null;
	}

	return (
		<Modal onRequestClose={ closeModal } overlayClassName={ styles.modal }>
			<div id={ containerID } className={ styles.container }></div>
		</Modal>
	);
}

export default IDCModal;

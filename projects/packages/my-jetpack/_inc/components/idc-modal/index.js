import { Modal } from '@wordpress/components';
import React from 'react';
import styles from './styles.module.scss';

/**
 * Wrapper for the IDC Screen to display it in a modal.
 *
 * @returns {React.Component|null} The IDC Screen modal component.
 */
function IDCModal() {
	if ( ! window.hasOwnProperty( 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
		return null;
	}

	const { containerID, isSafeModeConfirmed } = window.JP_IDENTITY_CRISIS__INITIAL_STATE;

	if ( ! containerID || isSafeModeConfirmed ) {
		return null;
	}

	return (
		<Modal isDismissible={ false } overlayClassName={ styles.modal }>
			<div id={ containerID } className={ styles.container }></div>
		</Modal>
	);
}

export default IDCModal;

import {
	CONNECTION_FROM,
	CONNECTION_STORE_ID,
	IdentityCrisis,
} from '@automattic/jetpack-connection';
import { Modal } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from 'react';
import styles from './styles.module.scss';

/**
 * Wrapper for the IDC Screen to display it in a modal.
 *
 * @return {import('react').Component|null} The IDC Screen modal component.
 */
function IDCModal() {
	const [ isOpen, setOpen ] = useState( true );
	// An older shared script has neither the selector nor the screen.
	const identityCrisis = useSelect(
		select => select( CONNECTION_STORE_ID ).getIdentityCrisis?.() ?? null,
		[]
	);

	const closeModal = useCallback( () => setOpen( false ), [] );

	if ( ! isOpen ) {
		return null;
	}

	if ( identityCrisis?.useNewScreen && typeof IdentityCrisis === 'function' ) {
		if ( identityCrisis.isSafeModeConfirmed ) {
			return null;
		}

		return (
			<Modal onRequestClose={ closeModal } overlayClassName={ styles.modal }>
				<div className={ styles[ 'new-screen' ] }>
					<IdentityCrisis
						context="my-jetpack"
						redirectUri="admin.php?page=my-jetpack"
						from={ CONNECTION_FROM.myJetpackSafeMode }
						onDismiss={ closeModal }
					/>
				</div>
			</Modal>
		);
	}

	if ( ! Object.hasOwn( window, 'JP_IDENTITY_CRISIS__INITIAL_STATE' ) ) {
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

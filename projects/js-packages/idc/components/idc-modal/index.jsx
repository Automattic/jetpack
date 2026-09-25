import { Modal } from '@wordpress/components';
import { useState, useCallback } from 'react';
import styles from './styles.module.scss';

/**
 * Container for the Safe Mode (identity crisis) screen, shown in a modal.
 *
 * The connection package's own script mounts the screen into this container
 * once IDC state carries a `containerID` and safe mode isn't confirmed yet.
 *
 * @return {import('react').ReactElement|null} The IDC Screen modal component.
 */
function IDCModal() {
	const [ isOpen, setOpen ] = useState( true );

	const closeModal = useCallback( () => setOpen( false ), [] );

	if ( ! isOpen ) {
		return null;
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
			<div id={ containerID } className={ styles.container } data-testid="jp-idc-modal-container" />
		</Modal>
	);
}

export default IDCModal;

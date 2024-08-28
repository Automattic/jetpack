import { ThemeProvider } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';

/**
 * Share status modal component.
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareStatusModal() {
	const { closeShareStatusModal } = useDispatch( socialStore );

	return (
		<Modal
			className={ styles.modal }
			onRequestClose={ closeShareStatusModal }
			title={ __( 'Share status', 'jetpack' ) }
		>
			Content goes here
		</Modal>
	);
}

/**
 * Themed share status modal component.
 *
 * This component can be used to avoid dealing with modal state management.
 *
 * @return {import('react').ReactNode} - React element
 */
export function ThemedShareStatusModal() {
	const shouldModalBeOpen = useSelect(
		select => select( socialStore ).isShareStatusModalOpen(),
		[]
	);

	return (
		<ThemeProvider targetDom={ document.body }>
			{ shouldModalBeOpen ? <ShareStatusModal /> : null }
		</ThemeProvider>
	);
}

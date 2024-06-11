import { ThemeProvider, useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import clsx from 'clsx';
import { store } from '../../social-store';
import { ServicesList } from '../services/services-list';
import { ConfirmationForm } from './confirmation-form';
import styles from './style.module.scss';

export const ManageConnectionsModal = () => {
	const { keyringResult } = useSelect( select => {
		const { getKeyringResult } = select( store );

		return {
			keyringResult: getKeyringResult(),
		};
	}, [] );

	const { setKeyringResult, closeConnectionsModal } = useDispatch( store );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const closeModal = useCallback( () => {
		setKeyringResult( null );
		closeConnectionsModal();
	}, [ closeConnectionsModal, setKeyringResult ] );

	const hasKeyringResult = Boolean( keyringResult?.ID );

	const title = hasKeyringResult
		? __( 'Connection confirmation', 'jetpack' )
		: _x( 'Manage Jetpack Social connections', '', 'jetpack' );

	const isAdmin = useSelect( select => select( coreStore ).canUser( 'update', 'settings' ), [] );

	return (
		<Modal
			className={ clsx( styles.modal, {
				[ styles.small ]: isSmall,
			} ) }
			onRequestClose={ closeModal }
			title={ title }
		>
			{
				//Use IIFE to avoid nested ternary
				( () => {
					if ( hasKeyringResult ) {
						return (
							<ConfirmationForm
								keyringResult={ keyringResult }
								onComplete={ closeModal }
								isAdmin={ isAdmin }
							/>
						);
					}

					return <ServicesList />;
				} )()
			}
		</Modal>
	);
};

/**
 * Themed Manage connections modal component.
 *
 * This component can be used to avoid dealing with modal state management.
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ThemedConnectionsModal() {
	const shouldModalBeOpen = useSelect( select => {
		return select( store ).isConnectionsModalOpen();
	}, [] );

	return (
		<ThemeProvider targetDom={ document.body }>
			{ shouldModalBeOpen ? <ManageConnectionsModal /> : null }
		</ThemeProvider>
	);
}

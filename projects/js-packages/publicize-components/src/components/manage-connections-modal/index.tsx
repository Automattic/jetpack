import { ThemeProvider, useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { cloneElement, useCallback, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import classNames from 'classnames';
import { store } from '../../social-store';
import { ServicesList } from '../services/services-list';
import { ConfirmationForm } from './confirmation-form';
import styles from './style.module.scss';

type ManageConnectionsModalProps = {
	onCloseModal?: VoidFunction;
};

export const ManageConnectionsModal = ( { onCloseModal }: ManageConnectionsModalProps ) => {
	const { keyringResult } = useSelect( select => {
		const { getKeyringResult } = select( store );

		return {
			keyringResult: getKeyringResult(),
		};
	}, [] );

	const { setKeyringResult } = useDispatch( store );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const closeModal = useCallback( () => {
		setKeyringResult( null );
		onCloseModal?.();
	}, [ onCloseModal, setKeyringResult ] );

	const hasKeyringResult = Boolean( keyringResult?.ID );

	const title = hasKeyringResult
		? __( 'Connection confirmation', 'jetpack' )
		: _x( 'Manage Jetpack Social connections', '', 'jetpack' );

	const isAdmin = useSelect( select => select( coreStore ).canUser( 'update', 'settings' ), [] );

	return (
		<Modal
			className={ classNames( styles.modal, {
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

export type ManageConnectionsModalWithTriggerProps = {
	trigger: React.ReactElement;
};

/**
 * Manage connections modal with trigger component.
 *
 * This component can be used to avoid dealing with modal state management.
 *
 * @param {ManageConnectionsModalWithTriggerProps} props - component props
 *
 * @returns {import('react').ReactNode} - React element
 */
export function ManageConnectionsModalWithTrigger( {
	trigger,
}: ManageConnectionsModalWithTriggerProps ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const { keyringResult } = useSelect( select => {
		return {
			keyringResult: select( store ).getKeyringResult(),
		};
	}, [] );

	const closeModal = useCallback( () => {
		setIsModalOpen( false );
	}, [] );
	const openModal = useCallback( () => {
		setIsModalOpen( true );
	}, [] );

	const shouldModalBeOpen =
		isModalOpen ||
		// It's possible that when reconnecting a connection from within the modal,
		// the user closes the modal immediately, without waiting for the confirmation,
		// in that case we should show the modal again when the keyringResult is set.
		keyringResult?.ID;

	// Clone trigger element and pass onClick handler to open modal
	const triggerWithOnClick = cloneElement( trigger, { onClick: openModal } );

	return (
		<ThemeProvider targetDom={ document.body }>
			{ triggerWithOnClick }
			{ shouldModalBeOpen ? <ManageConnectionsModal onCloseModal={ closeModal } /> : null }
		</ThemeProvider>
	);
}

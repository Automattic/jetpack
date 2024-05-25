import { useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
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
		: _x( 'Add a new connection to Jetpack Social', '', 'jetpack' );

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
						return <ConfirmationForm keyringResult={ keyringResult } onComplete={ closeModal } />;
					}

					return <ServicesList />;
				} )()
			}
		</Modal>
	);
};

import { useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import classNames from 'classnames';
import { KeyringResult } from '../../social-store/types';
import { ServicesList } from '../services/services-list';
import { SupportedService } from '../services/use-supported-services';
import { ConfirmationForm } from './confirmation-form';
import styles from './style.module.scss';

type AddConnectionModalProps = {
	onCloseModal: VoidFunction;
	defaultExpandedService: SupportedService | null;
};

const AddConnectionModal = ( {
	onCloseModal,
	defaultExpandedService,
}: AddConnectionModalProps ) => {
	const [ keyringResult, setKeyringResult ] = useState< KeyringResult | null >( null );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const onConfirm = useCallback( ( result: KeyringResult ) => {
		setKeyringResult( result );
	}, [] );

	const onComplete = useCallback( () => {
		setKeyringResult( null );
		onCloseModal();
	}, [ onCloseModal ] );

	const hasKeyringResult = Boolean( keyringResult?.ID );

	const title = hasKeyringResult
		? __( 'Connection confirmation', 'jetpack' )
		: _x( 'Add a new connection to Jetpack Social', '', 'jetpack' );

	return (
		<Modal
			className={ classNames( styles.modal, {
				[ styles[ 'service-selector' ] ]: ! defaultExpandedService,
				[ styles.small ]: isSmall,
			} ) }
			onRequestClose={ onCloseModal }
			title={ title }
		>
			{
				//Use IIFE to avoid nested ternary
				( () => {
					if ( hasKeyringResult ) {
						return <ConfirmationForm keyringResult={ keyringResult } onComplete={ onComplete } />;
					}

					return (
						<ServicesList
							onConfirm={ onConfirm }
							defaultExpandedService={ defaultExpandedService }
						/>
					);
				} )()
			}
		</Modal>
	);
};

export default AddConnectionModal;

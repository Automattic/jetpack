import { useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import { KeyringResult } from '../../social-store/types';
import { ConfirmationForm } from './confirmation-form';
import { ConnectPage } from './connect-page/connect-page';
import { ServicesList } from './services-list';
import styles from './style.module.scss';
import { SupportedService } from './use-supported-services';

type AddConnectionModalProps = {
	onCloseModal: VoidFunction;
	currentService: SupportedService | null;
	setCurrentService: ( service: SupportedService | null ) => void;
};

const AddConnectionModal = ( {
	onCloseModal,
	currentService,
	setCurrentService,
}: AddConnectionModalProps ) => {
	const [ keyringResult, setKeyringResult ] = useState< KeyringResult | null >( null );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const onBackClicked = useCallback( () => {
		setCurrentService( null );
	}, [ setCurrentService ] );

	const onConfirm = useCallback( ( result: KeyringResult ) => {
		setKeyringResult( result );
	}, [] );

	const onComplete = useCallback( () => {
		setKeyringResult( null );
		onCloseModal();
	}, [ onCloseModal ] );

	const hasKeyringResult = Boolean( keyringResult?.ID );

	// Use IIFE to avoid nested ternary and messed up minification
	const title = ( selectedService => {
		if ( hasKeyringResult ) {
			return __( 'Connection confirmation', 'jetpack' );
		}

		if ( selectedService ) {
			return sprintf(
				// translators: %s: Name of the service the user connects to.
				__( 'Connecting a new %s account', 'jetpack' ),
				selectedService.label
			);
		}

		return __( 'Add a new connection to Jetpack Social', 'jetpack' );
	} )( currentService );

	return (
		<Modal
			className={ classNames( styles.modal, {
				[ styles[ 'service-selector' ] ]: ! currentService,
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

					if ( currentService ) {
						return (
							<ConnectPage
								service={ currentService }
								onBackClicked={ onBackClicked }
								onConfirm={ onConfirm }
							/>
						);
					}

					return <ServicesList onSelectService={ setCurrentService } onConfirm={ onConfirm } />;
				} )()
			}
		</Modal>
	);
};

export default AddConnectionModal;

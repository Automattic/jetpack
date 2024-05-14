import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown } from '@wordpress/icons';
import classNames from 'classnames';
import { ConnectForm } from './connect-form';
import { ConnectPage } from './connect-page/connect-page';
import styles from './style.module.scss';
import { SupportedService, useSupportedServices } from './use-supported-services';

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
	const supportedServices = useSupportedServices();

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const onServiceSelected = useCallback(
		service => () => {
			setCurrentService( service );
		},
		[ setCurrentService ]
	);

	const onBackClicked = useCallback( () => {
		setCurrentService( null );
	}, [ setCurrentService ] );

	const onConfirm = useCallback( ( data: unknown ) => {
		// eslint-disable-next-line no-console
		console.log( data );
	}, [] );

	return (
		<Modal
			className={ classNames( styles.modal, {
				[ styles[ 'service-selector' ] ]: ! currentService,
				[ styles.small ]: isSmall,
			} ) }
			onRequestClose={ onCloseModal }
			title={
				currentService
					? sprintf(
							// translators: %s: Name of the service the user connects to.
							__( 'Connecting a new %s account', 'jetpack' ),
							currentService.label
					  )
					: __( 'Add a new connection to Jetpack Social', 'jetpack' )
			}
		>
			{ currentService ? (
				<ConnectPage
					service={ currentService }
					onBackClicked={ onBackClicked }
					onConfirm={ onConfirm }
				/>
			) : (
				<table>
					<thead>
						<tr>
							<th></th>
							<th></th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{ supportedServices.map( service => (
							<tr key={ service.ID }>
								<td>
									<service.icon iconSize={ isSmall ? 36 : 48 } />
								</td>
								<td
									className={ classNames( styles[ 'column-description' ], {
										[ styles.small ]: ! isSmall,
									} ) }
								>
									<h2 className={ styles.title }>{ service.label }</h2>
									{ ! isSmall ? (
										<p className={ styles.description }>{ service.description }</p>
									) : null }
								</td>
								<td>
									<div className={ styles[ 'column-actions' ] }>
										<ConnectForm
											service={ service }
											isSmall={ isSmall }
											onConfirm={ onConfirm }
											onSubmit={
												service.needsCustomInputs ? onServiceSelected( service ) : undefined
											}
										/>
										<Button
											size={ isSmall ? 'small' : 'normal' }
											className={ styles[ 'chevron-button' ] }
											variant="secondary"
											onClick={ onServiceSelected( service ) }
											aria-label={ __( 'Learn more', 'jetpack' ) }
										>
											{ <Icon className={ styles.chevron } icon={ chevronDown } /> }
										</Button>
									</div>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) }
		</Modal>
	);
};

export default AddConnectionModal;

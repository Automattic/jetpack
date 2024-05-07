import { Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown } from '@wordpress/icons';
import classNames from 'classnames';
import { useCallback, useState } from 'react';
import { ConnectPage } from './connect-page/connect-page';
import { getSupportedConnections } from './constants';
import styles from './style.module.scss';

const AddConnectionModal = ( { onCloseModal } ) => {
	const [ currentService, setCurrentService ] = useState( null );

	const [ isSmall ] = useBreakpointMatch( 'sm' );

	const onServiceSelected = useCallback(
		service => () => {
			setCurrentService( service );
		},
		[]
	);

	const onBackClicked = useCallback( () => {
		setCurrentService( null );
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
							currentService.title
					  )
					: __( 'Add a new connection to Jetpack Social', 'jetpack' )
			}
		>
			{ currentService ? (
				<ConnectPage service={ currentService } onBackClicked={ onBackClicked } />
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
						{ getSupportedConnections().map( service => (
							<tr key={ service.name }>
								<td>
									<service.icon iconSize={ isSmall ? 36 : 48 } />
								</td>
								<td
									className={ classNames( styles[ 'column-description' ], {
										[ styles.small ]: ! isSmall,
									} ) }
								>
									<h2 className={ styles.title }>{ service.title }</h2>
									{ ! isSmall ? (
										<p className={ styles.description }>{ service.description }</p>
									) : null }
								</td>
								<td>
									<div className={ styles[ 'column-actions' ] }>
										<Button type="submit" variant="primary" size={ isSmall ? 'small' : 'normal' }>
											{ __( 'Connect', 'jetpack' ) }
										</Button>
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

import restApi from '@automattic/jetpack-api';
import { Button, Spinner } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './styles.module.scss';

/**
 * Disconnect Site Link component.
 *
 * @param {object}   props              - Component props.
 * @param {Function} props.onDisconnect - Callback to run when the site is disconnected.
 * @returns {React.Component} The `DisconnectSiteLink` component.
 */
export default function DisconnectSiteLink( { onDisconnect } ) {
	const { apiNonce, apiRoot } = window.automatticForAgenciesClientInitialState;

	const [ showDisconnectSiteDialog, setShowDisconnectSiteDialog ] = useState( false );
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( false );

	const onDisconnectSiteClick = useCallback( () => setShowDisconnectSiteDialog( true ), [] );
	const onCloseDisconnectSiteDialog = useCallback( () => setShowDisconnectSiteDialog( false ), [] );

	/**
	 * Disconnect the site.
	 * Uses the rest API to remove the Jetpack connection.
	 */
	const disconnect = useCallback( () => {
		setIsDisconnecting( true );
		restApi
			.disconnectSite()
			.then( () => {
				setIsDisconnecting( false );
				setShowDisconnectSiteDialog( false );
				onDisconnect();
			} )
			.catch( error => {
				setIsDisconnecting( false );
				setDisconnectError( error );
			} );
	}, [ onDisconnect ] );

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	return (
		<>
			<div className={ styles.disconnect_site_trigger }>
				<Button variant="link" size="small" onClick={ onDisconnectSiteClick }>
					{ __( 'Disconnect site', 'automattic-for-agencies-client' ) }
				</Button>
			</div>
			{ showDisconnectSiteDialog && (
				<Modal
					title={ __(
						'Are you sure you want to disconnect this site?',
						'automattic-for-agencies-client'
					) }
					onRequestClose={ onCloseDisconnectSiteDialog }
					shouldCloseOnClickOutside={ false }
					shouldCloseOnEsc={ false }
					isDismissible={ false }
					className={ styles.disconnect_modal }
				>
					<p>
						{ __(
							'It will no longer show up in the Automattic for Agencies dashboard and you won’t be able to update plugins with one click or be notified of any downtime.',
							'automattic-for-agencies-client'
						) }
					</p>
					<div className={ styles.disconnect_modal__actions }>
						<Button
							variant="secondary"
							size="small"
							disabled={ isDisconnecting }
							onClick={ onCloseDisconnectSiteDialog }
						>
							{ __( 'Keep the site connected', 'automattic-for-agencies-client' ) }
						</Button>
						<Button
							variant="primary"
							isDestructive
							size="small"
							isLoading={ isDisconnecting }
							disabled={ isDisconnecting }
							onClick={ disconnect }
							className={ styles.disconnect_button }
						>
							{ isDisconnecting ? (
								<Spinner />
							) : (
								__( 'Yes, disconnect site', 'automattic-for-agencies-client' )
							) }
						</Button>
					</div>
					{ disconnectError && (
						<p className={ styles.disconnect_modal__error }>
							{ __(
								'An error occurred disconnecting the site.',
								'automattic-for-agencies-client'
							) }
						</p>
					) }
				</Modal>
			) }
		</>
	);
}

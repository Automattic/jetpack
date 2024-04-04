import restApi from '@automattic/jetpack-api';
import { ActionButton, Button, Spinner } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import BrandedCard from '../branded-card';
import CheckCircleIcon from '../check-circle-icon';
import CloseCircleIcon from '../close-circle-icon';
import styles from './styles.module.scss';

/**
 * Connected Card component.
 *
 * @returns {React.Component} The `ConnectionCard` component.
 */
export default function ConnectedCard() {
	const { apiNonce, apiRoot, registrationNonce } = window.automatticForAgenciesClientInitialState;

	const { handleRegisterSite, siteIsRegistering, userIsConnecting, registrationError } =
		useConnection( {
			apiNonce,
			apiRoot,
			autoTrigger: false,
			from: 'automattic-for-agencies-client',
			redirectUri: 'admin.php?page=automattic-for-agencies-client',
			registrationNonce,
		} );

	const [ showDisconnectSiteDialog, setShowDisconnectSiteDialog ] = useState( false );
	const [ isDisconnecting, setIsDisconnecting ] = useState( false );
	const [ isDisconnected, setIsDisconnected ] = useState( false );
	const [ disconnectError, setDisconnectError ] = useState( false );

	const onDisconnectSiteClick = useCallback( () => setShowDisconnectSiteDialog( true ), [] );
	const onCloseDisconnectSiteDialog = useCallback( () => setShowDisconnectSiteDialog( false ), [] );

	const navigateToDashboard = useCallback( () => {
		window.location.href = 'https://agencies.automattic.com';
	}, [] );

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
				setIsDisconnected( true );
				setShowDisconnectSiteDialog( false );
				// setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
			} )
			.catch( error => {
				setIsDisconnecting( false );
				setDisconnectError( error );
			} );
	}, [ setIsDisconnecting, setIsDisconnected, setDisconnectError ] );

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	return (
		<>
			<BrandedCard>
				{ ! isDisconnected ? (
					<div className={ styles.card }>
						<h1>
							{ __(
								'Your site is connected to Automattic for Agencies',
								'automattic-for-agencies-client'
							) }
						</h1>
						<p
							className={ classNames(
								styles.connection_status,
								styles[ 'connection_status--connected' ]
							) }
						>
							<CheckCircleIcon />
							{ __( 'Site is connected and syncing', 'automattic-for-agencies-client' ) }
						</p>
						<div>
							<Button onClick={ navigateToDashboard } isExternalLink>
								{ __( 'Visit the dashboard', 'automattic-for-agencies-client' ) }
							</Button>
						</div>
					</div>
				) : (
					<div className={ styles.card }>
						<h1>
							{ __(
								'Your site was disconnected from Automattic for Agencies',
								'automattic-for-agencies-client'
							) }
						</h1>
						<p
							className={ classNames(
								styles.connection_status,
								styles[ 'connection_status--disconnected' ]
							) }
						>
							<CloseCircleIcon />
							{ __( 'Site is disconnected', 'automattic-for-agencies-client' ) }
						</p>
						<div>
							<ActionButton
								label={ __( 'Reconnect this site now', 'automattic-for-agencies-client' ) }
								onClick={ handleRegisterSite }
								displayError={ registrationError ? true : false }
								isLoading={ siteIsRegistering || userIsConnecting }
							/>
						</div>
					</div>
				) }
			</BrandedCard>
			{ ! isDisconnected && (
				<div className={ styles.disconnect_site_trigger }>
					<Button variant="link" size="small" onClick={ onDisconnectSiteClick }>
						{ __( 'Disconnect site', 'automattic-for-agencies-client' ) }
					</Button>
				</div>
			) }
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

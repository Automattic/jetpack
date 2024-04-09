import restApi from '@automattic/jetpack-api';
import { Button, Spinner } from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { Modal } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import BrandedCard from '../branded-card';
import CheckCircleIcon from '../check-circle-icon';
import CloseCircleIcon from '../close-circle-icon';
import styles from './styles.module.scss';

/**
 * Site Connected Content component.
 *
 * @returns {React.Component} The `SiteConnectedContent` component.
 */
function SiteConnectedContent() {
	const navigateToDashboard = useCallback( () => {
		window.location.href = 'https://agencies.automattic.com';
	}, [] );

	return (
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
	);
}

/**
 * Site Disconnected Content component.
 *
 * @returns {React.Component} The `SiteDisconnectedContent` component.
 */
function SiteDisconnectedContent() {
	const { setConnectionStatus } = useDispatch( CONNECTION_STORE_ID );

	const refreshConnectionState = useCallback( () => {
		setConnectionStatus( { isActive: false, isRegistered: false, isUserConnected: false } );
	}, [ setConnectionStatus ] );

	return (
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
				<Button onClick={ refreshConnectionState }>
					{ __( 'Reconnect this site now', 'automattic-for-agencies-client' ) }
				</Button>
			</div>
		</div>
	);
}

/**
 * Disconnect Site Link component.
 *
 * @param {object}   props              - Component props.
 * @param {Function} props.onDisconnect - Callback to run when the site is disconnected.
 * @returns {React.Component} The `DisconnectSiteLink` component.
 */
function DisconnectSiteLink( { onDisconnect } ) {
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

/**
 * Connected Card component.
 *
 * @returns {React.Component} The `ConnectionCard` component.
 */
export default function ConnectedCard() {
	const [ isDisconnected, setIsDisconnected ] = useState( false );

	const onDisconnect = useCallback( () => setIsDisconnected( true ), [ setIsDisconnected ] );

	return (
		<>
			<BrandedCard>
				{ ! isDisconnected ? <SiteConnectedContent /> : <SiteDisconnectedContent /> }
			</BrandedCard>
			{ ! isDisconnected && <DisconnectSiteLink onDisconnect={ onDisconnect } /> }
		</>
	);
}

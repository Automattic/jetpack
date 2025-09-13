/* global jetpackExternalConnectionsData */

import requestExternalAccess from '@automattic/request-external-access';
import domReady from '@wordpress/dom-ready';
import { useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { createRoot } from 'react-dom/client';

const fetchData = async params => {
	const response = await fetch( '/wp-admin/admin-ajax.php', {
		method: 'POST',
		body: new URLSearchParams( params ),
		headers: {
			Accept: 'application/json',
		},
	} );

	return await response.json();
};

/**
 * Represents an external connection component for a given service,
 * allowing users to connect or disconnect from it.
 *
 * @param {object} props         - The properties for the ExternalConnection component.
 * @param {string} props.service - The name of the service to be connected or disconnected.
 * @return {import('react').Component} The ExternalConnection component.
 */
function ExternalConnection( { service } ) {
	const config = jetpackExternalConnectionsData[ service ];
	const [ isConnected, setIsConnected ] = useState( config.isConnected );
	const [ accountName, setAccountName ] = useState( config.accountName );
	const [ profileImage, setProfileImage ] = useState( config.profileImage );
	const [ isTogglingConnection, setTogglingConnection ] = useState( false );

	const toggleConnection = async () => {
		setTogglingConnection( true );

		if ( isConnected ) {
			const data = await fetchData( {
				action: 'jetpack_delete_external_connection',
				service,
				_ajax_nonce: config.deleteNonce,
			} );
			setTogglingConnection( false );
			if ( data.deleted ) {
				setIsConnected( false );
			}
			return;
		}

		requestExternalAccess( config.connectUrl, async ( { keyring_id: keyringId } ) => {
			if ( ! keyringId ) {
				setTogglingConnection( false );
			}

			const data = await fetchData( {
				action: 'jetpack_get_external_connection',
				service,
				_ajax_nonce: config.getNonce,
			} );
			setIsConnected( data.isConnected );
			setAccountName( data.accountName );
			setProfileImage( data.profileImage );
			setTogglingConnection( false );
		} );
	};

	let buttonText;
	if ( isTogglingConnection ) {
		buttonText = isConnected
			? __( 'Disconnecting…', 'jetpack-external-connections' )
			: __(
					'Connecting…',
					'jetpack-external-connections',
					/* dummy arg to avoid bad minification */ 0
			  );
	} else {
		buttonText = isConnected
			? __( 'Disconnect', 'jetpack-external-connections' )
			: __(
					'Connect',
					'jetpack-external-connections',
					/* dummy arg to avoid bad minification */ 0
			  );
	}

	const ExtraSettings = applyFilters( 'jetpack.externalConnections.extraSettings', null, service );

	return (
		<>
			<div className="jetpack-external-connection-settings">
				{ isConnected && accountName && (
					<>
						{ __( 'Connected as:', 'jetpack-external-connections' ) }
						{ profileImage && <img src={ profileImage } alt="" /> }
						<strong>{ accountName } </strong>
					</>
				) }
				{ ! isConnected && config.signupLink && (
					<a
						className={ `button-secondary ${ isTogglingConnection ? 'disabled' : '' }` }
						href={ config.signupLink }
						target="_blank"
						rel="noopener noreferrer"
					>
						{ __( 'Sign up', 'jetpack-external-connections' ) }
					</a>
				) }
				<button
					className="button-secondary"
					type="button"
					onClick={ toggleConnection }
					disabled={ isTogglingConnection }
				>
					{ buttonText }
				</button>
			</div>
			{ ExtraSettings && <ExtraSettings isConnected={ isConnected } /> }
		</>
	);
}

domReady( () => {
	const connections = document.querySelectorAll( '.jetpack-external-connection' );
	if ( ! connections.length ) {
		return;
	}

	connections.forEach( connection => {
		const root = createRoot( connection );
		const service = connection.dataset.service;
		root.render( <ExternalConnection service={ service } /> );
	} );
} );

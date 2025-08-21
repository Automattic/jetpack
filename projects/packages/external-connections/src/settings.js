/* global wp, jetpackExternalConnectionsData */

import requestExternalAccess from '@automattic/request-external-access';
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

domReady( () => {
	const connectionButtons = document.querySelectorAll( '.jetpack-external-connection' );
	if ( ! connectionButtons.length ) {
		return;
	}

	connectionButtons.forEach( connectionButton => {
		connectionButton.addEventListener( 'click', () => {
			const service = connectionButton.dataset.service;
			const { isConnected, connectUrl, deleteNonce } = jetpackExternalConnectionsData[ service ];

			connectionButton.innerText = isConnected
				? __( 'Disconnecting…', 'jetpack-external-connections' )
				: __(
						'Connecting…',
						'jetpack-external-connections',
						/* dummy arg to avoid bad minification */ 0
				  );
			connectionButton.disabled = true;

			if ( isConnected ) {
				wp.ajax.post(
					'jetpack_delete_external_connection',
					{
						service,
						_ajax_nonce: deleteNonce,
					},
					( { deleted } ) => {
						connectionButton.disabled = false;
						if ( deleted ) {
							connectionButton.innerText = __( 'Connect', 'jetpack-external-connections' );
							jetpackExternalConnectionsData[ service ].isConnected = false;
						} else {
							connectionButton.innerText = __( 'Disconnect', 'jetpack-external-connections' );
						}
					}
				);
				return;
			}

			requestExternalAccess( connectUrl, ( { keyring_id: keyringId } ) => {
				connectionButton.disabled = false;
				if ( keyringId ) {
					connectionButton.innerText = __( 'Disconnect', 'jetpack-external-connections' );
					jetpackExternalConnectionsData[ service ].isConnected = true;
				} else {
					connectionButton.innerText = __( 'Connect', 'jetpack-external-connections' );
				}
			} );
		} );
	} );
} );

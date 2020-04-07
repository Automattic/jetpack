/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PopupMonitor from 'lib/popup-monitor';

export default function useConnectService( serviceName, setAttributes, callbacks ) {
	const [ isConnecting, setIsConnecting ] = useState( false );

	const connectToService = () => {
		setIsConnecting( true );
		apiFetch( { path: `/wpcom/v2/${ serviceName }/connect-url` } ).then( connectUrl => {
			const popupMonitor = new PopupMonitor();

			popupMonitor.open(
				connectUrl,
				`connect-to-${ serviceName }-popup`,
				'toolbar=0,location=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 700, 700 )
			);

			popupMonitor.on( 'message', ( { keyring_id } ) => {
				setIsConnecting( false );
				if ( keyring_id ) {
					setAttributes( { accessToken: keyring_id.toString() } );
				}
				if ( callbacks.connect ) {
					callbacks.connect( keyring_id );
				}
			} );

			popupMonitor.on( 'close', name => {
				if ( `connect-to-${ serviceName }-popup` === name ) {
					setIsConnecting( false );
				}
			} );
		} );
	};

	const disconnectFromService = accessToken => {
		setIsConnecting( true );
		apiFetch( {
			path: addQueryArgs( `/wpcom/v2/${ serviceName }/delete-access-token`, {
				access_token: accessToken,
			} ),
			method: 'DELETE',
		} ).then( responseCode => {
			setIsConnecting( false );
			if ( 200 === responseCode ) {
				setAttributes( { accessToken: undefined } );
				if ( callbacks.disconnect ) {
					callbacks.disconnect();
				}
			}
		} );
	};

	return { isConnecting, connectToService, disconnectFromService };
}

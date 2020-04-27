/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import PopupMonitor from '@automattic/popup-monitor';

export default function useConnectInstagram( setAttributes, setImages, noticeOperations ) {
	const [ isConnecting, setIsConnecting ] = useState( false );

	const connectToService = () => {
		noticeOperations.removeAllNotices();
		setIsConnecting( true );

		apiFetch( { path: `/wpcom/v2/instagram-gallery/connect-url` } )
			.then( connectUrl => {
				const popupMonitor = new PopupMonitor();

				popupMonitor.open(
					connectUrl,
					`connect-to-instagram-popup`,
					'toolbar=0,location=0,menubar=0,' + popupMonitor.getScreenCenterSpecs( 700, 700 )
				);

				popupMonitor.on( 'message', ( { keyring_id } ) => {
					setIsConnecting( false );
					if ( keyring_id ) {
						setAttributes( { accessToken: keyring_id.toString() } );
					}
				} );

				popupMonitor.on( 'close', name => {
					if ( `connect-to-instagram-popup` === name ) {
						setIsConnecting( false );
					}
				} );
			} )
			.catch( () => {
				noticeOperations.createErrorNotice(
					__( 'An error occurred. Please try again later.', 'jetpack' )
				);
				setIsConnecting( false );
			} );
	};

	const disconnectFromService = accessToken => {
		setIsConnecting( true );
		apiFetch( {
			path: addQueryArgs( `/wpcom/v2/instagram-gallery/delete-access-token`, {
				access_token: accessToken,
			} ),
			method: 'DELETE',
		} ).then( responseCode => {
			setIsConnecting( false );
			if ( 200 === responseCode ) {
				setAttributes( { accessToken: undefined } );
				setImages( [] );
			}
		} );
	};

	return { isConnecting, connectToService, disconnectFromService };
}

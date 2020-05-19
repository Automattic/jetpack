/**
 * External dependencies
 */
import PopupMonitor from '@automattic/popup-monitor';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function useConnectInstagram( { noticeOperations, setAttributes, setImages } ) {
	const [ isConnecting, setIsConnecting ] = useState( false );

	const connectToService = async () => {
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
						const token = keyring_id.toString();
						setAttributes( { accessToken: token } );
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

	const disconnectFromService = () => {
		setAttributes( { accessToken: undefined } );
		setImages( [] );
	};

	return { isConnecting, connectToService, disconnectFromService };
}

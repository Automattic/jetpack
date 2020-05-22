/**
 * External dependencies
 */
import PopupMonitor from '@automattic/popup-monitor';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export default function useConnectInstagram( {
	accessToken,
	noticeOperations,
	setAttributes,
	setImages,
	setSelectedAccount,
} ) {
	const [ isConnecting, setIsConnecting ] = useState( false );
	const [ isRequestingUserConnections, setIsRequestingConnections ] = useState( false );
	const [ userConnections, setUserConnections ] = useState( [] );

	useEffect( () => {
		if ( accessToken ) {
			return;
		}

		setIsRequestingConnections( true );
		apiFetch( { path: '/wpcom/v2/instagram-gallery/connections' } )
			.then( connections => {
				setIsRequestingConnections( false );
				setUserConnections( connections );
			} )
			.catch( () => {
				setIsRequestingConnections( false );
				setUserConnections( [] );
			} );
	}, [ accessToken ] );

	const connectToService = () => {
		noticeOperations.removeAllNotices();

		setIsConnecting( true );
		apiFetch( { path: '/wpcom/v2/instagram-gallery/connect-url' } )
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
						setSelectedAccount( token );
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
		noticeOperations.removeAllNotices();
		setAttributes( { accessToken: undefined, instagramUser: undefined } );
		setImages( [] );
	};

	return {
		connectToService,
		disconnectFromService,
		isConnecting,
		isRequestingUserConnections,
		userConnections,
	};
}

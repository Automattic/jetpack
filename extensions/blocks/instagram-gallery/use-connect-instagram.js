/**
 * External dependencies
 */
import PopupMonitor from '@automattic/popup-monitor';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

export default function useConnectInstagram( {
	accessToken,
	noticeOperations,
	setAttributes,
	setImages,
} ) {
	const { isTokenConnected, isTokenDisconnected } = useSelect( select => {
		const { isInstagramGalleryTokenConnected, isInstagramGalleryTokenDisconnected } = select(
			'jetpack/instagram-gallery'
		);
		return {
			isTokenConnected: isInstagramGalleryTokenConnected( accessToken ),
			isTokenDisconnected: isInstagramGalleryTokenDisconnected( accessToken ),
		};
	} );

	const { connectInstagramGalleryToken, disconnectInstagramGalleryToken } = useDispatch(
		'jetpack/instagram-gallery'
	);

	const [ isConnecting, setIsConnecting ] = useState( false );

	// Automatically retrieve a working Instagram access token, if it exists.
	useEffect( () => {
		// If the block already has a token, and that token is marked as connected, don't retrieve it again.
		if ( isTokenConnected ) {
			return;
		}

		// If the block already has a token, and that token is marked as disconnected, remove it from the block.
		if ( isTokenDisconnected ) {
			setAttributes( { accessToken: undefined } );
			return;
		}

		// Otherwise, try to retrieve it from the API.
		setIsConnecting( true );
		apiFetch( { path: `/wpcom/v2/instagram-gallery/access-token` } )
			.then( token => {
				setIsConnecting( false );
				if ( token ) {
					connectInstagramGalleryToken( token );
					setAttributes( { accessToken: token } );
				}
			} )
			.catch( () => {
				setIsConnecting( false );
				// If there are errors, chances are the token is not valid anymore.
				// Mark it as disconnected, and remove it from the block.
				if ( accessToken ) {
					disconnectInstagramGalleryToken( accessToken );
					setAttributes( { accessToken: undefined } );
				}
			} );
	}, [
		accessToken,
		connectInstagramGalleryToken,
		disconnectInstagramGalleryToken,
		isTokenConnected,
		isTokenDisconnected,
		setAttributes,
		setIsConnecting,
	] );

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
						const token = keyring_id.toString();
						connectInstagramGalleryToken( token );
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

	const disconnectFromService = token => {
		setIsConnecting( true );
		apiFetch( {
			path: addQueryArgs( `/wpcom/v2/instagram-gallery/delete-access-token`, {
				access_token: token,
			} ),
			method: 'DELETE',
		} ).then( responseCode => {
			setIsConnecting( false );
			if ( 200 === responseCode ) {
				disconnectInstagramGalleryToken( token );
				setAttributes( { accessToken: undefined } );
				setImages( [] );
			}
		} );
	};

	return { isConnecting, connectToService, disconnectFromService };
}

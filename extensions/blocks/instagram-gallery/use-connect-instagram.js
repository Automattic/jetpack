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
	const { isTokenDisconnected } = useSelect( select => ( {
		isTokenDisconnected: select( 'jetpack/instagram-gallery' ).isInstagramGalleryTokenDisconnected(
			accessToken
		),
	} ) );

	const { connectInstagramGalleryToken, disconnectInstagramGalleryToken } = useDispatch(
		'jetpack/instagram-gallery'
	);

	const [ isConnecting, setIsConnecting ] = useState( false );

	// When a block is disconnected, also disconnect all other blocks using the same token.
	useEffect( () => {
		if ( isTokenDisconnected ) {
			setAttributes( { accessToken: undefined } );
		}
	}, [ isTokenDisconnected, setAttributes ] );

	// Check if the user has got a valid token, and add it to the block.
	const getAccessToken = async () => {
		try {
			setIsConnecting( true );
			const token = await apiFetch( { path: `/wpcom/v2/instagram-gallery/access-token` } );
			setIsConnecting( false );

			if ( token ) {
				connectInstagramGalleryToken( token );
				setAttributes( { accessToken: token } );
				return token;
			}
		} catch ( error ) {
			setIsConnecting( false );
			if ( accessToken ) {
				disconnectInstagramGalleryToken( accessToken );
				setAttributes( { accessToken: undefined } );
			}
		}
	};

	const connectToService = async () => {
		noticeOperations.removeAllNotices();

		// Try retrieving a valid token first;
		// if the user has got one, skip the Instagram authorization popup.
		// If/when the block has a valid token, the block will automatically embed the gallery.
		if ( ! accessToken || isTokenDisconnected ) {
			const token = await getAccessToken();
			if ( token ) {
				return;
			}
		}

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
		const hasConfirmed = window.confirm(
			__( 'Are you sure you wish to disconnect your Instagram account?', 'jetpack' )
		);
		if ( ! hasConfirmed ) {
			return;
		}

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

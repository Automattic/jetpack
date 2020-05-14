/**
 * External dependencies
 */
import { isArray, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { MAX_IMAGE_COUNT } from './constants';

export default function useInstagramGallery( { accessToken, noticeOperations, setAttributes } ) {
	const { isTokenDisconnected } = useSelect( select => {
		const { isInstagramGalleryTokenDisconnected } = select( 'jetpack/instagram-gallery' );
		return { isTokenDisconnected: isInstagramGalleryTokenDisconnected( accessToken ) };
	} );

	const { connectInstagramGalleryToken, disconnectInstagramGalleryToken } = useDispatch(
		'jetpack/instagram-gallery'
	);

	const [ images, setImages ] = useState( [] );
	const [ isLoadingGallery, setIsLoadingGallery ] = useState( false );

	useEffect( () => {
		// If the block doesn't have a token, or it's already marked as disconnected, don't bother trying to load the gallery.
		if ( ! accessToken || isTokenDisconnected ) {
			return;
		}

		noticeOperations.removeAllNotices();
		setIsLoadingGallery( true );

		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/instagram-gallery/gallery', {
				access_token: accessToken,
				count: MAX_IMAGE_COUNT,
			} ),
		} )
			.then( ( { external_name: externalName, images: imageList } ) => {
				setIsLoadingGallery( false );

				// If the response doesn't have an `images` property,
				// or `images` is not an array (the API might literally return the string "ERROR"),
				// the token is likely incorrect, so set it as disconnected.
				if ( ! imageList || ! isArray( imageList ) ) {
					noticeOperations.createErrorNotice(
						__( 'An error occurred. Please try again later.', 'jetpack' )
					);
					setImages( [] );
					disconnectInstagramGalleryToken( accessToken );
					return;
				}

				if ( isEmpty( imageList ) ) {
					noticeOperations.createErrorNotice(
						__( 'No images were found in your Instagram account.', 'jetpack' )
					);
				}

				connectInstagramGalleryToken( accessToken );
				setAttributes( { instagramUser: externalName } );
				setImages( imageList );
			} )
			.catch( () => {
				setIsLoadingGallery( false );
				setImages( [] );
				disconnectInstagramGalleryToken( accessToken );
			} );
	}, [
		accessToken,
		connectInstagramGalleryToken,
		disconnectInstagramGalleryToken,
		isTokenDisconnected,
		noticeOperations,
		setAttributes,
	] );

	return { images, isLoadingGallery, setImages };
}

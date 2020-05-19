/**
 * External dependencies
 */
import { isArray, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { MAX_IMAGE_COUNT } from './constants';

export default function useInstagramGallery( { accessToken, noticeOperations, setAttributes } ) {
	const [ images, setImages ] = useState( [] );
	const [ isLoadingGallery, setIsLoadingGallery ] = useState( false );

	useEffect( () => {
		// If the block doesn't have a token don't bother trying to load the gallery.
		if ( ! accessToken ) {
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
			.then( response => {
				setIsLoadingGallery( false );

				// `missing_data` indicates that the token is invalid.
				if ( response.code && 'missing_data' === response.code ) {
					setImages( [] );
					setAttributes( { accessToken: undefined } );
					return;
				}

				const { external_name: externalName, images: imageList } = response;

				if ( ! imageList || ! isArray( imageList ) ) {
					noticeOperations.createErrorNotice(
						__( 'An error occurred. Please try again later.', 'jetpack' )
					);
					setImages( [] );
					return;
				}

				if ( isEmpty( imageList ) ) {
					noticeOperations.createErrorNotice(
						__( 'No images were found in your Instagram account.', 'jetpack' )
					);
				}

				setAttributes( { instagramUser: externalName } );
				setImages( imageList );
			} )
			.catch( () => {
				setIsLoadingGallery( false );
				setImages( [] );
				setAttributes( { accessToken: undefined } );
			} );
	}, [ accessToken, noticeOperations, setAttributes ] );

	return { images, isLoadingGallery, setImages };
}

/**
 * External dependencies
 */
import { isEmpty } from 'lodash';

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
		} ).then( ( { external_name: externalName, images: imageList } ) => {
			setIsLoadingGallery( false );

			if ( isEmpty( imageList ) ) {
				noticeOperations.createErrorNotice(
					__( 'No images were found in your Instagram account.', 'jetpack' )
				);
				return;
			}

			setAttributes( { instagramUser: externalName } );
			setImages( imageList );
		} );
	}, [ accessToken, noticeOperations, setAttributes ] );

	return { images, isLoadingGallery, setImages };
}

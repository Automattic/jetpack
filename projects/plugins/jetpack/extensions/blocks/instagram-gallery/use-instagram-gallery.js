import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { isArray, isEmpty } from 'lodash';
import { MAX_IMAGE_COUNT } from './constants';

export default function useInstagramGallery( {
	accessToken,
	noticeOperations,
	setAttributes,
	setSelectedAccount,
} ) {
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
					setAttributes( { accessToken: undefined, instagramUser: undefined } );
					setSelectedAccount( undefined );
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
				setAttributes( { accessToken: undefined, instagramUser: undefined } );
				setSelectedAccount( undefined );
			} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ accessToken, setAttributes, setSelectedAccount ] );

	return { images, isLoadingGallery, setImages };
}

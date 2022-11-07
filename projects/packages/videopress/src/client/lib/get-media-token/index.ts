import {
	MediaTokenScopeProps,
	MediaTokenScopeAdminAjaxResponseBodyProps,
	mediaTokenProps,
	MEDIA_TOKEN_SCOPES,
	mediaTokenUploadActionProp,
} from './types';

/**
 * Return media token data hiting the admin-ajax endpoint.
 *
 * @param {MediaTokenScopeProps} scope - The scope of the token to request.
 * @returns {mediaTokenProps} - The media token data.
 */
const getMediaToken = function ( scope: MediaTokenScopeProps ): Promise< mediaTokenProps > {
	return new Promise( function ( resolve, reject ) {
		if ( ! MEDIA_TOKEN_SCOPES.includes( scope ) ) {
			return reject( 'Invalid scope' );
		}

		let adminAjaxAction: mediaTokenUploadActionProp;
		switch ( scope ) {
			case 'upload':
				adminAjaxAction = 'videopress-get-upload-token';
				break;
		}

		window.wp.media
			.ajax( adminAjaxAction, {
				async: true,
			} )
			.done( ( response: MediaTokenScopeAdminAjaxResponseBodyProps ) => {
				resolve( {
					token: response.upload_token,
					blogId: response.upload_blog_id,
					url: response.upload_action_url,
				} );
			} );
	} );
};

export default getMediaToken;

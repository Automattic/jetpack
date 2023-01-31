/**
 * Internal dependencies
 */
import { VideoGUID } from '../../block-editor/blocks/video/types';
import {
	MediaTokenScopeProps,
	MediaTokenScopeAdminAjaxResponseBodyProps,
	MediaTokenProps,
	MEDIA_TOKEN_SCOPES,
	AdminAjaxTokenProps,
	GetMediaTokenArgsProps,
} from './types';

/**
 * Return media token data hiting the admin-ajax endpoint.
 *
 * @param {MediaTokenScopeProps} scope  - The scope of the token to request.
 * @param {GetMediaTokenArgsProps} args - function arguments.
 * @returns {MediaTokenProps}             Media token data.
 */
const getMediaToken = function (
	scope: MediaTokenScopeProps,
	args: GetMediaTokenArgsProps = {}
): Promise< MediaTokenProps > {
	const { id, guid, adminAjaxAPI: adminAjaxAPIArggument } = args;
	return new Promise( function ( resolve, reject ) {
		const adminAjaxAPI = adminAjaxAPIArggument || window.videopressAjax?.ajaxUrl;
		if ( ! adminAjaxAPI ) {
			return reject( 'adminAjaxAPI is not accesible' );
		}

		if ( ! MEDIA_TOKEN_SCOPES.includes( scope ) ) {
			return reject( 'Invalid scope' );
		}

		const fetchData: {
			action: AdminAjaxTokenProps;
			guid?: VideoGUID;
			post_id?: string;
		} = { action: 'videopress-get-playback-jwt' };

		switch ( scope ) {
			case 'upload':
				fetchData.action = 'videopress-get-upload-token';
				break;

			case 'upload-jwt':
				fetchData.action = 'videopress-get-upload-jwt';
				break;

			case 'playback':
				fetchData.action = 'videopress-get-playback-jwt';
				fetchData.guid = guid;
				fetchData.post_id = String( id );
				break;
		}

		fetch( adminAjaxAPI, {
			method: 'POST',
			credentials: 'same-origin',
			body: new URLSearchParams( fetchData ),
		} )
			.then( response => {
				if ( ! response.ok ) {
					throw new Error( 'Network response was not ok' );
				}
				return response.json();
			} )
			.then( ( response: MediaTokenScopeAdminAjaxResponseBodyProps ) => {
				if ( ! response.success ) {
					throw new Error( 'Token is not achievable' );
				}

				switch ( scope ) {
					case 'upload':
					case 'upload-jwt':
						resolve( {
							token: response.data.upload_token,
							blogId: response.data.upload_blog_id,
							url: response.data.upload_action_url,
						} );
						break;

					case 'playback':
						resolve( { token: response.data.jwt } );
						break;
				}
			} )
			.catch( () => {
				console.warn( 'Token is not achievable' ); // eslint-disable-line no-console
				resolve( { token: null } );
			} );
	} );
};

export default getMediaToken;

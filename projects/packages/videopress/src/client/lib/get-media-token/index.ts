import { VideoGUID, VideoId } from '../../block-editor/blocks/video/types';
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
 * @param {GetMediaTokenArgsProps} args - function arguments
 * @returns {MediaTokenProps}            Media token data.
 */
const getMediaToken = function (
	scope: MediaTokenScopeProps,
	args: GetMediaTokenArgsProps = {}
): Promise< MediaTokenProps > {
	const { id, guid } = args;
	return new Promise( function ( resolve, reject ) {
		if ( ! MEDIA_TOKEN_SCOPES.includes( scope ) ) {
			return reject( 'Invalid scope' );
		}

		let adminAjaxAction: AdminAjaxTokenProps;

		const data: {
			guid?: VideoGUID;
			id?: VideoId;
		} = {};

		switch ( scope ) {
			case 'upload':
				adminAjaxAction = 'videopress-get-upload-token';
				break;

			case 'playback':
				adminAjaxAction = 'videopress-get-playback-jwt';
				data.id = id;
				data.guid = guid;
				break;
		}

		window.wp.media
			.ajax( adminAjaxAction, {
				async: true,
				data,
			} )
			.then( ( response: MediaTokenScopeAdminAjaxResponseBodyProps ) => {
				switch ( scope ) {
					case 'upload':
						resolve( {
							token: response.upload_token,
							blogId: response.upload_blog_id,
							url: response.upload_action_url,
						} );
						break;

					case 'playback':
						resolve( { token: response.jwt } );
						break;
				}
			} )
			.catch( err => {
				console.warn( 'Token is not achievable: "%s"', err?.message ?? err ); // eslint-disable-line no-console
				resolve( { token: null } );
			} );
	} );
};

export default getMediaToken;

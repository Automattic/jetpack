/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { VideoGuid, VideoId } from '../../block-editor/blocks/video/types';
import {
	MediaTokenScopeProps,
	MediaTokenScopeAdminAjaxResponseBodyProps,
	MediaTokenProps,
	MEDIA_TOKEN_SCOPES,
	AdminAjaxTokenProps,
	GetMediaTokenArgsProps,
} from './types';

const debug = debugFactory( 'videopress:get-media-token' );

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
			guid?: VideoGuid;
			id?: VideoId;
		} = {};

		switch ( scope ) {
			case 'upload':
				adminAjaxAction = 'videopress-get-upload-token';
				break;

			case 'upload-jwt':
				adminAjaxAction = 'videopress-get-upload-jwt';
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
					case 'upload-jwt':
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
			.catch( () => {
				debug( 'Token is not achievable' );
				resolve( { token: null } );
			} );
	} );
};

export default getMediaToken;

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import getMediaToken from '../../lib/get-media-token';
import { MediaTokenScopeProps } from '../../lib/get-media-token/types';
import { VideoGUID, VideoId } from '../blocks/video/types';

type UseMediaTokenArgs = {
	id?: VideoId;
	guid?: VideoGUID;
	isPrivate: boolean;
	tokenType: MediaTokenScopeProps;
};
/**
 * Hook to get a media token.
 *
 * @param {UseMediaTokenArgs} args - Hook arguments object.
 * @returns {string} The media token.
 */
const useMediaToken = ( { id, guid, isPrivate, tokenType }: UseMediaTokenArgs ): string | null => {
	const [ token, setToken ] = useState< string | null >( null );

	useEffect( () => {
		if ( ! isPrivate ) {
			return setToken( null );
		}
		getMediaToken( tokenType, { id, guid } ).then( tokenData => {
			setToken( tokenData?.token );
		} );
	}, [ isPrivate ] );

	return token;
};

export default useMediaToken;

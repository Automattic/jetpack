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

export default function useGatherTweetstorm( { url, noticeOperations } ) {
	const [ blocks, setBlocks ] = useState( [] );
	const [ isGatheringStorm, setIsGatheringStorm ] = useState( false );

	useEffect( () => {
		if ( isEmpty( url ) ) {
			return;
		}

		noticeOperations.removeAllNotices();
		setIsGatheringStorm( true );

		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/gather-tweetstorm', { url } ),
		} )
			.then( blockList => {
				setIsGatheringStorm( false );

				if ( ! isArray( blockList ) ) {
					noticeOperations.createErrorNotice(
						__( 'An error occurred. Please try again later.', 'jetpack' )
					);
					setBlocks( [] );
					return;
				}

				if ( isEmpty( blockList ) ) {
					noticeOperations.createErrorNotice(
						__( 'We were unable to get any content from this tweet.', 'jetpack' )
					);
				}

				setBlocks( blockList );
			} )
			.catch( response => {
				setIsGatheringStorm( false );
				setBlocks( [] );
				noticeOperations.createErrorNotice( response.message );
			} );
	}, [ url, noticeOperations ] );

	return { blocks, isGatheringStorm };
}

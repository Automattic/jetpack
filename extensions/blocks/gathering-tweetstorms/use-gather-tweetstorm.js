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
import { createBlock } from '@wordpress/blocks';

/**
 * Given a tweet URL, find any tweetstorm replies it has, and replace the current
 * block with the tweetstorm content.
 *
 * @param {object}   o - Function parameters.
 * @param {string}   o.url - The tweet URL.
 * @param {Function} [o.noticeOperations] - Optional. From WordPress' withNotices() HOC.
 * @param {Function} o.onReplace - The onReplace() function passed down from the block.
 *
 * @returns {object} Object containing blocks, whether the API call is still running,
 * and unleashStorm(), a function to replace the current block with the tweetstorm content.
 */
export default function useGatherTweetstorm( { url, noticeOperations, onReplace } ) {
	const [ blocks, setBlocks ] = useState( [] );
	const [ isGatheringStorm, setIsGatheringStorm ] = useState( false );

	useEffect( () => {
		if ( isEmpty( url ) ) {
			setBlocks( [] );
			return;
		}

		noticeOperations && noticeOperations.removeAllNotices();
		setIsGatheringStorm( true );

		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/gather-tweetstorm', { url } ),
		} )
			.then( blockList => {
				setIsGatheringStorm( false );

				if ( ! isArray( blockList ) ) {
					noticeOperations &&
						noticeOperations.createErrorNotice(
							__( 'An error occurred. Please try again later.', 'jetpack' )
						);
					setBlocks( [] );
					return;
				}

				if ( isEmpty( blockList ) ) {
					noticeOperations &&
						noticeOperations.createErrorNotice(
							__( 'We were unable to get any content from this tweet.', 'jetpack' )
						);
				}

				setBlocks( blockList );
			} )
			.catch( response => {
				setIsGatheringStorm( false );
				setBlocks( [] );
				noticeOperations && noticeOperations.createErrorNotice( response.message );
			} );
	}, [ url, noticeOperations ] );

	/**
	 * If the current tweet has produced blocks, replace the current block with those blocks.
	 */
	const unleashStorm = () => {
		if ( ! isEmpty( blocks ) ) {
			onReplace(
				blocks.map( block => {
					switch ( block.type ) {
						case 'paragraph':
							return createBlock( 'core/paragraph', { content: block.content } );
						case 'gallery':
							return createBlock( 'core/gallery', { images: block.images } );
						case 'image':
							return createBlock( 'core/image', { url: block.url, alt: block.alt } );
						case 'video':
							return createBlock( 'core/video', { src: block.url, caption: block.alt } );
						case 'embed':
							return createBlock( 'core/embed', { url: block.url } );
					}
				} )
			);
		}
	};

	return { blocks, isGatheringStorm, unleashStorm };
}

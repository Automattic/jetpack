import apiFetch from '@wordpress/api-fetch';
import { createBlock } from '@wordpress/blocks';
import { useSelect, dispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { isArray, isEmpty, some } from 'lodash';

/**
 * Given a tweet URL, find any tweetstorm replies it has, and replace the current
 * block with the tweetstorm content.
 *
 * @param {object}   o - Function parameters.
 * @param {Function} o.onReplace - The onReplace() function passed down from the block.
 * @returns {object} Object whether the API call is still running, and unleashStorm(),
 * a function to replace the current block with the tweetstorm content.
 */
export default function useGatherTweetstorm( { onReplace } ) {
	const [ isGatheringStorm, setIsGatheringStorm ] = useState( false );

	const connections = useSelect( select => {
		return select( 'core/editor' ).getEditedPostAttribute( 'jetpack_publicize_connections' );
	} );

	/**
	 * Import the tweet content, and replace the current block with that content.
	 *
	 * @param {string}   url - The tweet URL.
	 * @param {Function} noticeOperations - From WordPress' withNotices() HOC.
	 */
	const unleashStorm = ( url, noticeOperations ) => {
		if ( isEmpty( url ) ) {
			return;
		}

		const userResult = url.match( /^https?:\/\/(?:www\.)?twitter\.com\/([^/]+)\/status\/\d+/ );
		if ( isEmpty( userResult ) ) {
			return;
		}

		const twitterUser = userResult[ 1 ];

		noticeOperations.removeAllNotices();
		setIsGatheringStorm( true );

		apiFetch( {
			path: addQueryArgs( '/wpcom/v2/tweetstorm/gather', { url } ),
		} )
			.then( blocks => {
				setIsGatheringStorm( false );

				if ( ! isArray( blocks ) ) {
					noticeOperations.createErrorNotice(
						__( 'An error occurred. Please try again later.', 'jetpack' )
					);

					return;
				}

				if ( isEmpty( blocks ) ) {
					noticeOperations.createErrorNotice(
						__( 'We were unable to get any content from this tweet.', 'jetpack' )
					);

					return;
				}

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

				const verifiedConnection = some( connections, el => {
					if ( 'twitter' !== el.service_name ) {
						return false;
					}

					if ( `@${ twitterUser }` !== el.display_name ) {
						return false;
					}

					return true;
				} );

				if ( ! verifiedConnection ) {
					dispatch( 'core/notices' ).createWarningNotice(
						__(
							'We were unable to verify that this Twitter thread was published on a Twitter account belonging to you. Please ensure you have permission to reproduce it before publishing.',
							'jetpack'
						)
					);
				}

				dispatch( 'core/notices' ).createSuccessNotice(
					__( 'Twitter thread successfully imported', 'jetpack' ),
					{ type: 'snackbar' }
				);
			} )
			.catch( response => {
				setIsGatheringStorm( false );
				noticeOperations.createErrorNotice( response.message );
			} );
	};

	return { isGatheringStorm, unleashStorm };
}

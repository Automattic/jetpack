import { TwitterPreviews } from '@automattic/social-previews';
import { withSelect } from '@wordpress/data';
import React from 'react';
import { getMediaSourceUrl } from './utils';

/**
 * The twitter tab component.
 *
 * @param {object} props - The props.
 * @param {object[]} props.tweets - The tweets.
 * @param {object} props.media - The media.
 * @returns {React.ReactNode} The twitter tab component.
 */
export function Twitter( { tweets, media } ) {
	return <TwitterPreviews tweets={ tweets } media={ media } />;
}

export default withSelect( ( select, { title, description, image, url } ) => {
	const { getMedia } = select( 'core' );
	const { getEditedPostAttribute } = select( 'core/editor' );
	const { getTweetTemplate, getTweetStorm, getShareMessage, isTweetStorm } =
		select( 'jetpack/publicize' );

	const media = getMedia( getEditedPostAttribute( 'featured_media' ) );

	let tweets = [];
	if ( isTweetStorm() ) {
		tweets = getTweetStorm();
	} else {
		tweets.push( {
			...getTweetTemplate(),
			text: getShareMessage(),
			cardType: image ? 'summary_large_image' : 'summary',
			title,
			description,
			image,
			url,
		} );
	}

	return {
		tweets,
		media: media
			? [
					{
						type: media.mime_type,
						url: getMediaSourceUrl( media ),
						alt: media.alt_text,
					},
			  ]
			: null,
	};
} )( Twitter );

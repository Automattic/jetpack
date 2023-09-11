import { TwitterPreviews } from '@automattic/social-previews';
import { withSelect } from '@wordpress/data';
import React from 'react';

/**
 * The twitter tab component.
 *
 * @param {object} props - The props.
 * @param {object[]} props.tweets - The tweets.
 * @returns {React.ReactNode} The twitter tab component.
 */
function Twitter( { tweets } ) {
	return <TwitterPreviews tweets={ tweets } hidePostPreview />;
}

export default withSelect( ( select, { title, description, image, url, media } ) => {
	const { getTweetTemplate, getTweetStorm, getShareMessage, isTweetStorm } =
		select( 'jetpack/publicize' );

	let tweets = [];
	if ( isTweetStorm() ) {
		tweets = getTweetStorm();
	} else {
		tweets.push( {
			...getTweetTemplate(),
			text: getShareMessage() + ( media.length ? ` ${ url }` : '' ),
			cardType: image ? 'summary_large_image' : 'summary',
			title,
			description,
			image,
			media,
			url,
		} );
	}

	return { tweets };
} )( Twitter );

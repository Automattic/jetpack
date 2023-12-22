import { TwitterPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import React from 'react';
import { usePostMeta } from '../../hooks/use-post-meta';
import { SOCIAL_STORE_ID, CONNECTION_SERVICE_TWITTER } from '../../social-store';

/**
 * The twitter tab component.
 *
 * @param {object} props - The props.
 * @param {string} props.title - The post title
 * @param {string} props.description - The post description/excerpt
 * @param {object} props.image - The post featured image
 * @param {string} props.url - The URL of the post
 * @param {object[]} props.media - Array of attached media
 * @returns {React.ReactNode} The twitter tab component.
 */
function Twitter( { title, description, image, url, media } ) {
	const { shareMessage } = usePostMeta();

	const tweets = useSelect(
		select => {
			const {
				displayName: name,
				profileImage,
				username: screenName,
			} = select( SOCIAL_STORE_ID ).getConnectionProfileDetails( CONNECTION_SERVICE_TWITTER );

			return [
				{
					name,
					profileImage,
					screenName,
					text: shareMessage + ( media.length ? ` ${ url }` : '' ),
					cardType: image ? 'summary_large_image' : 'summary',
					title,
					description,
					image,
					media,
					url,
				},
			];
		},
		[ title, image, description, media, url, shareMessage ]
	);

	return <TwitterPreviews tweets={ tweets } hidePostPreview />;
}

export default Twitter;

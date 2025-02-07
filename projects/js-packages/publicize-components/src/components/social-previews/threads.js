import { ThreadsPreviews } from '@automattic/social-previews';
import { decodeEntities } from '@wordpress/html-entities';
import React, { useMemo } from 'react';
import { usePostMeta } from '../../hooks/use-post-meta';

/**
 * The threads tab component.
 *
 * @param {object}   props             - The props.
 * @param {string}   props.excerpt     - The post excerpt
 * @param {string}   props.title       - The post title
 * @param {string}   props.description - The post description/excerpt
 * @param {object}   props.image       - The post featured image
 * @param {string}   props.url         - The URL of the post
 * @param {object[]} props.media       - Array of attached media
 * @return {React.ReactNode} The threads tab component.
 */
export function Threads( { excerpt, title, description, image, url, media } ) {
	const { shareMessage } = usePostMeta();

	const posts = useMemo( () => {
		let caption = title;

		if ( shareMessage ) {
			caption = shareMessage;
		} else if ( title && excerpt ) {
			caption = `${ title }\n\n${ excerpt }`;
		}

		const captionLength =
			// 500 characters
			500 -
			// Number of characters in the article URL
			url.length -
			// 2 characters for line break
			2;

		caption = decodeEntities( caption ).slice( 0, captionLength );

		caption += `\n\n${ url }`;

		return [
			{
				caption,
				title,
				description,
				image,
				media,
				url,
			},
		];
	}, [ excerpt, title, image, description, media, url, shareMessage ] );

	return <ThreadsPreviews posts={ posts } hidePostPreview />;
}

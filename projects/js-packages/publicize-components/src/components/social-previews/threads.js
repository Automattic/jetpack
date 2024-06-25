import { ThreadsPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import React from 'react';
import { usePostMeta } from '../../hooks/use-post-meta';
import { CONNECTION_SERVICE_THREADS, store } from '../../social-store';

/**
 * The threads tab component.
 *
 * @param {object} props - The props.
 * @param {string} props.title - The post title
 * @param {string} props.description - The post description/excerpt
 * @param {object} props.image - The post featured image
 * @param {string} props.url - The URL of the post
 * @param {object[]} props.media - Array of attached media
 * @returns {React.ReactNode} The threads tab component.
 */
export function Threads( { title, description, image, url, media } ) {
	const { shareMessage: text } = usePostMeta();

	const posts = useSelect(
		select => {
			const { displayName: name, profileImage } = select( store ).getConnectionProfileDetails(
				CONNECTION_SERVICE_THREADS
			);

			return [
				{
					name,
					profileImage,
					text,
					title,
					description,
					image,
					media,
					url,
				},
			];
		},
		[ title, image, description, media, url, text ]
	);

	const threadsConnections = useSelect(
		select => select( store ).getConnectionsByService( CONNECTION_SERVICE_THREADS ),
		[]
	);

	return <ThreadsPreviews posts={ posts } hidePostPreview={ ! threadsConnections.length } />;
}

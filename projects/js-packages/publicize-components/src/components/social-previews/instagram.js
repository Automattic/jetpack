import { InstagramPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { SOCIAL_STORE_ID, CONNECTION_SERVICE_INSTAGRAM_BUSINESS } from '../../social-store';

/**
 * The Instagram tab component.
 *
 * @param {object} props - The props.
 * @returns {React.ReactNode} The Instagram tab component.
 */
export function Instagram( props ) {
	const { title, image, media, description } = props;
	const { username: name, profileImage } = useSelect( select =>
		select( SOCIAL_STORE_ID ).getConnectionProfileDetails( CONNECTION_SERVICE_INSTAGRAM_BUSINESS )
	);

	const { message: text } = useSocialMediaMessage();

	const caption = text || title || description;

	return (
		<InstagramPreviews
			image={ image }
			media={ media }
			name={ name }
			profileImage={ profileImage }
			caption={ caption }
		/>
	);
}

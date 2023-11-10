import { InstagramPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { SOCIAL_STORE_ID } from '../../social-store';

/**
 * The Instagram tab component.
 *
 * @param {object} props - The props.
 * @returns {React.ReactNode} The Instagram tab component.
 */
export function Instagram( props ) {
	const { title, image, media } = props;
	const { name, profileImage } = useSelect( select =>
		select( SOCIAL_STORE_ID ).getInstagramDetails()
	);

	const { message: text } = useSocialMediaMessage();

	const caption = text || title;

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

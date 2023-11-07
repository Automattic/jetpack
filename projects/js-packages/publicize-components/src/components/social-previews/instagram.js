import { InstagramPreviews } from '@automattic/social-previews';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { getInstagramDetails } from '../../store/selectors';

/**
 * The Instagram tab component.
 *
 * @param {object} props - The props.
 * @returns {React.ReactNode} The Instagram tab component.
 */
export function Instagram( props ) {
	const { title, image, media } = props;

	const { name, profileImage } = getInstagramDetails();

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

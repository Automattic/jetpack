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
	const { title, image } = props;

	const { name, profileImage } = getInstagramDetails();

	const { message: text } = useSocialMediaMessage();

	const caption = text || title;

	return (
		<InstagramPreviews
			image={ image }
			name={ name }
			profileImage={ profileImage }
			caption={ caption }
		/>
	);
}

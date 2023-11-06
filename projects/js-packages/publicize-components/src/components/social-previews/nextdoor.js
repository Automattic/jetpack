import { NextdoorPreviews } from '@automattic/social-previews';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { getNextdoorDetails } from '../../store/selectors';

/**
 * The linkedin tab component.
 *
 * @param {object} props - The props.
 * @returns {React.ReactNode} The linkedin tab component.
 */
export function Nextdoor( props ) {
	const { title, url, image, media } = props;

	const { name, profileImage } = getNextdoorDetails();

	const { message: text } = useSocialMediaMessage();

	// Add the URL to the description if there is media
	const description = `${ text || title } ${ media.length ? url : '' }`.trim();

	return (
		<NextdoorPreviews
			image={ image }
			name={ name }
			profileImage={ profileImage }
			title={ title }
			description={ description }
			url={ url }
			media={ media }
		/>
	);
}

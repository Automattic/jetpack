import { LinkedInPreviews } from '@automattic/social-previews';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { getLinkedInDetails } from '../../store/selectors';

/**
 * The linkedin tab component.
 *
 * @param {object} props - The props.
 * @returns {React.ReactNode} The linkedin tab component.
 */
export function LinkedIn( props ) {
	const { title, url, image, media } = props;

	const { name, profileImage } = getLinkedInDetails();

	const { message: text } = useSocialMediaMessage();

	// Add the URL to the description if there is media
	const description = `${ text || title } ${ media.length ? url : '' }`.trim();

	return (
		<LinkedInPreviews
			jobTitle={ __( 'Job Title (Company Name)', 'jetpack' ) }
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

import { LinkedInPreviews } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { SOCIAL_STORE_ID, CONNECTION_SERVICE_LINKEDIN } from '../../social-store';

/**
 * The linkedin tab component.
 *
 * @param {object} props - The props.
 * @returns {React.ReactNode} The linkedin tab component.
 */
export function LinkedIn( props ) {
	const { title, url, image, media, description: postDescription } = props;

	const { displayName: name, profileImage } = useSelect( select =>
		select( SOCIAL_STORE_ID ).getConnectionProfileDetails( CONNECTION_SERVICE_LINKEDIN )
	);

	const { message: text } = useSocialMediaMessage();

	// Add the URL to the description if there is media
	const description = `${ text || title || postDescription } ${ media.length ? url : '' }`.trim();

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

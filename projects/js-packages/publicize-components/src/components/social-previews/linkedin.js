import { LinkedInPreviews } from '@automattic/social-previews';
import { __ } from '@wordpress/i18n';
import useSocialMediaMessage from '../../hooks/use-social-media-message';

/**
 * The linkedin tab component.
 *
 * @param {object} props - The props.
 * @return {import('react').ReactNode} The linkedin tab component.
 */
export function LinkedIn( props ) {
	const { title, url, image, media, description: postDescription } = props;

	const { message: text } = useSocialMediaMessage();

	// Add the URL to the description if there is media
	const description = `${ text || title || postDescription } ${ media.length ? url : '' }`.trim();

	return (
		<LinkedInPreviews
			jobTitle={ __( 'Job Title (Company Name)', 'jetpack-publicize-components' ) }
			image={ image }
			title={ title }
			description={ description }
			url={ url }
			media={ media }
			hidePostPreview
		/>
	);
}

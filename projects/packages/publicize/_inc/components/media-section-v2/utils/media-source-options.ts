/**
 * Media source options and helper functions
 */

import { AiSVG } from '@automattic/jetpack-ai-client';
import { __ } from '@wordpress/i18n';
import { image, starEmpty, media as mediaIcon } from '@wordpress/icons';
import { MediaSourceOption, MediaSourceType } from '../types';

/**
 * Get available media source options with their metadata.
 * This is a function (not a constant) to ensure translations are loaded when called.
 *
 * @return {MediaSourceOption[]} Array of media source options
 */
export function getMediaSourceOptions(): MediaSourceOption[] {
	return [
		{
			id: 'sig',
			label: __( 'Use template', 'jetpack-publicize-pkg' ),
			description: __( 'You are using the template.', 'jetpack-publicize-pkg' ),
			icon: starEmpty,
			group: 'link-preview',
			attachmentDescription: __(
				'Shares your template as an attached image, without a link preview card, for higher engagement.',
				'jetpack-publicize-pkg'
			),
		},
		{
			id: 'featured-image',
			label: __( 'Use featured image', 'jetpack-publicize-pkg' ),
			description: __( 'You are using your post featured image.', 'jetpack-publicize-pkg' ),
			icon: image,
			group: 'link-preview',
			attachmentDescription: __(
				'Shares your image as a regular post, without a link preview card, for higher engagement.',
				'jetpack-publicize-pkg'
			),
		},
		{
			id: 'ai-image',
			label: __( 'Generate image', 'jetpack-publicize-pkg' ),
			description: __( 'You are using an AI-generated image.', 'jetpack-publicize-pkg' ),
			icon: AiSVG,
			group: 'attachment',
			attachmentDescription: __(
				'Shares your AI-generated image as an attachment for higher engagement.',
				'jetpack-publicize-pkg'
			),
		},
		{
			id: 'media-library',
			label: __( 'From Media Library', 'jetpack-publicize-pkg' ),
			description: __( 'You are using a custom image.', 'jetpack-publicize-pkg' ),
			icon: mediaIcon,
			group: 'attachment',
		},
	];
}

interface MediaSourceContext {
	featuredImageId?: number;
}

/**
 * Get the description for a media source
 *
 * @param {MediaSourceType}    sourceType - Media source type
 * @param {MediaSourceContext} context    - Optional context with additional info
 * @return {string} Description for the media source
 */
export function getMediaSourceDescription(
	sourceType: MediaSourceType,
	context?: MediaSourceContext
): string {
	const noImageMessage = __( "Your post won't show an image.", 'jetpack-publicize-pkg' );

	if ( ! sourceType ) {
		return noImageMessage;
	}

	// If featured image is selected but doesn't exist, show "no image" message
	if ( sourceType === 'featured-image' && context && ! context.featuredImageId ) {
		return noImageMessage;
	}

	const options = getMediaSourceOptions();
	const option = options.find( opt => opt.id === sourceType );
	return option?.description || noImageMessage;
}

/**
 * Get the attachment toggle description for a media source
 *
 * @param {MediaSourceType} sourceType - Media source type
 * @return {string | undefined} Attachment description for the media source
 */
export function getAttachmentDescription( sourceType: MediaSourceType ): string | undefined {
	if ( ! sourceType ) {
		return undefined;
	}
	const options = getMediaSourceOptions();
	const option = options.find( opt => opt.id === sourceType );
	return option?.attachmentDescription;
}

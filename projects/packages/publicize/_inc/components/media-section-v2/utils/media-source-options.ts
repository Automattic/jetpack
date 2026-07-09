/**
 * Media source options and helper functions
 */

import { __ } from '@wordpress/i18n';
import { postFeaturedImage, mediaAndText, media as mediaIcon, link } from '@wordpress/icons';
import { getSocialScriptData } from '../../../utils';
import sparkle from '../icons/sparkle';
import { MediaSourceOption, MediaSourceType } from '../types';

/**
 * Get available media source options with their metadata.
 * This is a function (not a constant) to ensure translations are loaded when called.
 *
 * @return {MediaSourceOption[]} Array of media source options
 */
export function getMediaSourceOptions(): MediaSourceOption[] {
	const { plugin_info } = getSocialScriptData();

	return [
		{
			id: null,
			label: __( 'Default', 'jetpack-publicize-pkg' ),
			description: __(
				"You are using the post's Open Graph image for the link preview.",
				'jetpack-publicize-pkg'
			),
			icon: link,
			group: 'link-preview',
		},
		{
			id: 'sig',
			label: __( 'Social image template', 'jetpack-publicize-pkg' ),
			description: __( 'You are using the template.', 'jetpack-publicize-pkg' ),
			icon: mediaAndText,
			group: 'link-preview',
			attachmentDescription: __(
				'Shares your template as an attached image, without a link preview card, for higher engagement.',
				'jetpack-publicize-pkg'
			),
		},
		{
			id: 'featured-image',
			label: __( 'Featured image', 'jetpack-publicize-pkg' ),
			description: __( 'You are using your post featured image.', 'jetpack-publicize-pkg' ),
			icon: postFeaturedImage,
			group: 'link-preview',
			attachmentDescription: __(
				'Shares your image as a regular post, without a link preview card, for higher engagement.',
				'jetpack-publicize-pkg'
			),
		},
		plugin_info.jetpack.version
			? {
					id: 'ai-image',
					label: __( 'Generate image', 'jetpack-publicize-pkg' ),
					description: __( 'You are using an AI-generated image.', 'jetpack-publicize-pkg' ),
					icon: sparkle,
					group: 'attachment',
					attachmentDescription: __(
						'Shares your AI-generated image as an attachment for higher engagement.',
						'jetpack-publicize-pkg'
					),
			  }
			: null,
		{
			id: 'media-library',
			label: __( 'From Media Library', 'jetpack-publicize-pkg' ),
			description: __( 'You are using a custom image.', 'jetpack-publicize-pkg' ),
			icon: mediaIcon,
			group: 'attachment',
		},
	].filter( Boolean ) as MediaSourceOption[];
}

interface MediaSourceContext {
	featuredImageId?: number;
	sigEnabled?: boolean;
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

	// If featured image is selected but doesn't exist, show "no image" message
	if ( sourceType === 'featured-image' && context && ! context.featuredImageId ) {
		return noImageMessage;
	}

	/*
	 * Default mode (sourceType === null): describe what the link preview will actually
	 * resolve to, mirroring the OG resolution priority — SIG (if globally enabled) →
	 * featured image → no image.
	 */
	if ( sourceType === null ) {
		if ( context?.sigEnabled ) {
			return __(
				'You are using the social image template for the link preview.',
				'jetpack-publicize-pkg'
			);
		}
		if ( context?.featuredImageId ) {
			return __(
				'You are using the featured image for the link preview.',
				'jetpack-publicize-pkg'
			);
		}
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

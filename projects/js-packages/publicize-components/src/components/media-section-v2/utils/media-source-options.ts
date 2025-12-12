/**
 * Media source options and helper functions
 */

import { AiSVG } from '@automattic/jetpack-ai-client';
import { __ } from '@wordpress/i18n';
import { image, video, starEmpty, media as mediaIcon } from '@wordpress/icons';
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
			id: 'featured-image',
			label: __( 'Featured Image', 'jetpack-publicize-components' ),
			description: __( 'You are using your post featured image.', 'jetpack-publicize-components' ),
			icon: image,
			group: 'link-preview',
			attachmentDescription: __(
				'Shares your image as a regular post, without a link preview card, for higher engagement.',
				'jetpack-publicize-components'
			),
		},
		{
			id: 'sig',
			label: __( 'Social Image Template', 'jetpack-publicize-components' ),
			description: __( 'You are using the template.', 'jetpack-publicize-components' ),
			icon: starEmpty,
			group: 'link-preview',
			attachmentDescription: __(
				'Shares your template as an attached image, without a link preview card, for higher engagement.',
				'jetpack-publicize-components'
			),
		},
		{
			id: 'media-library',
			label: __( 'Media Library', 'jetpack-publicize-components' ),
			description: __( 'You are using a custom image.', 'jetpack-publicize-components' ),
			icon: mediaIcon,
			group: 'attachment',
		},
		{
			id: 'upload-video',
			label: __( 'Upload video', 'jetpack-publicize-components' ),
			description: __( 'Upload a video file.', 'jetpack-publicize-components' ),
			icon: video,
			group: 'attachment',
		},
		{
			id: 'ai-image',
			label: __( 'Generate image', 'jetpack-publicize-components' ),
			description: __( 'You are using an AI-generated image.', 'jetpack-publicize-components' ),
			icon: AiSVG,
			group: 'attachment',
			attachmentDescription: __(
				'Shares your AI-generated image as an attachment for higher engagement.',
				'jetpack-publicize-components'
			),
		},
	];
}

/**
 * Get the description for a media source
 *
 * @param {MediaSourceType} sourceType - Media source type
 * @return {string} Description for the media source
 */
export function getMediaSourceDescription( sourceType: MediaSourceType ): string {
	if ( ! sourceType ) {
		return __( "Your post won't show an image.", 'jetpack-publicize-components' );
	}
	const options = getMediaSourceOptions();
	const option = options.find( opt => opt.id === sourceType );
	return (
		option?.description || __( "Your post won't show an image.", 'jetpack-publicize-components' )
	);
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

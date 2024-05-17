import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import MediaSection from '../media-section';
import MessageBoxControl from '../message-box-control';
import SocialPostControl from '../social-post-control';

export const SharePostForm: React.FC = () => {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();
	const { isEnabled: isSocialImageGeneratorEnabledForPost } = useImageGeneratorConfig();

	const { isEnhancedPublishingEnabled, isSocialImageGeneratorAvailable, isJetpackSocialNote } =
		usePublicizeConfig();

	const shouldDisableMediaPicker =
		isSocialImageGeneratorAvailable && isSocialImageGeneratorEnabledForPost;

	const { attachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();
	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;
	const socialPostDisabled = ! mediaId && ! isSocialImageGeneratorEnabledForPost;

	return isJetpackSocialNote && isEnhancedPublishingEnabled ? (
		<SocialPostControl disabled={ socialPostDisabled } isCustomMediaAvailable={ false } />
	) : (
		<>
			<MessageBoxControl maxLength={ maxLength } onChange={ updateMessage } message={ message } />
			{ isEnhancedPublishingEnabled && (
				<MediaSection
					disabled={ shouldDisableMediaPicker }
					socialPostDisabled={ socialPostDisabled }
					disabledNoticeMessage={
						shouldDisableMediaPicker
							? __(
									'It is not possible to add an image or video when Social Image Generator is enabled.',
									'jetpack'
							  )
							: null
					}
				/>
			) }
		</>
	);
};

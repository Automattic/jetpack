import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import MediaSection from '../media-section';
import MessageBoxControl from '../message-box-control';

export const SharePostForm: React.FC = () => {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();
	const { isEnabled: isSocialImageGeneratorEnabledForPost } = useImageGeneratorConfig();

	const { isEnhancedPublishingEnabled, isSocialImageGeneratorAvailable } = usePublicizeConfig();

	const shouldDisableMediaPicker =
		isSocialImageGeneratorAvailable && isSocialImageGeneratorEnabledForPost;

	return (
		<>
			<MessageBoxControl maxLength={ maxLength } onChange={ updateMessage } message={ message } />
			{ isEnhancedPublishingEnabled && (
				<MediaSection
					disabled={ shouldDisableMediaPicker }
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

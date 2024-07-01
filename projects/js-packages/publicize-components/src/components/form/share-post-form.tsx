import { usePublicizeConfig } from '../../..';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import MediaSection from '../media-section';
import MessageBoxControl from '../message-box-control';

export const SharePostForm: React.FC = () => {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();

	const { isEnhancedPublishingEnabled } = usePublicizeConfig();

	return (
		<>
			<MessageBoxControl maxLength={ maxLength } onChange={ updateMessage } message={ message } />
			{ isEnhancedPublishingEnabled && <MediaSection /> }
		</>
	);
};

import { usePublicizeConfig } from '../../..';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import MediaSection from '../media-section';
import MessageBoxControl from '../message-box-control';

type SharePostFormProps = {
	analyticsData?: object;
};

/**
 * The SharePostForm component.
 * @param {object} props - The component props.
 * @param {object} [props.analyticsData] - Data for tracking analytics.
 * @returns {object} The SharePostForm component.
 */
export const SharePostForm: React.FC< SharePostFormProps > = ( { analyticsData = null } ) => {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();

	const { isEnhancedPublishingEnabled } = usePublicizeConfig();

	return (
		<>
			<MessageBoxControl
				maxLength={ maxLength }
				onChange={ updateMessage }
				message={ message }
				analyticsData={ analyticsData }
			/>
			{ isEnhancedPublishingEnabled && <MediaSection analyticsData={ analyticsData } /> }
		</>
	);
};

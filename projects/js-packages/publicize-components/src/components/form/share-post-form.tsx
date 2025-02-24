import { siteHasFeature } from '@automattic/jetpack-script-data';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { features } from '../../utils/constants';
import { useIsSocialNote } from '../../utils/use-is-social-note';
import MediaSection from '../media-section';
import MessageBoxControl from '../message-box-control';
import styles from './styles.module.scss';

type SharePostFormProps = {
	analyticsData?: object;
};

/**
 * The SharePostForm component.
 * @param {object} props                 - The component props.
 * @param {object} [props.analyticsData] - Data for tracking analytics.
 * @return {object} The SharePostForm component.
 */
export const SharePostForm: React.FC< SharePostFormProps > = ( { analyticsData = null } ) => {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();
	const isSocialNote = useIsSocialNote();

	return (
		<>
			{ ! isSocialNote && (
				<MessageBoxControl
					maxLength={ maxLength }
					onChange={ updateMessage }
					message={ message }
					analyticsData={ analyticsData }
				/>
			) }
			{ siteHasFeature( features.ENHANCED_PUBLISHING ) && (
				<div className={ styles[ 'share-post-form__media-section' ] }>
					<MediaSection analyticsData={ analyticsData } />
				</div>
			) }
		</>
	);
};

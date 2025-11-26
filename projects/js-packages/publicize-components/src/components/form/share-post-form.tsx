import { siteHasFeature } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { usePostCanUseSig } from '../../hooks/use-post-can-use-sig';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { features } from '../../utils/constants';
import { useIsSocialNote } from '../../utils/use-is-social-note';
import MediaSection from '../media-section';
import MessageBoxControl from '../message-box-control';
import NewMediaSection from '../new-media-section';
import SocialImageGeneratorPanel from '../social-image-generator/panel';
import styles from './styles.module.scss';
import type { FC } from 'react';

type SharePostFormProps = {
	/** Data for tracking analytics */
	analyticsData?: {
		/** The location of the analytics event */
		location: string;
	};
};

/**
 * The SharePostForm component.
 * @param {object} props                 - The component props.
 * @param {object} [props.analyticsData] - Data for tracking analytics.
 * @return {object} The SharePostForm component.
 */
export const SharePostForm: FC< SharePostFormProps > = ( { analyticsData = null } ) => {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();
	const isSocialNote = useIsSocialNote();
	const postCanUseSig = usePostCanUseSig();

	return (
		<>
			{ ! isSocialNote && (
				<MessageBoxControl
					label={ __( 'Message', 'jetpack-publicize-components' ) }
					maxLength={ maxLength }
					onChange={ updateMessage }
					message={ message }
					analyticsData={ analyticsData }
				/>
			) }
			{ siteHasFeature( features.UNIFIED_UI_V1 ) ? (
				<div className={ styles[ 'share-post-form__media-section' ] }>
					<NewMediaSection analyticsData={ analyticsData } />
				</div>
			) : (
				<>
					{ siteHasFeature( features.ENHANCED_PUBLISHING ) && (
						<div className={ styles[ 'share-post-form__media-section' ] }>
							<MediaSection analyticsData={ analyticsData } />
						</div>
					) }
					{ /* Social Image Generator panel - only shown when not using unified UI */ }
					{ postCanUseSig && <SocialImageGeneratorPanel /> }
				</>
			) }
		</>
	);
};

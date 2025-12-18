import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useNavigator } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, type FC } from 'react';
import { usePostCanUseSig } from '../../hooks/use-post-can-use-sig';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils';
import { features } from '../../utils/constants';
import { useIsSocialNote } from '../../utils/use-is-social-note';
import MediaSection from '../media-section';
import MediaSectionV2 from '../media-section-v2';
import MessageBoxControl from '../message-box-control';
import SocialImageGeneratorPanel from '../social-image-generator/panel';
import styles from './styles.module.scss';
import { UpgradeNotice } from './upgrade-notice';

type SharePostFormProps = {
	/** Data for tracking analytics */
	analyticsData?: {
		/** The location of the analytics event */
		location: string;
	};
	/**
	 * Whether the form is rendered inside a NavigatorModal.
	 * This enables navigation for certain components within the form.
	 */
	isInsideNavigatorModal?: boolean;
};

/**
 * The SharePostForm component.
 * @param {SharePostFormProps} props - The component props.
 *
 * @return The SharePostForm component.
 */
export const SharePostForm: FC< SharePostFormProps > = ( {
	analyticsData = null,
	isInsideNavigatorModal,
} ) => {
	const { message, updateMessage, maxLength } = useSocialMediaMessage();
	const isSocialNote = useIsSocialNote();
	const postCanUseSig = usePostCanUseSig();

	const { openUnifiedModal } = useDispatch( socialStore );

	const navigator = useNavigator();

	const onEditTemplate = useCallback( () => {
		// If inside NavigatorModal, navigate to edit-template route
		if ( isInsideNavigatorModal ) {
			navigator.goTo( '/edit-template' );
		} else {
			// Otherwise, open the unified modal for editing template
			openUnifiedModal( { initialPath: '/edit-template', isScreenLocked: true } );
		}
	}, [ openUnifiedModal, isInsideNavigatorModal, navigator ] );

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
					{ ! hasSocialPaidFeatures() ? (
						<UpgradeNotice />
					) : (
						<MediaSectionV2 analyticsData={ analyticsData } onEditTemplate={ onEditTemplate } />
					) }
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

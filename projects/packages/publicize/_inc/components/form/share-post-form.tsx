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
import type { AttachedMedia, JetpackSocialOptions, SIGSettings } from '../../utils/types';

export type SharePostFormProps = {
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

	/**
	 * Optional message value. When provided, the component uses this value
	 * instead of fetching from the store.
	 */
	message?: string;

	/**
	 * Optional callback to update the message. When omitted, falls back to
	 * updating via the internal store.
	 */
	onMessageChange?: ( message: string ) => void;

	/**
	 * Optional attached media array. In controlled mode (when `onMediaChange` is provided),
	 * this value is passed to child components instead of fetching from the store.
	 */
	attachedMedia?: Array< AttachedMedia >;

	/**
	 * Optional image generator settings. In controlled mode, this value is passed to
	 * child components instead of fetching from the store.
	 */
	imageGeneratorSettings?: SIGSettings;

	/**
	 * Optional media source value. In controlled mode, this value is passed to
	 * child components instead of fetching from the store.
	 */
	mediaSource?: JetpackSocialOptions[ 'media_source' ];

	/**
	 * Optional callback to update media-related options. When provided, the component
	 * operates in controlled mode and uses the media props instead of fetching from the store.
	 */
	onMediaChange?: ( updates: Partial< JetpackSocialOptions > ) => void;
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
	message: messageProp,
	onMessageChange,
	attachedMedia,
	imageGeneratorSettings,
	mediaSource,
	onMediaChange,
} ) => {
	const {
		message: storeMessage,
		updateMessage: storeUpdateMessage,
		maxLength,
	} = useSocialMediaMessage();
	const isSocialNote = useIsSocialNote();
	const postCanUseSig = usePostCanUseSig();

	// Use props if provided, otherwise fall back to store values
	const message = messageProp !== undefined ? messageProp : storeMessage;
	const updateMessage = onMessageChange ?? storeUpdateMessage;

	// Check if we're in "controlled" mode for media (props provided)
	const isMediaControlled = onMediaChange !== undefined;

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
		<div className={ styles[ 'share-post-form' ] }>
			{ ! isSocialNote && (
				<MessageBoxControl
					label={ __( 'Message', 'jetpack-publicize-pkg' ) }
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
						<MediaSectionV2
							analyticsData={ analyticsData }
							onEditTemplate={ onEditTemplate }
							{ ...( isMediaControlled && {
								attachedMedia,
								imageGeneratorSettings,
								mediaSource,
								onMediaChange,
							} ) }
						/>
					) }
				</div>
			) : (
				<>
					{ siteHasFeature( features.ENHANCED_PUBLISHING ) && (
						<div className={ styles[ 'share-post-form__media-section' ] }>
							<MediaSection
								analyticsData={ analyticsData }
								{ ...( isMediaControlled && {
									attachedMedia,
									onMediaChange,
								} ) }
							/>
						</div>
					) }
					{ /* Social Image Generator panel - only shown when not using unified UI */ }
					{ postCanUseSig && <SocialImageGeneratorPanel /> }
				</>
			) }
		</div>
	);
};

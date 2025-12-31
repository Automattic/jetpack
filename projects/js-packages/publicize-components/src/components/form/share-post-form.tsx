import { siteHasFeature } from '@automattic/jetpack-script-data';
import { ToggleControl, useNavigator } from '@wordpress/components';
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
	 * Optional callback to update the message. Required when `message` prop is provided.
	 */
	onMessageChange?: ( message: string ) => void;

	/**
	 * Optional attached media array. When provided along with `onMediaChange`,
	 * the component uses these values instead of fetching from the store.
	 */
	attachedMedia?: Array< AttachedMedia >;

	/**
	 * Optional image generator settings. Used with per-connection customization.
	 */
	imageGeneratorSettings?: SIGSettings;

	/**
	 * Optional media source value.
	 */
	mediaSource?: JetpackSocialOptions[ 'media_source' ];

	/**
	 * Optional callback to update media-related options. Required when media props are provided.
	 * Accepts partial JetpackSocialOptions to update.
	 */
	onMediaChange?: ( updates: Partial< JetpackSocialOptions > ) => void;

	/**
	 * Whether to show the "Customize for this connection" toggle.
	 * When true, displays a toggle that allows users to override global settings.
	 */
	showCustomizeToggle?: boolean;

	/**
	 * Whether the customize toggle is currently enabled.
	 * Only used when showCustomizeToggle is true.
	 */
	isCustomizeEnabled?: boolean;

	/**
	 * Callback when the customize toggle is changed.
	 * Only used when showCustomizeToggle is true.
	 */
	onCustomizeToggle?: ( enabled: boolean ) => void;
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
	showCustomizeToggle = false,
	isCustomizeEnabled = false,
	onCustomizeToggle,
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

	// When customize is disabled, the form fields should be disabled
	const isFormDisabled = showCustomizeToggle && ! isCustomizeEnabled;

	return (
		<>
			{ showCustomizeToggle && (
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Customize for this connection', 'jetpack-publicize-components' ) }
					checked={ isCustomizeEnabled }
					onChange={ onCustomizeToggle }
					help={
						isCustomizeEnabled
							? __(
									'Using custom message and media for this connection.',
									'jetpack-publicize-components'
							  )
							: __(
									'Using the same message and media for all connections.',
									'jetpack-publicize-components'
							  )
					}
				/>
			) }
			{ ! isSocialNote && (
				<MessageBoxControl
					label={ __( 'Message', 'jetpack-publicize-components' ) }
					maxLength={ maxLength }
					onChange={ updateMessage }
					message={ message }
					analyticsData={ analyticsData }
					disabled={ isFormDisabled }
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
							disabled={ isFormDisabled }
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
								disabled={ isFormDisabled }
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
		</>
	);
};

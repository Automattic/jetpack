import { Disabled, useNavigator } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useCallback, type FC, type ReactNode } from 'react';
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { store as socialStore } from '../../social-store';
import { hasSocialPaidFeatures } from '../../utils';
import { useIsSocialNote } from '../../utils/use-is-social-note';
import MediaSectionV2 from '../media-section-v2';
import MessageBoxControl from '../message-box-control';
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
	 * Optional placeholder for the message field.
	 */
	messagePlaceholder?: string;

	/**
	 * Optional help text for the message field.
	 */
	messageHelp?: ReactNode;

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

	/**
	 * Whether the form is disabled.
	 */
	disabled?: boolean;

	/**
	 * Controls the "Share as attachment" toggle inside the media section.
	 * 'visible' (default): toggle is rendered and user-controlled.
	 * 'hidden': toggle is not rendered; attachment mode is implied by the selected source.
	 * Per-network customization passes 'hidden' so the dropdown alone decides media behavior.
	 */
	attachmentToggleMode?: 'visible' | 'hidden';

	/**
	 * Optional upgrade notice depending on where the form is rendered.
	 */
	upgradeNotice?: React.ReactNode;
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
	messagePlaceholder,
	messageHelp,
	attachedMedia,
	imageGeneratorSettings,
	mediaSource,
	onMediaChange,
	disabled = false,
	attachmentToggleMode,
	upgradeNotice,
} ) => {
	const {
		message: storeMessage,
		updateMessage: storeUpdateMessage,
		maxLength,
	} = useSocialMediaMessage();
	const isSocialNote = useIsSocialNote();
	const hasPaidFeatures = hasSocialPaidFeatures();

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
		<Disabled isDisabled={ disabled }>
			<div className={ styles[ 'share-post-form' ] }>
				{ ! isSocialNote && (
					<MessageBoxControl
						label={ __( 'Message', 'jetpack-publicize-pkg' ) }
						maxLength={ maxLength }
						onChange={ updateMessage }
						message={ message }
						placeholder={ messagePlaceholder }
						help={ messageHelp }
						analyticsData={ analyticsData }
						disabled={ disabled }
					/>
				) }
				<div
					className={ clsx( {
						[ styles[ 'share-post-form-disabled' ] ]: disabled,
					} ) }
				>
					{ ! hasPaidFeatures ? (
						upgradeNotice ?? <UpgradeNotice />
					) : (
						<MediaSectionV2
							analyticsData={ analyticsData }
							onEditTemplate={ onEditTemplate }
							attachmentToggleMode={ attachmentToggleMode }
							{ ...( isMediaControlled && {
								attachedMedia,
								imageGeneratorSettings,
								mediaSource,
								onMediaChange,
							} ) }
						/>
					) }
				</div>
			</div>
		</Disabled>
	);
};

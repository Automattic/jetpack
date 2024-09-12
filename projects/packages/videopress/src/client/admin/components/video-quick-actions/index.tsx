/**
 * External dependencies
 */
import { Text, Button, ThemeProvider } from '@automattic/jetpack-components';
import { Popover, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, trash, globe as siteDefaultPrivacyIcon } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
/**
 * Internal dependencies
 */
import privatePrivacyIcon from '../../../components/icons/crossed-eye-icon';
import publicPrivacyIcon from '../../../components/icons/uncrossed-eye-icon';
import {
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
} from '../../../state/constants';
import { useActionItem } from '../../hooks/use-action-item';
import { usePermission } from '../../hooks/use-permission';
import usePlaybackToken from '../../hooks/use-playback-token';
import usePosterEdit from '../../hooks/use-poster-edit';
import useVideo from '../../hooks/use-video';
import DeleteVideoConfirmationModal from '../delete-video-confirmation-modal';
import { VideoThumbnailDropdownButtons } from '../video-thumbnail';
import VideoThumbnailSelectorModal from '../video-thumbnail-selector-modal';
import styles from './style.module.scss';
/**
 * Types
 */
import {
	ActionItemProps,
	PopoverWithAnchorProps,
	ThumbnailActionsDropdownProps,
	VideoQuickActionsProps,
	PrivacyActionsDropdownProps,
	ConnectVideoQuickActionsProps,
} from './types';

const PopoverWithAnchor = ( {
	showPopover = false,
	isAnchorFocused = false,
	anchor,
	children = null,
}: PopoverWithAnchorProps ) => {
	useEffect( () => {
		if ( showPopover && ! isAnchorFocused ) {
			( anchor?.querySelector( '.components-popover' ) as HTMLElement | null )?.focus();
		}
	}, [ showPopover ] );

	if ( ! anchor || ! showPopover ) {
		return null;
	}

	const popoverProps = {
		anchor,
		offset: 15,
	};

	return (
		<Popover position="top center" noArrow focusOnMount={ false } { ...popoverProps }>
			<ThemeProvider>
				<Text variant="body-small" className={ styles.popover }>
					{ children }
				</Text>
			</ThemeProvider>
		</Popover>
	);
};

const ActionItem = ( { icon, children, className, ...props }: ActionItemProps ) => {
	const { setAnchor, setIsFocused, setIsHovering, anchor, isFocused, showPopover } =
		useActionItem();

	return (
		<div ref={ setAnchor } className={ className }>
			<Button
				size="small"
				variant="tertiary"
				icon={ icon }
				onMouseEnter={ () => setIsHovering( true ) }
				onMouseLeave={ () => setIsHovering( false ) }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
				disabled={ props.disabled }
				{ ...props }
			/>
			<PopoverWithAnchor
				showPopover={ showPopover }
				anchor={ anchor }
				isAnchorFocused={ isFocused }
			>
				{ children }
			</PopoverWithAnchor>
		</div>
	);
};

const ThumbnailActionsDropdown = ( {
	description,
	onUpdate,
	isUpdatingPoster,
	disabled,
}: ThumbnailActionsDropdownProps ) => {
	const { setAnchor, setIsFocused, setIsHovering, setShowPopover, anchor, isFocused, showPopover } =
		useActionItem();

	return (
		<Dropdown
			placement="bottom left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<div ref={ setAnchor }>
					<Button
						size="small"
						variant="tertiary"
						icon={ image }
						onClick={ () => {
							setShowPopover( false );
							onToggle();
						} }
						aria-expanded={ isOpen }
						onMouseEnter={ () => setIsHovering( true ) }
						onMouseLeave={ () => setIsHovering( false ) }
						onFocus={ () => setIsFocused( true ) }
						onBlur={ () => setIsFocused( false ) }
						disabled={ disabled }
					/>
					<PopoverWithAnchor
						showPopover={ showPopover && ! isOpen }
						anchor={ anchor }
						isAnchorFocused={ isFocused }
					>
						{ description }
					</PopoverWithAnchor>
				</div>
			) }
			renderContent={ ( { onClose } ) => (
				<ThemeProvider>
					<VideoThumbnailDropdownButtons
						isUpdatingPoster={ isUpdatingPoster }
						onClose={ onClose }
						onUseDefaultThumbnail={ () => onUpdate( 'default' ) }
						onSelectFromVideo={ () => onUpdate( 'select-from-video' ) }
						onUploadImage={ () => onUpdate( 'upload-image' ) }
					/>
				</ThemeProvider>
			) }
		/>
	);
};

const PrivacyActionsDropdown = ( {
	description,
	privacySetting,
	isUpdatingPrivacy,
	onUpdate,
	disabled,
}: PrivacyActionsDropdownProps ) => {
	const { setAnchor, setIsFocused, setIsHovering, setShowPopover, anchor, isFocused, showPopover } =
		useActionItem();

	let currentPrivacyIcon = siteDefaultPrivacyIcon;
	if ( VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PRIVATE ) {
		currentPrivacyIcon = privatePrivacyIcon;
	} else if ( VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PUBLIC ) {
		currentPrivacyIcon = publicPrivacyIcon;
	}

	return (
		<Dropdown
			placement="bottom left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<div ref={ setAnchor }>
					<Button
						size="small"
						variant="tertiary"
						icon={ currentPrivacyIcon }
						onClick={ () => {
							setShowPopover( false );
							onToggle();
						} }
						aria-expanded={ isOpen }
						onMouseEnter={ () => setIsHovering( true ) }
						onMouseLeave={ () => setIsHovering( false ) }
						onFocus={ () => setIsFocused( true ) }
						onBlur={ () => setIsFocused( false ) }
						disabled={ disabled || isUpdatingPrivacy }
					/>
					<PopoverWithAnchor
						showPopover={ showPopover && ! isOpen }
						anchor={ anchor }
						isAnchorFocused={ isFocused }
					>
						{ description }
					</PopoverWithAnchor>
				</div>
			) }
			renderContent={ ( { onClose } ) => (
				<ThemeProvider>
					<div className={ styles[ 'dropdown-content' ] }>
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ siteDefaultPrivacyIcon }
							onClick={ () => {
								onClose();
								onUpdate( 'site-default' );
							} }
							disabled={
								VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_SITE_DEFAULT
							}
						>
							{ __( 'Site default', 'jetpack-videopress-pkg' ) }
						</Button>

						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ publicPrivacyIcon }
							onClick={ () => {
								onClose();
								onUpdate( 'public' );
							} }
							disabled={ VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PUBLIC }
						>
							{ __( 'Public', 'jetpack-videopress-pkg' ) }
						</Button>

						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ privatePrivacyIcon }
							onClick={ () => {
								onClose();
								onUpdate( 'private' );
							} }
							disabled={ VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PRIVATE }
						>
							{ __( 'Private', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
				</ThemeProvider>
			) }
		/>
	);
};

const VideoQuickActions = ( {
	className,
	privacySetting,
	isUpdatingPrivacy,
	isUpdatingPoster,
	onUpdateVideoThumbnail,
	onUpdateVideoPrivacy,
	onDeleteVideo,
}: VideoQuickActionsProps ) => {
	const { canPerformAction } = usePermission();

	return (
		<div className={ clsx( styles.actions, className ) }>
			<ThumbnailActionsDropdown
				onUpdate={ onUpdateVideoThumbnail }
				description={ __( 'Update thumbnail', 'jetpack-videopress-pkg' ) }
				isUpdatingPoster={ isUpdatingPoster }
				disabled={ ! canPerformAction }
			/>

			<PrivacyActionsDropdown
				onUpdate={ onUpdateVideoPrivacy }
				privacySetting={ privacySetting }
				isUpdatingPrivacy={ isUpdatingPrivacy }
				description={ __( 'Update privacy', 'jetpack-videopress-pkg' ) }
				disabled={ ! canPerformAction }
			/>

			<ActionItem
				icon={ trash }
				className={ styles.trash }
				onClick={ onDeleteVideo }
				disabled={ ! canPerformAction }
			>
				{ __( 'Delete video', 'jetpack-videopress-pkg' ) }
			</ActionItem>
		</div>
	);
};

export const ConnectVideoQuickActions = ( props: ConnectVideoQuickActionsProps ) => {
	const { videoId } = props;

	if ( ! Number.isFinite( videoId ) ) {
		return null;
	}

	const { data, updateVideoPrivacy, deleteVideo, isUpdatingPrivacy, isUpdatingPoster } =
		useVideo( videoId );

	const { isFetchingPlaybackToken } = usePlaybackToken( data );

	const [ showDeleteModal, setShowDeleteModal ] = useState( false );
	const {
		frameSelectorIsOpen,
		handleCloseSelectFrame,
		handleOpenSelectFrame,
		handleVideoFrameSelected,
		selectedTime,
		handleConfirmFrame,
		updatePosterImageFromFrame,
		selectAndUpdatePosterImageFromLibrary,
	} = usePosterEdit( { video: data } );

	const onUpdateVideoThumbnail: VideoQuickActionsProps[ 'onUpdateVideoThumbnail' ] =
		async action => {
			switch ( action ) {
				case 'select-from-video':
					return handleOpenSelectFrame();
				case 'upload-image':
					return selectAndUpdatePosterImageFromLibrary();
			}
		};

	useEffect( () => {
		if ( selectedTime == null ) {
			return;
		}

		updatePosterImageFromFrame();
	}, [ selectedTime ] );

	if ( showDeleteModal ) {
		return (
			<DeleteVideoConfirmationModal
				onClose={ () => setShowDeleteModal( false ) }
				onDelete={ () => {
					setShowDeleteModal( false );
					deleteVideo();
				} }
			/>
		);
	}

	if ( frameSelectorIsOpen ) {
		return (
			<>
				<VideoThumbnailSelectorModal
					handleCloseSelectFrame={ handleCloseSelectFrame }
					url={ data.url }
					handleVideoFrameSelected={ handleVideoFrameSelected }
					selectedTime={ selectedTime }
					handleConfirmFrame={ handleConfirmFrame }
				/>
			</>
		);
	}

	const { privacySetting } = data;

	return (
		<VideoQuickActions
			{ ...props }
			onUpdateVideoPrivacy={ updateVideoPrivacy }
			onUpdateVideoThumbnail={ onUpdateVideoThumbnail }
			onDeleteVideo={ () => setShowDeleteModal( true ) }
			privacySetting={ privacySetting }
			isUpdatingPrivacy={ isUpdatingPrivacy || isFetchingPlaybackToken }
			isUpdatingPoster={ isUpdatingPoster }
		/>
	);
};

export default VideoQuickActions;

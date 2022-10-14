/**
 * External dependencies
 */
import { Text, Button, ThemeProvider } from '@automattic/jetpack-components';
import { Popover, Dropdown, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, trash, globe as siteDefaultPrivacyIcon } from '@wordpress/icons';
import classNames from 'classnames';
import { useState, useEffect } from 'react';
/** */
import privatePrivacyIcon from '../../../components/icons/crossed-eye-icon';
import publicPrivacyIcon from '../../../components/icons/uncrossed-eye-icon';
import {
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
} from '../../../state/constants';
import usePosterEdit from '../../hooks/use-poster-edit';
import useVideo from '../../hooks/use-video';
import { VideoThumbnailDropdownButtons } from '../video-thumbnail';
import VideoThumbnailSelectorModal from '../video-thumbnail-selector-modal';
import styles from './style.module.scss';
import {
	ActionItemProps,
	PopoverWithAnchorProps,
	ThumbnailActionsDropdownProps,
	VideoQuickActionsProps,
	PrivacyActionsDropdownProps,
	ConnectVideoQuickActionsProps,
} from './types';

const PopoverWithAnchor = ( { anchorRef, children = null }: PopoverWithAnchorProps ) => {
	if ( ! anchorRef ) {
		return null;
	}
	const popoverProps = {
		anchorRef,
		offset: 15,
	};

	return (
		<Popover position="top center" noArrow { ...popoverProps }>
			<Text variant="body-small" className={ styles.popover }>
				{ children }
			</Text>
		</Popover>
	);
};

const ActionItem = ( { icon, children, className, ...props }: ActionItemProps ) => {
	const [ anchorRef, setAnchorRef ] = useState( null );
	const [ showPopover, setShowPopover ] = useState( false );

	return (
		<div ref={ setAnchorRef } className={ className }>
			<Button
				size="small"
				variant="tertiary"
				icon={ icon }
				onMouseEnter={ () => setShowPopover( true ) }
				onMouseLeave={ () => setShowPopover( false ) }
				{ ...props }
			/>
			{ showPopover && <PopoverWithAnchor anchorRef={ anchorRef }>{ children }</PopoverWithAnchor> }
		</div>
	);
};

const ThumbnailActionsDropdown = ( { description, onUpdate }: ThumbnailActionsDropdownProps ) => {
	const [ anchorRef, setAnchorRef ] = useState( null );
	const [ showPopover, setShowPopover ] = useState( false );

	return (
		<Dropdown
			position="bottom left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<>
					<Button
						ref={ setAnchorRef }
						size="small"
						variant="tertiary"
						icon={ image }
						onClick={ () => {
							setShowPopover( false );
							onToggle();
						} }
						aria-expanded={ isOpen }
						onMouseEnter={ () => setShowPopover( true ) }
						onMouseLeave={ () => setShowPopover( false ) }
					/>
					{ showPopover && (
						<PopoverWithAnchor anchorRef={ anchorRef }>{ description }</PopoverWithAnchor>
					) }
				</>
			) }
			renderContent={ ( { onClose } ) => (
				<VideoThumbnailDropdownButtons
					onClose={ onClose }
					onUseDefaultThumbnail={ () => onUpdate( 'default' ) }
					onSelectFromVideo={ () => onUpdate( 'select-from-video' ) }
					onUploadImage={ () => onUpdate( 'upload-image' ) }
				/>
			) }
		/>
	);
};

const PrivacyActionsDropdown = ( {
	description,
	privacySetting,
	isUpdatingPrivacy,
	onUpdate,
}: PrivacyActionsDropdownProps ) => {
	const [ anchorRef, setAnchorRef ] = useState( null );
	const [ showPopover, setShowPopover ] = useState( false );

	let currentPrivacyIcon = siteDefaultPrivacyIcon;
	if ( VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PRIVATE ) {
		currentPrivacyIcon = privatePrivacyIcon;
	} else if ( VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_PUBLIC ) {
		currentPrivacyIcon = publicPrivacyIcon;
	}

	return (
		<Dropdown
			position="bottom left"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<>
					<Button
						ref={ setAnchorRef }
						size="small"
						variant="tertiary"
						icon={ currentPrivacyIcon }
						onClick={ () => {
							setShowPopover( false );
							onToggle();
						} }
						aria-expanded={ isOpen }
						onMouseEnter={ () => setShowPopover( true ) }
						onMouseLeave={ () => setShowPopover( false ) }
						disabled={ isUpdatingPrivacy }
					/>
					{ showPopover && (
						<PopoverWithAnchor anchorRef={ anchorRef }>{ description }</PopoverWithAnchor>
					) }
				</>
			) }
			renderContent={ ( { onClose } ) => (
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
						disabled={ VIDEO_PRIVACY_LEVELS[ privacySetting ] === VIDEO_PRIVACY_LEVEL_SITE_DEFAULT }
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
			) }
		/>
	);
};

const VideoQuickActions = ( {
	className,
	privacySetting,
	isUpdatingPrivacy,
	onUpdateVideoThumbnail,
	onUpdateVideoPrivacy,
	onDeleteVideo,
}: VideoQuickActionsProps ) => {
	return (
		<div className={ classNames( styles.actions, className ) }>
			<ThumbnailActionsDropdown
				onUpdate={ onUpdateVideoThumbnail }
				description={ __( 'Update thumbnail', 'jetpack-videopress-pkg' ) }
			/>

			<PrivacyActionsDropdown
				onUpdate={ onUpdateVideoPrivacy }
				privacySetting={ privacySetting }
				isUpdatingPrivacy={ isUpdatingPrivacy }
				description={ __( 'Update privacy', 'jetpack-videopress-pkg' ) }
			/>

			<ActionItem icon={ trash } className={ styles.trash } onClick={ onDeleteVideo }>
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

	const { data, updateVideoPrivacy, deleteVideo, isUpdatingPrivacy } = useVideo( videoId );

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

	const onUpdateVideoThumbnail: VideoQuickActionsProps[ 'onUpdateVideoThumbnail' ] = async action => {
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
			<Modal
				title={ __( 'Delete video', 'jetpack-videopress-pkg' ) }
				onRequestClose={ () => setShowDeleteModal( false ) }
				className={ styles[ 'delete-video-modal' ] }
			>
				<ThemeProvider>
					<div>
						<Text>{ __( 'This action cannot be undone.', 'jetpack-videopress-pkg' ) }</Text>
						<div className={ styles[ 'modal-actions' ] }>
							<Button
								className={ styles[ 'modal-action-button' ] }
								variant="secondary"
								weight="bold"
								onClick={ () => setShowDeleteModal( false ) }
							>
								{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
							</Button>

							<Button
								className={ styles[ 'modal-action-button' ] }
								isDestructive
								variant="primary"
								weight="bold"
								onClick={ () => {
									setShowDeleteModal( false );
									deleteVideo();
								} }
							>
								{ __( 'Delete', 'jetpack-videopress-pkg' ) }
							</Button>
						</div>
					</div>
				</ThemeProvider>
			</Modal>
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
			isUpdatingPrivacy={ isUpdatingPrivacy }
		/>
	);
};

export default VideoQuickActions;

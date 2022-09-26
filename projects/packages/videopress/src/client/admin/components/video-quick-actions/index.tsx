import { Text, Button } from '@automattic/jetpack-components';
import { Popover, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, trash, globe, lock, unlock } from '@wordpress/icons';
import classNames from 'classnames';
import { useState } from 'react';
import privacy from '../../../components/icons/privacy-icon';
import {
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
	VIDEO_PRIVACY_LEVEL_PUBLIC,
	VIDEO_PRIVACY_LEVEL_SITE_DEFAULT,
} from '../../../state/constants';
import useVideo from '../../hooks/use-video';
import { VideoThumbnailDropdownButtons } from '../video-thumbnail';
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

	return (
		<Popover position="top left" offset={ 15 } noArrow={ false } anchorRef={ anchorRef }>
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
	onUpdate,
}: PrivacyActionsDropdownProps ) => {
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
						icon={ privacy }
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
				<div className={ styles[ 'dropdown-content' ] }>
					<Button
						weight="regular"
						fullWidth
						variant="tertiary"
						icon={ globe }
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
						icon={ unlock }
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
						icon={ lock }
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
	if ( ! videoId ) {
		return null;
	}

	const { data, updateVideoPrivacy } = useVideo( videoId );
	const { privacySetting } = data;

	return (
		<VideoQuickActions
			{ ...props }
			onUpdateVideoPrivacy={ updateVideoPrivacy }
			privacySetting={ privacySetting }
		/>
	);
};

export default VideoQuickActions;

import { Text, Button } from '@automattic/jetpack-components';
import { Popover, Dropdown } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, trash } from '@wordpress/icons';
import classNames from 'classnames';
import { useState } from 'react';
import privacy from '../../../components/icons/privacy-icon';
import { VideoThumbnailDropdownButtons } from '../video-thumbnail';
import styles from './style.module.scss';
import {
	ActionItemProps,
	PopoverWithAnchorProps,
	ThumbnailActionsDropdownProps,
	VideoQuickActionsProps,
} from './types';

const PopoverWithAnchor = ( { anchorRef, children = null }: PopoverWithAnchorProps ) => {
	if ( ! anchorRef ) {
		return null;
	}

	return (
		<Popover placement="top" offset={ 15 } noArrow={ false } anchorRef={ anchorRef }>
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

const VideoQuickActions = ( {
	className,
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

			<ActionItem icon={ privacy } onClick={ onUpdateVideoPrivacy }>
				{ __( 'Update privacy', 'jetpack-videopress-pkg' ) }
			</ActionItem>
			<ActionItem icon={ trash } className={ styles.trash } onClick={ onDeleteVideo }>
				{ __( 'Delete video', 'jetpack-videopress-pkg' ) }
			</ActionItem>
		</div>
	);
};

export default VideoQuickActions;

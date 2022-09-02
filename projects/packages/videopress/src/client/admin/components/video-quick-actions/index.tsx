import { Text, Button } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, trash } from '@wordpress/icons';
import classNames from 'classnames';
import { useState } from 'react';
import privacy from '../../../components/icons/privacy-icon';
import styles from './style.module.scss';
import { ActionItemProps, PopoverWithAnchorProps, VideoQuickActionsProps } from './types';

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
				variant="tertiary"
				icon={ icon }
				onMouseOver={ () => setShowPopover( true ) }
				onMouseLeave={ () => setShowPopover( false ) }
				{ ...props }
			/>
			{ showPopover && <PopoverWithAnchor anchorRef={ anchorRef }>{ children }</PopoverWithAnchor> }
		</div>
	);
};

const VideoQuickActions = ( {
	className,
	onUpdateThumbnailClick,
	onUpdateUpdatePrivacyClick,
	onDeleteClick,
}: VideoQuickActionsProps ) => {
	return (
		<div className={ classNames( styles.actions, className ) }>
			<ActionItem icon={ image } onClick={ onUpdateThumbnailClick }>
				{ __( 'Update thumbnail', 'jetpack-videopress-pkg' ) }
			</ActionItem>
			<ActionItem icon={ privacy } onClick={ onUpdateUpdatePrivacyClick }>
				{ __( 'Update privacy', 'jetpack-videopress-pkg' ) }
			</ActionItem>
			<ActionItem icon={ trash } className={ styles.trash } onClick={ onDeleteClick }>
				{ __( 'Delete video', 'jetpack-videopress-pkg' ) }
			</ActionItem>
		</div>
	);
};

export default VideoQuickActions;

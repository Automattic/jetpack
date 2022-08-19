import { Text, Button } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { Icon, image, trash } from '@wordpress/icons';
import { useState } from 'react';
import privacy from './privacy-icon';
import styles from './style.module.scss';

const PopoverWithAnchor = ( { anchorRef, children = null } ) => {
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

/* eslint-disable jsx-a11y/mouse-events-have-key-events */
const ActionItem = ( { icon, children, className = '' } ) => {
	const [ anchorRef, setAnchorRef ] = useState( null );
	const [ showPopover, setShowPopover ] = useState( false );

	return (
		<div
			ref={ setAnchorRef }
			onMouseOver={ () => setShowPopover( true ) }
			onMouseLeave={ () => setShowPopover( false ) }
			className={ className }
		>
			<Icon icon={ icon } />
			{ showPopover && <PopoverWithAnchor anchorRef={ anchorRef }>{ children }</PopoverWithAnchor> }
		</div>
	);
};

const VideoRow = () => {
	const [ showActions, setShowActions ] = useState( false );

	return (
		<div
			className={ styles[ 'video-row' ] }
			onMouseOver={ () => setShowActions( true ) }
			onMouseLeave={ () => setShowActions( false ) }
		>
			<div className={ styles[ 'info-wrapper' ] }>
				<img
					className={ styles.poster }
					alt="Video Poster"
					src="https://videos.files.wordpress.com/PnQvSqdF/videopress-upload-demo-7_mp4_hd_1080p.original.jpg"
				/>
				<Text variant="title-small">videopress-upload-demo-7-mp4</Text>
			</div>
			<div className={ styles[ 'meta-wrapper' ] }>
				{ showActions ? (
					<div className={ styles.actions }>
						<Button size="small">Edit video details</Button>
						<ActionItem icon={ image }>Update thumbnail</ActionItem>
						<ActionItem icon={ privacy }>Update privacy</ActionItem>
						<ActionItem icon={ trash } className={ styles.trash }>
							Delete video
						</ActionItem>
					</div>
				) : (
					<div className={ styles.stats }>
						<div className={ styles.privacy }>No</div>
						<div className={ styles.duration }>34:25</div>
						<div className={ styles.play }>972</div>
						<div className={ styles.upload }>May 17, 2022</div>
					</div>
				) }
			</div>
		</div>
	);
};

export default VideoRow;

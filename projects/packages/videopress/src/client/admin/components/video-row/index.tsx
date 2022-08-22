import { Text, Button } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, image, trash } from '@wordpress/icons';
import { useState } from 'react';
import privacy from './privacy-icon';
import styles from './style.module.scss';

// Hiding it based on Design request:
// https://github.com/Automattic/jetpack/issues/25742#issuecomment-1223123815
const HIDE_QUICK_ACTIONS = true;

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
						<Button size="small">{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }</Button>
						{ ! HIDE_QUICK_ACTIONS && (
							<>
								<ActionItem icon={ image }>
									{ __( 'Update thumbnail', 'jetpack-videopress-pkg' ) }
								</ActionItem>
								<ActionItem icon={ privacy }>
									{ __( 'Update privacy', 'jetpack-videopress-pkg' ) }
								</ActionItem>
								<ActionItem icon={ trash } className={ styles.trash }>
									{ __( 'Delete video', 'jetpack-videopress-pkg' ) }
								</ActionItem>
							</>
						) }
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

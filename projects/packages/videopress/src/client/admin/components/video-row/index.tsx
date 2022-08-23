import { Text, Button } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon, image, trash } from '@wordpress/icons';
import { useState } from 'react';
import privacy from './privacy-icon';
import styles from './style.module.scss';

// Hiding it based on Design request:
// https://github.com/Automattic/jetpack/issues/25742#issuecomment-1223123815
const HIDE_QUICK_ACTIONS = true;

const millisecondsToMinutesAndSeconds = milliseconds => {
	const minutes = Math.floor( milliseconds / 60000 );
	const seconds = Math.floor( ( milliseconds % 60000 ) / 1000 );
	return `${ minutes }:${ seconds < 10 ? '0' : '' }${ seconds }`;
};

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

const VideoRow = ( {
	videoTitle,
	posterImage,
	duration,
	uploadDate,
	plays = null,
	isPrivate = false,
}: {
	videoTitle: string;
	posterImage: string;
	duration: number;
	uploadDate: string;
	plays: number;
	isPrivate: boolean;
} ) => {
	const [ showActions, setShowActions ] = useState( false );

	return (
		<div
			className={ styles[ 'video-row' ] }
			onMouseOver={ () => setShowActions( true ) }
			onMouseLeave={ () => setShowActions( false ) }
		>
			<div className={ styles[ 'info-wrapper' ] }>
				<img className={ styles.poster } alt="Video Poster" src={ posterImage } />
				<Text variant="title-small">{ videoTitle }</Text>
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
						{ isPrivate && (
							<div className={ styles.privacy }>
								<Icon icon={ privacy } />
							</div>
						) }
						<div className={ styles.duration }>{ millisecondsToMinutesAndSeconds( duration ) }</div>
						{ Number.isFinite( plays ) && <div className={ styles.plays }>{ plays }</div> }
						<div className={ styles.upload }>{ dateI18n( 'F j, Y', uploadDate, null ) }</div>
					</div>
				) }
			</div>
		</div>
	);
};

export default VideoRow;

import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, image, trash } from '@wordpress/icons';
import classNames from 'classnames';
import { useState, useRef } from 'react';
import privacy from './privacy-icon';
import styles from './style.module.scss';

// Hiding it based on Design request:
// https://github.com/Automattic/jetpack/issues/25742#issuecomment-1223123815
const HIDE_QUICK_ACTIONS = false;

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

const ActionItem = ( { icon, children, className = '' } ) => {
	const [ anchorRef, setAnchorRef ] = useState( null );
	const [ showPopover, setShowPopover ] = useState( false );

	return (
		<div
			ref={ setAnchorRef }
			onMouseOver={ () => setShowPopover( true ) }
			onMouseLeave={ () => setShowPopover( false ) }
			onFocus={ () => setShowPopover( true ) }
			onBlur={ () => setShowPopover( false ) }
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
	onClickEdit,
}: {
	videoTitle: string;
	posterImage: string;
	duration: number;
	uploadDate: string;
	plays: number;
	isPrivate: boolean;
	onClickEdit?: () => void;
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const [ showActions, setShowActions ] = useState( true );
	const [ keyPressed, setKeyDown ] = useState( false );
	const textRef = useRef( null );

	const editVideoLabel = __( 'Edit video details', 'jetpack-videopress-pkg' );
	const durationInMinutesAndSeconds = millisecondsToMinutesAndSeconds( duration );
	const uploadDateFormatted = dateI18n( 'M j, Y', uploadDate, null );
	const isSpaceOrEnter = code => code === 'Space' || code === 'Enter';
	const isEllipsisActive = textRef?.current?.offsetWidth < textRef?.current?.scrollWidth;

	const wrapperAriaLabel = sprintf(
		/* translators: 1 Video title, 2 Video duration, 3 Video upload date */
		__(
			'Video: %1$s, Duration: %2$s, Upload Date: %3$s. Click to edit details.',
			'jetpack-videopress-pkg'
		),
		videoTitle,
		durationInMinutesAndSeconds,
		uploadDateFormatted
	);

	const handleKeyDown = e => {
		if ( isSpaceOrEnter( e?.code ) ) {
			setKeyDown( true );
		}
	};

	const handleKeyUp = e => {
		if ( isSpaceOrEnter( e?.code ) ) {
			setKeyDown( false );
			onClickEdit?.();
		}
	};

	const handleOverOrFocus = () => {
		setShowActions( true );
	};

	const handleLeave = () => {
		setShowActions( false );
	};

	return (
		<div
			className={ classNames( styles[ 'video-row' ], {
				[ styles.pressed ]: keyPressed,
				[ styles.small ]: isSmall,
			} ) }
			onMouseOver={ handleOverOrFocus }
			onMouseLeave={ handleLeave }
			onFocus={ handleOverOrFocus }
			onKeyDown={ handleKeyDown }
			onKeyUp={ handleKeyUp }
			aria-label={ wrapperAriaLabel }
			role="button"
			tabIndex={ 0 }
		>
			<div className={ styles[ 'info-wrapper' ] }>
				<img className={ styles.poster } alt="" src={ posterImage } />
				<Text variant="title-small" className={ styles.title } ref={ textRef }>
					{ ! isSmall && isEllipsisActive && (
						<Text variant="body-extra-small" className={ styles.label } component="span">
							{ videoTitle }
						</Text>
					) }
					{ videoTitle }
				</Text>
			</div>
			<div className={ styles[ 'meta-wrapper' ] }>
				{ showActions ? (
					<div className={ styles.actions }>
						<Button size="small" onClick={ onClickEdit }>
							{ editVideoLabel }
						</Button>
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
							<div className={ styles.privacy } aria-disabled>
								<Icon icon={ privacy } />
							</div>
						) }
						<div className={ styles.duration }>{ durationInMinutesAndSeconds }</div>
						{ Number.isFinite( plays ) && <div className={ styles.plays }>{ plays }</div> }
						<div className={ styles.upload }>{ uploadDateFormatted }</div>
					</div>
				) }
			</div>
		</div>
	);
};

export default VideoRow;

import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Popover } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, image, trash, chevronDown, chevronUp } from '@wordpress/icons';
import classNames from 'classnames';
import { useState, useRef } from 'react';
import privacy from '../../../components/icons/privacy-icon';
import Checkbox from '../checkbox';
import StatsBase from './stats';
import styles from './style.module.scss';
import { VideoPressVideo, VideoRowProps } from './types';

const millisecondsToMinutesAndSeconds = ( milliseconds?: number ) => {
	if ( milliseconds ) {
		const minutes = Math.floor( milliseconds / 60000 );
		const seconds = Math.floor( ( milliseconds % 60000 ) / 1000 );
		return `${ minutes }:${ seconds < 10 ? '0' : '' }${ seconds }`;
	}
};

const PopoverWithAnchor = ( {
	anchorRef,
	children = null,
}: {
	anchorRef: HTMLElement | null;
	children: React.ReactNode;
} ) => {
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

const ActionItem = ( {
	icon,
	children,
	className = '',
}: {
	icon: JSX.Element;
	children: React.ReactNode;
	className?: string;
} ) => {
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

const QuickActions = ( {
	button,
	hideQuickActions,
	hideButton,
}: {
	button: React.ReactNode;
	hideQuickActions?: boolean;
	hideButton?: boolean;
} ) => {
	return hideButton && hideQuickActions ? null : (
		<div className={ styles.actions }>
			{ hideButton ? null : button }
			{ hideQuickActions ? null : (
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
	);
};

const Stats = ( {
	duration,
	uploadDate,
	plays,
	isPrivate,
}: {
	duration?: string;
	uploadDate?: string;
	plays?: number;
	isPrivate?: boolean;
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const durationLabel = __( 'Duration', 'jetpack-videopress-pkg' );
	const playsLabel = __( 'Plays', 'jetpack-videopress-pkg' );
	const privacyLabel = __( 'Privacy', 'jetpack-videopress-pkg' );

	const privacyElement = isSmall ? (
		<>
			<span>{ privacyLabel }</span>
			<span>
				{ isPrivate
					? __( 'Private', 'jetpack-videopress-pkg' )
					: __( 'Public', 'jetpack-videopress-pkg' ) }
			</span>
		</>
	) : (
		<>{ isPrivate && <Icon icon={ privacy } /> }</>
	);

	const durationElement =
		isSmall && duration ? (
			<>
				<span>{ durationLabel }</span>
				<span>{ duration }</span>
			</>
		) : (
			duration
		);

	const playsElement =
		isSmall && Number.isFinite( plays ) ? (
			<>
				<span>{ playsLabel }</span>
				<span>{ plays }</span>
			</>
		) : (
			plays
		);

	const uploadElement = isSmall ? null : uploadDate;

	return (
		<StatsBase
			privacy={ typeof isPrivate === 'boolean' ? privacyElement : null }
			duration={ durationElement }
			plays={ playsElement }
			upload={ uploadElement }
		/>
	);
};

const VideoRow = ( {
	className = '',
	checked = false,
	videoTitle,
	posterImage,
	duration,
	uploadDate,
	plays,
	isPrivate,
	onClickEdit,
	onSelect,
	hideEditButton,
	// Hiding it based on Design request:
	// https://github.com/Automattic/jetpack/issues/25742#issuecomment-1223123815
	hideQuickActions = true,
}: VideoRowProps ) => {
	const textRef = useRef( null );
	const checkboxRef = useRef( null );

	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const [ showActions, setShowActions ] = useState( false );
	const [ keyPressed, setKeyDown ] = useState( false );
	const [ expanded, setExpanded ] = useState( false );

	const durationInMinutesAndSeconds = millisecondsToMinutesAndSeconds( duration );
	const uploadDateFormatted = dateI18n( 'M j, Y', uploadDate, null );
	const isEllipsisActive = textRef?.current?.offsetWidth < textRef?.current?.scrollWidth;
	const showTitleLabel = ! isSmall && isEllipsisActive;
	const showStats = ( ! showActions && ! isSmall ) || ( isSmall && expanded );
	const showBottom = ! isSmall || ( isSmall && expanded );
	const canExpand =
		isSmall &&
		( ! hideEditButton ||
			Boolean( duration ) ||
			Number.isFinite( plays ) ||
			typeof isPrivate === 'boolean' );

	const isSpaceOrEnter = code => code === 'Space' || code === 'Enter';

	const editVideoLabel = __( 'Edit video details', 'jetpack-videopress-pkg' );
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

	const handleEditClick = e => {
		onClickEdit?.();
		e.stopPropagation();
	};

	const editDetailsButton = hideEditButton ? null : (
		<Button size="small" onClick={ handleEditClick } fullWidth={ isSmall }>
			{ editVideoLabel }
		</Button>
	);

	const handleInfoWrapperClick = e => {
		if ( canExpand ) {
			setExpanded( current => ! current );
		} else {
			handleClick( e );
		}
	};

	const handleClick = e => {
		if ( e.target !== checkboxRef.current ) {
			checkboxRef?.current?.click();
		}
	};

	const handleKeyDown = e => {
		if ( isSpaceOrEnter( e?.code ) ) {
			setKeyDown( true );
		}
	};

	const handleKeyUp = e => {
		if ( isSpaceOrEnter( e?.code ) ) {
			setKeyDown( false );
			handleClick( e );
		}
	};

	const handleOver = () => {
		setShowActions( true );
	};

	const handleLeave = () => {
		setShowActions( false );
	};

	return (
		<div
			role="button"
			tabIndex={ 0 }
			onKeyDown={ isSmall ? null : handleKeyDown }
			onKeyUp={ isSmall ? null : handleKeyUp }
			onMouseOver={ isSmall ? null : handleOver }
			onMouseLeave={ isSmall ? null : handleLeave }
			onClick={ isSmall ? null : handleClick }
			aria-label={ wrapperAriaLabel }
			className={ classNames(
				styles[ 'video-row' ],
				{
					[ styles.pressed ]: keyPressed,
				},
				className
			) }
		>
			<div className={ classNames( { [ styles[ 'checkbox-wrapper-small' ] ]: isSmall } ) }>
				<Checkbox ref={ checkboxRef } checked={ checked } tabIndex={ -1 } onChange={ onSelect } />
			</div>
			<div
				className={ classNames( styles[ 'video-data-wrapper' ], {
					[ styles.small ]: isSmall,
				} ) }
			>
				<div
					className={ classNames( styles[ 'info-wrapper' ], { [ styles.small ]: isSmall } ) }
					onClick={ isSmall ? handleInfoWrapperClick : null }
					role="presentation"
				>
					{ posterImage && <img className={ styles.poster } alt="" src={ posterImage } /> }
					<div className={ styles[ 'title-wrapper' ] }>
						{ showTitleLabel && (
							<Text variant="body-extra-small" className={ styles.label } component="span">
								{ videoTitle }
							</Text>
						) }
						<Text variant="title-small" className={ styles.title } ref={ textRef }>
							{ videoTitle }
						</Text>
						{ isSmall && <Text component="div">{ uploadDateFormatted }</Text> }
					</div>
					{ canExpand && <Icon icon={ expanded ? chevronUp : chevronDown } size={ 45 } /> }
				</div>
				{ showBottom && (
					<div className={ classNames( styles[ 'meta-wrapper' ], { [ styles.small ]: isSmall } ) }>
						{ showActions && (
							<QuickActions
								button={ editDetailsButton }
								hideButton={ hideEditButton }
								hideQuickActions={ hideQuickActions }
							/>
						) }
						{ showStats && (
							<Stats
								duration={ durationInMinutesAndSeconds }
								uploadDate={ uploadDateFormatted }
								plays={ plays }
								isPrivate={ isPrivate }
							/>
						) }
						{ isSmall && ! hideEditButton && editDetailsButton }
					</div>
				) }
			</div>
		</div>
	);
};

export type { VideoPressVideo };
export { StatsBase as Stats };
export default VideoRow;

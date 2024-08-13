/**
 * External dependencies
 */
import {
	Text,
	Button,
	useBreakpointMatch,
	ActionPopover,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp, trash } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useRef } from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import VideoThumbnail from '../video-thumbnail';
import styles from './style.module.scss';
/**
 * Types
 */
import { VideoRowProps } from './types';

export const VideoRowError = ( { id, className = '', title }: VideoRowProps ) => {
	const textRef = useRef( null );
	const checkboxRef = useRef( null );

	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const [ keyPressed, setKeyDown ] = useState( false );
	const [ expanded, setExpanded ] = useState( false );
	const [ anchor, setAnchor ] = useState( null );
	const [ showError, setShowError ] = useState( false );

	const { dismissErroredVideo } = useDispatch( STORE_ID );

	const uploadDateFormatted = dateI18n( 'M j, Y', new Date(), null );
	const isEllipsisActive = textRef?.current?.offsetWidth < textRef?.current?.scrollWidth;

	const showTitleLabel = ! isSmall && isEllipsisActive;
	const showBottom = ! isSmall || ( isSmall && expanded );

	const wrapperAriaLabel = sprintf(
		/* translators: 1 Video title, 2 Video duration, 3 Video upload date */
		__(
			'Video Upload Error: Video upload, titled %1$s, failed. Please try again or visit the troubleshooting docs at %2$s.',
			'jetpack-videopress-pkg'
		),
		title,
		getRedirectUrl( 'jetpack-videopress-dashboard-troubleshoot' )
	);

	const troubleshootUrl = getRedirectUrl( 'jetpack-videopress-dashboard-troubleshoot' );

	const isSpaceOrEnter = code => code === 'Space' || code === 'Enter';

	const onActionClick = () => {
		setShowError( true );
	};

	const closeErrorHint = () => {
		setShowError( false );
	};

	const handleClickWithStopPropagation = callback => event => {
		event.stopPropagation();
		callback?.( event );
	};

	const handleInfoWrapperClick = e => {
		if ( isSmall ) {
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

	const handleDismiss = () => dismissErroredVideo( id );

	return (
		<div
			role="button"
			tabIndex={ 0 }
			onKeyDown={ isSmall ? null : handleKeyDown }
			onKeyUp={ isSmall ? null : handleKeyUp }
			onClick={ isSmall ? null : handleClick }
			aria-label={ wrapperAriaLabel }
			className={ clsx(
				styles[ 'video-row' ],
				{
					[ styles.pressed ]: keyPressed,
					[ styles[ 'hover-disabled' ] ]: isSmall,
				},
				className
			) }
			ref={ setAnchor }
		>
			<div
				className={ clsx( styles[ 'video-data-wrapper' ], {
					[ styles.small ]: isSmall,
				} ) }
			>
				<div
					className={ clsx( styles[ 'info-wrapper' ], { [ styles.small ]: isSmall } ) }
					onClick={ isSmall ? handleInfoWrapperClick : null }
					role="presentation"
				>
					<div className={ styles.poster }>
						<VideoThumbnail isRow hasError={ true } />
					</div>

					<div className={ styles[ 'title-wrapper' ] }>
						{ showTitleLabel && (
							<Text variant="body-extra-small" className={ styles.label } component="span">
								{ title }
							</Text>
						) }

						<Text variant="title-small" className={ clsx( styles.title ) } ref={ textRef }>
							{ title }
						</Text>

						{ isSmall && <Text component="div">{ uploadDateFormatted }</Text> }
					</div>

					{ isSmall && <Icon icon={ expanded ? chevronUp : chevronDown } size={ 45 } /> }
				</div>

				{ showBottom && (
					<div className={ clsx( styles[ 'meta-wrapper' ], { [ styles.small ]: isSmall } ) }>
						{ ! isSmall && (
							<div className={ styles.actions }>
								<Button size="small" onClick={ handleClickWithStopPropagation( onActionClick ) }>
									{ __( 'Upload Error!', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button size="small" variant="tertiary" icon={ trash } onClick={ handleDismiss } />
							</div>
						) }

						{ isSmall && (
							<div className={ styles[ 'mobile-actions' ] }>
								<Button size="small" onClick={ handleClickWithStopPropagation( onActionClick ) }>
									{ __( 'Upload Error!', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button size="small" variant="tertiary" icon={ trash } onClick={ handleDismiss } />
							</div>
						) }
					</div>
				) }
			</div>

			{ showError && (
				<ActionPopover
					title={ __( 'Error', 'jetpack-videopress-pkg' ) }
					buttonContent={ __( 'Visit the docs', 'jetpack-videopress-pkg' ) }
					buttonHref={ troubleshootUrl }
					buttonExternalLink
					anchor={ anchor }
					onClose={ closeErrorHint }
					onClick={ closeErrorHint }
					noArrow={ false }
					className={ styles[ 'action-popover' ] }
					position="top center"
				>
					<Text>
						{ __(
							"There's been an error uploading your video. Try uploading the video again, if the error persists, visit our documentation to troubleshoot the issue or contact support.",
							'jetpack-videopress-pkg'
						) }
					</Text>
				</ActionPopover>
			) }
		</div>
	);
};

export default VideoRowError;

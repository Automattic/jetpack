/**
 * External dependencies
 */
import {
	Button,
	Title,
	useBreakpointMatch,
	ActionPopover,
	getRedirectUrl,
	Text,
} from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp, trash } from '@wordpress/icons';
import clsx from 'clsx';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import VideoThumbnail from '../video-thumbnail';
import styles from './style.module.scss';
import { VideoCardProps } from './types';
/**
 * Types
 */
import type React from 'react';

/**
 * Video Card Error component
 *
 * @param {VideoCardProps} props - Component props.
 * @returns {React.ReactNode} - VideoCardError react component.
 */
export const VideoCardError = ( { title, id }: VideoCardProps ) => {
	const { dismissErroredVideo } = useDispatch( STORE_ID );
	const isBlank = ! title;

	const [ anchor, setAnchor ] = useState( null );
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ showError, setShowError ] = useState( false );
	const disabled = false;

	const handleDismiss = () => dismissErroredVideo( id );

	const handleErrorHint = () => setShowError( true );

	const troubleshootUrl = getRedirectUrl( 'jetpack-videopress-dashboard-troubleshoot' );

	const closeErrorHint = () => setShowError( false );

	return (
		<>
			<div
				className={ clsx( styles[ 'video-card__wrapper' ], {
					[ styles[ 'is-blank' ] ]: isBlank,
					[ styles.disabled ]: isSm,
				} ) }
				{ ...( isSm && ! disabled && { onClick: () => setIsOpen( wasOpen => ! wasOpen ) } ) }
			>
				{ ! isSm && <div className={ styles[ 'video-card__background' ] } /> }

				<VideoThumbnail
					className={ styles[ 'video-card__thumbnail' ] }
					ref={ setAnchor }
					hasError={ true }
				/>

				<div className={ styles[ 'video-card__title-section' ] }>
					{ isSm && (
						<div className={ styles.chevron }>
							{ isOpen && <Icon icon={ chevronUp } /> }
							{ ! isOpen && <Icon icon={ chevronDown } /> }
						</div>
					) }

					<Title className={ styles[ 'video-card__title' ] } mb={ 0 } size="small">
						{ title }
					</Title>
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
					>
						<Text>
							{ __(
								"There's been an error uploading your video. Try uploading the video again, if the error persists, visit our documentation to troubleshoot the issue or contact support.",
								'jetpack-videopress-pkg'
							) }
						</Text>
					</ActionPopover>
				) }

				{ ! isSm && (
					<div
						className={ clsx(
							styles[ 'video-card__quick-actions-section' ],
							styles[ 'is-blank' ]
						) }
					>
						<Button variant="primary" size="small" onClick={ handleErrorHint }>
							{ __( 'Upload Error!', 'jetpack-videopress-pkg' ) }
						</Button>

						<Button size="small" variant="tertiary" icon={ trash } onClick={ handleDismiss } />
					</div>
				) }
			</div>

			{ isSm && isOpen && (
				<div className={ clsx( styles[ 'video-card__quick-actions-section' ], styles.small ) }>
					<Button variant="primary" size="small" onClick={ handleErrorHint }>
						{ __( 'Upload Error!', 'jetpack-videopress-pkg' ) }
					</Button>

					<Button size="small" variant="tertiary" icon={ trash } onClick={ handleDismiss } />
				</div>
			) }
		</>
	);
};

export default VideoCardError;

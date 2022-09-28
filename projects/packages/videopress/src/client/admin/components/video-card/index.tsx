/**
 * External dependencies
 */
import {
	Text,
	Button,
	Title,
	numberFormat,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chartBar, chevronDown, chevronUp } from '@wordpress/icons';
import classnames from 'classnames';
import React, { useState } from 'react';
import useVideo from '../../hooks/use-video';
/**
 * Internal dependencies
 */
import { ConnectVideoQuickActions } from '../video-quick-actions';
import VideoThumbnail from '../video-thumbnail';
import styles from './style.module.scss';
import { VideoCardProps } from './types';

const QuickActions = ( {
	id,
	onVideoDetailsClick,
	className,
}: {
	id: VideoCardProps[ 'id' ];
	onVideoDetailsClick: VideoCardProps[ 'onVideoDetailsClick' ];
	className?: VideoCardProps[ 'className' ];
} ) => {
	return (
		<div className={ classnames( styles[ 'video-card__quick-actions-section' ], className ) }>
			<Button
				variant="primary"
				size="small"
				onClick={ onVideoDetailsClick }
				className={ styles[ 'video-card__quick-actions__edit-button' ] }
			>
				{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }
			</Button>

			{ id && <ConnectVideoQuickActions videoId={ id } /> }
		</div>
	);
};

/**
 * Video Card component
 *
 * @param {VideoCardProps} props - Component props.
 * @returns {React.ReactNode} - VideoCard react component.
 */
export const VideoCard = ( {
	title,
	id,
	duration,
	plays,
	thumbnail,
	editable,
	showQuickActions = true,
	isDeleting,
	onVideoDetailsClick,
}: VideoCardProps ) => {
	// @todo: implement removing video state properly
	const isBlank = ( ! title && ! duration && ! plays && ! thumbnail ) || isDeleting;
	thumbnail = isDeleting ? null : thumbnail;

	const hasPlays = typeof plays !== 'undefined';
	const playsCount = hasPlays
		? sprintf(
				/* translators: placeholder is a product name */
				__( '%s plays', 'jetpack-videopress-pkg' ),
				numberFormat( plays )
		  )
		: '';
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const [ isOpen, setIsOpen ] = useState( false );

	return (
		<>
			<div
				className={ classnames( styles[ 'video-card__wrapper' ], {
					[ styles[ 'is-blank' ] ]: isBlank,
					[ styles.small ]: isSm,
				} ) }
				{ ...( isSm && { onClick: () => setIsOpen( wasOpen => ! wasOpen ) } ) }
			>
				{ ! isSm && <div className={ styles[ 'video-card__background' ] } /> }

				<VideoThumbnail
					className={ styles[ 'video-card__thumbnail' ] }
					thumbnail={ thumbnail }
					duration={ duration }
					editable={ editable }
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
					{ hasPlays && (
						<Text
							weight="regular"
							size="small"
							component="div"
							className={ styles[ 'video-card__video-plays-counter' ] }
						>
							<Icon icon={ chartBar } />
							{ playsCount }
						</Text>
					) }
				</div>

				{ showQuickActions && ! isSm && (
					<QuickActions id={ id } onVideoDetailsClick={ onVideoDetailsClick } />
				) }
			</div>

			{ showQuickActions && isSm && isOpen && (
				<QuickActions
					id={ id }
					onVideoDetailsClick={ onVideoDetailsClick }
					className={ styles.small }
				/>
			) }
		</>
	);
};

export const ConnectVideoCard = ( { id, ...restProps }: VideoCardProps ) => {
	const { data: video, isDeleting, hasBeenDeleted } = useVideo( id );
	if ( ! id || ! video ) {
		return null;
	}

	return (
		<VideoCard
			id={ id }
			{ ...video }
			{ ...restProps }
			isDeleting={ isDeleting }
			hasBeenDeleted={ hasBeenDeleted }
		/>
	);
};

export default VideoCard;

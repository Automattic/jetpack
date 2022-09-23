/**
 * External dependencies
 */
import { Text, Button, Title, numberFormat } from '@automattic/jetpack-components';
import { Icon } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import VideoQuickActions from '../video-quick-actions';
import VideoThumbnail from '../video-thumbnail';
import styles from './style.module.scss';
import { VideoCardProps } from './types';
import type React from 'react';

/**
 * Video Card component
 *
 * @param {VideoCardProps} props - Component props.
 * @returns {React.ReactNode} - VideoCard react component.
 */
export const VideoCard = ( {
	title,
	duration,
	plays,
	thumbnail,
	editable,
	onVideoDetailsClick,
	onUpdateVideoThumbnail,
	onUpdateVideoPrivacy,
	onDeleteVideo,
}: VideoCardProps ) => {
	const isBlank = ! title && ! duration && ! plays && ! thumbnail;
	const hasPlays = typeof plays !== 'undefined';
	const playsCount = hasPlays
		? sprintf(
				/* translators: placeholder is a product name */
				__( '%s plays', 'jetpack-videopress-pkg' ),
				numberFormat( plays )
		  )
		: '';

	return (
		<div
			className={ classnames( styles[ 'video-card__wrapper' ], {
				[ styles[ 'is-blank' ] ]: isBlank,
			} ) }
		>
			<div className={ styles[ 'video-card__background' ] } />

			<VideoThumbnail
				className={ styles[ 'video-card__thumbnail' ] }
				thumbnail={ thumbnail }
				duration={ duration }
				editable={ editable }
			/>
			<div className={ styles[ 'video-card__title-section' ] }>
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
			<div className={ styles[ 'video-card__quick-actions-section' ] }>
				<Button
					variant="primary"
					size="small"
					onClick={ onVideoDetailsClick }
					className={ styles[ 'video-card__quick-actions__edit-button' ] }
				>
					{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }
				</Button>

				<VideoQuickActions
					onUpdateVideoThumbnail={ onUpdateVideoThumbnail }
					onUpdateVideoPrivacy={ onUpdateVideoPrivacy }
					onDeleteVideo={ onDeleteVideo }
				/>
			</div>
		</div>
	);
};

export default VideoCard;

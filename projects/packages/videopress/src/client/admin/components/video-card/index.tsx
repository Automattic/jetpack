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
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chartBar, chevronDown, chevronUp } from '@wordpress/icons';
import classnames from 'classnames';
import React from 'react';
import { useState } from 'react';
import useVideo from '../../hooks/use-video';
import Placeholder from '../placeholder';
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

const UploadingThumbnail = () => (
	<div className={ styles[ 'video-card__custom-thumbnail' ] }>
		<Spinner />
		<Text>{ __( 'Uploading', 'jetpack-videopress-pkg' ) }</Text>
	</div>
);

const ProcessingThumbnail = () => (
	<div className={ styles[ 'video-card__custom-thumbnail' ] }>
		<Text className={ styles.pulse }>{ __( 'Processing', 'jetpack-videopress-pkg' ) }</Text>
	</div>
);

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
	thumbnail: defaultThumbnail,
	editable,
	showQuickActions = true,
	loading = false,
	isUploadingPoster = false,
	uploading = false,
	processing = false,
	onVideoDetailsClick,
}: VideoCardProps ) => {
	const isBlank = ! title && ! duration && ! plays && ! defaultThumbnail && ! loading;

	// Mapping thumbnail (Ordered by priority)
	let thumbnail = loading ? <Placeholder /> : defaultThumbnail;
	thumbnail = uploading || isUploadingPoster ? <UploadingThumbnail /> : thumbnail;
	thumbnail = processing ? <ProcessingThumbnail /> : thumbnail;

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
	const disabled = isSm || loading || uploading || processing;

	return (
		<>
			<div
				className={ classnames( styles[ 'video-card__wrapper' ], {
					[ styles[ 'is-blank' ] ]: isBlank,
					[ styles.disabled ]: disabled,
				} ) }
				{ ...( isSm && { onClick: () => setIsOpen( wasOpen => ! wasOpen ) } ) }
			>
				{ ! isSm && <div className={ styles[ 'video-card__background' ] } /> }

				<VideoThumbnail
					videoId={ id }
					className={ styles[ 'video-card__thumbnail' ] }
					thumbnail={ thumbnail }
					duration={ loading ? null : duration }
					editable={ loading ? false : editable }
				/>

				<div className={ styles[ 'video-card__title-section' ] }>
					{ isSm && (
						<div className={ styles.chevron }>
							{ isOpen && <Icon icon={ chevronUp } /> }
							{ ! isOpen && <Icon icon={ chevronDown } /> }
						</div>
					) }

					{ loading ? (
						<Placeholder width="60%" height={ 30 } />
					) : (
						<Title className={ styles[ 'video-card__title' ] } mb={ 0 } size="small">
							{ title }
						</Title>
					) }

					{ loading ? (
						<Placeholder width={ 96 } height={ 24 } />
					) : (
						<>
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
						</>
					) }
				</div>

				{ showQuickActions && ! isSm && (
					<QuickActions
						id={ id }
						onVideoDetailsClick={ onVideoDetailsClick }
						className={ classnames( {
							[ styles[ 'is-blank' ] ]: loading,
						} ) }
					/>
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
	const { isDeleting, uploading, processing, isUpdatingPoster } = useVideo( id );

	const loading = ( isDeleting || restProps?.loading ) && ! uploading && ! processing;
	const editable = restProps?.editable && ! isDeleting && ! uploading && ! processing;

	return (
		<VideoCard
			id={ id }
			{ ...restProps }
			loading={ loading }
			uploading={ uploading }
			isUploadingPoster={ isUpdatingPoster }
			processing={ processing }
			editable={ editable }
		/>
	);
};

export default ConnectVideoCard;

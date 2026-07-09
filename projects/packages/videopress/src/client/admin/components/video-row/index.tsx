/**
 * External dependencies
 */
import { Text, Button, LoadingPlaceholder } from '@automattic/jetpack-components';
import { useViewportMatch } from '@wordpress/compose';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import clsx from 'clsx';
import { useState, useRef, useEffect } from 'react';
/**
 * Internal dependencies
 */
import privateIcon from '../../../components/icons/crossed-eye-icon';
import { usePermission } from '../../hooks/use-permission';
import useVideo from '../../hooks/use-video';
import PublishFirstVideoPopover from '../publish-first-video-popover';
import { ConnectVideoQuickActions } from '../video-quick-actions';
import VideoThumbnail from '../video-thumbnail';
import StatsBase from './stats';
import styles from './style.module.scss';
/**
 * Types
 */
import { VideoRowProps } from './types';

const millisecondsToMinutesAndSeconds = ( milliseconds?: number ) => {
	if ( milliseconds ) {
		const minutes = Math.floor( milliseconds / 60000 );
		const seconds = Math.floor( ( milliseconds % 60000 ) / 1000 );
		return `${ minutes }:${ seconds < 10 ? '0' : '' }${ seconds }`;
	}
};

const Stats = ( {
	duration,
	uploadDate,
	plays,
	isPrivate,
	loading = false,
}: {
	duration?: string;
	uploadDate?: string;
	plays?: number;
	isPrivate?: boolean;
	loading?: boolean;
} ) => {
	const isSmall = useViewportMatch( 'small', '<' );
	const durationLabel = __( 'Duration', 'jetpack-videopress-pkg' );
	const playsLabel = __( 'Plays', 'jetpack-videopress-pkg' );
	const privacyLabel = __( 'Privacy', 'jetpack-videopress-pkg' );
	const privateLabel = __( 'Private', 'jetpack-videopress-pkg' );
	const publicLabel = __( 'Public', 'jetpack-videopress-pkg' );

	const privacyElement = isSmall ? (
		<>
			<span>{ privacyLabel }</span>
			<span>{ isPrivate ? privateLabel : publicLabel }</span>
		</>
	) : (
		isPrivate && <Icon icon={ privateIcon } />
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
			loading={ loading }
			className={ clsx( { [ styles[ 'mobile-stats' ] ]: isSmall } ) }
		/>
	);
};

export const VideoRow = ( {
	id,
	className = '',
	title,
	titleAdornment = null,
	thumbnail,
	showThumbnail = false,
	duration,
	uploadDate,
	plays,
	isPrivate,
	onActionClick,
	showActionButton = true,
	showQuickActions = true,
	loading = false,
	uploading = false,
	processing = false,
	isUpdatingPoster = false,
	actionButtonLabel = __( 'Edit video details', 'jetpack-videopress-pkg' ),
	disableActionButton = false,
	disabled = false,
	uploadProgress,
	isLocalVideo = false,
}: VideoRowProps ) => {
	const textRef = useRef( null );

	const { canPerformAction } = usePermission();

	const isSmall = useViewportMatch( 'small', '<' );
	const [ expanded, setExpanded ] = useState( false );
	const [ anchor, setAnchor ] = useState( null );

	const durationInMinutesAndSeconds = millisecondsToMinutesAndSeconds( duration );
	const uploadDateFormatted = dateI18n( 'M j, Y', uploadDate );
	const isEllipsisActive = textRef?.current?.offsetWidth < textRef?.current?.scrollWidth;

	const showTitleLabel = ! isSmall && isEllipsisActive;
	const showActions = ( showActionButton || showQuickActions ) && ! loading && ! disabled;
	const showBottom = ! loading && ( ! isSmall || ( isSmall && expanded ) );
	const canExpand =
		isSmall &&
		showActions &&
		! loading &&
		( showActionButton ||
			Boolean( duration ) ||
			Number.isFinite( plays ) ||
			typeof isPrivate === 'boolean' );

	const hoverDisabled = isSmall || loading || disabled;

	const handleClickWithStopPropagation = callback => event => {
		event.stopPropagation();
		callback?.( event );
	};

	const actionButton = (
		<Button
			size="small"
			onClick={ handleClickWithStopPropagation( onActionClick ) }
			disabled={ ! canPerformAction || disableActionButton }
		>
			{ actionButtonLabel }
		</Button>
	);

	const handleInfoWrapperClick = () => {
		if ( canExpand ) {
			setExpanded( current => ! current );
		}
	};

	useEffect( () => {
		if ( disabled ) {
			setExpanded( false );
		}
	}, [ disabled ] );

	return (
		<div
			className={ clsx(
				styles[ 'video-row' ],
				{
					[ styles.disabled ]: disabled,
					[ styles[ 'hover-disabled' ] ]: hoverDisabled,
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
					onClick={ isSmall && ! loading ? handleInfoWrapperClick : null }
					role="presentation"
				>
					{ showThumbnail && (
						<div className={ styles.poster }>
							<VideoThumbnail
								thumbnail={ thumbnail }
								loading={ loading || isUpdatingPoster }
								uploading={ uploading }
								processing={ processing }
								blankIconSize={ 28 }
								uploadProgress={ uploadProgress }
								isRow
							/>
						</div>
					) }

					<div className={ styles[ 'title-wrapper' ] }>
						{ showTitleLabel && (
							<Text variant="body-extra-small" className={ styles.label } component="span">
								{ title }
							</Text>
						) }

						{ loading ? (
							<LoadingPlaceholder height={ 30 } />
						) : (
							<Text
								variant="title-small"
								className={ clsx( styles.title, { [ styles.disabled ]: disabled } ) }
								ref={ textRef }
							>
								{ title }
								{ titleAdornment }
							</Text>
						) }

						{ isSmall && (
							<>
								{ loading ? (
									<LoadingPlaceholder height={ 20 } width="80%" />
								) : (
									<Text component="div">{ uploadDateFormatted }</Text>
								) }
							</>
						) }
					</div>

					{ canExpand && <Icon icon={ expanded ? chevronUp : chevronDown } size={ 45 } /> }
				</div>

				{ showBottom && (
					<div className={ clsx( styles[ 'meta-wrapper' ], { [ styles.small ]: isSmall } ) }>
						{ ! isSmall && showActions && (
							<div className={ styles.actions }>
								{ showActionButton && actionButton }
								{ showQuickActions && id && <ConnectVideoQuickActions videoId={ id } /> }
							</div>
						) }

						<Stats
							duration={ durationInMinutesAndSeconds }
							uploadDate={ uploadDateFormatted }
							plays={ plays }
							isPrivate={ isPrivate }
							loading={ loading }
						/>

						{ isSmall && showActions && (
							<div className={ styles[ 'mobile-actions' ] }>
								{ showActionButton && actionButton }
								{ showQuickActions && id && <ConnectVideoQuickActions videoId={ id } /> }
							</div>
						) }
					</div>
				) }
			</div>

			{ ! isLocalVideo && (
				<PublishFirstVideoPopover id={ id } anchor={ anchor } position="top center" />
			) }
		</div>
	);
};

export const LocalVideoRow = ( props: VideoRowProps ) => {
	return <VideoRow isLocalVideo={ true } { ...props } />;
};

export const ConnectVideoRow = ( { id, ...restProps }: VideoRowProps ) => {
	const { isDeleting, uploading, processing, isUpdatingPoster, data, uploadProgress } =
		useVideo( id );
	const loading = ( isDeleting || restProps?.loading ) && ! uploading && ! processing;
	return (
		<VideoRow
			id={ id }
			{ ...restProps }
			loading={ loading }
			uploading={ uploading }
			isUpdatingPoster={ isUpdatingPoster }
			processing={ processing }
			showThumbnail
			privacySetting={ data.privacySetting }
			uploadProgress={ uploadProgress }
		/>
	);
};

export type { VideoRowProps };
export { StatsBase as Stats };
export default ConnectVideoRow;

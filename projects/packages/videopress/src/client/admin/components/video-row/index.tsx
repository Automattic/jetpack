import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { sprintf, __ } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp } from '@wordpress/icons';
import classNames from 'classnames';
import { useState, useRef } from 'react';
import privacy from '../../../components/icons/crossed-eye-icon';
import useVideo from '../../hooks/use-video';
import Checkbox from '../checkbox';
import Placeholder from '../placeholder';
import { ConnectVideoQuickActions } from '../video-quick-actions';
import VideoThumbnail from '../video-thumbnail';
import StatsBase from './stats';
import styles from './style.module.scss';
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
	const [ isSmall ] = useBreakpointMatch( 'sm' );
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
			loading={ loading }
		/>
	);
};

export const VideoRow = ( {
	id,
	className = '',
	checked = false,
	title,
	titleAdornment = null,
	thumbnail,
	showThumbnail = false,
	duration,
	uploadDate,
	plays,
	isPrivate,
	onActionClick,
	onSelect,
	showActionButton = true,
	showQuickActions = true,
	showCheckbox = true,
	loading = false,
	uploading = false,
	processing = false,
	isUpdatingPoster = false,
	actionButtonLabel = __( 'Edit video details', 'jetpack-videopress-pkg' ),
	disableActionButton = false,
	disabled = false,
	uploadProgress,
}: VideoRowProps ) => {
	const textRef = useRef( null );
	const checkboxRef = useRef( null );

	const [ isSmall ] = useBreakpointMatch( 'sm' );
	const [ showActionsState, setShowActions ] = useState( false );
	const [ keyPressed, setKeyDown ] = useState( false );
	const [ expanded, setExpanded ] = useState( false );

	const durationInMinutesAndSeconds = millisecondsToMinutesAndSeconds( duration );
	const uploadDateFormatted = dateI18n( 'M j, Y', uploadDate, null );
	const isEllipsisActive = textRef?.current?.offsetWidth < textRef?.current?.scrollWidth;

	const showTitleLabel = ! isSmall && isEllipsisActive;
	const showActions =
		showActionsState && ( showActionButton || showQuickActions ) && ! loading && ! disabled;
	const showStats = ! loading && ( ( ! isSmall && ! showActions ) || ( isSmall && expanded ) );
	const showBottom = ! loading && ( ! isSmall || ( isSmall && expanded ) );
	const canExpand =
		isSmall &&
		! loading &&
		( showActionButton ||
			Boolean( duration ) ||
			Number.isFinite( plays ) ||
			typeof isPrivate === 'boolean' );

	const hoverDisabled = isSmall || loading || disabled;

	const isSpaceOrEnter = code => code === 'Space' || code === 'Enter';

	const wrapperAriaLabel = sprintf(
		/* translators: 1 Video title, 2 Video duration, 3 Video upload date */
		__(
			'Video: %1$s, Duration: %2$s, Upload Date: %3$s. Click to edit details.',
			'jetpack-videopress-pkg'
		),
		title,
		durationInMinutesAndSeconds,
		uploadDateFormatted
	);

	const handleClickWithStopPropagation = callback => event => {
		event.stopPropagation();
		callback?.( event );
	};

	const actionButton = (
		<Button
			size="small"
			onClick={ handleClickWithStopPropagation( onActionClick ) }
			disabled={ disableActionButton }
		>
			{ actionButtonLabel }
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
			onMouseOver={ hoverDisabled ? null : handleOver }
			onMouseLeave={ hoverDisabled ? null : handleLeave }
			onClick={ isSmall ? null : handleClick }
			aria-label={ wrapperAriaLabel }
			className={ classNames(
				styles[ 'video-row' ],
				{
					[ styles.pressed ]: keyPressed,
					[ styles.disabled ]: disabled,
				},
				className
			) }
		>
			{ showCheckbox && (
				<div className={ classNames( { [ styles[ 'checkbox-wrapper-small' ] ]: isSmall } ) }>
					<Checkbox
						ref={ checkboxRef }
						checked={ checked && ! loading }
						tabIndex={ -1 }
						onChange={ onSelect }
						disabled={ loading }
					/>
				</div>
			) }
			<div
				className={ classNames( styles[ 'video-data-wrapper' ], {
					[ styles.small ]: isSmall,
				} ) }
			>
				<div
					className={ classNames( styles[ 'info-wrapper' ], { [ styles.small ]: isSmall } ) }
					onClick={ isSmall && ! loading ? handleInfoWrapperClick : null }
					role="presentation"
				>
					{ showThumbnail && (
						<div className={ styles.poster }>
							<VideoThumbnail
								thumbnail={ thumbnail }
								loading={ loading }
								uploading={ uploading || isUpdatingPoster }
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
							<Placeholder height={ 30 } />
						) : (
							<Text
								variant="title-small"
								className={ classNames( styles.title, { [ styles.disabled ]: disabled } ) }
								ref={ textRef }
							>
								{ title }
								{ titleAdornment }
							</Text>
						) }

						{ isSmall && (
							<>
								{ loading ? (
									<Placeholder height={ 20 } width="80%" />
								) : (
									<Text component="div">{ uploadDateFormatted }</Text>
								) }
							</>
						) }
					</div>
					{ canExpand && <Icon icon={ expanded ? chevronUp : chevronDown } size={ 45 } /> }
				</div>
				{ showBottom && (
					<div className={ classNames( styles[ 'meta-wrapper' ], { [ styles.small ]: isSmall } ) }>
						{ showActions && (
							<div className={ styles.actions }>
								{ showActionButton && actionButton }
								{ showQuickActions && id && <ConnectVideoQuickActions videoId={ id } /> }
							</div>
						) }
						{ showStats && (
							<Stats
								duration={ durationInMinutesAndSeconds }
								uploadDate={ uploadDateFormatted }
								plays={ plays }
								isPrivate={ isPrivate }
								loading={ loading }
							/>
						) }
						{ isSmall && (
							<div className={ styles[ 'mobile-actions' ] }>
								{ showActionButton && actionButton }
								{ showQuickActions && id && <ConnectVideoQuickActions videoId={ id } /> }
							</div>
						) }
					</div>
				) }
			</div>
		</div>
	);
};

export const ConnectVideoRow = ( { id, ...restProps }: VideoRowProps ) => {
	const { isDeleting, uploading, processing, isUpdatingPoster, data, uploadProgress } = useVideo(
		id
	);
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

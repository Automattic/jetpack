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
	thumbnail: defaultThumbnail,
	showThumbnail = false,
	duration,
	uploadDate,
	plays,
	isPrivate,
	onVideoDetailsClick,
	onSelect,
	showEditButton = true,
	showQuickActions = true,
	loading = false,
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
	const showStats = ( ! showActions && ! isSmall ) || ( isSmall && expanded ) || loading;
	const showBottom = ! isSmall || ( isSmall && expanded );

	let thumbnail = defaultThumbnail;
	thumbnail = loading ? <Placeholder width={ 90 } height={ 50 } /> : thumbnail;

	const canExpand =
		isSmall &&
		! loading &&
		( showEditButton ||
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
		title,
		durationInMinutesAndSeconds,
		uploadDateFormatted
	);

	const handleClickWithStopPropagation = callback => event => {
		event.stopPropagation();
		callback?.( event );
	};

	const editDetailsButton = (
		<Button size="small" onClick={ handleClickWithStopPropagation( onVideoDetailsClick ) }>
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
			onMouseOver={ isSmall || loading ? null : handleOver }
			onMouseLeave={ isSmall || loading ? null : handleLeave }
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
				<Checkbox
					ref={ checkboxRef }
					checked={ checked && ! loading }
					tabIndex={ -1 }
					onChange={ onSelect }
					disabled={ loading }
				/>
			</div>
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
							<VideoThumbnail thumbnail={ thumbnail } blankIconSize={ 28 } />
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
							<Text variant="title-small" className={ styles.title } ref={ textRef }>
								{ title }
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
						{ showActions && ( showEditButton || showQuickActions ) && ! loading && (
							<div className={ styles.actions }>
								{ showEditButton && editDetailsButton }
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
								{ showEditButton && editDetailsButton }
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
	const { isDeleting, uploading, processing } = useVideo( id );
	const loading = ( isDeleting || restProps?.loading ) && ! uploading && ! processing;
	return <VideoRow id={ id } { ...restProps } loading={ loading } />;
};

export type { VideoRowProps };
export { StatsBase as Stats };
export default ConnectVideoRow;

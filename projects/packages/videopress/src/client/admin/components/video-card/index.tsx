/**
 * External dependencies
 */
import {
	Text,
	Button,
	useBreakpointMatch,
	Title,
	numberFormat,
} from '@automattic/jetpack-components';
import { Icon } from '@wordpress/components';
import { Dropdown } from '@wordpress/components';
import { gmdateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
import { edit, cloud, image, media } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import ClipboardButtonInput from '../clipboard-button-input';
import styles from './style.module.scss';
import {
	VideoDetailsProps,
	VideoThumbnailProps,
	VideoThumbnailDropdownProps,
	VideoPressVideoProp,
} from './types';
import type React from 'react';

export const VideoThumbnailDropdown: React.FC< VideoThumbnailDropdownProps > = ( {
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
} ) => {
	return (
		<div className={ styles[ 'video-thumbnail-edit' ] }>
			<Dropdown
				position="bottom left"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						variant="secondary"
						className={ styles[ 'thumbnail__edit-button' ] }
						icon={ edit }
						onClick={ onToggle }
						aria-expanded={ isOpen }
					/>
				) }
				renderContent={ () => (
					<>
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ image }
							onClick={ onUseDefaultThumbnail }
						>
							{ __( 'Use default thumbnail', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ media }
							onClick={ onSelectFromVideo }
						>
							{ __( 'Select from video', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button
							weight="regular"
							fullWidth
							variant="tertiary"
							icon={ cloud }
							onClick={ onUploadImage }
						>
							{ __( 'Upload image', 'jetpack-videopress-pkg' ) }
						</Button>
					</>
				) }
			/>
		</div>
	);
};

/**
 * React component to display video thumbnail.
 *
 * @param {VideoThumbnailProps} props - Component props.
 * @returns {React.ReactNode} - VideoThumbnail react component.
 */
export const VideoThumbnail: React.FC< VideoThumbnailProps & VideoThumbnailDropdownProps > = ( {
	className,
	thumbnail,
	duration,
	editable,
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<div
			className={ classnames( className, styles.thumbnail, { [ styles[ 'is-small' ] ]: isSmall } ) }
		>
			{ editable && (
				<VideoThumbnailDropdown
					onUseDefaultThumbnail={ onUseDefaultThumbnail }
					onSelectFromVideo={ onSelectFromVideo }
					onUploadImage={ onUploadImage }
				/>
			) }
			{ duration && (
				<div className={ styles[ 'video-thumbnail-duration' ] }>
					<Text variant="body-small" component="div">
						{ duration >= 3600 * 1000
							? gmdateI18n( 'H:i:s', duration )
							: gmdateI18n( 'i:s', duration ) }
					</Text>
				</div>
			) }

			<img src={ thumbnail } alt={ __( 'Video thumbnail', 'jetpack-videopress-pkg' ) } />
		</div>
	);
};

export const VideoDetails: React.FC< VideoDetailsProps > = ( { filename, src, uploadDate } ) => {
	return (
		<div className={ styles.details }>
			<div className={ styles[ 'detail-row' ] }>
				<Text variant="body-small">{ __( 'Link to video', 'jetpack-videopress-pkg' ) }</Text>
				<ClipboardButtonInput value={ src } />
			</div>

			<div>
				<Text variant="body-small">{ __( 'File name', 'jetpack-videopress-pkg' ) }</Text>
				<Text variant="body">{ filename }</Text>
			</div>

			<div>
				<Text variant="body-small">{ __( 'Upload date', 'jetpack-videopress-pkg' ) }</Text>
				<Text variant="body">{ gmdateI18n( 'F j, Y', uploadDate ) }</Text>
			</div>
		</div>
	);
};

/**
 * Video Card component
 *
 * @param {VideoThumbnailProps} props - Component props.
 * @returns {React.ReactNode} - VideoCard react component.
 */
export const VideoCard: React.FC< VideoPressVideoProp & VideoThumbnailProps > = ( {
	title,
	duration,
	plays,
	thumbnail,
	editable,
} ) => {
	const playsCount = sprintf(
		/* translators: placeholder is a product name */
		__( '%s plays', 'jetpack-videopress-pkg' ),
		numberFormat( plays )
	);

	return (
		<div className={ styles[ 'video-card__wrapper' ] }>
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
				<Text
					weight="regular"
					size="small"
					component="div"
					className={ styles[ 'video-card__video-plays-counter' ] }
				>
					<Icon icon={ chartBar } />
					{ playsCount }
				</Text>
			</div>
			<div className={ styles[ 'video-card__quick-actions-section' ] }>
				<Button variant="primary" size="small">
					{ __( 'Edit video details', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
		</div>
	);
};

export default VideoCard;

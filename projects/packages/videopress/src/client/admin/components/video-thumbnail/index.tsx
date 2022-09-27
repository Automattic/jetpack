/**
 * External dependencies
 */
import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { gmdateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { Icon, edit, cloud, image, media, video } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';
/**
 * Types
 */
import { VideoThumbnailDropdownProps, VideoThumbnailProps } from './types';
import type React from 'react';

export const VideoThumbnailDropdownButtons = ( {
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
	onClose,
} ) => {
	return (
		<>
			<Button
				weight="regular"
				fullWidth
				variant="tertiary"
				icon={ image }
				onClick={ () => {
					onClose();
					onUseDefaultThumbnail?.();
				} }
			>
				{ __( 'Use default thumbnail', 'jetpack-videopress-pkg' ) }
			</Button>
			<Button
				weight="regular"
				fullWidth
				variant="tertiary"
				icon={ media }
				onClick={ () => {
					onClose();
					onSelectFromVideo?.();
				} }
			>
				{ __( 'Select from video', 'jetpack-videopress-pkg' ) }
			</Button>
			<Button
				weight="regular"
				fullWidth
				variant="tertiary"
				icon={ cloud }
				onClick={ () => {
					onClose();
					onUploadImage?.();
				} }
			>
				{ __( 'Upload image', 'jetpack-videopress-pkg' ) }
			</Button>
		</>
	);
};

export const VideoThumbnailDropdown = ( {
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
}: VideoThumbnailDropdownProps ) => {
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
				renderContent={ ( { onClose } ) => (
					<VideoThumbnailDropdownButtons
						onClose={ onClose }
						onUseDefaultThumbnail={ onUseDefaultThumbnail }
						onSelectFromVideo={ onSelectFromVideo }
						onUploadImage={ onUploadImage }
					/>
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
const VideoThumbnail = ( {
	className,
	thumbnail,
	duration,
	editable,
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
}: VideoThumbnailProps ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<div
			className={ classnames( className, styles.thumbnail, { [ styles[ 'is-small' ] ]: isSmall } ) }
		>
			{ typeof thumbnail === 'string' && editable && (
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

			{ typeof thumbnail === 'string' ? (
				<img src={ thumbnail } alt={ __( 'Video thumbnail', 'jetpack-videopress-pkg' ) } />
			) : (
				<div className={ styles[ 'thumbnail-placeholder' ] }>
					{ thumbnail ? thumbnail : <Icon icon={ video } size={ 96 } /> }
				</div>
			) }
		</div>
	);
};

export default VideoThumbnail;

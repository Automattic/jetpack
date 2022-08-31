/**
 * External dependencies
 */
import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { gmdateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { edit, cloud, image, media } from '@wordpress/icons';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import ClipboardButtonInput from '../clipboard-button-input';
import styles from './style.module.scss';
import { VideoDetailsProps, VideoThumbnailEditProps } from './types';
import type React from 'react';

/**
 * React component to display video thumbnail.
 *
 * @param {VideoThumbnailEditProps} props - Component props.
 * @returns {React.ReactNode} - VideoThumbnailEdit react component.
 */
export const VideoThumbnailEdit: React.FC< VideoThumbnailEditProps > = ( {
	thumbnail,
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
} ) => {
	const [ isSmall ] = useBreakpointMatch( 'sm' );

	return (
		<div className={ classnames( styles.thumbnail, { [ styles[ 'is-small' ] ]: isSmall } ) }>
			<div className={ styles[ 'video-details-card__edit-button-container' ] }>
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
 * Video Details Card component
 *
 * @param {VideoThumbnailEditProps} props - Component props.
 * @returns {React.ReactNode} - VideoDetailsCard react component.
 */
const VideoDetailsCard: React.FC< VideoDetailsProps & VideoThumbnailEditProps > = ( {
	filename,
	src,
	uploadDate,

	thumbnail,
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
} ) => {
	return (
		<div className={ styles.wrapper }>
			<VideoThumbnailEdit
				thumbnail={ thumbnail }
				onUseDefaultThumbnail={ onUseDefaultThumbnail }
				onSelectFromVideo={ onSelectFromVideo }
				onUploadImage={ onUploadImage }
			/>

			<VideoDetails filename={ filename } src={ src } uploadDate={ uploadDate } />
		</div>
	);
};

export default VideoDetailsCard;

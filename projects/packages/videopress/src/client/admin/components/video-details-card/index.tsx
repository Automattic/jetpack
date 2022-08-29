/**
 * External dependencies
 */
import { Text, Button } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { gmdateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { edit, cloud, image, media } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ClipboardButtonInput from '../clipboard-button-input';
import styles from './style.module.scss';
import { VideoDetailsCardProps, VideoThumbailEditProps } from './types';
import type React from 'react';

/**
 * React component to display video thumbnail.
 *
 * @param {VideoThumbailEditProps} props - Component props.
 * @returns {React.ReactNode} - VideoThumbailEdit react component.
 */
const VideoThumbailEdit: React.FC< VideoThumbailEditProps > = ( {
	thumbnail,
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
} ) => {
	return (
		<div className={ styles.thumbnail }>
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

/**
 * Video Details Card component
 *
 * @param {VideoDetailsCardProps} props - Component props.
 * @returns {React.ReactNode} - VideoDetailsCard react component.
 */
const VideoDetailsCard: React.FC< VideoDetailsCardProps > = ( {
	filename,
	src,
	uploadDate,

	thumbnail,
	onUseDefaultThumbnail,
	onSelectFromVideo,
	onUploadImage,
} ) => {
	const formattedUploadDate = gmdateI18n( 'F j, Y', uploadDate );

	return (
		<div className={ styles.wrapper }>
			<VideoThumbailEdit
				thumbnail={ thumbnail }
				onUseDefaultThumbnail={ onUseDefaultThumbnail }
				onSelectFromVideo={ onSelectFromVideo }
				onUploadImage={ onUploadImage }
			/>

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
					<Text variant="body">{ formattedUploadDate }</Text>
				</div>
			</div>
		</div>
	);
};

export default VideoDetailsCard;

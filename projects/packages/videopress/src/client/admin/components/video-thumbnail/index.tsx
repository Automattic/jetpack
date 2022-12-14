/**
 * External dependencies
 */
import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { Dropdown } from '@wordpress/components';
import { gmdateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, edit, cloud, image, media, video } from '@wordpress/icons';
import classnames from 'classnames';
import { forwardRef } from 'react';
/**
 * Internal dependencies
 */
import Placeholder from '../placeholder';
import ProgressBar from '../progress-bar';
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
	isUpdatingPoster = false,
} ) => {
	return (
		<>
			{ /* TODO: Implement use default and remove disabled class */ }
			<Button
				className={ styles.disabled }
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
				disabled={ isUpdatingPoster }
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

const UploadingThumbnail = ( {
	uploadProgress = 0,
	isRow = false,
}: {
	uploadProgress: number;
	isRow?: boolean;
} ) => {
	const completingTextFull = __( 'Completing upload', 'jetpack-videopress-pkg' );
	const completingTextCompact = __( 'Completing', 'jetpack-videopress-pkg' );
	const completingText = isRow ? completingTextCompact : completingTextFull;

	const uploadPercentage = `${ Math.floor( uploadProgress * 100 ) }%`;
	const uploadingText = sprintf(
		/* translators: placeholder is the upload percentage */
		__( 'Uploading %s', 'jetpack-videopress-pkg' ),
		uploadPercentage
	);
	const infoText = uploadProgress === 1 ? completingText : uploadingText;

	return (
		<div
			className={ classnames( styles[ 'custom-thumbnail' ], { [ styles[ 'is-row' ] ]: isRow } ) }
		>
			<ProgressBar
				className={ styles[ 'progress-bar' ] }
				size="small"
				progress={ uploadProgress }
			/>
			<Text variant={ isRow ? 'body-extra-small' : 'body' } className={ styles[ 'upload-text' ] }>
				{ infoText }
			</Text>
		</div>
	);
};

const ProcessingThumbnail = ( { isRow = false }: { isRow?: boolean } ) => (
	<div className={ styles[ 'custom-thumbnail' ] }>
		<Text variant={ isRow ? 'body-extra-small' : 'body' } className={ styles.pulse }>
			{ __( 'Processing', 'jetpack-videopress-pkg' ) }
		</Text>
	</div>
);

/**
 * React component to display video thumbnail.
 *
 * @param {VideoThumbnailProps} props - Component props.
 * @returns {React.ReactNode} - VideoThumbnail react component.
 */
const VideoThumbnail = forwardRef< HTMLDivElement, VideoThumbnailProps >(
	(
		{
			className,
			thumbnail: defaultThumbnail,
			duration,
			editable,
			blankIconSize = 96,
			loading = false,
			uploading = false,
			processing = false,
			onUseDefaultThumbnail,
			onSelectFromVideo,
			onUploadImage,
			uploadProgress,
			isRow = false,
		},
		ref
	) => {
		const [ isSmall ] = useBreakpointMatch( 'sm' );

		// Mapping thumbnail (Ordered by priority)
		let thumbnail = defaultThumbnail;
		thumbnail = loading ? <Placeholder /> : thumbnail;
		thumbnail = uploading ? (
			<UploadingThumbnail isRow={ isRow } uploadProgress={ uploadProgress } />
		) : (
			thumbnail
		);
		thumbnail = processing ? <ProcessingThumbnail isRow={ isRow } /> : thumbnail;

		thumbnail =
			typeof thumbnail === 'string' && thumbnail !== '' ? (
				<img src={ thumbnail } alt={ __( 'Video thumbnail', 'jetpack-videopress-pkg' ) } />
			) : (
				thumbnail
			);

		/** If the thumbnail is not set, use the placeholder with an icon */
		thumbnail = thumbnail ? (
			thumbnail
		) : (
			<div className={ styles[ 'thumbnail-blank' ] }>
				<Icon icon={ video } size={ blankIconSize } />
			</div>
		);

		return (
			<div
				className={ classnames( className, styles.thumbnail, {
					[ styles[ 'is-small' ] ]: isSmall,
				} ) }
				ref={ ref }
			>
				{ Boolean( thumbnail ) && editable && (
					<VideoThumbnailDropdown
						onUseDefaultThumbnail={ onUseDefaultThumbnail }
						onSelectFromVideo={ onSelectFromVideo }
						onUploadImage={ onUploadImage }
					/>
				) }
				{ Number.isFinite( duration ) && (
					<div className={ styles[ 'video-thumbnail-duration' ] }>
						<Text variant="body-small" component="div">
							{ duration >= 3600 * 1000
								? gmdateI18n( 'H:i:s', new Date( duration ) )
								: gmdateI18n( 'i:s', new Date( duration ) ) }
						</Text>
					</div>
				) }

				<div className={ styles[ 'thumbnail-placeholder' ] }>{ thumbnail }</div>
			</div>
		);
	}
);

export default VideoThumbnail;

import { Button, ThemeProvider } from '@automattic/jetpack-components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { ResponsiveWrapper, Spinner, VisuallyHidden } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import clsx from 'clsx';
import { isVideo } from '../../hooks/use-media-restrictions';
import { SELECTABLE_MEDIA_TYPES } from '../../hooks/use-media-restrictions/restrictions';
import VideoPreview from '../video-preview';
import styles from './styles.module.scss';

// This is to cope with the problem describeed here:
// https://github.com/WordPress/gutenberg/blob/ebad47952fc94ce4324e989691dde2d3d7689f45/packages/block-editor/src/components/inserter/media-tab/media-tab.js#L122
const clickHandler = open => e => {
	e.currentTarget.focus();
	open();
};

/**
 * Wrapper that handles media-related functionality.
 *
 * @param {object} props - Props for the Media Picker
 * @param {string} props.buttonLabel - Label for the button of the picker
 * @param {string} props.subTitle - Alt text under the button
 * @param {number} props.mediaId - The ID of the currently selected media
 * @param {object} props.mediaDetails - The details of the media for preview
 * @param {Function} props.onChange - A callback that can be passed to parent for validation
 * @param {string} props.wrapperClassName - A class name to be added to the wrapper
 * @param {object} props.allowedMediaTypes - Custom allowed media types
 * @returns {object} The media section.
 */
export default function MediaPicker( {
	buttonLabel,
	subTitle,
	mediaId = null,
	mediaDetails = {},
	onChange,
	wrapperClassName,
	allowedMediaTypes = null,
} ) {
	const {
		mediaData: { width, height, sourceUrl } = {},
		metaData: { mime, length = null } = {},
		previewData: { width: previewWidth, height: previewHeight, sourceUrl: previewUrl } = {},
	} = mediaDetails;

	const isImageLoading = ! sourceUrl || ! width || ! height || ! mime;

	const onRemoveMedia = useCallback( () => onChange( null ), [ onChange ] );
	const onUpdateMedia = useCallback(
		media => {
			onChange( media );
		},
		[ onChange ]
	);

	const renderPreview = useCallback(
		open => {
			const renderVideoPreview = isVideo( mime );
			if ( renderVideoPreview && ! length ) {
				return null;
			}

			return (
				<div className={ clsx( styles[ 'preview-wrapper' ], wrapperClassName ) }>
					<button className={ styles.remove } onClick={ onRemoveMedia }>
						<VisuallyHidden>{ __( 'Remove media', 'jetpack' ) }</VisuallyHidden>
						<Icon icon={ closeSmall } />
					</button>
					<button
						className={ styles.preview }
						onClick={ clickHandler( open ) }
						data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
					>
						{ renderVideoPreview ? (
							<VideoPreview
								sourceUrl={ sourceUrl }
								mime={ mime }
								duration={ length }
							></VideoPreview>
						) : (
							<ResponsiveWrapper
								naturalWidth={ previewWidth || width }
								naturalHeight={ previewHeight || height }
								isInline
							>
								<img
									src={ previewUrl || sourceUrl }
									alt=""
									className={ styles[ 'preview-image' ] }
								/>
							</ResponsiveWrapper>
						) }
					</button>
				</div>
			);
		},
		[
			height,
			length,
			mime,
			onRemoveMedia,
			previewHeight,
			previewUrl,
			previewWidth,
			sourceUrl,
			width,
			wrapperClassName,
		]
	);

	const renderPicker = useCallback(
		open => (
			<div className={ styles.container }>
				{ ! mediaId ? (
					<>
						<Button
							variant="secondary"
							size="small"
							className={ styles.preview }
							onClick={ clickHandler( open ) }
							data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
						>
							{ buttonLabel }
						</Button>
						{ subTitle && <span>{ subTitle }</span> }
					</>
				) : (
					<>
						<button className={ styles[ 'remove-loading' ] } onClick={ onRemoveMedia }>
							<VisuallyHidden>{ __( 'Remove media', 'jetpack' ) }</VisuallyHidden>
							<Icon icon={ closeSmall } />
						</button>
						<Spinner data-testid="spinner" />
					</>
				) }
			</div>
		),
		[ buttonLabel, mediaId, onRemoveMedia, subTitle ]
	);

	const setMediaRender = useCallback(
		( { open } ) => ( mediaId && ! isImageLoading ? renderPreview( open ) : renderPicker( open ) ),
		[ mediaId, isImageLoading, renderPreview, renderPicker ]
	);

	return (
		<ThemeProvider>
			<MediaUploadCheck>
				<MediaUpload
					allowedTypes={ allowedMediaTypes ?? SELECTABLE_MEDIA_TYPES }
					title={ buttonLabel }
					onSelect={ onUpdateMedia }
					render={ setMediaRender }
					value={ mediaId }
				/>
			</MediaUploadCheck>
		</ThemeProvider>
	);
}

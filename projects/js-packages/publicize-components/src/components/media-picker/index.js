import { Button, ThemeProvider } from '@automattic/jetpack-components';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { ResponsiveWrapper, Spinner, VisuallyHidden } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import { isVideo } from '../../hooks/use-media-restrictions';
import VideoPreview from '../video-preview';
import styles from './styles.module.scss';

/**
 * Wrapper that handles media-related functionality.
 *
 * @param {object} props - Props for the Media Picker
 * @param {string} props.buttonLabel - Label for the button of the picker
 * @param {string} props.subTitle - Alt text under the button
 * @param {number} props.mediaId - The ID of the currently selected media
 * @param {object} props.mediaDetails - The details of the media for preview
 * @param {Function} props.onChange - A callback that can be passed to parent for validation
 * @returns {object} The media section.
 */
export default function MediaPicker( {
	buttonLabel,
	subTitle,
	mediaId = null,
	mediaDetails = {},
	onChange,
} ) {
	const { mediaData: { width, height, sourceUrl } = {}, metaData: { mime, length = null } = {} } =
		mediaDetails;

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
				<div className={ styles[ 'preview-wrapper' ] }>
					<button className={ styles.remove } onClick={ onRemoveMedia }>
						<VisuallyHidden>{ __( 'Remove media', 'jetpack' ) }</VisuallyHidden>
						<Icon icon={ closeSmall } />
					</button>
					<button className={ styles.preview } onClick={ open }>
						{ renderVideoPreview ? (
							<VideoPreview
								sourceUrl={ sourceUrl }
								mime={ mime }
								duration={ length }
							></VideoPreview>
						) : (
							<ResponsiveWrapper naturalWidth={ width } naturalHeight={ height } isInline>
								<img src={ sourceUrl } alt="" className={ styles[ 'preview-image' ] } />
							</ResponsiveWrapper>
						) }
					</button>
				</div>
			);
		},
		[ height, length, mime, onRemoveMedia, sourceUrl, width ]
	);

	const renderPicker = useCallback(
		open => (
			<div className={ styles.container }>
				{ ! mediaId ? (
					<>
						<Button variant="secondary" size="small" className={ styles.preview } onClick={ open }>
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
					title={ buttonLabel }
					onSelect={ onUpdateMedia }
					render={ setMediaRender }
					value={ mediaId }
				/>
			</MediaUploadCheck>
		</ThemeProvider>
	);
}

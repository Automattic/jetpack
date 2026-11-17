import { ThemeProvider } from '@automattic/jetpack-components';
import { loadMediaLibrary } from '@automattic/jetpack-components/tools/load-media-library';
import { MediaUpload, MediaUploadCheck } from '@wordpress/block-editor';
import { Fragment, useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import { Button, Spinner, VisuallyHidden } from '@wordpress/ui';
import clsx from 'clsx';
import { isVideo } from '../../hooks/use-media-restrictions';
import { SELECTABLE_MEDIA_TYPES } from '../../hooks/use-media-restrictions/restrictions';
import VideoPreview from '../video-preview';
import styles from './styles.module.scss';
import type { MediaDetails } from '../../hooks/use-media-details/types';
import type { Attachment } from '@wordpress/core-data';

type MediaPickerProps = {
	buttonLabel: string;
	subTitle?: string;
	mediaId?: number | null;
	mediaDetails?: MediaDetails;
	onChange: ( media: Attachment | null ) => void;
	wrapperClassName?: string;
	allowedMediaTypes?: string[] | null;
	isEditor?: boolean;
};

/**
 * Wrapper that handles media-related functionality.
 *
 * @param {object}   props                   - Props for the Media Picker
 * @param {string}   props.buttonLabel       - Label for the button of the picker
 * @param {string}   props.subTitle          - Alt text under the button
 * @param {number}   props.mediaId           - The ID of the currently selected media
 * @param {object}   props.mediaDetails      - The details of the media for preview
 * @param {Function} props.onChange          - A callback that can be passed to parent for validation
 * @param {string}   props.wrapperClassName  - A class name to be added to the wrapper
 * @param {object}   props.allowedMediaTypes - Custom allowed media types
 * @param {boolean}  props.isEditor          - Whether the media picker is in the editor
 * @return {object} The media section.
 */
export default function MediaPicker( {
	buttonLabel,
	subTitle,
	mediaId = null,
	mediaDetails = {},
	onChange,
	wrapperClassName,
	allowedMediaTypes = null,
	isEditor = true,
}: MediaPickerProps ) {
	const {
		mediaData: { width, height, sourceUrl } = {},
		metaData: { mime, length = null } = {},
		previewData: { width: previewWidth, height: previewHeight, sourceUrl: previewUrl } = {},
	} = mediaDetails;

	const isImageLoading = ! sourceUrl || ! width || ! height || ! mime;
	const [ isLoadingLibrary, setIsLoadingLibrary ] = useState( false );
	const [ hasLibraryError, setHasLibraryError ] = useState( false );
	const isLoadingRef = useRef( false );

	// MediaUpload's `open` needs wp.media, which loads on the first click.
	const clickHandler = useCallback(
		open => async e => {
			// Focus first, to cope with the problem described here:
			// https://github.com/WordPress/gutenberg/blob/ebad47952fc94ce4324e989691dde2d3d7689f45/packages/block-editor/src/components/inserter/media-tab/media-tab.js#L122
			e.currentTarget.focus();
			// The preview button has no disabled state, so a second click must not open it twice.
			if ( isLoadingRef.current ) {
				return;
			}
			isLoadingRef.current = true;
			setIsLoadingLibrary( true );
			setHasLibraryError( false );
			try {
				await loadMediaLibrary();
			} catch {
				setHasLibraryError( true );
				return;
			} finally {
				isLoadingRef.current = false;
				setIsLoadingLibrary( false );
			}
			open();
		},
		[]
	);

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
			return (
				<div className={ clsx( styles[ 'preview-wrapper' ], wrapperClassName ) }>
					<button className={ styles.remove } onClick={ onRemoveMedia }>
						<VisuallyHidden>{ __( 'Remove media', 'jetpack-publicize-pkg' ) }</VisuallyHidden>
						<Icon icon={ closeSmall } />
					</button>
					<button
						className={ styles.preview }
						onClick={ clickHandler( open ) }
						aria-busy={ isLoadingLibrary }
						data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
					>
						{ renderVideoPreview ? (
							<VideoPreview
								sourceUrl={ sourceUrl }
								mime={ mime }
								duration={ length }
							></VideoPreview>
						) : (
							<img
								src={ previewUrl || sourceUrl }
								alt=""
								className={ styles[ 'preview-image' ] }
								style={ {
									aspectRatio: `${ previewWidth || width } / ${ previewHeight || height }`,
								} }
							/>
						) }
					</button>
				</div>
			);
		},
		[
			clickHandler,
			height,
			isLoadingLibrary,
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
							variant="outline"
							size="small"
							className={ styles[ 'picker-button' ] }
							onClick={ clickHandler( open ) }
							loading={ isLoadingLibrary }
							disabled={ isLoadingLibrary }
							data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
						>
							{ buttonLabel }
						</Button>
						{ subTitle && <span>{ subTitle }</span> }
					</>
				) : (
					<>
						<button className={ styles[ 'remove-loading' ] } onClick={ onRemoveMedia }>
							<VisuallyHidden>{ __( 'Remove media', 'jetpack-publicize-pkg' ) }</VisuallyHidden>
							<Icon icon={ closeSmall } />
						</button>
						<Spinner data-testid="spinner" />
					</>
				) }
			</div>
		),
		[ buttonLabel, clickHandler, isLoadingLibrary, mediaId, onRemoveMedia, subTitle ]
	);

	const setMediaRender = useCallback(
		( { open } ) => ( mediaId && ! isImageLoading ? renderPreview( open ) : renderPicker( open ) ),
		[ mediaId, isImageLoading, renderPreview, renderPicker ]
	);

	const MediaUploadComponent = isEditor ? MediaUploadCheck : Fragment;

	return (
		<ThemeProvider>
			<MediaUploadComponent>
				<MediaUpload
					allowedTypes={ allowedMediaTypes ?? SELECTABLE_MEDIA_TYPES }
					title={ buttonLabel }
					onSelect={ onUpdateMedia }
					render={ setMediaRender }
					value={ mediaId }
				/>
			</MediaUploadComponent>
			{ hasLibraryError && (
				<p role="alert" className={ styles[ 'library-error' ] }>
					{ __( 'The media library could not be loaded. Try again.', 'jetpack-publicize-pkg' ) }
				</p>
			) }
		</ThemeProvider>
	);
}

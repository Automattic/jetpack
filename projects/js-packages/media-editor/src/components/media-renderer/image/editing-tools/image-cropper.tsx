/**
 * WordPress dependencies
 */
// TODO: Re-enable when @wordpress/image-cropper is available
// import {
// 	ImageCropper as ImageCropperComponent,
// 	type MediaSize,
// 	useImageCropper,
// } from '@wordpress/image-cropper';
import { useState, useRef, useCallback, useLayoutEffect } from '@wordpress/element';

// Temporary stubs until @wordpress/image-cropper is available
type MediaSize = {
	width: number;
	height: number;
	naturalWidth: number;
	naturalHeight: number;
};

interface ImageCropperComponentProps {
	src: string;
	onLoad: ( loadedMediaSize: MediaSize ) => void;
}

const ImageCropperComponent = ( { src, onLoad }: ImageCropperComponentProps ) => {
	// Stub implementation
	return null;
};

interface CropState {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface FlipState {
	horizontal: boolean;
	vertical: boolean;
}

const useImageCropper = () => ( {
	mediaSize: { width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 } as MediaSize,
	setResetState: ( state: any ) => {},
	resetState: {
		flip: { horizontal: false, vertical: false } as FlipState,
		rotation: 0,
		zoom: 1,
		aspectRatio: null,
		crop: { x: 0, y: 0, width: 100, height: 100 } as CropState,
	},
	isDirty: false,
	setCrop: ( crop: CropState ) => {},
	crop: { x: 0, y: 0, width: 100, height: 100 } as CropState,
	getCroppedImage: () => Promise.resolve( '' ),
	setRotation: ( rotation: number ) => {},
	setZoom: ( zoom: number ) => {},
	zoom: 1,
	rotation: 0,
	aspectRatio: null,
	setAspectRatio: ( ratio: any ) => {},
	setFlip: ( flip: FlipState ) => {},
	flip: { horizontal: false, vertical: false } as FlipState,
	reset: () => {},
} );

/**
 * Internal dependencies
 */
import { getMaximumScaledDimensions } from './utils';

const DEFAULT_CONTAINER_STYLE = {
	minHeight: '100%',
	minWidth: '100%',
	maxWidth: '100%',
	maxHeight: '100%',
};

export default function ImageCropper( { src }: { src: string } ) {
	const containerRef = useRef< HTMLDivElement | null >( null );
	const [ containerStyle, setContainerStyle ] = useState< {
		minHeight?: string;
		minWidth?: string;
		maxWidth?: string;
		maxHeight?: string;
	} | null >( null );

	const {
		mediaSize,
		setResetState,
		resetState,
		isDirty: isImageCropperDirty,
		setCrop,
		crop,
	} = useImageCropper();

	const updateDimensions = useCallback( ( loadedMediaSize: MediaSize ) => {
		/*
		 * In use-cropper.ts `onSetRotation` we flip the aspect ratio when:
		 * - the image is rotated, and
		 * - the aspectRatio matches the natural image aspect ratio.
		 *
		 * While the image aspect ratio is active, the crop area should effectively rotate with the image.
		 *
		 * Because rotation is performed using CSS transforms, the media is outside the flow
		 * of the container. The cropper lib does not handle dynamic resize by default,
		 * so the solution is just to adjust the container so that the image will fit
		 * inside the crop area regardless of the rotation.
		 */
		if ( containerRef && containerRef.current?.offsetWidth && containerRef.current?.offsetHeight ) {
			const { scaledWidth, scaledHeight } = getMaximumScaledDimensions(
				loadedMediaSize.width,
				loadedMediaSize.height,
				containerRef.current.offsetWidth,
				containerRef.current.offsetHeight
			);
			/*
			 * Depending on the image's aspect ration, allow scaling with window.
			 * Set minHeight/maxHeight to the container width to ensure that the image
			 * fits into the crop area, even when the image is rotated.
			 */
			if ( loadedMediaSize.width > containerRef.current.offsetHeight ) {
				setContainerStyle( {
					maxWidth: `${ scaledWidth }px`,
					minHeight: `${ scaledWidth }px`,
				} );
			} else if ( loadedMediaSize.height > containerRef.current.offsetWidth ) {
				setContainerStyle( {
					maxHeight: `${ scaledHeight }px`,
					minWidth: `${ scaledHeight }px`,
				} );
			}
		}
	}, [] );

	const handleOnload = useCallback(
		( loadedMediaSize: MediaSize ) => {
			if ( isImageCropperDirty ) {
				/*
				 * If the image is dirty, don't set the default cropper state
				 * when the image is loaded. This ensure that the cropper's state
				 * persists between media editor open and close.
				 *
				 * `setCrop` is used to set the cropper's state to the current crop.
				 * It might be better to encapsulate this logic in the image-cropper
				 * package.
				 */
				setCrop( crop );
				return;
			}
			setResetState( {
				aspectRatio: loadedMediaSize.naturalWidth / loadedMediaSize.naturalHeight,
				crop: {
					x: 0,
					y: 0,
					width: loadedMediaSize.naturalWidth,
					height: loadedMediaSize.naturalHeight,
				},
			} );
		},
		[ isImageCropperDirty, setResetState, setCrop, crop ]
	);

	/*
	 * Forces a reflow/repaint, and give React time to complete
	 * its layout calculations.
	 */
	useLayoutEffect( () => {
		if ( ! containerStyle && mediaSize && containerRef.current && resetState ) {
			requestAnimationFrame( () => {
				updateDimensions( mediaSize );
			} );
		}
	}, [ updateDimensions, containerStyle, mediaSize, containerRef, resetState ] );

	return (
		<div
			className="next-admin-media-editor-content__cropper"
			ref={ containerRef }
			style={ containerStyle || DEFAULT_CONTAINER_STYLE }
		>
			<ImageCropperComponent src={ src } onLoad={ handleOnload } />
		</div>
	);
}

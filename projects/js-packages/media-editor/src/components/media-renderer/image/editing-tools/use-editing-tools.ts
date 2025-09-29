/**
 * WordPress dependencies
 */
// TODO: Re-enable when @wordpress/image-cropper is available
// import { useImageCropper } from '@wordpress/image-cropper';
import { useEffect, useCallback } from '@wordpress/element';

// Temporary stub until @wordpress/image-cropper is available
const useImageCropper = () => ( {
	setRotation: ( rotation: number ) => {},
	setZoom: ( zoom: number ) => {},
	zoom: 1,
	rotation: 0,
	aspectRatio: null as any,
	setAspectRatio: ( ratio: any ) => {},
	mediaSize: { width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 },
	setFlip: ( flip: { horizontal: boolean; vertical: boolean } ) => {},
	flip: { horizontal: false, vertical: false },
	reset: () => {},
} );

/**
 * Internal dependencies
 */
import useGetAspectRatios from '../../../../hooks/use-get-aspect-ratios';
import { ratioToNumber, type AspectRatio } from './aspect-ratio';
import { isQuarterTurn } from './utils';
import { useMediaEditorState } from '../../../provider/with-media-editor-state-provider';

/**
 * Custom hook that encapsulates shared editing tools logic
 * Used by both toolbar and panel components
 */
export default function useEditingTools() {
	const {
		setRotation,
		setZoom,
		zoom,
		rotation,
		aspectRatio,
		setAspectRatio,
		mediaSize,
		setFlip,
		flip,
		reset,
	} = useImageCropper();

	const { default: defaultRatios, theme: themeRatios, imageAspectRatios } = useGetAspectRatios();

	const { selectedAspectRatio, setSelectedAspectRatio } = useMediaEditorState();

	useEffect( () => {
		setSelectedAspectRatio( imageAspectRatios[ 0 ] );
	}, [ imageAspectRatios, setSelectedAspectRatio ] );

	/*
	 * If the image is rotated 90° or 270° and the aspect ratio is the default image aspect ratio,
	 * the aspect ratio needs to be recalculated to update the crop area.
	 */
	const maybeFlipAspectRatio = useCallback(
		( updatedRotation: number ) => {
			let newAspectRatio = aspectRatio;
			const original = mediaSize?.naturalWidth
				? mediaSize.naturalWidth / mediaSize.naturalHeight
				: 1;
			const rotated = mediaSize?.naturalHeight
				? mediaSize.naturalHeight / mediaSize.naturalWidth
				: 1;
			/*
			 * Rotate the crop area with the image when the image aspect ratio is active,
			 * and the user has not changed the zoom level.
			 *
			 * To rotate the crop area with the image,
			 * the aspect ratio needs to be recalculated to update the crop area.
			 */
			if (
				zoom === 1 &&
				selectedAspectRatio?.slug === imageAspectRatios[ 0 ]?.slug &&
				( aspectRatio === original || aspectRatio === rotated )
			) {
				/*
				 * If the image is rotated 90° or 270°,
				 * the aspect ratio needs to be recalculated to
				 * update the crop area.
				 *
				 * If the image is 0° or 180° rotated, set
				 * the aspect ratio to the default image aspect ratio.
				 */
				newAspectRatio = isQuarterTurn( updatedRotation ) ? rotated : original;
			}
			if ( newAspectRatio !== aspectRatio ) {
				setAspectRatio( newAspectRatio );
			}
		},
		[ zoom, aspectRatio, selectedAspectRatio, imageAspectRatios, setAspectRatio, mediaSize ]
	);

	const handleSetRotation = useCallback(
		( newRotation: number ) => {
			setRotation( newRotation );
			maybeFlipAspectRatio( newRotation );
		},
		[ setRotation, maybeFlipAspectRatio ]
	);

	const handleSetAspectRatio = useCallback(
		( newAspectRatio: AspectRatio ) => {
			setAspectRatio( ratioToNumber( newAspectRatio.ratio ) );
			setSelectedAspectRatio( newAspectRatio );
		},
		[ setAspectRatio, setSelectedAspectRatio ]
	);

	const handleReset = useCallback( () => {
		setSelectedAspectRatio( imageAspectRatios[ 0 ] ?? null );
		reset();
	}, [ setSelectedAspectRatio, imageAspectRatios, reset ] );

	return {
		// State
		selectedAspectRatio,
		zoom,
		rotation,
		aspectRatio,
		flip,
		// Aspect ratio data
		defaultRatios,
		themeRatios,
		imageAspectRatios,
		// Actions
		setZoom,
		setAspectRatio,
		setFlip,
		setRotation,
		setSelectedAspectRatio,
		handleSetRotation,
		handleSetAspectRatio,
		handleReset,
	};
}

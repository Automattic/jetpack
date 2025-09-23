/**
 * WordPress dependencies
 */
import {
	__experimentalHeading as Heading,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Button,
} from '@wordpress/components';
import { __experimentalVStack as Stack } from '@wordpress/components';
// TODO: Implement image cropping functionality
// import { useImageCropper } from '@wordpress/image-cropper';
import { useCallback, useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	flipHorizontal as flipHorizontalIcon,
	flipVertical as flipVerticalIcon,
	rotateRight as rotateRightIcon,
	rotateLeft as rotateLeftIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useGetAspectRatios from '../../../../hooks/use-get-aspect-ratios.ts';
import { AspectRatioSelect, ratioToNumber, type AspectRatio } from './aspect-ratio/index.ts';
import { isQuarterTurn } from './utils.ts';
import ZoomRange from './zoom-range/index.tsx';
import './style.scss';

/**
 *
 */
export default function EditingToolsPanel() {
	// TODO: Implement image cropping functionality
	// const {
	//	setRotation,
	//	setZoom,
	//	zoom,
	//	rotation,
	//	aspectRatio,
	//	setAspectRatio,
	//	mediaSize,
	//	setFlip,
	//	flip,
	//	reset,
	//	resetState,
	// } = useImageCropper();

	// Stub implementations
	const setRotation = ( rotation: number ) => {};
	const setZoom = ( zoom: number ) => {};
	const zoom = 1;
	const rotation = 0;
	const aspectRatio = 1;
	const setAspectRatio = ( aspectRatio: number ) => {};
	const mediaSize = { naturalWidth: 1, naturalHeight: 1 };
	const setFlip = ( flip: { horizontal: boolean; vertical: boolean } ) => {};
	const flip = { horizontal: false, vertical: false };
	const reset = () => {};
	const resetState = {
		zoom: 1,
		aspectRatio: 1,
		rotation: 0,
		flip: { horizontal: false, vertical: false },
	};

	const { default: defaultRatios, theme: themeRatios, imageAspectRatios } = useGetAspectRatios();

	const [ selectedAspectRatio, setSelectedAspectRatio ] = useState< AspectRatio >(
		imageAspectRatios[ 0 ]
	);

	useEffect( () => {
		setSelectedAspectRatio( imageAspectRatios[ 0 ] );
	}, [ imageAspectRatios ] );

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
	}, [ reset, imageAspectRatios ] );

	const resetPositionTools = useCallback( () => {
		setFlip(
			resetState?.flip ?? {
				horizontal: false,
				vertical: false,
			}
		);

		setRotation( resetState?.rotation ?? 0 );
	}, [ resetState, setFlip, setRotation ] );

	if ( ! selectedAspectRatio ) {
		return null;
	}

	return (
		<div className="next-admin-media-editor__tools-panel">
			<ToolsPanel
				label={ __( 'Crop area', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
				resetAll={ () => {
					setZoom( resetState?.zoom ?? 1 );
					setAspectRatio( resetState?.aspectRatio ?? 1 );
					setSelectedAspectRatio( imageAspectRatios[ 0 ] ?? null );
				} }
				panelId={ 'crop-area' }
			>
				<ToolsPanelItem
					hasValue={ () => zoom !== resetState?.zoom }
					label={ __( 'Zoom', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
					onDeselect={ () => setZoom( resetState?.zoom ?? 1 ) }
					isShownByDefault
					panelId={ 'crop-area' }
				>
					<ZoomRange label={ __( 'Zoom', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) } zoom={ zoom } onChange={ setZoom } />
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () => aspectRatio !== resetState?.aspectRatio }
					label={ __( 'Aspect ratio', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
					onDeselect={ () => {
						setAspectRatio( resetState?.aspectRatio ?? 1 );
						setSelectedAspectRatio( imageAspectRatios[ 0 ] ?? null );
					} }
					isShownByDefault
					panelId={ 'crop-area' }
				>
					<AspectRatioSelect
						className="next-admin-media-editor__tools-panel-dropdown"
						aspectRatio={ selectedAspectRatio }
						onChange={ handleSetAspectRatio }
						imageAspectRatios={ imageAspectRatios }
						defaultRatios={ defaultRatios }
						themeRatios={ themeRatios }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
			<ToolsPanel
				label={ __( 'Position', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
				resetAll={ resetPositionTools }
				panelId={ 'position' }
			>
				<ToolsPanelItem
					hasValue={ () => rotation !== resetState?.rotation }
					label={ __( 'Rotate', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
					onDeselect={ () => {
						setRotation( resetState?.rotation ?? 0 );
						if ( 1 === zoom ) {
							setAspectRatio( resetState?.aspectRatio ?? 1 );
						}
					} }
					isShownByDefault
					panelId={ 'position' }
				>
					<Heading
						upperCase
						level={ 3 }
						size={ 11 }
						className="next-admin-media-editor__tools-panel-heading"
					>
						{ __( 'Rotate', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
					</Heading>
					<Stack direction="row" justify="space-between" gap={ 2 }>
						<Button
							className="next-admin-media-editor__tools-panel-button"
							variant="secondary"
							icon={ rotateLeftIcon }
							label={ __( 'Rotate 90° left', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
							onClick={ () => handleSetRotation( rotation - 90 ) }
						>
							{ __( '90° left', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
						</Button>
						<Button
							className="next-admin-media-editor__tools-panel-button"
							variant="secondary"
							icon={ rotateRightIcon }
							label={ __( 'Rotate 90° right', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
							onClick={ () => handleSetRotation( rotation + 90 ) }
						>
							{ __( '90° right', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
						</Button>
					</Stack>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () =>
						flip.horizontal !== resetState?.flip?.horizontal ||
						flip.vertical !== resetState?.flip?.vertical
					}
					label={ __( 'Flip', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
					onDeselect={ () =>
						setFlip(
							resetState?.flip ?? {
								horizontal: false,
								vertical: false,
							}
						)
					}
					isShownByDefault
					panelId={ 'position' }
				>
					<Heading
						upperCase
						level={ 3 }
						size={ 11 }
						className="next-admin-media-editor__tools-panel-heading"
					>
						{ __( 'Flip', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
					</Heading>
					<Stack direction="row" justify="space-between" gap={ 2 }>
						<Button
							className="next-admin-media-editor__tools-panel-button"
							variant="secondary"
							icon={ flipHorizontalIcon }
							label={ __( 'Flip horizontal', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
							onClick={ () =>
								setFlip( {
									vertical: flip.vertical,
									horizontal: ! flip.horizontal,
								} )
							}
						>
							{ __( 'Horizontal', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
						</Button>
						<Button
							variant="secondary"
							className="next-admin-media-editor__tools-panel-button"
							icon={ flipVerticalIcon }
							label={ __( 'Flip vertical', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
							onClick={ () =>
								setFlip( {
									vertical: ! flip.vertical,
									horizontal: flip.horizontal,
								} )
							}
						>
							{ __( 'Vertical', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
						</Button>
					</Stack>
				</ToolsPanelItem>
			</ToolsPanel>
			<Stack
				direction="row"
				justify="end"
				gap={ 4 }
				className="next-admin-media-editor__tools-panel-row"
			>
				<Button
					className="next-admin-media-editor__tools-panel-button"
					variant="secondary"
					isDestructive
					onClick={ handleReset }
				>
					{ __( 'Reset all', 'no text domain is set in this in this project's eslint.config.mjs or composer.json' ) }
				</Button>
			</Stack>
		</div>
	);
}

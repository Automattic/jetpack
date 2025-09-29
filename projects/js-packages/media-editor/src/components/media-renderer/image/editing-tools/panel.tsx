/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalHeading as Heading,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	Button,
	Flex,
} from '@wordpress/components';
// TODO: Re-enable when @wordpress/image-cropper is available
// import { useImageCropper } from '@wordpress/image-cropper';
import { useCallback } from '@wordpress/element';
import { __experimentalVStack as VStack } from '@wordpress/components';

// Temporary stub until @wordpress/image-cropper is available
const useImageCropper = () => ( {
	resetState: {
		flip: { horizontal: false, vertical: false },
		rotation: 0,
		zoom: 1,
		aspectRatio: null,
		crop: { x: 0, y: 0, width: 100, height: 100 },
	},
} );
import {
	flipHorizontal as flipHorizontalIcon,
	flipVertical as flipVerticalIcon,
	rotateRight as rotateRightIcon,
	rotateLeft as rotateLeftIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ZoomRange from './zoom/range';
import { AspectRatioSelect } from './aspect-ratio';
import useEditingTools from './use-editing-tools';
import './style.scss';

export default function EditingToolsPanel() {
	const { resetState } = useImageCropper();

	const {
		selectedAspectRatio,
		zoom,
		rotation,
		aspectRatio,
		flip,
		defaultRatios,
		themeRatios,
		imageAspectRatios,
		setZoom,
		setAspectRatio,
		setFlip,
		setRotation,
		setSelectedAspectRatio,
		handleSetRotation,
		handleSetAspectRatio,
		handleReset,
	} = useEditingTools();

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
				label={ __( 'Crop area', 'media-editor' ) }
				resetAll={ () => {
					setZoom( resetState?.zoom ?? 1 );
					setAspectRatio( resetState?.aspectRatio ?? 1 );
					setSelectedAspectRatio( imageAspectRatios[ 0 ] ?? null );
				} }
				panelId={ 'crop-area' }
			>
				<ToolsPanelItem
					hasValue={ () => zoom !== resetState?.zoom }
					label={ __( 'Zoom', 'media-editor' ) }
					onDeselect={ () => setZoom( resetState?.zoom ?? 1 ) }
					isShownByDefault
					panelId={ 'crop-area' }
				>
					<ZoomRange label={ __( 'Zoom', 'media-editor' ) } zoom={ zoom } onChange={ setZoom } />
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () => aspectRatio !== resetState?.aspectRatio }
					label={ __( 'Aspect ratio', 'media-editor' ) }
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
						displayAspectRatioName={ true }
					/>
				</ToolsPanelItem>
			</ToolsPanel>
			<ToolsPanel
				label={ __( 'Position', 'media-editor' ) }
				resetAll={ resetPositionTools }
				panelId={ 'position' }
			>
				<ToolsPanelItem
					hasValue={ () => rotation !== resetState?.rotation }
					label={ __( 'Rotate', 'media-editor' ) }
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
						{ __( 'Rotate', 'media-editor' ) }
					</Heading>
					<Flex direction="row" justify="space-between" gap={ 2 }>
						<Button
							className="next-admin-media-editor__tools-panel-button"
							variant="secondary"
							icon={ rotateLeftIcon }
							label={ __( 'Rotate 90° left', 'media-editor' ) }
							onClick={ () => handleSetRotation( rotation - 90 ) }
						>
							{ __( '90° left', 'media-editor' ) }
						</Button>
						<Button
							className="next-admin-media-editor__tools-panel-button"
							variant="secondary"
							icon={ rotateRightIcon }
							label={ __( 'Rotate 90° right', 'media-editor' ) }
							onClick={ () => handleSetRotation( rotation + 90 ) }
						>
							{ __( '90° right', 'media-editor' ) }
						</Button>
					</Flex>
				</ToolsPanelItem>
				<ToolsPanelItem
					hasValue={ () =>
						flip.horizontal !== resetState?.flip?.horizontal ||
						flip.vertical !== resetState?.flip?.vertical
					}
					label={ __( 'Flip', 'media-editor' ) }
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
						{ __( 'Flip', 'media-editor' ) }
					</Heading>
					<Flex direction="row" justify="space-between" gap={ 2 }>
						<Button
							className="next-admin-media-editor__tools-panel-button"
							variant="secondary"
							icon={ flipHorizontalIcon }
							label={ __( 'Flip horizontal', 'media-editor' ) }
							onClick={ () =>
								setFlip( {
									vertical: flip.vertical,
									horizontal: ! flip.horizontal,
								} )
							}
						>
							{ __( 'Horizontal', 'media-editor' ) }
						</Button>
						<Button
							variant="secondary"
							className="next-admin-media-editor__tools-panel-button"
							icon={ flipVerticalIcon }
							label={ __( 'Flip vertical', 'media-editor' ) }
							onClick={ () =>
								setFlip( {
									vertical: ! flip.vertical,
									horizontal: flip.horizontal,
								} )
							}
						>
							{ __( 'Vertical', 'media-editor' ) }
						</Button>
					</Flex>
				</ToolsPanelItem>
			</ToolsPanel>
			<Flex
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
					{ __( 'Reset all', 'media-editor' ) }
				</Button>
			</Flex>
		</div>
	);
}

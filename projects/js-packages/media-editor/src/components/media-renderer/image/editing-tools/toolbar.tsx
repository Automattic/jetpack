/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Flex } from '@wordpress/components';
import {
	flipHorizontal as flipHorizontalIcon,
	flipVertical as flipVerticalIcon,
	rotateRight as rotateRightIcon,
	rotateLeft as rotateLeftIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import ZoomDropdown from './zoom/dropdown';
import { AspectRatioDropdown } from './aspect-ratio';
import useEditingTools from './use-editing-tools';

export default function EditingToolsToolbar() {
	const {
		selectedAspectRatio,
		zoom,
		rotation,
		flip,
		defaultRatios,
		themeRatios,
		imageAspectRatios,
		setZoom,
		setFlip,
		handleSetRotation,
		handleSetAspectRatio,
		handleReset,
	} = useEditingTools();

	return (
		<Flex
			direction="row"
			gap={ 2 }
			className="next-admin-media-editor__toolbar"
			id="next-admin-media-editor-toolbar"
		>
			<ZoomDropdown label={ __( 'Zoom', 'media-editor' ) } zoom={ zoom } onChange={ setZoom } />
			<AspectRatioDropdown
				className="next-admin-media-editor__tools-panel-dropdown"
				aspectRatio={ selectedAspectRatio }
				onChange={ handleSetAspectRatio }
				imageAspectRatios={ imageAspectRatios }
				defaultRatios={ defaultRatios }
				themeRatios={ themeRatios }
			/>
			<Button
				variant="tertiary"
				label={ __( 'Flip horizontal', 'media-editor' ) }
				icon={ flipHorizontalIcon }
				isSmall
				onClick={ () =>
					setFlip( {
						vertical: flip.vertical,
						horizontal: ! flip.horizontal,
					} )
				}
			/>
			<Button
				variant="tertiary"
				label={ __( 'Flip vertical', 'media-editor' ) }
				icon={ flipVerticalIcon }
				isSmall
				onClick={ () =>
					setFlip( {
						vertical: ! flip.vertical,
						horizontal: flip.horizontal,
					} )
				}
			/>
			<Button
				variant="tertiary"
				icon={ rotateLeftIcon }
				isSmall
				onClick={ () => handleSetRotation( rotation - 90 ) }
				label={ __( 'Rotate 90° left', 'media-editor' ) }
			/>
			<Button
				variant="tertiary"
				icon={ rotateRightIcon }
				isSmall
				label={ __( 'Rotate 90° right', 'media-editor' ) }
				onClick={ () => handleSetRotation( rotation + 90 ) }
			/>
			<Button variant="tertiary" onClick={ handleReset }>
				{ __( 'Reset', 'media-editor' ) }
			</Button>
		</Flex>
	);
}

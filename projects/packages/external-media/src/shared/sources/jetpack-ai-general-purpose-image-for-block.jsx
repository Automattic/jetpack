import {
	GeneralPurposeImage,
	PLACEMENT_BLOCK_PLACEHOLDER_BUTTON,
} from '@automattic/jetpack-ai-client';

/**
 * JetpackAIGeneralPurposeImageForBlock component
 * @param {object}   props          - The component properties.
 * @param {Function} props.onClose  - To handle the close.
 * @param {Function} props.onSelect - To handle the selection of the media.
 * @param {boolean}  props.multiple - Whether to allow multiple selection.
 * @return {import('react').ReactElement} The `JetpackAIGeneralPurposeImageForBlock` component.
 */
function JetpackAIGeneralPurposeImageForBlock( {
	onClose = () => {},
	onSelect,
	multiple = false,
} ) {
	return (
		<GeneralPurposeImage
			placement={ PLACEMENT_BLOCK_PLACEHOLDER_BUTTON }
			onClose={ onClose }
			onSetImage={ image => onSelect( multiple ? [ image ] : image ) }
		/>
	);
}

export default JetpackAIGeneralPurposeImageForBlock;

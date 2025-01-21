import {
	GeneralPurposeImage,
	PLACEMENT_BLOCK_PLACEHOLDER_BUTTON,
} from '@automattic/jetpack-ai-client';

/**
 *
 * @param root0
 * @param root0.onClose
 * @param root0.onSelect
 * @param root0.multiple
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

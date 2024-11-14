import {
	GeneralPurposeImage,
	PLACEMENT_BLOCK_PLACEHOLDER_BUTTON,
} from '../../../plugins/ai-assistant-plugin/components/ai-image';

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

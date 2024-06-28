import {
	GeneralPurposeImage,
	PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from '../../../plugins/ai-assistant-plugin/components/ai-image';

function JetpackAIGeneralPurposeImage( { onClose = () => {}, onSelect, multiple = false } ) {
	return (
		<GeneralPurposeImage
			placement={ PLACEMENT_MEDIA_SOURCE_DROPDOWN }
			onClose={ onClose }
			onSetImage={ image => onSelect( multiple ? [ image ] : image ) }
		/>
	);
}

export default JetpackAIGeneralPurposeImage;

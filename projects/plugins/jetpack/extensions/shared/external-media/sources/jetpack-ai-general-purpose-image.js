import {
	GeneralPurposeImage,
	PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from '../../../plugins/ai-assistant-plugin/components/ai-image';

function JetpackAIGeneralPurposeImage( { onClose = () => {}, onSelect } ) {
	return (
		<GeneralPurposeImage
			placement={ PLACEMENT_MEDIA_SOURCE_DROPDOWN }
			onClose={ onClose }
			onSetImage={ onSelect }
		/>
	);
}

export default JetpackAIGeneralPurposeImage;

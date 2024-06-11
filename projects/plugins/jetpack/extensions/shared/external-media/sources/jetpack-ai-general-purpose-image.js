import {
	GeneralPurposeImage,
	FEATURED_IMAGE_PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from '../../../plugins/ai-assistant-plugin/components/ai-image';

function JetpackAIGeneralPurposeImage( { onClose = () => {} } ) {
	return (
		<GeneralPurposeImage
			placement={ FEATURED_IMAGE_PLACEMENT_MEDIA_SOURCE_DROPDOWN }
			onClose={ onClose }
		/>
	);
}

export default JetpackAIGeneralPurposeImage;

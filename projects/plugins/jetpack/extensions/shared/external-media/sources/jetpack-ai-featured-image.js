import {
	FeaturedImage,
	PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from '../../../plugins/ai-assistant-plugin/components/ai-image';

function JetpackAIFeaturedImage( { onClose = () => {} } ) {
	return <FeaturedImage placement={ PLACEMENT_MEDIA_SOURCE_DROPDOWN } onClose={ onClose } />;
}

export default JetpackAIFeaturedImage;

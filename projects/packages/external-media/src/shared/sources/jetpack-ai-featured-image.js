import { FeaturedImage, PLACEMENT_MEDIA_SOURCE_DROPDOWN } from '@automattic/jetpack-ai-client';

/**
 *
 * @param root0
 * @param root0.onClose
 */
function JetpackAIFeaturedImage( { onClose = () => {} } ) {
	return <FeaturedImage placement={ PLACEMENT_MEDIA_SOURCE_DROPDOWN } onClose={ onClose } />;
}

export default JetpackAIFeaturedImage;

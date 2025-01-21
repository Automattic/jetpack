import {
	GeneralPurposeImage,
	PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from '@automattic/jetpack-ai-client';

/**
 *
 * @param root0
 * @param root0.onClose
 * @param root0.onSelect
 * @param root0.multiple
 */
function JetpackAIGeneralPurposeImageForMediaSource( {
	onClose = () => {},
	onSelect,
	multiple = false,
} ) {
	return (
		<GeneralPurposeImage
			placement={ PLACEMENT_MEDIA_SOURCE_DROPDOWN }
			onClose={ onClose }
			onSetImage={ image => onSelect( multiple ? [ image ] : image ) }
		/>
	);
}

export default JetpackAIGeneralPurposeImageForMediaSource;

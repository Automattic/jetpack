import {
	GeneralPurposeImage,
	PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from '@automattic/jetpack-ai-client';

/**
 * JetpackAIGeneralPurposeImageForMediaSource component
 * @param {object}   props          - The component properties.
 * @param {Function} props.onClose  - To handle the close.
 * @param {Function} props.onSelect - To handle the selection of the media.
 * @param {boolean}  props.multiple - Whether to allow multiple selection.
 * @return {import('react').ReactElement} The `JetpackAIGeneralPurposeImageForMediaSource` component.
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

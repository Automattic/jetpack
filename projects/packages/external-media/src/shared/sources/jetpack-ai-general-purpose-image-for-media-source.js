import {
	GeneralPurposeImage,
	PLACEMENT_MEDIA_SOURCE_DROPDOWN,
} from '@automattic/jetpack-ai-client';
import React from 'react';

/**
 * JetpackAIGeneralPurposeImageForMediaSource component
 * @param {object}   props          - The component properties.
 * @param {Function} props.onClose  - To handle the close.
 * @param {Function} props.onSelect - To handle the selection of the media.
 * @param {boolean}  props.multiple - Whether to allow multiple selection.
 * @return {React.ReactElement} The `JetpackAIGeneralPurposeImageForMediaSource` component.
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

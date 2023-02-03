import React, { useState } from 'react';
import VideopressUploader from './components/videopress-uploader';

/**
 * VideoPress block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected     - Whether the block is selected.
 * @param {string} props.clientId        - Block client ID.
 * @returns {React.ReactNode}            - React component.
 */
export default function VideoPressEdit({
	attributes,
	setAttributes,
	isSelected,
	clientId,
}): React.ReactNode {
	const [fileToUpload, setFileToUpload] = useState(null);
	return (
		<VideopressUploader
			setAttributes={setAttributes}
			attributes={attributes}
		/>
	)
}

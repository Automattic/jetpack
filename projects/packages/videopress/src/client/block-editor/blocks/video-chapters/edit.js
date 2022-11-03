// Disabling temporarily
/* eslint-disable no-unused-vars */

/**
 * WordPress dependencies
 */
import { BlockIcon, useBlockProps } from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { formatListNumbered as ChaptersIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { description, title } from '.';

import './editor.scss';

/**
 * VideoPress Chapters block Edit react components
 *
 * @param {object} props                 - Component props.
 * @param {object} props.attributes      - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @param {boolean} props.isSelected     - Whether the block is selected.
 * @param {string} props.clientId        - Block client ID.
 * @returns {object}                     - React component.
 */
export default function VideoPressChaptersEdit( {
	attributes,
	setAttributes,
	isSelected,
	clientId,
} ) {
	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-videopress-chapters',
	} );

	return (
		<div { ...blockProps }>
			<Placeholder
				icon={ <BlockIcon icon={ ChaptersIcon } /> }
				instructions={ description }
				label={ title }
			>
				<div />
			</Placeholder>
		</div>
	);
}

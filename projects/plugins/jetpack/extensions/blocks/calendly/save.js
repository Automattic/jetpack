/* eslint-disable wpcalypso/import-docblock, jsdoc/require-jsdoc */
/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save() {
	return (
		<div>
			<InnerBlocks.Content />
		</div>
	);
}

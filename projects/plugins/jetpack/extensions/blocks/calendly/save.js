/* eslint-disable jsdoc/require-jsdoc */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save() {
	return (
		<div>
			<InnerBlocks.Content />
		</div>
	);
}

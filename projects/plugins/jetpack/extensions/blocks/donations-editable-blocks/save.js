/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function Save() {
	return (
		<div className="wp-block-jetpack-donations">
			<InnerBlocks.Content />
		</div>
	);
}

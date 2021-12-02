/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function Save() {
	return (
		<div className="wp-block-premium-content-container">
			<InnerBlocks.Content />
		</div>
	);
}

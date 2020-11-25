/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Block Save function
 */
export default function Save() {
	return (
		<div className="wp-block-premium-content-subscriber-view entry-content">
			<InnerBlocks.Content />
		</div>
	);
}

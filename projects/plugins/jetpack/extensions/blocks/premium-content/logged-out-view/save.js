/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Block Save function
 *
 * @returns {string} HTML markup.
 */
export default function Save() {
	return (
		<div className="wp-block-premium-content-logged-out-view entry-content">
			<InnerBlocks.Content />
		</div>
	);
}

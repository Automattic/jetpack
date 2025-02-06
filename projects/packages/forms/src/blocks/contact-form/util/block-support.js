import { hasBlockSupport } from '@wordpress/blocks';

/**
 * Check if Gutenberg supports splitting paragraphs.
 *
 * @return {boolean} Whether Gutenberg supports splitting paragraphs.
 */
export function supportsParagraphSplitting() {
	return hasBlockSupport( 'core/paragraph', 'splitting', false );
}

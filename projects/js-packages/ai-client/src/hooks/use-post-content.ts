/**
 * External dependencies
 */
import { serialize } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
/**
 * Types
 */
import { renderMarkdownFromHTML } from '../libs/markdown/index.js';
import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors.js';
/**
 * Internal dependencies
 */

/*
 * Simple helper to get the post content as markdown
 */
const usePostContent = () => {
	const blocks = useSelect(
		select => ( select( 'core/block-editor' ) as typeof BlockEditorSelectors ).getBlocks(),
		[]
	);

	return blocks?.length ? renderMarkdownFromHTML( { content: serialize( blocks ) } ) : '';
};

export default usePostContent;

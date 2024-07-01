/**
 * External dependencies
 */
import { renderMarkdownFromHTML } from '@automattic/jetpack-ai-client';
import { serialize } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
/**
 * Types
 */
import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors';

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

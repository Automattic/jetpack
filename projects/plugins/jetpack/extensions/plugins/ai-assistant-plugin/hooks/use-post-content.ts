/**
 * External dependencies
 */
import { serialize } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import TurndownService from 'turndown';
/**
 * Types
 */
import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors';

// Turndown instance
const turndownService = new TurndownService();

/*
 * Simple helper to get the post content as markdown
 */
const usePostContent = () => {
	const blocks = useSelect(
		select => ( select( 'core/block-editor' ) as typeof BlockEditorSelectors ).getBlocks(),
		[]
	);

	return blocks?.length ? turndownService.turndown( serialize( blocks ) ) : '';
};

export default usePostContent;

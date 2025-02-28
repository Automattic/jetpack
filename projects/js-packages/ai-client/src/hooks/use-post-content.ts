/**
 * External dependencies
 */
import { serialize } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { renderMarkdownFromHTML } from '../libs/markdown/index.js';

/*
 * Simple helper to get the post content as markdown
 */
const usePostContent = () => {
	const { getBlocks, isEditedPostEmpty } = useSelect( select => {
		const blockEditorSelect = select( editorStore );

		return {
			getBlocks: blockEditorSelect.getBlocks,
			isEditedPostEmpty: blockEditorSelect.isEditedPostEmpty,
		};
	}, [] );

	const getPostContent = useCallback( () => {
		const blocks = getBlocks();

		return blocks?.length ? renderMarkdownFromHTML( { content: serialize( blocks ) } ) : '';
	}, [ getBlocks ] );

	return { getPostContent, isEditedPostEmpty };
};

export default usePostContent;

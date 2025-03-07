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
/**
 * Types
 */
import type * as BlockEditorSelectors from '@wordpress/block-editor/store/selectors.js';

/*
 * Simple helper to get the post content as markdown
 */
const usePostContent = () => {
	const { getBlocks, isEditedPostEmpty } = useSelect( select => {
		const blockEditorSelect = select( 'core/block-editor' ) as typeof BlockEditorSelectors;
		const coreEditorSelect = select( editorStore );

		return {
			getBlocks: blockEditorSelect.getBlocks,
			isEditedPostEmpty: coreEditorSelect.isEditedPostEmpty,
		};
	}, [] );

	const getPostContent = useCallback(
		( preprocess?: ( serialized: string ) => string ) => {
			const blocks = getBlocks();

			if ( blocks.length === 0 ) {
				return '';
			}

			let serialized = serialize( blocks );

			if ( preprocess && typeof preprocess === 'function' ) {
				serialized = preprocess( serialized );
			}

			return serialized ? renderMarkdownFromHTML( { content: serialized } ) : '';
		},
		[ getBlocks ]
	);

	return { getPostContent, isEditedPostEmpty };
};

export default usePostContent;

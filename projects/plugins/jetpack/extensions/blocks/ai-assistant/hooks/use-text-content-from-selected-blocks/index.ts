/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { getBlockTextContent } from '../../lib/utils/block-content';
/*
 * Types
 */
import type { BlockEditorStore } from '../../types';

type GetTextContentFromBlocksProps = {
	count: number;
	clientIds: string[];
	content: string;
};

const HTML_JOIN_CHARACTERS = '<br />';

/**
 * Returns the text content from all selected blocks.
 *
 * @returns {GetTextContentFromBlocksProps} The text content.
 */

export default function useTextContentFromSelectedBlocks(): GetTextContentFromBlocksProps {
	const clientIds = useSelect(
		selectFromHook =>
			(
				selectFromHook( 'core/block-editor' ) as BlockEditorStore[ 'selectors' ]
			 ).getSelectedBlockClientIds(),
		[]
	);

	const blocks = useSelect(
		selectFromHook =>
			(
				selectFromHook( 'core/block-editor' ) as BlockEditorStore[ 'selectors' ]
			 ).getBlocksByClientId( clientIds ),
		[ clientIds ]
	);

	const defaultContent = {
		count: 0,
		clientIds: [],
		content: '',
	};

	if ( ! clientIds?.length ) {
		return defaultContent;
	}

	if ( ! blocks?.length ) {
		return defaultContent;
	}

	return {
		count: blocks.length,
		clientIds,
		content: blocks
			? blocks
					.filter( block => block !== null && block !== undefined ) // Safeguard against null or undefined blocks
					.map( block => getBlockTextContent( block.clientId ) )
					.join( HTML_JOIN_CHARACTERS )
			: '',
	};
}

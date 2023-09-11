/**
 * Internal dependencies
 */
import { getBlockTextContent } from '../../lib/utils/block-content';
import useSelectedBlocks from '../use-selected-blocks';
/*
 * Types
 */
import type { GetSelectedBlocksProps } from '../use-selected-blocks';

type GetTextContentFromBlocksProps = GetSelectedBlocksProps & {
	content: string;
};

/**
 * Returns the text content from all selected blocks.
 *
 * @returns {GetTextContentFromBlocksProps} The text content.
 */

export default function useTextContentFromSelectedBlocks(): GetTextContentFromBlocksProps {
	const selected = useSelectedBlocks();

	return {
		...selected,
		content: selected.blocks
			? selected.blocks
					.filter( block => block != null ) // Safeguard against null or undefined blocks
					.map( block => getBlockTextContent( block.clientId ) )
					.join( '\n\n' )
			: '',
	};
}

/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/*
 * Types
 */
import type { BlockEditorStore } from '../../types';

export type ExtendedBlockProps = {
	clientId: string;
	attributes: object;
};

export type GetSelectedBlocksProps = {
	count: number;
	clientIds: string[];
	blocks: Array< ExtendedBlockProps >;
};

/**
 * Returns all selected blocks.
 *
 * @returns {GetSelectedBlocksProps} The text content.
 */

export default function useSelectedBlocks(): GetSelectedBlocksProps {
	const clientIds = useSelect(
		select =>
			(
				select( 'core/block-editor' ) as BlockEditorStore[ 'selectors' ]
			 ).getSelectedBlockClientIds(),
		[]
	);

	const blocks = useSelect(
		select =>
			( select( 'core/block-editor' ) as BlockEditorStore[ 'selectors' ] ).getBlocksByClientId(
				clientIds
			),
		[ clientIds ]
	);

	const defaltValue = {
		count: 0,
		clientIds: [],
		blocks: [],
	};

	if ( ! clientIds?.length || ! blocks?.length ) {
		return defaltValue;
	}

	return {
		count: blocks.length,
		clientIds,
		blocks,
	};
}

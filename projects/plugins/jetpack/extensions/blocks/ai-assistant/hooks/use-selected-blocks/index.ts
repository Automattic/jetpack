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
	name: string;
	attributes: object;
	innerBlocks: Array< ExtendedBlockProps >;
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

	const defaultValue = {
		count: 0,
		clientIds: [],
		blocks: [],
	};

	if ( ! clientIds?.length || ! blocks?.length ) {
		return defaultValue;
	}

	return {
		count: blocks.length,
		clientIds,
		blocks,
	};
}

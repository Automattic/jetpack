/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import { EXTENDED_BLOCKS, isPossibleToExtendBlock } from '../extensions/ai-assistant';

const transformFromCoreEmbed = {
	type: 'block',
	blocks: EXTENDED_BLOCKS,
	isMatch: () => isPossibleToExtendBlock(),
	transform: ( { content } ) => {
		return createBlock( blockName, { content } );
	},
};

const from = [ transformFromCoreEmbed ];

export default { from };

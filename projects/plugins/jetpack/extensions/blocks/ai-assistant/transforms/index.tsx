/**
 * External dependencies
 */
import { createBlock } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
import { blockName } from '..';
import { EXTENDED_BLOCKS } from '../extensions/ai-assistant';

const transformFromCoreEmbed = {
	type: 'block',
	blocks: EXTENDED_BLOCKS,
	transform: ( { content } ) => {
		return createBlock( blockName, { content } );
	},
};

const from = [ transformFromCoreEmbed ];

export default { from };

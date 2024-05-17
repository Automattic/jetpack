/**
 * External dependencies
 */
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { BlockHandler } from './block-handler';
import { HeadingHandler } from './heading';
/**
 * Types
 */
import type { IBlockHandler } from './types';
import type { ExtendedInlineBlockProp } from '../extensions/ai-assistant';

const debug = debugFactory( 'jetpack-ai-assistant:extensions:get-block-handler' );

const handlers = {
	'core/heading': HeadingHandler,
};

/**
 * Gets the block handler based on the block type.
 * The block handler is used to handle the request suggestions.
 * @param {ExtendedInlineBlockProp} blockType - The block type.
 * @param {string} clientId                   - The block client ID.
 * @returns {IBlockHandler}                     The block handler.
 */
export function getBlockHandler(
	blockType: ExtendedInlineBlockProp,
	clientId: string
): IBlockHandler {
	let HandlerClass = handlers[ blockType ];

	if ( ! HandlerClass ) {
		debug( `No handler found for block type: ${ blockType }. Using default handler.` );
		HandlerClass = BlockHandler;
	}

	const handler = new HandlerClass( clientId );

	return {
		onSuggestion: handler.onSuggestion.bind( handler ),
		onDone: handler.onDone.bind( handler ),
		getContent: handler.getContent.bind( handler ),
	};
}

/**
 * Internal dependencies
 */
import { HeadingHandler } from './heading';
/**
 * Types
 */
import type { IBlockHandler } from './types';
import type { ExtendedInlineBlockProp } from '../extensions/ai-assistant';

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
export function blockHandler(
	blockType: ExtendedInlineBlockProp,
	clientId: string
): IBlockHandler {
	const HandlerClass = handlers[ blockType ];

	if ( ! HandlerClass ) {
		throw new Error( `No handler found for block type: ${ blockType }` );
	}

	const handler = new HandlerClass( clientId );

	return {
		onSuggestion: handler.onSuggestion.bind( handler ),
		getContent: handler.getContent.bind( handler ),
	};
}

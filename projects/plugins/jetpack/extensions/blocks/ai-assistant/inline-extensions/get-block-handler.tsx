/**
 * External dependencies
 */
import { createContext } from '@wordpress/element';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import {
	JETPACK_FORM_CHILDREN_BLOCKS,
	type ExtendedInlineBlockProp,
} from '../extensions/ai-assistant';
import { BlockHandler } from './block-handler';
import { HeadingHandler } from './heading';
import { JetpackFormHandler, JetpackChildrenFormHandler } from './jetpack-form';
import { ListHandler } from './list';
import { ListItemHandler } from './list-item';
import { ParagraphHandler } from './paragraph';
/**
 * Types
 */
import type { IBlockHandler } from './types';

const debug = debugFactory( 'jetpack-ai-assistant:extensions:get-block-handler' );

const handlers = {
	'core/heading': HeadingHandler,
	'core/paragraph': ParagraphHandler,
	'core/list-item': ListItemHandler,
	'core/list': ListHandler,
	'jetpack/contact-form': JetpackFormHandler,
	...JETPACK_FORM_CHILDREN_BLOCKS.reduce(
		( acc, blockType ) => ( {
			...acc,
			[ blockType ]: JetpackChildrenFormHandler,
		} ),
		{}
	),
};

export const InlineExtensionsContext = createContext( {} );

/**
 * Gets the block handler based on the block type.
 * The block handler is used to handle the request suggestions.
 * @param {ExtendedInlineBlockProp} blockType - The block type.
 * @param {string}                  clientId  - The block client ID.
 * @return {IBlockHandler}                     The block handler.
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
		behavior: handler.behavior,
		isChildBlock: handler.isChildBlock,
		feature: handler.feature,
		adjustPosition: handler.adjustPosition,
		startOpen: handler.startOpen,
		hideOnBlockFocus: handler.hideOnBlockFocus,
	};
}

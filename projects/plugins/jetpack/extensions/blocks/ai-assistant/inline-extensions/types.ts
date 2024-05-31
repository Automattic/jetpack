/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
/**
 * Types
 */
import type { Block } from '@automattic/jetpack-ai-client';

export type OnSuggestion = ( suggestion: string ) => void;

type CustomBlockBehavior = ( { onToggle, onAskAiAssistant, context } ) => void;
export type BlockBehavior = 'dropdown' | 'action' | CustomBlockBehavior;

export interface IBlockHandler {
	onSuggestion: OnSuggestion;
	onDone: ( suggestion: string ) => void;
	getContent: () => string;
	behavior: BlockBehavior;
	isChildBlock?: boolean;
}

export type BlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
};

const blockEditorDispatch = dispatch( 'core/block-editor' );

export type BlockEditorDispatch = typeof blockEditorDispatch & {
	__unstableMarkNextChangeAsNotPersistent: () => void;
};

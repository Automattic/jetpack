/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
/**
 * Types
 */
import type { Block } from '@automattic/jetpack-ai-client';

export type OnSuggestion = ( suggestion: string ) => void;

export type BlockBehavior = 'dropdown' | 'action';

export interface IBlockHandler {
	onSuggestion: OnSuggestion;
	onDone: () => void;
	getContent: () => string;
	behavior: BlockBehavior;
}

export type BlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
};

const blockEditorDispatch = dispatch( 'core/block-editor' );

export type BlockEditorDispatch = typeof blockEditorDispatch & {
	__unstableMarkNextChangeAsNotPersistent: () => void;
};

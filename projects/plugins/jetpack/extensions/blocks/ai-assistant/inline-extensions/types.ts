/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
/**
 * Types
 */
import type { Block } from '@automattic/jetpack-ai-client';

export type OnSuggestion = ( suggestion: string ) => void;

export interface IBlockHandler {
	onSuggestion: OnSuggestion;
	getContent: () => string;
}

export type BlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
};

const blockEditorDispatch = dispatch( 'core/block-editor' );

export type BlockEditorDispatch = typeof blockEditorDispatch & {
	__unstableMarkNextChangeAsNotPersistent: () => void;
};

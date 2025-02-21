/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
/**
 * Types
 */
import type { BlockBehavior, OnSuggestion } from '../types';
import type { Block } from '@automattic/jetpack-ai-client';

export interface IBlockHandler {
	onSuggestion: OnSuggestion;
	onDone: ( suggestion: string ) => void;
	getContent: () => string;
	getExtensionInputPlaceholder: () => string | null;
	behavior: BlockBehavior;
	isChildBlock?: boolean;
	feature: string;
	adjustPosition?: boolean;
	startOpen?: boolean;
	hideOnBlockFocus?: boolean;
}

export type BlockEditorSelect = {
	getBlock: ( clientId: string ) => Block;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- @todo Once `@wordpress/block-editor` has types, see if we can get rid of `BlockEditorSelect` and `BlockEditorDispatch` entirely.
const blockEditorDispatch = dispatch( 'core/block-editor' );

export type BlockEditorDispatch = typeof blockEditorDispatch & {
	__unstableMarkNextChangeAsNotPersistent: () => void;
};

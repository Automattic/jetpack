/**
 * External dependencies
 */
import type { BlockBehavior, OnSuggestion } from '../types';
import type { BlockEditorActions, BlockEditorSelectors } from '@automattic/jetpack-ai-client';

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
	supports?: Record< string, number >;
}

export type BlockEditorSelect = BlockEditorSelectors;
export type BlockEditorDispatch = BlockEditorActions;

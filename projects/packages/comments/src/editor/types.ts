import type { EditorLabels } from '../shared/types';
import type { Block, BlockEditProps } from '@wordpress/blocks';
import type { DropdownMenu } from '@wordpress/components';
import type { ComponentProps, ReactNode } from 'react';

export type EditorProps = {
	initialContent: string;
	/** The editor's own strings, translated in PHP. */
	labels: EditorLabels;
	/** The caret's offset into the text, or -1 for the end. Left out, the editor takes no focus. */
	focus?: () => number;
	placeholder: string;
	/** Fetch and draw provider previews. Off on the edit-comment screen, where the URL is enough. */
	previewEmbeds?: boolean;
	onChange: ( content: string ) => void;
	/** The editor broke; the caller brings its textarea back. */
	onError: ( error: unknown ) => void;
};

export type BoundaryProps = { onError: ( error: unknown ) => void; children: ReactNode };

export type WritingAreaProps = { undo: () => void; redo: () => void; children: ReactNode };

export type IconType = ComponentProps< typeof DropdownMenu >[ 'icon' ];

export type EmbedAttributes = { url?: string };

/** What the preview route answers: core's proxy shape, less the scripts it never fills. */
export type EmbedPreview = { html?: string };

/** What a lookup settled on: data, a URL the site will not embed, or a failure worth retrying. */
export type EmbedLookup = EmbedPreview | 'unsupported' | null;

export type EmbedEditProps = BlockEditProps< EmbedAttributes > & {
	onReplace: ( blocks: Block | Block[] ) => void;
};

type HistoryStep = { blocks: Block[]; markup: string };

export type History = {
	past: HistoryStep[];
	present: HistoryStep;
	future: HistoryStep[];
	/** When the present step last changed; 0 after an undo or redo. */
	editedAt: number;
};

export type HistoryAction =
	{ type: 'edit'; blocks: Block[]; at: number } | { type: 'undo' } | { type: 'redo' };

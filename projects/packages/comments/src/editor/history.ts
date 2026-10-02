import { serialize, type Block } from '@wordpress/blocks';

type Step = { blocks: Block[]; markup: string };
type History = {
	past: Step[];
	present: Step;
	future: Step[];
	/** When the present step last changed; 0 after an undo or redo. */
	editedAt: number;
};
type HistoryAction =
	{ type: 'edit'; blocks: Block[]; at: number } | { type: 'undo' } | { type: 'redo' };

/**
 * Which blocks there are, at every depth: typing keeps it, a new or removed block does not.
 *
 * @param blocks - Blocks.
 * @return Their shape.
 */
const shape = ( blocks: Block[] ): string =>
	blocks.map( block => `${ block.clientId }(${ shape( block.innerBlocks ) })` ).join();

/**
 * The comment's undo history: the post editor's lives outside the block editor. A burst
 * of edits to the same blocks is one step; a new block or a pause starts the next.
 *
 * @param state  - History so far.
 * @param action - What happened.
 * @return The history after it.
 */
export const history = ( state: History, action: HistoryAction ): History => {
	const { past, present, future, editedAt } = state;

	if ( action.type === 'undo' ) {
		return past.length
			? {
					past: past.slice( 0, -1 ),
					present: past.at( -1 )!,
					future: [ present, ...future ],
					editedAt: 0,
				}
			: state;
	}

	if ( action.type === 'redo' ) {
		return future.length
			? { past: [ ...past, present ], present: future[ 0 ], future: future.slice( 1 ), editedAt: 0 }
			: state;
	}

	// The one serialize an edit costs. Unchanged markup is a selection move, or the editor
	// handing back what an undo restored; recording either would drop the redo steps.
	const markup = serialize( action.blocks );
	if ( markup === present.markup ) {
		return state;
	}

	const extendsStep =
		action.at - editedAt < 1000 && shape( action.blocks ) === shape( present.blocks );

	return {
		// A comment needs no more than 100 steps.
		past: extendsStep ? past : [ ...past, present ].slice( -100 ),
		present: { blocks: action.blocks, markup },
		future: [],
		editedAt: action.at,
	};
};

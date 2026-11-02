import { serialize } from '@wordpress/blocks';
import type { History, HistoryAction } from './types';

/**
 * The comment's undo history: the post editor's lives outside the block editor. A step
 * starts where the block editor marks a change persistent, as the post editor's does: a
 * new block, a pause in typing, or just before a shortcut such as "- " converts the text.
 *
 * @param state  - History so far.
 * @param action - What happened.
 * @return The history after it.
 */
export const history = ( state: History, action: HistoryAction ): History => {
	const { past, present, future } = state;

	if ( action.type === 'undo' ) {
		return past.length
			? { past: past.slice( 0, -1 ), present: past.at( -1 )!, future: [ present, ...future ] }
			: state;
	}

	if ( action.type === 'redo' ) {
		return future.length
			? { past: [ ...past, present ], present: future[ 0 ], future: future.slice( 1 ) }
			: state;
	}

	// The one serialize an edit costs. Unchanged markup is a selection move, or the editor
	// handing back what an undo restored; recording either would drop the redo steps.
	const markup = serialize( action.blocks );
	if ( markup === present.markup ) {
		return state;
	}

	return {
		// A comment needs no more than 100 steps.
		past: action.persistent ? [ ...past, present ].slice( -100 ) : past,
		present: { blocks: action.blocks, markup, selection: action.selection },
		future: [],
	};
};

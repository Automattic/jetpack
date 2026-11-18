import { useCallback, useReducer } from 'react';
import { flowReducer, getFlowEvent, getInitialFlowState, getOption } from './steps';
import type {
	FlowAction,
	FlowContext,
	FlowState,
	IdentityCrisisFlowEvent,
	Option,
	OptionId,
} from './steps';

export interface IdentityCrisisFlow {
	state: FlowState;
	/** The selected answer of the current step. */
	selected: Option | null;
	/** No answer has moved the flow on yet, so the intro shows. */
	isFirstView: boolean;
	pick: ( option: OptionId ) => void;
	next: () => void;
	back: () => void;
	restart: () => void;
}

/**
 * Where the user is in the Safe Mode questions.
 *
 * @param ctx        - The flow context.
 * @param clearError - Forgets the last failed action, which no longer matches once the flow changes.
 * @param onEvent    - Receives each Next and Back, for the question events.
 * @return The flow state and its changes.
 */
export default function useIdentityCrisisFlow(
	ctx: FlowContext,
	clearError: () => void,
	onEvent: ( event: IdentityCrisisFlowEvent ) => void
): IdentityCrisisFlow {
	const [ state, dispatch ] = useReducer( flowReducer, ctx, getInitialFlowState );

	// Only user input calls this, so `state` is the one each change starts from, and a render sends nothing.
	const change = useCallback(
		( action: FlowAction ) => {
			const event = getFlowEvent( state, action, ctx );
			if ( event ) {
				onEvent( event );
			}
			clearError();
			dispatch( action );
		},
		[ state, ctx, clearError, onEvent ]
	);

	return {
		state,
		selected: getOption( state.step, state.pick ),
		isFirstView: state.entry === 'main' && state.history.length === 0,
		pick: useCallback( option => change( { type: 'pick', option } ), [ change ] ),
		next: useCallback( () => change( { type: 'next' } ), [ change ] ),
		back: useCallback( () => change( { type: 'back' } ), [ change ] ),
		restart: useCallback( () => change( { type: 'restart', ctx } ), [ change, ctx ] ),
	};
}

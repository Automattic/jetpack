import { useCallback, useReducer } from 'react';
import { flowReducer, getInitialFlowState, getOption } from './steps';
import type { FlowAction, FlowContext, FlowState, Option, OptionId } from './steps';

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
 * @return The flow state and its changes.
 */
export default function useIdentityCrisisFlow(
	ctx: FlowContext,
	clearError: () => void
): IdentityCrisisFlow {
	const [ state, dispatch ] = useReducer( flowReducer, ctx, getInitialFlowState );

	const change = useCallback(
		( action: FlowAction ) => {
			clearError();
			dispatch( action );
		},
		[ clearError ]
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

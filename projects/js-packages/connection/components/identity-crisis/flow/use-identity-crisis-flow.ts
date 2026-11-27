import { useCallback, useReducer } from 'react';
import { flowReducer, getFlowEvents, getInitialFlowState, getOption } from './steps';
import type {
	FlowAction,
	FlowContext,
	FlowState,
	GuideAnswerId,
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
	/** Returns to an earlier step, by its place in `state.history`. */
	backTo: ( index: number ) => void;
	restart: () => void;
	openGuide: () => void;
	/** Answers a guide question, which moves on straight away. */
	answer: ( answer: GuideAnswerId ) => void;
	/** "Stay in Safe Mode for now" from the guide. */
	later: () => void;
}

/**
 * Where the user is in the Safe Mode questions and the step-by-step guide.
 *
 * @param ctx        - The flow context.
 * @param clearError - Forgets the last failed action, which no longer matches once the flow changes.
 * @param onEvent    - Receives each Safe Mode event a change sends.
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
			for ( const event of getFlowEvents( state, action, ctx ) ) {
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
		backTo: useCallback( index => change( { type: 'back-to', index } ), [ change ] ),
		restart: useCallback( () => change( { type: 'restart', ctx } ), [ change, ctx ] ),
		openGuide: useCallback( () => change( { type: 'open-guide' } ), [ change ] ),
		answer: useCallback( answer => change( { type: 'answer', answer } ), [ change ] ),
		later: useCallback( () => change( { type: 'later' } ), [ change ] ),
	};
}

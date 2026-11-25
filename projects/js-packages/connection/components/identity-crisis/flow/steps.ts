import type { IdentityCrisisAction } from '../../../hooks/use-identity-crisis-actions/types';

/** A question in the Safe Mode flow. */
export type ChoiceStepId = 'main' | 'copy' | 'replaced';

/** A step that explains a result and offers one action, without a question. */
export type ResultStepId = 'two-addresses';

export type StepId = ChoiceStepId | ResultStepId;

/** An answer to a question, named the same as in the `jetpack_idc_*` events' `path`. */
export type OptionId =
	'same' | 'old' | 'original' | 'copyof' | 'safe' | 'fresh' | 'yes' | 'no' | 'unsure';

/** What the flow knows about the site, built once from the Safe Mode state. */
export interface FlowContext {
	isDevelopmentSite: boolean;
	possibleDynamicSiteUrlDetected: boolean;
	/** A WooCommerce-family plugin is connected. */
	isStore: boolean;
	/** A Jetpack-family plugin is connected. */
	hasJetpackPlugin: boolean;
}

/** An answer that either asks the next question or runs an action. */
export type Option = {
	id: OptionId;
	/** Leave out to always offer it. */
	isAvailable?: ( ctx: FlowContext ) => boolean;
} & ( { next: StepId } | { action: IdentityCrisisAction } );

/** Where the flow is. `entry` leaves room for the step-by-step guide (CONNECT-625). */
export interface FlowState {
	entry: 'main' | 'guide';
	step: StepId;
	pick: OptionId | null;
	/** The earlier steps and their answers, oldest first. */
	history: Array< { step: StepId; pick: OptionId } >;
}

/** A change of the flow, as the Safe Mode events describe it. */
export type IdentityCrisisFlowEvent =
	| { type: 'answer'; question: StepId; answer: OptionId }
	| { type: 'back'; to: StepId }
	| { type: 'support'; step: StepId; path: string };

// The copy for each option and result lives in `copy.tsx`, looked up by its id.
const CHOICE_STEPS: Readonly< Record< ChoiceStepId, readonly Option[] > > = {
	main: [
		{
			id: 'same',
			next: 'two-addresses',
			isAvailable: ctx => ctx.possibleDynamicSiteUrlDetected,
		},
		{ id: 'old', action: 'migrate' },
		{ id: 'original', next: 'copy' },
		{ id: 'copyof', next: 'replaced' },
	],
	copy: [
		{ id: 'safe', action: 'confirm-safe-mode' },
		{ id: 'fresh', action: 'start-fresh' },
	],
	replaced: [
		{ id: 'yes', action: 'start-fresh' },
		{ id: 'no', action: 'migrate' },
		{ id: 'unsure', action: 'confirm-safe-mode' },
	],
};

// The step-by-step guide reaches these too.
const RESULT_STEPS: Readonly< Record< ResultStepId, IdentityCrisisAction > > = {
	'two-addresses': 'confirm-safe-mode',
};

/**
 * Whether a step asks a question, rather than showing a result.
 *
 * @param step - The step.
 * @return True for a question.
 */
export function isChoiceStep( step: StepId ): step is ChoiceStepId {
	return Object.hasOwn( CHOICE_STEPS, step );
}

/**
 * The one action a result step offers.
 *
 * @param step - The result step.
 * @return The action.
 */
export function getResultAction( step: ResultStepId ): IdentityCrisisAction {
	return RESULT_STEPS[ step ];
}

/**
 * Where the flow starts: WordPress already says a staging or development site is a copy.
 *
 * @param ctx - The flow context.
 * @return The first step and its preselected answer.
 */
export function getHomeStep( ctx: FlowContext ): Pick< FlowState, 'step' | 'pick' > {
	return ctx.isDevelopmentSite ? { step: 'copy', pick: 'safe' } : { step: 'main', pick: null };
}

/**
 * The answers a step offers this site.
 *
 * @param step - The step.
 * @param ctx  - The flow context.
 * @return The available options, in order.
 */
export function getOptions( step: ChoiceStepId, ctx: FlowContext ): Option[] {
	return CHOICE_STEPS[ step ].filter( option => ! option.isAvailable || option.isAvailable( ctx ) );
}

/**
 * Finds an answer of a step.
 *
 * @param step - The step.
 * @param id   - The answer, if any.
 * @return The option, or null when the step has no such answer or is a result.
 */
export function getOption( step: StepId, id: OptionId | null ): Option | null {
	if ( ! isChoiceStep( step ) ) {
		return null;
	}
	return CHOICE_STEPS[ step ].find( option => option.id === id ) ?? null;
}

/** A change to the flow; every change goes through `flowReducer()`. */
export type FlowAction =
	| { type: 'pick'; option: OptionId }
	| { type: 'next' }
	| { type: 'back' }
	| { type: 'restart'; ctx: FlowContext };

/**
 * The flow before any answer.
 *
 * @param ctx - The flow context.
 * @return The state.
 */
export function getInitialFlowState( ctx: FlowContext ): FlowState {
	return { entry: 'main', ...getHomeStep( ctx ), history: [] };
}

/**
 * Applies a change to the flow.
 *
 * @param state  - The flow state.
 * @param action - The change.
 * @return The new state; the same object when the change does not apply.
 */
export function flowReducer( state: FlowState, action: FlowAction ): FlowState {
	switch ( action.type ) {
		case 'pick':
			return getOption( state.step, action.option ) ? { ...state, pick: action.option } : state;
		case 'next': {
			const option = getOption( state.step, state.pick );
			if ( ! option || ! ( 'next' in option ) ) {
				return state;
			}
			return {
				...state,
				step: option.next,
				pick: null,
				history: [ ...state.history, { step: state.step, pick: option.id } ],
			};
		}
		case 'back': {
			const previous = state.history.at( -1 );
			if ( ! previous ) {
				return state;
			}
			return { ...state, ...previous, history: state.history.slice( 0, -1 ) };
		}
		case 'restart':
			return getInitialFlowState( action.ctx );
		default: {
			const unhandled: never = action;
			return unhandled;
		}
	}
}

/**
 * The answers so far, joined by `>`, for the `jetpack_idc_*` events' `path`.
 *
 * @param state - The flow state.
 * @param ctx   - The flow context.
 * @return E.g. `original>safe`, `same` or `detected_copy>fresh`; `none` before any answer.
 */
export function getPath( state: FlowState, ctx: FlowContext ): string {
	const parts: string[] = [];
	if ( state.entry === 'guide' ) {
		parts.push( 'guide' );
	} else if ( ctx.isDevelopmentSite ) {
		parts.push( 'detected_copy' );
	}
	parts.push( ...state.history.map( entry => entry.pick ) );
	if ( state.pick ) {
		parts.push( state.pick );
	}
	return parts.join( '>' ) || 'none';
}

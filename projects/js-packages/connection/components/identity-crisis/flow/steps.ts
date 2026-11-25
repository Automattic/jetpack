import type { IdentityCrisisAction } from '../../../hooks/use-identity-crisis-actions/types';

/** A question in the Safe Mode flow. */
export type ChoiceStepId = 'main' | 'copy' | 'replaced';

/** A step-by-step guide question: one thing the admin can check, answered by moving on. */
export type GuideStepId = 'open_address' | 'was_it_there' | 'same_or_separate' | 'visitors_use';

/** A step that explains a result and offers one action, without a question. */
export type ResultStepId = 'two-addresses' | 'ask' | 'later';

export type StepId = ChoiceStepId | GuideStepId | ResultStepId;

/** An answer to a question, named the same as in the `jetpack_idc_*` events' `path`. */
export type OptionId =
	'same' | 'old' | 'original' | 'copyof' | 'safe' | 'fresh' | 'yes' | 'no' | 'unsure';

/** An answer to a guide question, named the same as in the `jetpack_idc_*` events' `path`. */
export type GuideAnswerId =
	| 'forwards'
	| 'nothing'
	| 'loads'
	| 'was_there'
	| 'not_there'
	| 'same'
	| 'separate'
	| 'unsure'
	| 'other_address'
	| 'this_address';

/** A main-question statement the guide can reach. */
export type ConclusionId = Extract< OptionId, 'old' | 'original' | 'copyof' >;

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

/** A guide answer that either asks the next question or reaches a statement or result. */
export type GuideAnswer = { id: GuideAnswerId } & (
	{ next: GuideStepId | ResultStepId } | { conclude: ConclusionId }
);

/** Where the flow is. */
export interface FlowState {
	/** `guide` once the admin opens the step-by-step guide. */
	entry: 'main' | 'guide';
	step: StepId;
	pick: OptionId | null;
	/** The steps left behind, oldest first. */
	history: FlowHistoryEntry[];
}

/** A step left behind, restored by Back. `answer` is null for a step left without answering. */
export type FlowHistoryEntry = Pick< FlowState, 'entry' | 'step' | 'pick' > & {
	answer: OptionId | GuideAnswerId | null;
};

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

// One thing to check per question; the copy lives in `copy.tsx`.
const GUIDE_STEPS: Readonly< Record< GuideStepId, readonly GuideAnswer[] > > = {
	open_address: [
		{ id: 'forwards', conclude: 'old' },
		{ id: 'nothing', next: 'was_it_there' },
		{ id: 'loads', next: 'same_or_separate' },
	],
	was_it_there: [
		{ id: 'was_there', conclude: 'old' },
		{ id: 'not_there', next: 'ask' },
	],
	same_or_separate: [
		{ id: 'same', next: 'two-addresses' },
		{ id: 'separate', next: 'visitors_use' },
		{ id: 'unsure', next: 'ask' },
	],
	visitors_use: [
		{ id: 'other_address', conclude: 'original' },
		{ id: 'this_address', conclude: 'copyof' },
		{ id: 'unsure', next: 'ask' },
	],
};

// Every result keeps Safe Mode on; the guide adds no action of its own.
const RESULT_STEPS: Readonly< Record< ResultStepId, IdentityCrisisAction > > = {
	'two-addresses': 'confirm-safe-mode',
	ask: 'confirm-safe-mode',
	later: 'confirm-safe-mode',
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
 * Whether a step is a guide question.
 *
 * @param step - The step.
 * @return True for a guide question.
 */
export function isGuideStep( step: StepId ): step is GuideStepId {
	return Object.hasOwn( GUIDE_STEPS, step );
}

/**
 * Whether a step is a result.
 *
 * @param step - The step.
 * @return True for a result.
 */
export function isResultStep( step: StepId ): step is ResultStepId {
	return Object.hasOwn( RESULT_STEPS, step );
}

/**
 * Whether the guide reached a statement on the main question, so only that statement shows.
 *
 * @param state - The flow state.
 * @return True for a conclusion.
 */
export function isConcluded( state: FlowState ): boolean {
	return state.entry === 'guide' && state.step === 'main';
}

/**
 * The answers of a guide question.
 *
 * @param step - The guide question.
 * @return The answers, in order.
 */
export function getGuideAnswers( step: GuideStepId ): readonly GuideAnswer[] {
	return GUIDE_STEPS[ step ];
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
	/** Returns to an earlier step, by its place in `history`. */
	| { type: 'back-to'; index: number }
	| { type: 'restart'; ctx: FlowContext }
	| { type: 'open-guide' }
	| { type: 'answer'; answer: GuideAnswerId }
	| { type: 'later' };

/**
 * The current step as a history entry.
 *
 * @param state  - The flow state.
 * @param answer - The answer that leaves the step, if any.
 * @return The entry.
 */
function leave( state: FlowState, answer: FlowHistoryEntry[ 'answer' ] ): FlowHistoryEntry {
	return { entry: state.entry, step: state.step, pick: state.pick, answer };
}

/**
 * The flow as it was at an earlier step, with the steps after it forgotten.
 *
 * @param state - The flow state.
 * @param index - The step's place in `history`.
 * @return The state; the same object when there is no such step.
 */
function restore( state: FlowState, index: number ): FlowState {
	const previous = Number.isInteger( index ) && index >= 0 ? state.history[ index ] : undefined;
	if ( ! previous ) {
		return state;
	}
	const { entry, step, pick } = previous;
	return { entry, step, pick, history: state.history.slice( 0, index ) };
}

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
				history: [ ...state.history, leave( state, option.id ) ],
			};
		}
		case 'back':
			return restore( state, state.history.length - 1 );
		case 'back-to':
			return restore( state, action.index );
		case 'restart':
			return getInitialFlowState( action.ctx );
		case 'open-guide':
			if ( state.entry === 'guide' ) {
				return state;
			}
			return {
				entry: 'guide',
				step: 'open_address',
				pick: null,
				history: [ ...state.history, leave( state, null ) ],
			};
		case 'answer': {
			if ( ! isGuideStep( state.step ) ) {
				return state;
			}
			const answer = GUIDE_STEPS[ state.step ].find( candidate => candidate.id === action.answer );
			if ( ! answer ) {
				return state;
			}
			const history = [ ...state.history, leave( state, answer.id ) ];
			return 'conclude' in answer
				? { ...state, step: 'main', pick: answer.conclude, history }
				: { ...state, step: answer.next, pick: null, history };
		}
		case 'later':
			if ( state.entry !== 'guide' || state.step === 'later' ) {
				return state;
			}
			return {
				...state,
				step: 'later',
				pick: null,
				history: [ ...state.history, leave( state, null ) ],
			};
		default: {
			const unhandled: never = action;
			return unhandled;
		}
	}
}

/**
 * The answers so far, joined by `>`, for the `jetpack_idc_*` events' `path`.
 * The guide starts over, so its path leaves out the answers given before it.
 *
 * @param state - The flow state.
 * @param ctx   - The flow context.
 * @return E.g. `original>safe`, `detected_copy>fresh` or `guide>loads>separate>other_address>original>safe`; `none` before any answer.
 */
export function getPath( state: FlowState, ctx: FlowContext ): string {
	const parts: string[] = [];
	if ( state.entry === 'guide' ) {
		parts.push( 'guide' );
	} else if ( ctx.isDevelopmentSite ) {
		parts.push( 'detected_copy' );
	}
	for ( const entry of state.history ) {
		if ( entry.entry === state.entry && entry.answer ) {
			parts.push( entry.answer );
		}
	}
	if ( state.pick ) {
		parts.push( state.pick );
	}
	return parts.join( '>' ) || 'none';
}

/** A guide answer given so far, and where in `history` its question is. */
export interface GuideTrailItem {
	index: number;
	answer: GuideAnswerId;
}

/**
 * The guide answers given so far, oldest first, each leading back to its question.
 *
 * @param state - The flow state.
 * @return The answers; none outside the guide.
 */
export function getGuideTrail( state: FlowState ): GuideTrailItem[] {
	const items: GuideTrailItem[] = [];
	state.history.forEach( ( entry, index ) => {
		const answer = isGuideStep( entry.step )
			? GUIDE_STEPS[ entry.step ].find( candidate => candidate.id === entry.answer )
			: undefined;
		if ( answer ) {
			items.push( { index, answer: answer.id } );
		}
	} );
	return items;
}

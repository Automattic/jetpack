import { createReduxStore, register } from '@wordpress/data';
import { AI_PATH, getPreloaded } from './get-preloaded';
import type { AiState } from './ai-types';

/**
 * A tiny `@wordpress/data` store holding the latest-saved AI tab state.
 *
 * Same rationale as [settings-store]: the AI tab is its own route, so toggling a
 * setting and saving was lost on the next visit (the form re-seeded from the
 * never-updated bootstrap) until a reload. This store keeps the current snapshot
 * of each AI slice — seeded from the bootstrap, replaced on each successful save
 * — so `useAiForm` re-seeds from the freshest values across routes.
 */

const STORE_NAME = 'jetpack-seo/ai';

type Enhancer = AiState[ 'enhancer' ];
type LlmsTxt = AiState[ 'llmsTxt' ];

interface State {
	enhancer: Enhancer | null;
	llmsTxt: LlmsTxt | null;
}

type Action =
	| { type: 'SET_ENHANCER'; enhancer: Enhancer }
	| { type: 'SET_LLMS_TXT'; llmsTxt: LlmsTxt };

const preloaded = getPreloaded< AiState >( AI_PATH );

const DEFAULT_STATE: State = {
	enhancer: preloaded?.enhancer ?? null,
	llmsTxt: preloaded?.llmsTxt ?? null,
};

const actions = {
	/**
	 * Replace the stored enhancer snapshot with the value just persisted.
	 *
	 * @param enhancer - The latest-saved enhancer state.
	 * @return The action.
	 */
	setEnhancer( enhancer: Enhancer ): Action {
		return { type: 'SET_ENHANCER', enhancer };
	},
	/**
	 * Replace the stored llms.txt snapshot with the value just persisted.
	 *
	 * @param llmsTxt - The latest-saved llms.txt state.
	 * @return The action.
	 */
	setLlmsTxt( llmsTxt: LlmsTxt ): Action {
		return { type: 'SET_LLMS_TXT', llmsTxt };
	},
};

const selectors = {
	/**
	 * The latest-known enhancer state (or `null` when the bootstrap was absent).
	 *
	 * @param state - Store state.
	 * @return The enhancer state.
	 */
	getEnhancer( state: State ): Enhancer | null {
		return state.enhancer;
	},
	/**
	 * The latest-known llms.txt state (or `null` when the bootstrap was absent).
	 *
	 * @param state - Store state.
	 * @return The llms.txt state.
	 */
	getLlmsTxt( state: State ): LlmsTxt | null {
		return state.llmsTxt;
	},
};

const store = createReduxStore( STORE_NAME, {
	reducer( state: State = DEFAULT_STATE, action: Action ): State {
		switch ( action.type ) {
			case 'SET_ENHANCER':
				return { ...state, enhancer: action.enhancer };
			case 'SET_LLMS_TXT':
				return { ...state, llmsTxt: action.llmsTxt };
			default:
				return state;
		}
	},
	actions,
	selectors,
} );

register( store );

export { store as aiStore, STORE_NAME as AI_STORE_NAME };

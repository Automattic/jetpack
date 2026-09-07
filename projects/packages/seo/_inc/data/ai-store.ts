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
type Crawlers = AiState[ 'crawlers' ];

interface State {
	enhancer: Enhancer | null;
	llmsTxt: LlmsTxt | null;
	crawlers: Crawlers | null;
}

type Action =
	| { type: 'SET_ENHANCER'; enhancer: Enhancer }
	| { type: 'SET_LLMS_TXT'; llmsTxt: LlmsTxt }
	| { type: 'SET_CRAWLERS'; crawlers: Crawlers };

const preloaded = getPreloaded< AiState >( AI_PATH );

const DEFAULT_STATE: State = {
	enhancer: preloaded?.enhancer ?? null,
	llmsTxt: preloaded?.llmsTxt ?? null,
	crawlers: preloaded?.crawlers ?? null,
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
	/**
	 * Replace the stored crawler snapshot with the value just persisted.
	 *
	 * @param crawlers - The latest-saved crawler state.
	 * @return The action.
	 */
	setCrawlers( crawlers: Crawlers ): Action {
		return { type: 'SET_CRAWLERS', crawlers };
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
	/**
	 * The latest-known crawler state (or `null` when the bootstrap was absent).
	 *
	 * @param state - Store state.
	 * @return The crawler state.
	 */
	getCrawlers( state: State ): Crawlers | null {
		return state.crawlers;
	},
};

const store = createReduxStore( STORE_NAME, {
	reducer( state: State = DEFAULT_STATE, action: Action ): State {
		switch ( action.type ) {
			case 'SET_ENHANCER':
				return { ...state, enhancer: action.enhancer };
			case 'SET_LLMS_TXT':
				return { ...state, llmsTxt: action.llmsTxt };
			case 'SET_CRAWLERS':
				return { ...state, crawlers: action.crawlers };
			default:
				return state;
		}
	},
	actions,
	selectors,
} );

register( store );

export { store as aiStore, STORE_NAME as AI_STORE_NAME };

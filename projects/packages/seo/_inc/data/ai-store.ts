import { getScriptData } from '@automattic/jetpack-script-data';
import { createReduxStore, register } from '@wordpress/data';
import type { AiState } from './ai-types';

/**
 * A tiny `@wordpress/data` store holding the latest-saved AI SEO Enhancer state.
 *
 * Same rationale as [settings-store]: the AI tab is its own route, so toggling
 * the Enhancer and saving was lost on the next visit (the form re-seeded from
 * the never-updated bootstrap) until a reload. This store keeps the current
 * enhancer snapshot — seeded from the bootstrap, replaced on each successful
 * save — so `useAiForm` re-seeds from the freshest value across routes.
 */

const STORE_NAME = 'jetpack-seo/ai';

type Enhancer = AiState[ 'enhancer' ];

type SeoScriptData = {
	seo?: {
		ai?: AiState;
	};
};

interface State {
	enhancer: Enhancer | null;
}

interface SetEnhancerAction {
	type: 'SET_ENHANCER';
	enhancer: Enhancer;
}

const DEFAULT_STATE: State = {
	enhancer: ( getScriptData() as SeoScriptData | undefined )?.seo?.ai?.enhancer ?? null,
};

const actions = {
	/**
	 * Replace the stored enhancer snapshot with the value just persisted.
	 *
	 * @param enhancer - The latest-saved enhancer state.
	 * @return The action.
	 */
	setEnhancer( enhancer: Enhancer ): SetEnhancerAction {
		return { type: 'SET_ENHANCER', enhancer };
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
};

const store = createReduxStore( STORE_NAME, {
	reducer( state: State = DEFAULT_STATE, action: SetEnhancerAction ): State {
		if ( action.type === 'SET_ENHANCER' ) {
			return { enhancer: action.enhancer };
		}
		return state;
	},
	actions,
	selectors,
} );

register( store );

export { store as aiStore, STORE_NAME as AI_STORE_NAME };

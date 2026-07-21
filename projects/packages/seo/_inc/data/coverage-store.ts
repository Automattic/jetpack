import { createReduxStore, register } from '@wordpress/data';
import getOverview from './get-overview';
import type { CoverageDelta } from './content-types';
import type { ContentCoverage } from './overview-types';

/**
 * A tiny `@wordpress/data` store holding the Overview's Content-SEO coverage
 * counts. It exists so cross-route state survives navigation: the Content route
 * and the Overview route mount separately (only one at a time), so when the
 * Content inspector saves a post's SEO, it dispatches a delta here and the
 * Overview card reflects it on the next visit — without a page reload, and
 * without prop-drilling through a shared parent (there isn't one any more).
 *
 * Seeded once from the page bootstrap (`getOverview().content_coverage`).
 */

const STORE_NAME = 'jetpack-seo/coverage';

interface State {
	coverage: ContentCoverage | null;
}

interface ApplyDeltaAction {
	type: 'APPLY_DELTA';
	delta: CoverageDelta;
}

const DEFAULT_STATE: State = {
	coverage: getOverview()?.content_coverage ?? null,
};

const actions = {
	/**
	 * Adjust the coverage counts by a per-metric delta (+1 / 0 / -1), e.g. after a
	 * post's SEO is saved in the Content inspector.
	 *
	 * @param delta - The change to apply to each metric.
	 * @return The action.
	 */
	applyCoverageDelta( delta: CoverageDelta ): ApplyDeltaAction {
		return { type: 'APPLY_DELTA', delta };
	},
};

const selectors = {
	/**
	 * The current coverage counts (or `null` when the bootstrap was absent).
	 *
	 * @param state - Store state.
	 * @return The coverage counts.
	 */
	getCoverage( state: State ): ContentCoverage | null {
		return state.coverage;
	},
};

const store = createReduxStore( STORE_NAME, {
	reducer( state: State = DEFAULT_STATE, action: ApplyDeltaAction ): State {
		if ( action.type === 'APPLY_DELTA' && state.coverage ) {
			return {
				coverage: {
					...state.coverage,
					with_schema: state.coverage.with_schema + action.delta.schema,
					with_title: state.coverage.with_title + action.delta.title,
					with_description: state.coverage.with_description + action.delta.description,
					with_search_visible: state.coverage.with_search_visible + action.delta.search_visible,
				},
			};
		}
		return state;
	},
	actions,
	selectors,
} );

register( store );

export { store as coverageStore, STORE_NAME as COVERAGE_STORE_NAME };

/**
 * In-memory backing store for the akismet/v1 REST routes — used by the
 * `mockApiClient` helper in `tests/js/mocks/api-client.ts`. State is reset
 * between tests by the `afterEach` in `tests/js/setup.ts`.
 *
 * Shape mirrors `class.akismet-experimental-rest-api.php` so test outcomes
 * carry over to manual sandbox verification.
 *
 * The conventions doc §11 explicitly says MSW is deferred to Plan 3 — we
 * mock at the `apiClient` boundary instead, which sidesteps the JSDOM +
 * fetch-polyfill rabbit hole and is the same boundary Plan 0's
 * `api-client.test.ts` already uses.
 */

export type SettingsState = {
	akismet_strictness: '0' | '1';
	akismet_show_user_comments_approved: '0' | '1';
};

/**
 * Overrides the mock store hands back to the fake apiClient when it serves
 * `stats/{interval}` or `stats/timeseries`. Lets tests pick specific spam
 * counts without rebuilding the whole fixture.
 */
export type StatsOverride = {
	spam?: number;
	ham?: number;
	missed_spam?: number;
	false_positives?: number;
	preview?: boolean;
};

/**
 * Same idea for Blackbox aggregates — tests want to assert on specific
 * blocked/challenged/passed totals without recreating series fixtures.
 */
export type BlackboxAggregateOverride = {
	blocked?: number;
	challenged?: number;
	passed?: number;
	preview?: boolean;
};

/**
 * Per-session Blackbox verdict override (Plan 3). Lets a single test
 * force a specific decision / score / preview shape on the row drawer
 * without rebuilding the whole signals array.
 */
export type BlackboxVerdictOverride = {
	decision?: 'allow' | 'challenge' | 'block';
	risk_score?: number;
	preview?: boolean;
};

/**
 * Activity-row override (Plan 3). The fake apiClient serves a built-in
 * fixture set; tests can override per-row by id.
 */
export type ActivityOverride = {
	preview?: boolean;
	outcome?: string;
	source?: string;
};

/**
 * And for WC fraud summaries.
 */
export type WooFraudOverride = {
	orders_flagged?: number;
	blocked_checkouts?: number;
	estimated_chargebacks_averted_usd?: number;
	wfp_active?: boolean;
	preview?: boolean;
};

export type MockState = {
	key: string;
	keyValid: boolean;
	settings: SettingsState;
	stats: Partial< Record< string, StatsOverride > >; // keyed by interval
	blackboxAggregates: Partial< Record< string, BlackboxAggregateOverride > >; // keyed by `${category}|${interval}`
	wooFraud: Partial< Record< string, WooFraudOverride > >; // keyed by interval
	blackboxVerdicts: Partial< Record< string, BlackboxVerdictOverride > >; // keyed by session_id
	activityOverrides: Partial< Record< string, ActivityOverride > >; // keyed by row id
};

const initialState = (): MockState => ( {
	key: '',
	keyValid: false,
	settings: {
		akismet_strictness: '0',
		akismet_show_user_comments_approved: '0',
	},
	stats: {},
	blackboxAggregates: {},
	wooFraud: {},
	blackboxVerdicts: {},
	activityOverrides: {},
} );

let state: MockState = initialState();

/**
 * Read the current mock state. Use sparingly — tests should usually assert via
 * the public hook API, not by peeking at the store.
 *
 * @return Read-only snapshot.
 */
export function getMockState(): MockState {
	return state;
}

/**
 * Replace the mock state in place. Used by tests that want to start from a
 * specific scenario (e.g., "site already has a valid key").
 *
 * @param patch - Partial state to apply on top of the defaults.
 */
export function setMockState( patch: Partial< MockState > ): void {
	state = { ...initialState(), ...patch };
}

/**
 * Reset the in-memory backing store between tests. Wired into `afterEach` by
 * `tests/js/setup.ts`.
 */
export function __resetMockState(): void {
	state = initialState();
}

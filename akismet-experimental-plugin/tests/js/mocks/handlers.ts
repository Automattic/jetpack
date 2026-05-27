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

export type MockState = {
	key: string;
	keyValid: boolean;
	settings: SettingsState;
};

const initialState = (): MockState => ( {
	key: '',
	keyValid: false,
	settings: {
		akismet_strictness: '0',
		akismet_show_user_comments_approved: '0',
	},
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

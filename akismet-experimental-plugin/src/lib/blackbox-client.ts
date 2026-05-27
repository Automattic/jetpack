import { apiClient } from '@/lib/api-client';

/**
 * Verdict shape mirrors `blackbox-api.wp.com/v1/verify/{sessionId}` response.
 * The PHP proxy (`Akismet_Experimental::rest_get_blackbox_verdict`) normalizes
 * Blackbox's response into this shape so the front-end never depends on
 * Blackbox's wire format directly.
 *
 * @see https://blackboxdocs.wordpress.com/api-reference/
 */
export type BlackboxVerdict = {
	session_id: string;
	decision: 'allow' | 'challenge' | 'block' | 'error';
	risk_score: number;
	confidence?: 'high' | 'medium' | 'low' | 'degraded';
	visitor_id?: string;
	telemetry_score?: number;
	ip_address?: string;
	signals?: Array< {
		name: string;
		log_odds: number;
		confidence: number;
		category: string;
		rule_id: string;
		rule_version: string;
		metadata?: Record< string, unknown >;
	} >;
	/** True if this response came from the deterministic mock (preview mode). */
	preview?: boolean;
};

/**
 * Server-side aggregate shape consumed by Plan 2's Overview category cards.
 * The PHP proxy adds `preview: true` whenever the response is mocked (default,
 * unless AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API is on and the site is enrolled).
 */
export type BlackboxAggregates = {
	category: 'logins' | 'bots' | 'brute-force' | 'forms';
	interval: '30-days' | '60-days' | '6-months' | 'all';
	blocked: number;
	challenged: number;
	passed: number;
	series: Array< {
		date: string;
		blocked: number;
		challenged: number;
		passed: number;
	} >;
	preview: boolean;
	generated_at: string;
};

/**
 * Thin client for the WP REST endpoints that proxy to Blackbox.
 *
 * Ships as a shell — concrete `getAggregates()` / `getVerdict()` methods are
 * added in later phases backed by `akismet/v1/blackbox/aggregates` and
 * `akismet/v1/blackbox/verdict/{id}` WP REST routes.
 *
 * All real Blackbox calls happen server-side; the browser hits
 * `akismet/v1/blackbox/*` endpoints on the local WP site only. The Bearer key
 * is held in PHP and never sent to the browser.
 */
export const blackboxClient = {
	// Plans 2 + 3 extend this object with:
	//   getAggregates( category, interval ): Promise< BlackboxAggregates >
	//   getVerdict( sessionId ): Promise< BlackboxVerdict >
	// Until then, ping is the only method — useful as a connectivity probe
	// and to confirm the WP-side proxy is reachable.

	/**
	 * No-op probe. Currently returns immediately; future plans may swap to a
	 * real `GET /akismet/v1/blackbox/health` round-trip.
	 *
	 * @return Resolves to `{ ok: true }`.
	 */
	async ping(): Promise< { ok: true } > {
		return { ok: true };
	},
};

// Type re-export so consumers can `import { apiClient }` from one place if they want.
export { apiClient };

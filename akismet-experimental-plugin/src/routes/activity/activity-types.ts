/**
 * Unified Activity row type — every row in the Activity tab speaks this
 * shape regardless of origin (real spam comment, mock login attempt,
 * WC fraud order, …). Mirrors the PHP shape in
 * `class.akismet-experimental-activity.php`.
 *
 * The DataViews fields in `src/routes/activity/fields.tsx` render off
 * these fields; the row drawer in `row-drawer.tsx` does too.
 */

export type ActivityCategory =
	| 'comments'
	| 'forms'
	| 'logins'
	| 'checkouts'
	| 'bots'
	| 'brute-force';

export type ActivityOutcome =
	| 'block'
	| 'challenge-passed'
	| 'challenge-failed'
	| 'allowed-but-flagged';

export type ActivitySource =
	| 'akismet-content'
	| 'blackbox-behavioral'
	| 'blackbox-fingerprint'
	| 'blackbox-edge'
	| 'woocommerce-fraud'
	| 'akismet-rules';

export type ActivitySubjectKind =
	| 'comment'
	| 'visitor'
	| 'order'
	| 'login-attempt'
	| 'form-submission';

export type ActivitySubject = {
	kind: ActivitySubjectKind;
	label: string;
	secondary?: string;
	link?: string;
};

export type ActivitySignal = {
	name: string;
	weight: number;
	description?: string;
};

export type ActivityRow = {
	id: string;
	timestamp: string;
	category: ActivityCategory;
	source: ActivitySource;
	outcome: ActivityOutcome;
	subject: ActivitySubject;
	signals: ActivitySignal[];
	ip?: string;
	visitor_id?: string | null;
	context: Record< string, unknown >;
	preview: boolean;
};

/**
 * Verdict shape from `/akismet/v1/blackbox/verdict/{session_id}`. Mirrors
 * the PHP mock in `Akismet_Experimental_REST_API::deterministic_mock_verdict`.
 */
export type BlackboxVerdict = {
	session_id: string;
	decision: 'allow' | 'challenge' | 'block';
	risk_score: number;
	confidence: string;
	visitor_id: string;
	ip_address: string;
	signals: Array< {
		name: string;
		log_odds: number;
		confidence: number;
		category: string;
		rule_id: string;
		rule_version: string;
	} >;
	preview: boolean;
};

/**
 * The `/akismet/v1/activity` response envelope.
 */
export type ActivityResponse = {
	items: ActivityRow[];
	total: number;
	page: number;
	per_page: number;
	total_pages: number;
};

/**
 * Query parameters accepted by `/akismet/v1/activity`. The hook builds
 * the URL-encoded query string from this shape.
 */
export type ActivityQueryParams = {
	page: number;
	perPage: number;
	category: ActivityCategory | 'all';
	outcome: ActivityOutcome | 'all';
	source: ActivitySource | 'all';
	search: string;
	from?: string;
	to?: string;
};

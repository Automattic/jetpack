export type DnsPurpose = 'lockdown' | 'spf' | 'dkim';

export type DnsRecord = {
	type: string;
	/** Full record name, e.g. `_mailchannels.example.com`. */
	name: string;
	value: string;
	purpose: DnsPurpose;
	optional?: boolean;
	/**
	 * The name relative to the domain's DNS zone (`_mailchannels`, `jpsend._domainkey`), or `@` for the
	 * zone root. Set on `account.dns_records` in every status payload; absent on `zone_records`.
	 */
	host?: string;
};

export type DnsCheck = {
	checked_at: string;
	domain_lockdown: string;
	spf: string;
	dkim: string;
	sender_domain: string;
	existing_spf: string;
};

export type Account = {
	handle: string;
	lockdown_auth_id: string;
	domain: string;
	dkim_selector: string;
	monthly_limit: number;
	dns_records: DnsRecord[];
	/** Records the DNS zone behind the customer's CNAMEs must publish; set by the dev provisioner. */
	zone_records?: DnsRecord[];
	provider: 'wpcom' | 'local';
	provisioned_at: string;
	dns_check: DnsCheck | null;
	existing_spf?: string;
	/** The last DNS host detection, cached by GET /dns-host; null until it has run. */
	dns_host?: DnsHost | null;
};

export type Settings = {
	enabled: boolean;
	from_name: string;
	from_local_part: string;
	fallback: boolean;
	/** Reply-To added to emails that don't set one; '' for none. */
	reply_to: string;
	/** Turn sending on by itself once the domain's records pass. Defaults to true. */
	auto_enable: boolean;
	/** Days the log keeps emails: 0 (forever), 1, 7, 30, 90, 180 or 365. */
	log_retention_days: number;
	/** The debug log is recording. */
	debug_log: boolean;
	/** Days the debug log records for once it's turned on, and how long each entry is kept. */
	debug_log_days: DebugLogDays;
};

/** How long the debug log records once turned on, in days. */
export type DebugLogDays = 1 | 7 | 30;

/** The debug log as GET /status reports it. */
export type DebugLogState = {
	enabled: boolean;
	days: DebugLogDays;
	/** When it turns itself off, ISO 8601 UTC; null while off. */
	until: string | null;
	/** Entries kept now. */
	entries: number;
};

/** The onboarding steps, in order. */
export type OnboardingStep = 'sender' | 'connect' | 'finish';

/**
 * A provider slug from `providers.json`, or `unsure` when the user picked "I'm not sure".
 * `other` is the generic entry ("Another one" with no match).
 */
export type ProviderSlug = string;

/** Server-side onboarding state. Timestamps are ISO 8601 (UTC); null when not set. */
export type OnboardingState = {
	/** When setup was finished, or the test skipped. Overview then shows the sending page. */
	closed_at: string | null;
	/** Kept for older clients; the setup page doesn't write it. */
	step: OnboardingStep | null;
	/** The DNS host the user picked in the picker; null to use detection. */
	dns_provider: ProviderSlug | null;
	/** Server-set: email of the user who ran setup. The automatic test goes here. */
	test_to: string | null;
	/** Server-set: when a test first went out successfully. */
	test_sent_at: string | null;
	/** Server-set: log id of the automatic test sent when the domain verified while away. */
	auto_test_log_id: string | null;
	/** When the user first saw the ready state (the open test task, or the wp-admin notice). */
	verified_seen_at: string | null;
};

/**
 * Client-writable onboarding fields, sent as `POST /settings { onboarding: OnboardingUpdate }`.
 * The server stamps the time for `closed` and `verified_seen`; other fields are server-only.
 */
export type OnboardingUpdate = {
	step?: OnboardingStep;
	dns_provider?: ProviderSlug | null;
	/** True stamps `closed_at` with the current time; false clears it. */
	closed?: boolean;
	/** True stamps `verified_seen_at` with the current time. */
	verified_seen?: boolean;
};

/** Fields accepted by POST /settings. */
export type SettingsUpdate = Partial< Settings > & { onboarding?: OnboardingUpdate };

export type EnableBlocker =
	'not_set_up' | 'dns_not_checked' | 'domain_lockdown' | 'sender_domain' | 'spf' | 'dkim';

export type SpfSuggestion = {
	value: string;
	state: 'new' | 'merge' | 'present';
};

export type SendStatus = {
	provisioner: 'wpcom' | 'local' | null;
	account: Account | null;
	settings: Settings;
	can_enable: boolean;
	enable_blockers: EnableBlocker[];
	suggested_domain: string;
	site_title: string;
	admin_email: string;
	/** The logged-in user's email: the only address POST /test sends to. */
	current_user_email: string;
	connect_url: string;
	spf_suggestion: SpfSuggestion | null;
	reset_warning?: string;
	onboarding: OnboardingState;
	/** When the server's background check next runs (ISO 8601); null when it isn't watching. */
	next_check_at: string | null;
	/** The From address's avatar (transparent when it has none), for that address only; null with avatars off. */
	sender_avatar: { email: string; url: string } | null;
	/** The site icon, shown for the sender under its avatar; null when the site has none. */
	site_icon_url: string | null;
	/** Days the log keeps emails, after the site's own filter; 0 when it keeps them for good. */
	log_retention_days: number;
	/** The site's code sets how long emails are kept, so the setting can't change it. */
	log_retention_locked: boolean;
	/** The oldest email still in the log, ISO 8601 UTC; null when the log is empty. */
	log_covers_from: string | null;
	/** Set (to `log_covers_from`) only when older emails were deleted from the log; else null. */
	log_trimmed_before: string | null;
	debug_log: DebugLogState;
	/** The dashboard has counted a site email (tests don't count), so it loads in its busy layout. */
	has_history?: boolean;
	/** POST /settings only: what lowering the retention deleted, and what's left for the background job. */
	pruned?: { deleted: number; remaining: number };
};

/**
 * Why a domain can't be used for sending: an IP address, a temporary or staging host
 * (`*.local`, host staging suffixes), or a reserved name (`.example`, `.invalid`, `.localhost`, `.test`).
 */
export type DnsHostReason = 'ip' | 'temporary' | 'reserved';

/** GET /dns-host: who runs the domain's DNS. */
export type DnsHost = {
	/** The sending domain that was checked. */
	domain: string;
	/** The zone root that answered SOA, e.g. `example.com` for `mail.example.com`. */
	apex: string;
	/** Lowercased nameserver hostnames, without trailing dots. */
	nameservers: string[];
	/** Provider slug from `providers.json`, or null when unknown. The user's pick wins when set. */
	provider: ProviderSlug | null;
	/** What nameserver detection found, before the user's pick is applied. */
	detected_provider?: ProviderSlug | null;
	/** `ns` when detected from nameservers, `user` when picked in the picker. */
	provider_source: 'ns' | 'user' | null;
	/** `low` for mixed nameserver sets: open the picker with `provider` preselected. */
	confidence: 'high' | 'low' | 'none';
	/** False for IPs, temporary/staging hosts and reserved names (`.example`, `.test`…). */
	editable: boolean;
	reason: DnsHostReason | null;
	/** `supported` stays null until a backend answers; show the slot only when true. */
	domain_connect: { host: string | null; supported: boolean | null };
	one_click: { supported: boolean | null };
	wpcom_dns: { supported: boolean | null };
	/** The plugin-only Cloudflare token paste ("Let Jetpack add them"). */
	cloudflare_api: { supported: boolean };
	/** Records already published at the names Send uses; null when none. */
	existing: { lockdown: string | null; spf: string | null; dkim: string | null };
	checked_at: string;
};

/** Server-side state of one record. Client-only states (waiting, checking) live in the UI. */
export type DnsRecordState = 'not_found' | 'found' | 'verified' | 'needs_fix' | 'no_answer';

/** What's wrong with a record whose state is `needs_fix`. */
export type DnsRecordProblem = 'doubled' | 'wrong_value' | 'proxied' | 'conflict' | 'not_live';

export type DnsLookupRecord = {
	/** `sender_domain` rows appear only when that check fails. */
	purpose: DnsPurpose | 'sender_domain';
	/** Full record name. */
	name: string;
	/** Name relative to the zone, as in `DnsRecord.host`. */
	host: string;
	type: string;
	state: DnsRecordState;
	/** Values seen at the name (or at the doubled name), quotes and spaces stripped. */
	found?: string[];
	/** The value we're looking for ('' for `sender_domain`). */
	expected: string;
	/** Set only when `state` is `needs_fix`. */
	problem?: DnsRecordProblem;
};

/** GET /dns-lookup: a local, free look at the domain's records. */
export type DnsLookup = {
	domain: string;
	checked_at: string;
	/** Required records in display order, plus a `sender_domain` row only when it fails. */
	records: DnsLookupRecord[];
	/** Every required record is at least `found`: time to ask the mail service (POST /check-dns). */
	all_found: boolean;
	/** Mirrors `SendStatus.can_enable`. */
	can_enable: boolean;
};

/** One record written by POST /cloudflare/apply. */
export type CloudflareRecordResult = {
	purpose: DnsPurpose;
	name: string;
	/** `skipped`: an optional record Cloudflare has locked, left as it is. */
	action: 'created' | 'updated' | 'unchanged' | 'skipped' | 'failed';
	/** Sending works without it. */
	optional?: boolean;
	/** Cloudflare locks the record (Email Routing's own, or another read-only one), or turned down the write. */
	reason?: 'email_routing' | 'locked' | 'refused';
	/** Plain-language reason when `action` is `failed`. */
	error?: string;
};

/** POST /cloudflare/apply. Token problems come back as REST errors instead. */
export type CloudflareApplyResult = {
	/** True when every required record was created, updated or already right. */
	success: boolean;
	records: CloudflareRecordResult[];
	/** The status after writing, so the UI can refresh without another request. */
	status: SendStatus;
};

/** GET /usage: this month, counted from the log in the site's timezone. */
export type Usage = {
	/** Emails handed to the mail service this month, tests included. */
	emails: number;
	/** How many of those were tests. */
	tests: number;
	/** First day of the month, site-local `Y-m-d`. */
	month_start: string;
	/** The day the count starts again, site-local `Y-m-d`. */
	resets_on: string;
	/** The plan's monthly limit; 0 or less for none. */
	monthly_limit: number;
	/** The mail service's own count, which can lag; null when it didn't answer. Not shown. */
	total_usage: number | null;
	period_start: string;
	period_end: string;
};

/** The dashboard's preset ranges, in days; 1 is the rolling last 24 hours. */
export type PeriodPreset = 1 | 7 | 30 | 90 | 180 | 365;

/** A preset, or custom site-local days (`Y-m-d`, both inclusive). */
export type Period = { range: PeriodPreset } | { start: string; end: string };

/** One site-local day of GET /stats. Test emails aren't counted. */
export type StatsDay = {
	/** Site-local `Y-m-d`. */
	date: string;
	sent: number;
	fallback: number;
	failed: number;
};

/** One site-local hour of GET /stats, for one-day ranges. */
export type StatsHour = {
	/** The hour's start, ISO 8601 UTC. */
	start: string;
	sent: number;
	fallback: number;
	failed: number;
};

/** Days grouped for the chart's weekly bars (`groupByWeek()`). */
export type StatsBucket = {
	/** First and last site-local day in the bucket, `Y-m-d`. */
	start: string;
	end: string;
	sent: number;
	fallback: number;
	failed: number;
	/** The bucket includes today, so it's still filling up. */
	partial: boolean;
};

/** What sent emails: a plugin, a theme, a kind of WordPress email, or `other` for the rest. */
export type StatsOrigin = {
	key: string;
	label: string;
	count: number;
	/** The plugin's WordPress.org icon from core's update check; null (or absent in older caches) when unknown. */
	icon_url?: string | null;
};

/** How many of the period's failed and host-sent emails are still in the log. */
export type StatsAttention = {
	/** Failed site emails and resends still in the log in this period. */
	failed_in_log: number;
	/** The same for host-sent ones. */
	fallback_in_log: number;
};

/** GET /stats. Numbers come from the counts table, so they outlive the log's retention. */
export type Stats = {
	/** Null for custom dates. */
	range: PeriodPreset | null;
	/** First and last site-local day, `Y-m-d`. */
	from: string;
	to: string;
	/** `hour` for one-day spans. */
	unit: 'hour' | 'day';
	/** Tests excluded, resends included. */
	totals: { emails: number; sent: number; fallback: number; failed: number };
	/** Test emails in the range, counted apart. */
	tests: number;
	/** Every day in the range, oldest first, zero-filled; empty when `unit` is `hour`. */
	days: StatsDay[];
	/** Every hour when `unit` is `hour` (23 to 25 on a daylight-saving day); else empty. */
	hours: StatsHour[];
	/** The top five origins, then `other`; empty when no email in the range has one. */
	origins: StatsOrigin[];
	attention: StatsAttention;
	/** The newest non-test email still in the log (ISO 8601, UTC); null when there is none. */
	last_email_at: string | null;
	/** The newest counted non-test day (`Y-m-d`), shown when `last_email_at` is null. */
	last_email_day: string | null;
	/** Whether anything but tests was ever counted. */
	has_history: boolean;
	/** The oldest counted day, `Y-m-d`; null with no counts. */
	stats_since: string | null;
	/** As in GET /status. */
	log_covers_from: string | null;
};

/** The email's type: a site email, a test, or a copy sent again from the Log. The UI calls it Type. */
export type LogSource = 'wp_mail' | 'test' | 'resend';

export type LogRow = {
	id: string;
	created_at: string;
	recipients: string;
	subject: string;
	status: 'sent' | 'fallback' | 'failed';
	/** The raw error, for older rows and the status tooltip's legacy path. */
	error: string;
	request_id: string;
	source: LogSource;
	/** The first recipient's avatar, transparent when they have none; null when the site hides avatars. */
	avatar_url?: string | null;
	/** What sent it, as an origin key like `plugin:shop`; '' for tests and older rows. The UI calls it Source. */
	origin?: string;
	/** That origin's plain name, as What sends the most shows it; '' when there's none. */
	origin_label?: string;
	/** The plugin's WordPress.org icon, or null. */
	origin_icon_url?: string | null;
	/** The From address as sent; '' when core's default sender was used. */
	from_email?: string;
	/** Send's failure reason key (a `FailureReason`); '' for sent rows and older rows. */
	reason?: string;
	/** On a resend, the original's id; '' on every other row. */
	resend_of?: string;
};

export type LogAddress = {
	email: string;
	name?: string;
};

export type LogMessage = {
	/** Null when core sent the email from its default address. */
	from: LogAddress | null;
	reply_to: LogAddress | null;
	/** The parsed To, for resend; absent on older rows. */
	to?: LogAddress[];
	cc: LogAddress[];
	bcc: LogAddress[];
	/** The full subject, not cut at 255. */
	subject?: string;
	content_type: 'text/plain' | 'text/html';
	/** Null when the content wasn't kept (`kept` says why). */
	body: string | null;
	attachments: string[];
	/** `off`: the site's code turned content off; `too_large`: over the size the log keeps. */
	kept?: 'full' | 'off' | 'too_large';
	/** Sign-in links were stripped from this stored copy. */
	redacted?: boolean;
};

/** Why Send couldn't send an email; worked out on the server and stored on the row. */
export type FailureReason =
	| 'unsupported'
	| 'too_large'
	| 'attachment_missing'
	| 'attachment_blocked'
	| 'bad_address'
	| 'lockdown'
	| 'dkim'
	| 'spf'
	| 'sender_domain'
	| 'unverified'
	| 'account'
	| 'limit'
	| 'paused'
	| 'busy'
	| 'service_down'
	| 'no_answer'
	| 'unclear'
	| 'blocked_by_site'
	| 'cant_find'
	| 'cant_connect'
	| 'insecure'
	| 'content'
	| 'virus'
	| 'suppressed'
	| 'rejected'
	| 'bad_list'
	| 'unknown';

/** Why the host's mail failed too, after Send handed an email to it. */
export type HostReason =
	| 'host_off'
	| 'host_login'
	| 'host_unreachable'
	| 'host_refused'
	| 'host_failed'
	| 'bad_address'
	| 'attachment_missing';

/** Who can fix a failure; sets the notice's actions. */
export type FailureOwner =
	'records' | 'ours' | 'retry' | 'email' | 'recipient' | 'server' | 'site' | 'none';

/** Structured facts about a send, stored as the row's `detail`. Every key is optional. */
export type FailureDetail = {
	v?: number;
	stage?: 'build' | 'request' | 'response' | 'result' | 'host';
	/** Send's WP_Error code, e.g. `jetpack_send_http_403`. */
	code?: string;
	http_status?: number;
	/** The service's own words, at most five. */
	service_errors?: string[];
	result?: { status?: string; reason?: string; message_id?: string };
	smtp?: { code?: string; enhanced?: string; policy?: string };
	transport?: {
		wp_code?: string;
		errno?: number;
		phase?: 'dns' | 'connect' | 'after_send' | 'unknown';
		message?: string;
	};
	timing?: { ms?: number; timeout_s?: number };
	request_id?: string;
	message_id?: string;
	/** The host's mail as a backup, on or off when it was sent. */
	fallback?: 'on' | 'off';
	/** What the host's mail did after a hand-off; `reason` only when it failed. */
	host?: {
		result: 'accepted' | 'failed' | 'unknown';
		reason?: HostReason;
		message?: string;
		exception_code?: number | string;
	};
	/** The domain check's verdicts at the time, for records reasons. */
	records?: { lockdown?: string; dkim?: string; spf?: string; checked_at?: string };
	builder?: { feature?: string; attachments?: { count: number; bytes: number } };
	locale?: string;
};

/** Why an email can't be resent; the dialog says so instead of offering the form. */
export type ResendBlock =
	| 'test'
	| 'paused'
	| 'not_ready'
	| 'no_content'
	| 'too_large'
	| 'attachments'
	| 'unsupported'
	| 'redacted';

/** GET /log/{id}: a log row with the content kept for previewing, which is null when none was kept. */
export type LogEntry = LogRow & {
	message: LogMessage | null;
	/** The From address's avatar; null for the host's default sender or with avatars off. */
	from_avatar_url?: string | null;
	detail: FailureDetail | null;
	/** `locked`: an email with a sign-in link, which can go only to the same people or the current user. */
	resend: { allowed: boolean; reason: ResendBlock | ''; locked: boolean };
	/** Copies of this email, newest first, at most 20. */
	resends: { id: string; status: LogRow[ 'status' ]; created_at: string }[];
	resend_count: number;
	/** On a copy, the original, with its status while it's still in the log; null on every other row. */
	resend_of_entry: {
		id: string;
		exists: boolean;
		created_at: string | null;
		status?: LogRow[ 'status' ] | null;
	} | null;
	/** Who resent it: a display name, 'a former user', or '' when it isn't a resend. */
	resent_by: string;
	/** Debug entries recorded for this email. */
	debug_count: number;
	/** Plain-text report for support; domains only, never the subject, body or full addresses. */
	support_text: string;
};

/** POST /log/delete. Ids that were already gone come back as `missing`. */
export type LogDeleteResult = {
	deleted: string[];
	missing: string[];
};

/** GET /log. */
export type LogPage = {
	items: LogRow[];
	/** Capped at 1,000 when a search is set (`total_capped`). */
	total: number;
	/** False when too many emails matched the filters to search their text too. */
	searched_text?: boolean;
	total_capped?: boolean;
};

/** What the Log asks GET /log for. Lists match any of their values; empty or absent means any. */
export type LogQuery = {
	page: number;
	per_page: number;
	search?: string;
	status?: LogRow[ 'status' ][];
	/** Origin keys; the UI calls this Source. */
	origin?: string[];
	/** Types; the UI calls this Type. */
	source?: LogSource[];
	/** Null for any date. */
	period?: Period | null;
};

/** GET /log/origins: the origins still in the log, most first. */
export type LogOrigin = {
	key: string;
	label: string;
	icon_url: string | null;
	count: number;
};

/** GET /log/summary. `older_than` counts emails older than each retention choice, in days. */
export type LogSummary = {
	total: number;
	/** The oldest email, ISO 8601 UTC; null when the log is empty. */
	oldest_at: string | null;
	older_than: Record< '1' | '7' | '30' | '90' | '180' | '365', number >;
};

/** POST /log/{id}/resend. Addresses only; at most 10 in all. */
export type ResendRequest = {
	to: string[];
	cc: string[];
	bcc: string[];
};

/** POST /log/{id}/resend, when a send was attempted and logged. Refusals are REST errors instead. */
export type ResendResult = {
	success: boolean;
	/** The new copy's row. */
	log_id: string;
	status: 'sent' | 'failed';
	reason: string;
	/** The plain headline when it failed; '' when it was sent. */
	message: string;
};

export type DebugLevel = 'error' | 'warning' | 'info' | 'debug';
export type DebugArea = 'sending' | 'domain' | 'account' | 'settings' | 'cleanup';

/** One debug log entry, already redacted on the server. */
export type DebugEntry = {
	id: string;
	/** UTC `Y-m-d H:i:s`, like log rows; read it with `parseUtc()`. */
	created_at: string;
	level: DebugLevel;
	area: DebugArea;
	/** The event key, e.g. `mail.failed`. */
	event: string;
	message: string;
	context: Record< string, unknown > | null;
	/** The email it's about; '' when none. */
	log_id: string;
	/** Who did it: a display name, 'a former user', or '' for automatic work. */
	user: string;
};

export type DebugPage = {
	items: DebugEntry[];
	total: number;
};

/** What the debug log screen asks GET /debug-log for. */
export type DebugQuery = {
	page: number;
	per_page: number;
	search?: string;
	level?: DebugLevel[];
	area?: DebugArea[];
	/** A log id: only entries about that email. */
	email?: string;
};

/**
 * POST /test. A send that was attempted returns 200 (with `log_id` whenever a row was logged).
 * Refusals are REST errors: `jetpack_send_not_ready` (400), `jetpack_send_bad_recipient` (400),
 * `jetpack_send_rate_limited` (429), `jetpack_send_not_set_up` (400).
 */
export type TestResult = {
	success: boolean;
	request_id?: string;
	/** The log row for this test, for `/log?entry={log_id}`. */
	log_id?: string;
	error?: string;
	/** Send's failure reason key when it failed. */
	reason?: string;
};

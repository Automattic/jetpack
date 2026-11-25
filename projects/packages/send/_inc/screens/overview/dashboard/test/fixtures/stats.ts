import type { Stats } from '../../../../../data/types';

export const makeStats = ( overrides: Partial< Stats > = {} ): Stats => ( {
	range: 7,
	from: '2026-10-12',
	to: '2026-10-18',
	unit: 'day',
	totals: { emails: 0, sent: 0, fallback: 0, failed: 0 },
	tests: 0,
	days: [],
	hours: [],
	origins: [],
	attention: { failed_in_log: 0, fallback_in_log: 0 },
	last_email_at: null,
	last_email_day: null,
	has_history: false,
	stats_since: null,
	log_covers_from: null,
	...overrides,
} );

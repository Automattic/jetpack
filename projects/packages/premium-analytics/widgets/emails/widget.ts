/** Which count and rate each row shows. Rows stay in newest-first order either way. */
export type EmailMetric = 'opens' | 'clicks';

/**
 * Configurable attributes for the Emails widget. Mirrors the `attributes` in
 * `widget.json`; the host passes the selected values through to `render.tsx`.
 */
export type EmailsAttributes = {
	metric?: EmailMetric;
};

/**
 * Ported from the Jetpack Stats "Emails" module. The summary endpoint reports
 * across the whole lifetime of the site, so there is no date range or
 * comparison period.
 */
export default {
	example: {
		attributes: {
			metric: 'opens',
		},
	},
};

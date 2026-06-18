/**
 * A single normalized top-posts row, as produced by the Jetpack Stats
 * "Top posts & pages" data layer (`useReportTopPosts` in `@jetpack-premium-analytics/data`).
 */
export type TopPostRow = {
	/**
	 * Post or page title.
	 */
	label: string;
	/**
	 * View count for the period.
	 */
	value: number;
	/**
	 * View count for the comparison (previous) period. Only used when the widget
	 * is rendered with `withComparison`; omit it for single-period views.
	 */
	previousValue?: number;
	/**
	 * URL of the published post/page.
	 */
	href: string;
	/**
	 * Post type, e.g. `post` or `page`.
	 */
	type: string;
};

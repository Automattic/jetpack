/**
 * Internal dependencies
 */
import type { CountLabel } from '../../types';

/**
 * One metric drawable on the report performance chart. `key` must match a
 * `stat_fields` metric present on the time-series points (`views`, `visitors`,
 * `comments`, `likes`).
 */
export interface ReportChartMetric {
	key: string;
	label: string;
	countLabel?: CountLabel;
}

/**
 * External dependencies
 */
import { reportingTimeZone } from '@jetpack-premium-analytics/datetime';
import { intlLocale } from '@jetpack-premium-analytics/formatters';

/**
 * The site's locale and timezone, for a chart provider to format its dates with.
 *
 * @return The formatting context.
 */
export function siteChartFormatting() {
	return { locale: intlLocale(), timeZone: reportingTimeZone() };
}

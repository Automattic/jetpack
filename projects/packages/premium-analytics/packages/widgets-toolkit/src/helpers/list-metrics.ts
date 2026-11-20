/**
 * External dependencies
 */
import { __, _n, sprintf } from '@wordpress/i18n';

/** What a list widget's values count. */
export type ListMetric = 'views' | 'clicks' | 'downloads' | 'shares' | 'comments' | 'opens';

/** The column heading for a list metric, e.g. "Views". */
export function getListMetricLabel( metric: ListMetric ): string {
	switch ( metric ) {
		case 'clicks':
			return __( 'Clicks', 'jetpack-premium-analytics-pkg' );
		case 'downloads':
			return __( 'Downloads', 'jetpack-premium-analytics-pkg' );
		case 'shares':
			return __( 'Shares', 'jetpack-premium-analytics-pkg' );
		case 'comments':
			return __( 'Comments', 'jetpack-premium-analytics-pkg' );
		case 'opens':
			return __( 'Opens', 'jetpack-premium-analytics-pkg' );
		case 'views':
			return __( 'Views', 'jetpack-premium-analytics-pkg' );
	}
}

/** A count with its unit, e.g. "22,008 views"; `value` picks the plural form of `exact`. */
export function formatListMetricCount( metric: ListMetric, value: number, exact: string ): string {
	switch ( metric ) {
		case 'clicks':
			return sprintf(
				/* translators: %s: number of link clicks, e.g. "190". */
				_n( '%s click', '%s clicks', value, 'jetpack-premium-analytics-pkg' ),
				exact
			);
		case 'downloads':
			return sprintf(
				/* translators: %s: number of file downloads, e.g. "1,287". */
				_n( '%s download', '%s downloads', value, 'jetpack-premium-analytics-pkg' ),
				exact
			);
		case 'shares':
			return sprintf(
				/* translators: %s: number of social media shares, e.g. "1,287". */
				_n( '%s share', '%s shares', value, 'jetpack-premium-analytics-pkg' ),
				exact
			);
		case 'comments':
			return sprintf(
				/* translators: %s: number of comments, e.g. "1,287". */
				_n( '%s comment', '%s comments', value, 'jetpack-premium-analytics-pkg' ),
				exact
			);
		case 'opens':
			return sprintf(
				/* translators: %s: number of email opens, e.g. "1,287". */
				_n( '%s open', '%s opens', value, 'jetpack-premium-analytics-pkg' ),
				exact
			);
		case 'views':
			return sprintf(
				/* translators: %s: number of views, e.g. "2,033". */
				_n( '%s view', '%s views', value, 'jetpack-premium-analytics-pkg' ),
				exact
			);
	}
}

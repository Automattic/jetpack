/**
 * A thin wrapper for @automattic/jetpack-analytics
 */

/**
 * Internal dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';

// set some defaults
jetpackAnalytics.setMcAnalyticsEnabled( true );

export default jetpackAnalytics;

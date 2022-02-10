/**
 * A thin wrapper for @automattic/jetpack-analytics
 */

/**
 * Internal dependencies
 */
import config from '../../config';
import jetpackAnalytics from '@automattic/jetpack-analytics';

// set some defaults
jetpackAnalytics.setMcAnalyticsEnabled( config( 'mc_analytics_enabled' ) );
jetpackAnalytics.setGoogleAnalyticsEnabled(
	config( 'google_analytics_enabled' ),
	config( 'google_analytics_key' )
);

export default jetpackAnalytics;

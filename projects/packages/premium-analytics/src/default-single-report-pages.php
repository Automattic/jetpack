<?php
/**
 * The package's own single-report pages, registered through the single-report page API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

// Guarded on a symbol the file declares, so a second copy of the package can't
// redeclare it. See the include block in Analytics::load_dashboard_components().
if ( ! function_exists( __NAMESPACE__ . '\\register_single_report_page' ) ) {
	require_once __DIR__ . '/single-report-pages.php';
}
if ( ! function_exists( __NAMESPACE__ . '\\is_videopress_available' ) ) {
	require_once __DIR__ . '/videopress-availability.php';
}

/**
 * The video page's fixed composition: two full-width rows on the three-column detail grid.
 *
 * @return array
 */
function get_video_single_report_page_default_layout() {
	return array(
		get_dashboard_default_widget_instance( 'video-detail-views-performance', 'jpa/video-detail-views-performance', 1, 3, 2, array( 'chartType' => 'bar' ) ),
		get_dashboard_default_widget_instance( 'video-detail-embeds', 'jpa/video-detail-embeds', 2, 3, 2 ),
	);
}

/**
 * The Post traffic section of the post page: highlights, views, likes, comments, UTM, all-time traffic.
 *
 * @return array
 */
function get_post_traffic_single_report_section_default_layout() {
	return array(
		get_dashboard_default_widget_instance( 'post-detail-highlights', 'jpa/post-detail-highlights', 1, 3, 1 ),
		get_dashboard_default_widget_instance( 'post-views', 'jpa/post-views', 2, 3, 2, array( 'chartType' => 'bar' ) ),
		get_dashboard_default_widget_instance( 'post-likes', 'jpa/post-likes', 3, 1, 2 ),
		get_dashboard_default_widget_instance( 'post-comments', 'jpa/post-comments', 4, 1, 2 ),
		// No "View all" or "Download CSV": the site-wide UTM report would drop this post's scope.
		get_dashboard_default_widget_instance(
			'post-utm',
			'jpa/utm-insights--utm',
			5,
			1,
			2,
			array(
				'utmDimension'   => 'utm_source,utm_medium',
				'showReportLink' => false,
			)
		),
		get_dashboard_default_widget_instance( 'post-all-time-traffic', 'jpa/post-all-time-traffic', 6, 3, 2 ),
	);
}

/**
 * The Email opens section of the post page.
 *
 * @return array
 */
function get_email_opens_single_report_section_default_layout() {
	return array(
		get_dashboard_default_widget_instance( 'email-opens-highlights', 'jpa/email-top-row', 1, 3, 1, array( 'metric' => 'opens' ) ),
		get_dashboard_default_widget_instance( 'email-opens-trend', 'jpa/email-time-series--total-opens', 2, 3, 2, array( 'metric' => 'opens' ) ),
		get_dashboard_default_widget_instance(
			'email-opens-countries',
			'jpa/email-breakdown--location-opens',
			3,
			1,
			2,
			array(
				'view'   => 'countries',
				'metric' => 'opens',
			)
		),
		get_dashboard_default_widget_instance(
			'email-opens-devices',
			'jpa/email-breakdown--platforms-opens',
			4,
			1,
			2,
			array(
				'view'   => 'devices',
				'metric' => 'opens',
			)
		),
		get_dashboard_default_widget_instance(
			'email-opens-clients',
			'jpa/email-breakdown--clients-opens',
			5,
			1,
			2,
			array(
				'view'   => 'clients',
				'metric' => 'opens',
			)
		),
	);
}

/**
 * The Email clicks section of the post page.
 *
 * @return array
 */
function get_email_clicks_single_report_section_default_layout() {
	return array(
		get_dashboard_default_widget_instance( 'email-clicks-highlights', 'jpa/email-top-row', 1, 3, 1, array( 'metric' => 'clicks' ) ),
		get_dashboard_default_widget_instance( 'email-clicks-trend', 'jpa/email-time-series--total-clicks', 2, 3, 2, array( 'metric' => 'clicks' ) ),
		// Width 2: the map unmounts below a 720px container floor.
		get_dashboard_default_widget_instance(
			'email-clicks-countries',
			'jpa/email-breakdown--location-clicks',
			3,
			2,
			2,
			array(
				'view'    => 'countries',
				'metric'  => 'clicks',
				'showMap' => true,
			)
		),
		get_dashboard_default_widget_instance(
			'email-clicks-devices',
			'jpa/email-breakdown--platforms-clicks',
			4,
			1,
			2,
			array(
				'view'   => 'devices',
				'metric' => 'clicks',
			)
		),
		get_dashboard_default_widget_instance(
			'email-clicks-clients',
			'jpa/email-breakdown--clients-clicks',
			5,
			1,
			2,
			array(
				'view'   => 'clients',
				'metric' => 'clicks',
			)
		),
		get_dashboard_default_widget_instance(
			'email-clicks-links',
			'jpa/email-breakdown--top-links',
			6,
			2,
			2,
			array(
				'view'   => 'links',
				'metric' => 'clicks',
			)
		),
	);
}

/**
 * Whether the video page is available: VideoPress is there and the reader may view Stats.
 *
 * @return bool
 */
function is_video_single_report_page_available() {
	if ( ! Capabilities::current_user_can_view_stats() ) {
		return false;
	}

	return function_exists( __NAMESPACE__ . '\\is_videopress_available' ) && is_videopress_available();
}

/**
 * Registers the package's own single-report pages into the registry being hydrated.
 *
 * @param Single_Report_Page_Registry|null $registry The registry the action hands over.
 */
function register_default_single_report_pages( $registry = null ) {
	if ( ! $registry instanceof Single_Report_Page_Registry ) {
		$registry = Single_Report_Page_Registry::get_instance();
	}

	$pages = array(
		'analytics/post'  => array(
			'path'              => 'post',
			'label'             => __( 'Post', 'jetpack-premium-analytics-pkg' ),
			'dashboard_section' => 'traffic',
			'scope_param'       => 'post_id',
			'icon'              => 'jpa/post',
			'reports_page'      => 'posts',
			'sections'          => array(
				array(
					'slug'           => 'post-traffic',
					'label'          => __( 'Post traffic', 'jetpack-premium-analytics-pkg' ),
					'default_layout' => __NAMESPACE__ . '\\get_post_traffic_single_report_section_default_layout',
				),
				array(
					'slug'           => 'email-opens',
					'label'          => __( 'Email opens', 'jetpack-premium-analytics-pkg' ),
					'default_layout' => __NAMESPACE__ . '\\get_email_opens_single_report_section_default_layout',
					'controls'       => false,
				),
				array(
					'slug'           => 'email-clicks',
					'label'          => __( 'Email clicks', 'jetpack-premium-analytics-pkg' ),
					'default_layout' => __NAMESPACE__ . '\\get_email_clicks_single_report_section_default_layout',
					'controls'       => false,
				),
			),
			'preferences_scope' => 'jetpack-premium-analytics/post-detail',
		),
		'analytics/video' => array(
			'path'              => 'video',
			'label'             => __( 'Video', 'jetpack-premium-analytics-pkg' ),
			'dashboard_section' => 'traffic',
			'is_available'      => __NAMESPACE__ . '\\is_video_single_report_page_available',
			'feature'           => 'videos',
			'scope_param'       => 'post_id',
			'icon'              => 'jpa/video',
			'reports_page'      => 'videos',
			'default_layout'    => __NAMESPACE__ . '\\get_video_single_report_page_default_layout',
			'preferences_scope' => 'jetpack-premium-analytics/video-detail',
		),
	);

	foreach ( $pages as $id => $args ) {
		if ( ! $registry->is_registered( DASHBOARD_NAME, $id ) ) {
			$registry->register( DASHBOARD_NAME, $id, $args );
		}
	}
}

add_action( Single_Report_Page_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_single_report_pages' );

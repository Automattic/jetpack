<?php
/**
 * The package's own single-report pages, registered through the single-report page API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/single-report-pages.php';
require_once __DIR__ . '/videopress-availability.php';

/**
 * The video page's fixed composition: the performance chart full width, then the player beside the embeds list.
 *
 * @return array
 */
function get_video_single_report_page_default_layout() {
	return array(
		get_dashboard_default_widget_instance( 'video-detail-views-performance', 'jpa/video-detail-views-performance', 10, 'full', 2, array( 'chartType' => 'bar' ) ),
		get_dashboard_default_widget_instance( 'videopress-video-player', 'videopress/video-player', 20, 1, 2 ),
		get_dashboard_default_widget_instance( 'video-detail-embeds', 'jpa/video-detail-embeds', 30, 'fill', 2 ),
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

	return is_videopress_available();
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

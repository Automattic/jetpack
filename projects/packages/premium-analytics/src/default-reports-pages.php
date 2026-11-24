<?php
/**
 * The package's own reports pages, registered through the reports page API.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

require_once __DIR__ . '/reports-pages.php';

/**
 * Rows a reports page's table tile spans.
 */
const REPORTS_PAGE_TABLE_TILE = 4;

/**
 * Registers the package's own reports pages into the registry being hydrated.
 *
 * @param Reports_Page_Registry|null $registry The registry the action hands over.
 */
function register_default_reports_pages( $registry = null ) {
	if ( ! $registry instanceof Reports_Page_Registry ) {
		$registry = Reports_Page_Registry::get_instance();
	}

	$pages = array(
		'analytics/posts' => array(
			'path'              => 'posts',
			'label'             => __( 'All pages', 'jetpack-premium-analytics-pkg' ),
			'dashboard_section' => 'traffic',
			'feature'           => 'top-posts',
			'sections'          => array(
				array(
					'slug'           => 'posts-pages',
					'label'          => __( 'Posts & Pages', 'jetpack-premium-analytics-pkg' ),
					'default_layout' => array(
						get_dashboard_default_widget_instance( 'posts-table', 'jpa/posts-table', 1, 'full', REPORTS_PAGE_TABLE_TILE ),
					),
				),
				array(
					'slug'           => 'archives',
					'label'          => __( 'Archives', 'jetpack-premium-analytics-pkg' ),
					'default_layout' => array(
						get_dashboard_default_widget_instance( 'archives-table', 'jpa/archives-table', 1, 'full', REPORTS_PAGE_TABLE_TILE ),
					),
				),
			),
		),
	);

	foreach ( $pages as $id => $args ) {
		if ( ! $registry->is_registered( DASHBOARD_NAME, $id ) ) {
			$registry->register( DASHBOARD_NAME, $id, $args );
		}
	}
}

add_action( Reports_Page_Registry::REGISTER_ACTION, __NAMESPACE__ . '\\register_default_reports_pages' );

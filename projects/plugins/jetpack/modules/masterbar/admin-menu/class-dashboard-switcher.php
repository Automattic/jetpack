<?php
/**
 * Dashboard_Switcher class file
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

/**
 * Class Dashboard_Switcher
 *
 * Handles Calypso to WP-Admin quick switcher
 *
 * @package Automattic\Jetpack\Dashboard_Customizations
 */
class Dashboard_Switcher {

	/**
	 * Site's domain
	 *
	 * @var string.
	 */
	private $domain;

	/**
	 * Dashboard_Switcher constructor.
	 *
	 * @param string $domain Site's domain.
	 */
	public function __construct( $domain ) {
		$this->domain = $domain;
	}

	/**
	 * Prepend a dashboard switcher to the "Screen Options" box of the current page.
	 * Callback for the 'screen_settings' filter (available in WP 3.0 and up).
	 *
	 * @param string $current The currently added panels in screen options.
	 *
	 * @return string|void The HTML code to append to "Screen Options"
	 */
	public function register_dashboard_switcher( $current ) {
		$menu_mappings = require __DIR__ . '/menu-mappings.php';
		$screen        = $this->get_current_screen();

		// Let's show the switcher only in screens that we have a Calypso mapping to switch to.
		if ( ! isset( $menu_mappings[ $screen ] ) ) {
			return;
		}

		$contents = sprintf(
			'<div id="dashboard-switcher"><h5>%s</h5><p class="dashboard-switcher-text">%s</p><a class="button button-primary dashboard-switcher-button" href="%s">%s</a></div>',
			__( 'Screen features', 'jetpack' ),
			__( 'Currently you are seeing the classic WP-Admin view of this page. Would you like to see the default WordPress.com view?', 'jetpack' ),
			$menu_mappings[ $screen ] . $this->domain,
			__( 'Use WordPress.com view', 'jetpack' )
		);

		// Prepend the Dashboard switcher to the other custom panels.
		return $contents . $current;
	}

	/**
	 * Gets the identifier of the current screen.
	 *
	 * @return string
	 */
	public function get_current_screen() {
		// phpcs:disable WordPress.Security.NonceVerification
		global $pagenow;

		$screen = isset( $_REQUEST['screen'] ) ? $_REQUEST['screen'] : $pagenow;
		if ( isset( $_GET['post_type'] ) ) {
			$screen = add_query_arg( 'post_type', $_GET['post_type'], $screen );
		}
		if ( isset( $_GET['taxonomy'] ) ) {
			$screen = add_query_arg( 'taxonomy', $_GET['taxonomy'], $screen );
		}
		if ( isset( $_GET['page'] ) ) {
			$screen = add_query_arg( 'page', $_GET['page'], $screen );
		}

		return $screen;
	}
}

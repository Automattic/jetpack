<?php
/**
 * Instant switching between Jetpack admin pages.
 *
 * @package automattic/jetpack-admin-ui
 */

namespace Automattic\Jetpack\Admin_UI;

/**
 * Keeps visited Jetpack admin pages alive in iframe layers, so the sidebar switches between them
 * without a page load. Off unless the `jetpack_admin_instant_nav_enabled` filter turns it on.
 */
class Instant_Nav {

	/**
	 * Hook into wp-admin.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue' ) );
	}

	/**
	 * Enqueue the client on Jetpack admin pages.
	 *
	 * @return void
	 */
	public static function enqueue() {
		if ( 'jetpack' !== get_admin_page_parent() ) {
			return;
		}

		/**
		 * Whether Jetpack admin pages switch through keep-alive iframe layers.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Default false.
		 */
		if ( ! apply_filters( 'jetpack_admin_instant_nav_enabled', false ) ) {
			return;
		}

		$asset_file = dirname( __DIR__ ) . '/build/instant-nav.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : array();

		wp_enqueue_script(
			'jetpack-admin-ui-instant-nav',
			plugins_url( '../build/instant-nav.js', __FILE__ ),
			$asset['dependencies'] ?? array(),
			$asset['version'] ?? Admin_Menu::PACKAGE_VERSION,
			array( 'in_footer' => true )
		);
		wp_add_inline_script(
			'jetpack-admin-ui-instant-nav',
			'window.jetpackInstantNavConfig = ' . wp_json_encode( array( 'pages' => self::get_pages() ), JSON_UNESCAPED_SLASHES ) . ';',
			'before'
		);
	}

	/**
	 * Slugs of the Jetpack submenu pages the current user can open.
	 *
	 * @return string[]
	 */
	private static function get_pages() {
		global $submenu;

		$pages = array();
		foreach ( $submenu['jetpack'] ?? array() as $item ) {
			// Items with a URL slug (external links, `admin.php?…`) are not admin pages of their own.
			if ( isset( $item[2] ) && ! str_contains( $item[2], '/' ) && ! str_contains( $item[2], '?' ) && current_user_can( $item[1] ) ) {
				$pages[] = $item[2];
			}
		}

		/**
		 * Jetpack admin pages that may be kept alive in a layer.
		 *
		 * @since $$next-version$$
		 *
		 * @param string[] $pages Page slugs.
		 */
		return array_values( (array) apply_filters( 'jetpack_admin_instant_nav_pages', $pages ) );
	}
}

<?php
namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

class Admin_Bar_Compatibility {

	/**
	 * Enforces the admin bar stylesheet to load late and synchronously
	 * when the admin bar is present on the page.
	 */
	public static function init() {

		// Force the Admin Bar to render in the footer.
		remove_action( 'wp_body_open', 'wp_admin_bar_render', '0' );

		add_filter( 'jetpack_boost_async_style', array( __CLASS__, 'enable_asynchronous_admin_bar' ), 10, 2 );
		add_action( 'wp_before_admin_bar_render', array( __CLASS__, 'force_admin_bar_stylesheet' ) );
		add_action( 'wp_head', array( __CLASS__, 'dequeue_admin_bar' ), 0 );
	}

	/**
	 * Load the admin bar CSS synchronously.
	 *
	 * @param bool   $is_async Whether admin bar is async.
	 * @param string $handle   Asset handle.
	 *
	 * @return bool
	 */
	public static function enable_asynchronous_admin_bar( $is_async, $handle ) {

		if ( 'admin-bar' === $handle ) {
			$is_async = false;
		}

		return $is_async;
	}

	/**
	 * Dequeue the admin bar stylesheet, so that it's not printed early.
	 *
	 * @see     wp_head
	 */
	public static function dequeue_admin_bar() {
		wp_dequeue_style( 'admin-bar' );
	}

	/**
	 * Force the admin bar stylesheet to print right before the admin bar markup.
	 *
	 * @see     wp_before_admin_bar_render
	 */
	public static function force_admin_bar_stylesheet() {
		wp_print_styles( 'admin-bar' );
	}
}

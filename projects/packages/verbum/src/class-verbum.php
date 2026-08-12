<?php
/**
 * Main loader for the Jetpack Verbum package.
 *
 * @package automattic/jetpack-verbum
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Verbum\Comment_Form;
use Automattic\Jetpack\Verbum\Moderation;
use Automattic\Jetpack\Verbum\REST\Auth_Controller;
use Automattic\Jetpack\Verbum\REST\OEmbed_Controller;
use Automattic\Jetpack\Verbum\Settings;

/**
 * Loads the Verbum commenting experience.
 *
 * Verbum only runs on WordPress.com Simple sites. Jetpack and Atomic sites embed
 * it through an iframe served from jetpack.wordpress.com, which is itself Simple.
 */
class Verbum {

	const PACKAGE_VERSION = '0.1.0-alpha';

	/**
	 * Register the hooks that load each part of Verbum.
	 */
	public static function init() {
		add_action( 'plugins_loaded', array( __CLASS__, 'load_comment_form' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_moderation' ) );
		add_action( 'wp_loaded', array( __CLASS__, 'load_settings' ) );
	}

	/**
	 * Load the front end comment form.
	 */
	public static function load_comment_form() {
		// wpcom ships its own copy of Verbum as an mu-plugin. Defer to it when it is loaded.
		if ( class_exists( 'Verbum_Comments' ) ) {
			return;
		}

		$blog_id = get_current_blog_id();

		// Jetpack loads Verbum through an iframe from jetpack.wordpress.com,
		// so the blog id has to come from the query string.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['blogid'] ) ) {
			$blog_id = intval( $_GET['blogid'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		if ( self::should_disable_comment_experience( $blog_id ) ) {
			return;
		}

		self::load_rest_endpoints();

		new Comment_Form();
	}

	/**
	 * Load comment moderation in wp-admin.
	 */
	public static function load_moderation() {
		new Moderation();
	}

	/**
	 * Load the Verbum settings on the Discussion screen.
	 */
	public static function load_settings() {
		new Settings();
	}

	/**
	 * Register the Verbum REST endpoints.
	 */
	private static function load_rest_endpoints() {
		if ( ! function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
			return;
		}

		wpcom_rest_api_v2_load_plugin( Auth_Controller::class );
		wpcom_rest_api_v2_load_plugin( OEmbed_Controller::class );
	}

	/**
	 * Whether the Verbum comment experience should stay off for a blog.
	 *
	 * @param int $blog_id The blog to check.
	 * @return bool
	 */
	private static function should_disable_comment_experience( $blog_id ) {
		$path_wp_for_teams = WP_CONTENT_DIR . '/lib/wpforteams/functions.php';

		if ( file_exists( $path_wp_for_teams ) ) {
			require_once $path_wp_for_teams;
		}

		// This covers both P2 and P2020 themes.
		$is_p2     = str_contains( get_stylesheet(), 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && is_wpforteams_site( $blog_id );
		$is_forums = str_contains( get_stylesheet(), 'a8c/supportforums' ); // Not in /forums.

		$verbum_option_enabled = get_blog_option( $blog_id, 'enable_verbum_commenting', true );

		if ( empty( $verbum_option_enabled ) ) {
			return true;
		}

		// Don't load any comment experience in the Reader, GlotPress, wp-admin, or P2.
		return ( 1 === $blog_id || TRANSLATE_BLOG_ID === $blog_id || is_admin() || $is_p2 || $is_forums );
	}
}

<?php
/**
 * Attract high-quality traffic to your site.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\Sync\Settings as Sync_Settings;

/**
 * Class for promoting posts.
 */
class Blaze {

	const PACKAGE_VERSION = '0.3.4-alpha';

	/**
	 * The configuration method that is called from the jetpack-config package.
	 */
	public static function init() {
		$blaze = self::get_instance();
		$blaze->register();
	}

	/**
	 * Initialize Blaze UIs.
	 *
	 * @return Blaze Blaze instance.
	 */
	public static function get_instance() {
		return new Blaze();
	}

	/**
	 * Sets up Post List action callbacks.
	 */
	public function register() {

		if ( ! did_action( 'jetpack_on_blaze_init' ) ) {
			if ( self::should_initialize() ) {
				add_filter( 'post_row_actions', array( $this, 'jetpack_blaze_row_action' ), 10, 2 );
				add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_block_editor_assets' ) );
			}

			/**
			 * Action called after initializing Blaze.
			 *
			 * @since 0.1.0
			 */
			do_action( 'jetpack_on_blaze_init' );
		}
	}

	/**
	 * Determines if criteria is met to enable Blaze features.
	 *
	 * @todo - Get response from API if requirements are met on the wpcom-side.
	 *
	 * @return bool
	 */
	public static function should_initialize() {
		$should_initialize = true;
		$is_wpcom          = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$user_data         = $is_wpcom
			? array( 'user_locale' => get_user_locale() )
			: ( new Jetpack_Connection() )->get_connected_user_data();

		/*
		 * These features currently only work on WordPress.com,
		 * so the user should either be connected to WordPress.com for things to work,
		 * or be on a WordPress.com site where we have direct access to user data such as user locale.
		 */
		if ( ! $user_data ) {
			$should_initialize = false;
		}

		// We currently do not show the UI for non-English WordPress.com users.
		if (
			! empty( $user_data['user_locale'] )
			&& ! in_array( $user_data['user_locale'], array( 'en', 'en-gb' ), true )
		) {
			$should_initialize = false;
		}

		// The whole thing is also powered by Sync!
		if ( ! Sync_Settings::is_sync_enabled() ) {
			$should_initialize = false;
		}

		// Only show the UI on WordPress.com Simple and WoA sites for now.
		if (
			! $is_wpcom
			&& ! ( new Host() )->is_woa_site()
		) {
			$should_initialize = false;
		}

		/*
		 * Do not show the UI on private sites
		 * nor on sites that have not been launched yet.
		 */
		if (
			'-1' === get_option( 'blog_public' )
			|| (
				( function_exists( 'site_is_coming_soon' ) && \site_is_coming_soon() )
				|| (bool) get_option( 'wpcom_public_coming_soon' )
			)
		) {
			$should_initialize = false;
		}

		// The feature relies on this module for now.
		// See 1386-gh-dotcom-forge
		if ( ! $is_wpcom && ! ( new Modules() )->is_active( 'json-api' ) ) {
			$should_initialize = false;
		}

		/**
		 * Filter to disable all Blaze functionality.
		 *
		 * @since 0.3.0
		 *
		 * @param bool $should_initialize Whether Blaze should be enabled. Default to true.
		 */
		return apply_filters( 'jetpack_blaze_enabled', $should_initialize );
	}

	/**
	 * Adds the Promote link to the posts list row action.
	 *
	 * @param array   $post_actions The current array of post actions.
	 * @param WP_Post $post The current post in the post list table.
	 *
	 * @return array
	 */
	public function jetpack_blaze_row_action( $post_actions, $post ) {
		$post_id = $post->ID;

		if ( $post->post_status !== 'publish' ) {
			return $post_actions;
		}

		// Might be useful to wrap in a method call for general use without post_id.
		$blaze_url = Redirect::get_url(
			'jetpack-blaze',
			array(
				'query' => 'blazepress-widget=post-' . esc_attr( $post_id ),
			)
		);

		// Add the link, make sure to tooltip hover.
		$text  = _x( 'Blaze', 'Verb', 'jetpack-blaze' );
		$title = _draft_or_post_title( $post );
		/* translators: post title */
		$label                 = sprintf( __( 'Blaze &#8220;%s&#8221; to Tumblr and WordPress.com audiences.', 'jetpack-blaze' ), $title );
		$post_actions['blaze'] = sprintf(
			'<a href="%1$s" target="_blank" title="%2$s" aria-label="%2$s" rel="noopener noreferrer">%3$s</a>',
			esc_url( $blaze_url ),
			esc_attr( $label ),
			esc_html( $text )
		);

		return $post_actions;
	}

	/**
	 * Enqueue block editor assets.
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_block_editor_assets( $hook ) {
		/*
		 * We do not want (nor need) Blaze in the site editor or the widget editor, only in the post editor.
		 * Enqueueing the script in those editors would cause a fatal error.
		 * See #20357 for more info.
		 */
		if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		Assets::register_script(
			'jetpack-promote-editor',
			'../build/editor.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-blaze',
			)
		);
	}
}

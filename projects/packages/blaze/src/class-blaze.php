<?php
/**
 * Attract high-quality traffic to your site.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;

/**
 * Class for promoting posts.
 */
class Blaze {

	const PACKAGE_VERSION = '0.2.0-alpha';

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

		if ( ! self::should_initialize() ) {
			return;
		}

		if ( ! did_action( 'jetpack_on_blaze_init' ) ) {
			add_filter( 'post_row_actions', array( $this, 'jetpack_blaze_row_action' ), 10, 2 );

			/**
			 * Action called after initializing Blaze.
			 *
			 * @since 0.1.0
			 */
			do_action( 'jetpack_on_blaze_init' );
		}

		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_assets' ) );
	}

	/**
	 * Determines if criteria is met to enable Blaze features.
	 * Needs to be:
	 * - Not filtered out.
	 * - Blaze enabled.
	 *
	 * @todo - Get response from API if requirements are met on the wpcom-side.
	 *
	 * @return bool
	 */
	public static function should_initialize() {
		/**
		 * Filter to disable all Blaze functionality.
		 *
		 * @since $$next-version$$
		 * @since-jetpack $$next-version$$
		 *
		 * @param bool true Whether Blaze should be enabled. Default to true.
		 */
		if ( ! apply_filters( 'jetpack_blaze_enabled', true ) ) {
			return false;
		}

		if ( ! ( new Jetpack_Connection() )->is_user_connected() ) {
			return false;
		}

		return true;
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

		// Might be useful to wrap in a method call for general use without post_id.
		$blaze_url = Redirect::get_url(
			'jetpack-blaze',
			array(
				'query' => 'blazepress-widget=post-' . esc_attr( $post_id ),
			)
		);

		// Add the link, make sure to tooltip hover.
		$text  = _x( 'Promote', 'Verb', 'jetpack-blaze' );
		$title = _draft_or_post_title( $post );
		/* translators: post title */
		$label                 = sprintf( __( 'Promote &#8220;%s&#8221; via Jetpack Social', 'jetpack-blaze' ), $title );
		$post_actions['blaze'] = sprintf(
			'<a href="%1$s" target="_blank" title="%2$s" aria-label="%2$s">%3$s</a>',
			esc_url( $blaze_url ),
			esc_attr( $label ),
			esc_html( $text )
		);

		return $post_actions;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public function enqueue_block_editor_assets() {
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

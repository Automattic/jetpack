<?php
/**
 * Attract high-quality traffic to your site.
 *
 * @package automattic/jetpack-promote-posts
 */

namespace Automattic\Jetpack;

/**
 * Class for promoting posts.
 */
class Promote_Posts {

	const PACKAGE_VERSION = '0.1.0';

	/**
	 * The configuration method that is called from the jetpack-config package.
	 */
	public static function configure() {
		$promote_posts = self::get_instance();
		$promote_posts->register();
	}

	/**
	 * Initialize Promote Posts UIs.
	 *
	 * @return Promote_Posts Promote_Posts instance.
	 */
	public static function get_instance() {
		return new Promote_Posts();
	}

	/**
	 * Sets up Post List action callbacks.
	 */
	public function register() {
		// @todo filter to turn it off.
		// @todo criteria for enabling: User connected, etc
		// @todo When showing for individual posts: Is it a supported post type? Basically anything that Jetpack syncs.
		// @todo Organize tracks events.
		if ( ! did_action( 'jetpack_on_promote_posts_init' ) ) {
			add_filter( 'post_row_actions', array( $this, 'jetpack_promote_posts_row_action' ), 10, 2 );

			/**
			 * Action called after initializing Post_List Admin resources.
			 *
			 * @since 0.1.0
			 */
			do_action( 'jetpack_on_promote_posts_init' );
		}
	}

	/**
	 * Adds the Promote link to the posts list row action.
	 *
	 * @param array   $post_actions The current array of post actions.
	 * @param WP_Post $post The current post in the post list table.
	 *
	 * @return array
	 */
	public function jetpack_promote_posts_row_action( $post_actions, $post ) {
		$post_id = $post->ID;

		// @todo wrap in method call, for general use?
		$promote_post_url = Redirect::get_url(
			'jetpack-promote-posts',
			array(
				'query' => 'blazepress-widget=post-' . esc_attr( $post_id ),
			)
		);

		// Add the link, make sure to tooltip hover.
		$text  = _x( 'Promote', 'Verb', 'jetpack-promote-posts' );
		$title = _draft_or_post_title( $post );
		/* translators: post title */
		$label                   = sprintf( __( 'Promote &#8220;%s&#8221; via Jetpack Social', 'jetpack-promote-posts' ), $title );
		$post_actions['promote'] = sprintf(
			'<a href="%1$s" target="_blank" title="%2$s" aria-label="%2$s">%3$s</a>',
			esc_url( $promote_post_url ),
			esc_attr( $label ),
			esc_html( $text )
		);

		return $post_actions;
	}
}

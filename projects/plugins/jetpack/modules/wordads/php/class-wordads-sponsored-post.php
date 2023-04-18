<?php
/**
 * WordAds Sponsored Post
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Assets;

/**
 * Class WordAds_Sponsored_Post
 */
class WordAds_Sponsored_Post {

	/**
	 * The Sponsored Post ID.
	 */
	const POST_ID = -99;

	/**
	 * Initializes scripts and hooks.
	 */
	public static function init() {
		// Inject the sponsored post.
		add_action( 'loop_start', array( __CLASS__, 'inject_sponsored_post' ) );

		// Override post display.
		add_filter( 'post_class', array( __CLASS__, 'add_post_class' ), 10, 3 );
		add_filter( 'post_link', array( __CLASS__, 'override_post_link' ), 10, 2 );

		// Remove edit post link.
		add_filter( 'get_edit_post_link', array( __CLASS__, 'remove_edit_post_link' ), 99, 2 );

		// Allow placeholder links through esc_url() filter.
		add_filter( 'clean_url', array( __CLASS__, 'clean_placeholder_link' ), 10, 2 );

		wp_enqueue_script(
			'wordads_sponsored',
			Assets::get_file_url_for_environment(
				'_inc/build/wordads/js/wordads-sponsored-post.min.js',
				'modules/wordads/js/wordads-sponsored-post.js'
			),
			array(),
			JETPACK__VERSION,
			false
		);

		wp_localize_script(
			'wordads_sponsored',
			'wa_sponsored_post',
			array(
				'template' => '',
				'selector' => '',
			)
		);
	}

	/**
	 * Inject the sponsored post into the WP query
	 *
	 * @param WP_Query $wp_query The WP_Query.
	 *
	 * @return array Array of Posts.
	 */
	public static function inject_sponsored_post( $wp_query ) {

		// Don't run on AMP pages.
		if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
			return;
		}

		// Only inject on main front page query.
		if ( ! ( is_front_page() && $wp_query->is_main_query() ) ) {
			return;
		}

		$dummy                 = new stdClass();
		$dummy->ID             = self::POST_ID;
		$dummy->post_title     = '{{sp_link_text}}';
		$dummy->post_content   = '{{sp_post_thumbnail}}{{sp_post_content}}{{sp_cta}}';
		$dummy->post_excerpt   = $dummy->post_content;
		$dummy->post_date      = current_time( 'mysql' ); // If you don't add a post_date then WordPress fills it automatically with the current date + time.
		$dummy->post_date_gmt  = current_time( 'mysql', 1 );
		$dummy->post_author    = '{{sp_post_author}}';
		$dummy->filter         = 'raw';
		$dummy->comment_status = 'closed'; // Prevent commenting.
		$dummy_post            = new WP_Post( $dummy );
		wp_cache_add( $dummy->ID, $dummy_post, 'posts' );

		$wp_query->posts[] = $dummy_post;
		++$wp_query->post_count;
	}

	/**
	 * Override the post link with macro.
	 *
	 * @param string  $permalink The permalink.
	 * @param WP_Post $post The post.
	 *
	 * @return string The overridden post link.
	 */
	public static function override_post_link( $permalink, $post ) {
		if ( self::POST_ID === $post->ID ) {
			$permalink = '{{sp_permalink}}';
		}

		return $permalink;
	}

	/**
	 * Add sponsored post CSS class.
	 *
	 * @param string[] $classes An array of post class names.
	 * @param string[] $class An array of additional names added to the post.
	 * @param int      $post_id The post ID.
	 *
	 * @return string[] Array of class names.
	 */
	public static function add_post_class( $classes, $class, $post_id ) {
		if ( self::POST_ID === $post_id ) {
			$classes[] = 'wa-sponsored-post';
		}

		return $classes;
	}

	/**
	 * Remove the edit link in the post.
	 *
	 * @param string $link The edit link.
	 * @param int    $post_id The post ID.
	 *
	 * @return string The edit link.
	 */
	public static function remove_edit_post_link( $link, $post_id ) {
		if ( self::POST_ID === $post_id ) {
			$link = '';
		}

		return $link;
	}

	/**
	 * Allows macro to appear in the template link.
	 *
	 * @param string $good_protocol_url The cleaned URL to be returned.
	 * @param string $original_url The URL prior to cleaning.
	 *
	 * @return string The cleaned URL.
	 */
	public static function clean_placeholder_link( $good_protocol_url, $original_url ) {

		// These are URLs that would not normally pass the esc_url() check, but we want them output on the page anyway.
		// They are either data URIs or will be replaced later via Javascript.
		$good_urls = array(
			'{{sp_permalink}}',
		);

		// Found a matching URL.
		if ( in_array( $original_url, $good_urls, true ) ) {
			return $original_url;
		}

		// Pass through.
		return $good_protocol_url;
	}

}

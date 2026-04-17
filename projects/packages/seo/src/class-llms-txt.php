<?php
/**
 * LLMs.txt generation.
 *
 * Intercepts `/llms.txt` via the `parse_request` hook (mirroring how Jetpack's
 * sitemap module handles routing) and emits an auto-curated listing of the
 * site's most recent public posts. Users can opt into including pages, override
 * the max item count, and supply a manual textarea override.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Generates and serves /llms.txt.
 */
class LLMS_Txt {

	const ENABLED_OPTION = 'jetpack_seo_llms_txt_enabled';
	const CONFIG_OPTION  = 'jetpack_seo_llms_txt_config';
	const ROUTE          = 'llms.txt';

	/**
	 * Wire up the parse_request hook.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'parse_request', array( __CLASS__, 'handle_request' ) );
	}

	/**
	 * Default config for llms.txt generation.
	 *
	 * @return array
	 */
	public static function get_default_config() {
		return array(
			'include_types' => array( 'post', 'page' ),
			'max_items'     => 50,
			'override'      => '',
		);
	}

	/**
	 * Read the current config with defaults applied.
	 *
	 * @return array
	 */
	public static function get_config() {
		$stored = get_option( self::CONFIG_OPTION, array() );
		if ( ! is_array( $stored ) ) {
			$stored = array();
		}
		return array_merge( self::get_default_config(), $stored );
	}

	/**
	 * Whether llms.txt generation is currently enabled.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		return (bool) get_option( self::ENABLED_OPTION, false );
	}

	/**
	 * Parse_request callback — serves /llms.txt when enabled.
	 *
	 * @param \WP $wp The global WP request object.
	 * @return void
	 */
	public static function handle_request( $wp ) {
		if ( ! isset( $wp->request ) || self::ROUTE !== trim( $wp->request, '/' ) ) {
			return;
		}
		if ( ! self::is_enabled() ) {
			return;
		}

		header( 'Content-Type: text/plain; charset=utf-8' );
		header( 'X-Robots-Tag: noindex' );
		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		echo self::render();
		exit;
	}

	/**
	 * Build the llms.txt body.
	 *
	 * @return string
	 */
	public static function render() {
		$config = self::get_config();
		if ( ! empty( $config['override'] ) ) {
			return (string) $config['override'];
		}

		$site_title   = get_bloginfo( 'name' );
		$site_tagline = get_bloginfo( 'description' );
		$site_url     = home_url( '/' );

		$lines   = array();
		$lines[] = '# ' . $site_title;
		if ( $site_tagline ) {
			$lines[] = '';
			$lines[] = '> ' . $site_tagline;
		}
		$lines[] = '';
		$lines[] = '- Site: ' . $site_url;
		$lines[] = '';
		$lines[] = '## Recent content';
		$lines[] = '';

		$posts = get_posts(
			array(
				'post_type'      => (array) $config['include_types'],
				'post_status'    => 'publish',
				'posts_per_page' => max( 1, min( 500, (int) $config['max_items'] ) ),
				'orderby'        => 'date',
				'order'          => 'DESC',
			)
		);

		foreach ( $posts as $post ) {
			if ( get_post_meta( $post->ID, 'jetpack_seo_noindex', true ) ) {
				continue;
			}
			$title   = wp_strip_all_tags( get_the_title( $post ) );
			$url     = get_permalink( $post );
			$excerpt = wp_strip_all_tags( get_the_excerpt( $post ) );
			$excerpt = trim( preg_replace( '/\s+/', ' ', $excerpt ) );
			$line    = sprintf( '- [%s](%s)', $title, $url );
			if ( $excerpt ) {
				$line .= ': ' . $excerpt;
			}
			$lines[] = $line;
		}

		return implode( "\n", $lines ) . "\n";
	}
}

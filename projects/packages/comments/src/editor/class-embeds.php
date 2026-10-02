<?php
/**
 * Embeds in comments.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * The embed block in a comment: a URL from a provider core trusts, previewed through an open
 * route and drawn through core's embed cache. Discovery is off at every step, so the only
 * requests that leave go to a provider's own endpoint, never to an address a commenter typed.
 *
 * The route is `wpcom/v2`, registered as the identity routes are, so one definition is
 * same-origin on self-hosted and Atomic and served through public-api on Simple.
 */
class Embeds extends WP_REST_Controller {

	const ROUTE = 'comments/embed';

	/**
	 * The instance registered without the WPCOM loader, which otherwise holds it.
	 *
	 * @var Embeds|null
	 */
	private static $instance = null;

	/**
	 * Whether the route has been hooked.
	 *
	 * @var bool
	 */
	private static $hooked = false;

	/**
	 * Wire the route onto `rest_api_init`. The loader instantiates this once.
	 */
	public function __construct() {
		$this->namespace = 'wpcom/v2';
		$this->rest_base = self::ROUTE;

		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register the route. Safe to call more than once.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$hooked ) {
			return;
		}

		self::$hooked = true;

		if ( function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
			wpcom_rest_api_v2_load_plugin( self::class );
		} else {
			self::$instance = new self();
		}
	}

	/**
	 * Whether the editor offers the embed block. The route is registered on every WordPress.com
	 * site, so this is also what keeps it closed where the comment form is not on.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		/**
		 * Offer the embed block in the Jetpack Comments editor.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled Whether to offer it. Default true, wherever the block editor is on.
		 */
		return Comments::is_enabled() && Block_Editor::is_enabled() && (bool) apply_filters( 'jetpack_comments_block_editor_embeds', true );
	}

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . self::ROUTE,
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'preview' ),
				'permission_callback' => '__return_true',
				'args'                => array(
					'url' => array(
						'type'     => 'string',
						'required' => true,
					),
				),
			)
		);
	}

	/**
	 * The oEmbed data for a URL, shaped as core's proxy shapes it, for the editor's preview.
	 *
	 * @param WP_REST_Request $request The request.
	 * @return WP_REST_Response|WP_Error
	 */
	public function preview( WP_REST_Request $request ) {
		if ( ! self::is_enabled() ) {
			return new WP_Error( 'not_enabled', __( 'Embeds are not available on this site.', 'jetpack-comments' ), array( 'status' => 404 ) );
		}

		$url = self::trusted_url( $request->get_param( 'url' ) );

		if ( ! $url ) {
			return new WP_Error( 'oembed_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		// A day, as core's proxy keeps its lookups, so a popular link costs one provider request.
		$cache_key = 'jetpack_comments_embed_' . md5( $url );
		$data      = get_transient( $cache_key );

		if ( is_object( $data ) ) {
			return self::respond( $data );
		}

		// Each lookup is a request to a provider on the visitor's behalf. Thirty in ten minutes covers
		// a reader trying links, not a script. The object cache counts atomically; a site without a
		// persistent one falls back to a transient, which a parallel burst can slip past.
		$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$key = 'embed_previews_' . md5( $ip );

		if ( wp_using_ext_object_cache() ) {
			wp_cache_add( $key, 0, 'jetpack_comments', 10 * MINUTE_IN_SECONDS );
			$count = (int) wp_cache_incr( $key, 1, 'jetpack_comments' );
		} else {
			$count = (int) get_transient( 'jetpack_comments_' . $key ) + 1;
			set_transient( 'jetpack_comments_' . $key, $count, 10 * MINUTE_IN_SECONDS );
		}

		if ( $count > 30 ) {
			return new WP_Error( 'rate_limited', __( 'Too many requests. Please wait a moment and try again.', 'jetpack-comments' ), array( 'status' => 429 ) );
		}

		$oembed = _wp_oembed_get_object();
		$args   = array_merge( wp_embed_defaults( $url ), array( 'discover' => false ) );
		$data   = $oembed->get_data( $url, $args );

		if ( ! is_object( $data ) ) {
			return new WP_Error( 'oembed_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		/** This filter is documented in wp-includes/class-wp-oembed.php */
		$data->html = apply_filters( 'oembed_result', $oembed->data2html( $data, $url ), $url, $args );

		/** This filter is documented in wp-includes/class-wp-oembed-controller.php */
		set_transient( $cache_key, $data, apply_filters( 'rest_oembed_ttl', DAY_IN_SECONDS, $url, $args ) );

		return self::respond( $data );
	}

	/**
	 * The oEmbed data as a response the browser and any cache between may keep: it is the same for every visitor.
	 *
	 * @param object $data The oEmbed data.
	 * @return WP_REST_Response
	 */
	private static function respond( $data ) {
		$response = new WP_REST_Response( $data );
		$response->header( 'Cache-Control', 'public, max-age=' . HOUR_IN_SECONDS );

		return $response;
	}

	/**
	 * The URL as the site may embed it: http or https, under 2 KB, and from a provider core trusts.
	 *
	 * @param mixed $url What the commenter gave.
	 * @return string|false
	 */
	public static function trusted_url( $url ) {
		if ( ! self::is_enabled() || ! is_string( $url ) ) {
			return false;
		}

		// kses writes & as &amp;, in the block's markup and in its attributes alike.
		$url = trim( html_entity_decode( $url, ENT_QUOTES ) );

		if ( '' === $url || strlen( $url ) > 2048 ) {
			return false;
		}

		$url = esc_url_raw( $url, array( 'http', 'https' ) );

		if ( '' === $url || false === _wp_oembed_get_object()->get_provider( $url, array( 'discover' => false ) ) ) {
			return false;
		}

		return $url;
	}

	/**
	 * The embed block as this package writes it: the URL alone, in the editor's markup. A URL the
	 * site will not embed becomes a paragraph holding the link. At render, the figure holds the
	 * embed itself, or the link where it may not.
	 *
	 * @param array     $block  Parsed embed block.
	 * @param bool|null $render Null while saving; at render, whether the comment may show the embed.
	 * @return array|null The block to keep, if any.
	 */
	public static function block( array $block, $render = null ) {
		$raw = isset( $block['attrs']['url'] ) && is_string( $block['attrs']['url'] ) ? $block['attrs']['url'] : '';
		$url = self::trusted_url( $raw );

		if ( ! $url ) {
			$raw  = trim( html_entity_decode( $raw, ENT_QUOTES ) );
			$link = esc_url_raw( $raw, array( 'http', 'https' ) );
			$text = $link ? '<a href="' . esc_url( $link ) . '">' . esc_html( $link ) . '</a>' : esc_html( $raw );

			if ( '' === $text ) {
				return null;
			}

			$html = "\n<p>$text</p>\n";

			return array(
				'blockName'    => 'core/paragraph',
				'attrs'        => array(),
				'innerBlocks'  => array(),
				'innerHTML'    => $html,
				'innerContent' => array( $html ),
			);
		}

		if ( null === $render ) {
			$block['attrs'] = array( 'url' => $url );
			$content        = esc_html( $url );
		} else {
			global $wp_embed;

			// Through core's embed cache, which the site's posts share; the delimiters are stripped after.
			$block['attrs'] = array();
			$content        = false;

			if ( $render && $wp_embed instanceof \WP_Embed ) {
				$on_fail                        = $wp_embed->return_false_on_fail;
				$wp_embed->return_false_on_fail = true;
				add_filter( 'embed_oembed_discover', '__return_false', 999 );

				$content = $wp_embed->shortcode( array(), $url );

				remove_filter( 'embed_oembed_discover', '__return_false', 999 );
				$wp_embed->return_false_on_fail = $on_fail;
			}

			if ( ! is_string( $content ) || '' === $content || $content === $url ) {
				$content = '<a href="' . esc_url( $url ) . '" rel="nofollow ugc">' . esc_html( $url ) . '</a>';
			} else {
				wp_enqueue_style( 'wp-block-embed' );
			}
		}

		$html = "\n<figure class=\"wp-block-embed\"><div class=\"wp-block-embed__wrapper\">\n$content\n</div></figure>\n";

		$block['innerBlocks']  = array();
		$block['innerHTML']    = $html;
		$block['innerContent'] = array( $html );

		return $block;
	}
}

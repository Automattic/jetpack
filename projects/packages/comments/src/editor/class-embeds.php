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
 * route and drawn through core's embed cache. Discovery is off at every step, so no request
 * leaves for an address a commenter typed; the only requests go to the providers' own endpoints.
 *
 * The route is `wpcom/v2`, registered as the identity routes are, so one definition is
 * same-origin on self-hosted and Atomic and served through public-api on Simple.
 */
class Embeds extends WP_REST_Controller {

	const ROUTE = 'comments/embed';

	/**
	 * The oEmbed types the block's classes may name.
	 */
	const TYPES = array( 'video', 'rich', 'photo', 'link', 'wp-embed' );

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
	 * The figure classes written during the comment being saved, which kses lets through and nothing else.
	 *
	 * @var string[]
	 */
	private static $classes = array();

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
	 * Whether the editor offers the embed block.
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
		return Block_Editor::is_enabled() && (bool) apply_filters( 'jetpack_comments_block_editor_embeds', true );
	}

	/**
	 * The route's URL for this host, or nothing while embeds are off.
	 *
	 * @return string
	 */
	public static function url() {
		return self::is_enabled() ? Checkpoint_Endpoint::route_url( self::ROUTE ) : '';
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

		$key  = 'jetpack_comments_embed_' . md5( $url );
		$data = get_transient( $key );

		if ( false === $data ) {
			// Each miss is a request to a provider on the visitor's behalf. Thirty in ten
			// minutes covers a reader trying links, not a script.
			$ip        = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
			$count_key = 'jetpack_comments_embed_previews_' . md5( $ip );
			$count     = (int) get_transient( $count_key );

			if ( $count >= 30 ) {
				return new WP_Error( 'rate_limited', __( 'Too many requests. Please wait a moment and try again.', 'jetpack-comments' ), array( 'status' => 429 ) );
			}

			set_transient( $count_key, $count + 1, 10 * MINUTE_IN_SECONDS );

			$data = self::fetch( $url );
			// A miss is kept too, for less time, so a dead link is not asked for again and again.
			set_transient( $key, $data ? $data : 0, $data ? DAY_IN_SECONDS : HOUR_IN_SECONDS );
		}

		if ( ! $data ) {
			return new WP_Error( 'oembed_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		$response = new WP_REST_Response( $data );
		// The same for every visitor, so a cache between them may keep it.
		$response->header( 'Cache-Control', 'public, max-age=' . HOUR_IN_SECONDS );

		return $response;
	}

	/**
	 * The provider's data, with the HTML built as core's proxy builds it.
	 *
	 * @param string $url A trusted URL.
	 * @return object|false
	 */
	private static function fetch( $url ) {
		$oembed = _wp_oembed_get_object();
		$args   = array_merge( wp_embed_defaults( $url ), array( 'discover' => false ) );
		$data   = $oembed->get_data( $url, $args );

		if ( ! is_object( $data ) ) {
			return false;
		}

		/** This filter is documented in wp-includes/class-wp-oembed.php */
		$data->html = apply_filters( 'oembed_result', $oembed->data2html( $data, $url ), $url, $args );

		return $data;
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

		// The URL in the block's markup is text, where kses writes & as &amp;.
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
	 * The embed block as this package writes it: the URL, the classes the editor's preview
	 * chose, and the caption. A URL the site will not embed becomes a paragraph holding the
	 * link. At render, the figure holds the embed itself, or the link where it may not.
	 *
	 * @param array     $block  Parsed embed block.
	 * @param bool|null $render Null while saving; at render, whether the comment may show the embed.
	 * @return array|null The block to keep, if any.
	 */
	public static function block( array $block, $render = null ) {
		$attrs = is_array( $block['attrs'] ) ? $block['attrs'] : array();
		$inner = (string) $block['innerHTML'];
		$raw   = isset( $attrs['url'] ) && is_string( $attrs['url'] ) ? $attrs['url'] : self::wrapper_text( $inner );
		$url   = self::trusted_url( $raw );

		if ( ! $url ) {
			return self::link_block( $raw );
		}

		$type   = isset( $attrs['type'] ) && in_array( $attrs['type'], self::TYPES, true ) ? $attrs['type'] : '';
		$slug   = isset( $attrs['providerNameSlug'] ) && is_string( $attrs['providerNameSlug'] ) && preg_match( '/^[a-z0-9-]{1,40}$/', $attrs['providerNameSlug'] ) ? $attrs['providerNameSlug'] : '';
		$aspect = isset( $attrs['className'] ) && is_string( $attrs['className'] ) ? array_values( preg_grep( '/^wp-embed-aspect-\d{1,2}-\d{1,2}$/', preg_split( '/\s+/', $attrs['className'] ) ) ) : array();
		// Already through kses once, so this is idempotent at render.
		$caption = preg_match( '#<figcaption\b[^>]*>(.*?)</figcaption>#s', $inner, $match ) ? trim( wp_kses( $match[1], 'data' ) ) : '';

		if ( $aspect ) {
			$aspect[] = 'wp-has-aspect-ratio';
		}

		$class = implode(
			' ',
			array_merge(
				array( 'wp-block-embed' ),
				$type ? array( "is-type-$type" ) : array(),
				$slug ? array( "is-provider-$slug", "wp-block-embed-$slug" ) : array(),
				$aspect
			)
		);

		if ( null === $render ) {
			self::$classes[] = $class;
			$content         = esc_html( $url );
			$block['attrs']  = array_filter(
				array(
					'url'              => $url,
					'type'             => $type,
					'providerNameSlug' => $slug,
					'className'        => implode( ' ', $aspect ),
				)
			);
		} else {
			$html    = $render ? self::html( $url ) : false;
			$content = $html ? $html : '<a href="' . esc_url( $url ) . '" rel="nofollow ugc">' . esc_html( $url ) . '</a>';
			// Rendered the way a post's embed is, with the delimiters stripped after.
			$block['attrs'] = array();

			if ( $html ) {
				wp_enqueue_style( 'wp-block-embed' );
			}
		}

		$html = sprintf(
			"\n<figure class=\"%s\"><div class=\"wp-block-embed__wrapper\">\n%s\n</div>%s</figure>\n",
			esc_attr( $class ),
			$content,
			$caption ? '<figcaption class="wp-element-caption">' . $caption . '</figcaption>' : ''
		);

		$block['innerBlocks']  = array();
		$block['innerHTML']    = $html;
		$block['innerContent'] = array( $html );

		return $block;
	}

	/**
	 * The figure classes written while saving the current comment.
	 *
	 * @return string[]
	 */
	public static function saved_classes() {
		return self::$classes;
	}

	/**
	 * Forget them with the comment they were for.
	 *
	 * @return void
	 */
	public static function forget() {
		self::$classes = array();
	}

	/**
	 * The embed's HTML through core's embed cache, which the site's posts share.
	 *
	 * @param string $url A trusted URL.
	 * @return string|false False when the provider does not answer.
	 */
	public static function html( $url ) {
		global $wp_embed;

		if ( ! $wp_embed instanceof \WP_Embed ) {
			return false;
		}

		$on_fail                        = $wp_embed->return_false_on_fail;
		$wp_embed->return_false_on_fail = true;
		add_filter( 'embed_oembed_discover', '__return_false', 999 );

		$html = $wp_embed->shortcode( array(), $url );

		remove_filter( 'embed_oembed_discover', '__return_false', 999 );
		$wp_embed->return_false_on_fail = $on_fail;

		return is_string( $html ) && '' !== $html && $html !== $url ? $html : false;
	}

	/**
	 * The URL on its own line inside the block's wrapper.
	 *
	 * @param string $inner The block's inner HTML.
	 * @return string
	 */
	private static function wrapper_text( $inner ) {
		return preg_match( '#<div class="wp-block-embed__wrapper">(.*?)</div>#s', $inner, $match ) ? trim( wp_strip_all_tags( $match[1] ) ) : '';
	}

	/**
	 * A paragraph holding the link, for a URL the site will not embed.
	 *
	 * @param mixed $raw What the commenter gave.
	 * @return array|null Nothing when there was no text either.
	 */
	private static function link_block( $raw ) {
		$raw  = is_string( $raw ) ? trim( html_entity_decode( $raw, ENT_QUOTES ) ) : '';
		$url  = esc_url_raw( $raw, array( 'http', 'https' ) );
		$text = $url ? '<a href="' . esc_url( $url ) . '">' . esc_html( $url ) . '</a>' : esc_html( $raw );

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
}

<?php
/**
 * Embeds in comments.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\IP\Utils as IP_Utils;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * The embed block in a comment: a URL from a provider core trusts, previewed through an open route and
 * drawn from the same cached lookup, as a player or a card, never with the provider's script. Discovery is off at
 * every step, so the only requests that leave go to a provider's own endpoint, never to an
 * address a commenter typed.
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
		 * @since 0.5.0
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

		$data = self::data( $url, false );

		if ( false === $data ) {
			if ( self::rate_limited() ) {
				return new WP_Error( 'rate_limited', __( 'Too many requests. Please wait a moment and try again.', 'jetpack-comments' ), array( 'status' => 429 ) );
			}

			$data = self::data( $url );
		}

		if ( ! is_object( $data ) ) {
			return new WP_Error( 'oembed_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		return self::respond( $data, $url );
	}

	/**
	 * Whether this visitor has asked for too many previews that were not already cached.
	 *
	 * @return bool
	 */
	private static function rate_limited() {
		// Each lookup is a request to a provider on the visitor's behalf. Thirty in ten minutes covers
		// a reader trying links, not a script. The object cache counts atomically; a site without a
		// persistent one, or one that cannot be reached, falls back to a transient, which a parallel burst can slip past.
		// The address comes through the site's trusted proxy header, so one proxy is not one bucket.
		$key   = 'embed_previews_' . md5( (string) IP_Utils::get_ip() );
		$count = false;

		if ( wp_using_ext_object_cache() ) {
			wp_cache_add( $key, 0, 'jetpack_comments', 10 * MINUTE_IN_SECONDS );
			$count = wp_cache_incr( $key, 1, 'jetpack_comments' );
		}

		if ( false === $count ) {
			$count = (int) get_transient( 'jetpack_comments_' . $key ) + 1;
			set_transient( 'jetpack_comments_' . $key, $count, 10 * MINUTE_IN_SECONDS );
		}

		return $count > 30;
	}

	/**
	 * The provider's oEmbed data for a trusted URL, shared by the preview and the comment.
	 *
	 * @param string $url   A URL from trusted_url().
	 * @param bool   $fetch Whether to ask the provider when nothing is cached.
	 * @return object|string|false The data, '' when the provider had none, or false when not cached and not fetched.
	 */
	private static function data( $url, $fetch = true ) {
		$cache_key = 'jetpack_comments_embed_' . md5( $url );
		$cached    = get_transient( $cache_key );
		$lookup    = self::lookup_url( $url );
		$args      = array_merge( wp_embed_defaults( $lookup ), array( 'discover' => false ) );

		// Fresh for a day, as core's proxy keeps its lookups, so a popular link costs one provider request.
		/** This filter is documented in wp-includes/class-wp-oembed-controller.php */
		$ttl   = (int) apply_filters( 'rest_oembed_ttl', DAY_IN_SECONDS, $lookup, $args );
		$fresh = '' === $cached || ( is_object( $cached ) && (int) ( $cached->jetpack_comments_fetched ?? 0 ) > time() - $ttl );

		if ( $fresh || ! $fetch ) {
			return $cached;
		}

		$oembed = _wp_oembed_get_object();
		$data   = $oembed->get_data( $lookup, $args );

		if ( is_object( $data ) ) {
			/** This filter is documented in wp-includes/class-wp-oembed.php */
			$data->html = apply_filters( 'oembed_result', $oembed->data2html( $data, $lookup ), $lookup, $args );
		} elseif ( is_object( $cached ) && '' !== self::player( $cached ) ) {
			// A player outlives a failed refresh, as in core's embed cache. A card does not: its post may be gone.
			$data = $cached;
		} else {
			// Kept an hour, so a dead link costs one provider request rather than one per page view.
			set_transient( $cache_key, '', HOUR_IN_SECONDS );
			return '';
		}

		// Kept past fresh, so a player is still there to fall back on when the next refresh fails.
		$data->jetpack_comments_fetched = time();
		set_transient( $cache_key, $data, $ttl + WEEK_IN_SECONDS );

		return $data;
	}

	/**
	 * The oEmbed data as a response the browser and any cache between may keep: it is the same for every visitor.
	 *
	 * @param object $data The oEmbed data.
	 * @param string $url  The URL it was fetched for.
	 * @return WP_REST_Response|WP_Error
	 */
	private static function respond( $data, $url ) {
		// The editor would hand each entry to SandBox as a script of its own.
		unset( $data->scripts, $data->jetpack_comments_fetched );
		$player     = self::player( $data );
		$data->card = '' === $player;
		$data->html = $data->card ? self::card( $data, $url ) : $player;

		// Nothing to show, so the comment will hold the link. Say so now.
		if ( '' === $data->html ) {
			return new WP_Error( 'oembed_invalid_url', get_status_header_desc( 404 ), array( 'status' => 404 ) );
		}

		$response = new WP_REST_Response( $data );
		$response->header( 'Cache-Control', 'public, max-age=' . HOUR_IN_SECONDS );

		return $response;
	}

	/**
	 * The player for the oEmbed data, or '' when it has none.
	 *
	 * @param object $data The oEmbed data.
	 * @return string
	 */
	private static function player( $data ) {
		$video = isset( $data->embed_product_id ) && is_scalar( $data->embed_product_id ) ? (string) $data->embed_product_id : '';

		// TikTok's oEmbed sends its script, but it also documents a player that needs none.
		if ( 'TikTok' === ( $data->provider_name ?? '' ) && ctype_digit( $video ) ) {
			$author = isset( $data->author_name ) && is_string( $data->author_name ) && '' !== $data->author_name ? $data->author_name : 'TikTok';
			/* translators: %s: The video's author. */
			$title = sprintf( __( 'TikTok video by %s', 'jetpack-comments' ), $author );

			return '<iframe src="https://www.tiktok.com/player/v1/' . $video . '" width="325" height="578" title="' . esc_attr( $title ) . '" allow="fullscreen" allowfullscreen></iframe>';
		}

		return self::sanitize_html( $data->html ?? '' );
	}

	/**
	 * A provider's player or photo, rebuilt as a bare iframe or img, or '' when it sent neither. Nothing else of
	 * its HTML is kept, so no script or inline handler runs first-party for every reader on a commenter's say-so.
	 *
	 * @param mixed $html What the provider sent.
	 * @return string
	 */
	public static function sanitize_html( $html ) {
		if ( ! is_string( $html ) ) {
			return '';
		}

		$kept = array(
			'IFRAME' => array( 'width', 'height', 'title', 'allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy', 'sandbox' ),
			'IMG'    => array( 'width', 'height', 'alt' ),
		);

		$sent = new \WP_HTML_Tag_Processor( $html );
		while ( $sent->next_tag() ) {
			$name = (string) $sent->get_tag();
			$src  = $sent->get_attribute( 'src' );
			$src  = is_string( $src ) ? esc_url_raw( str_starts_with( $src, '//' ) ? 'https:' . $src : $src ) : '';

			if ( ! isset( $kept[ $name ] ) || 'https' !== wp_parse_url( $src, PHP_URL_SCHEME ) ) {
				continue;
			}

			// A tag of our own, so only the attributes listed above come along.
			$tag = new \WP_HTML_Tag_Processor( 'IFRAME' === $name ? '<iframe></iframe>' : '<img>' );
			$tag->next_tag();
			$tag->set_attribute( 'src', $src );
			foreach ( $kept[ $name ] as $attribute ) {
				$value = $sent->get_attribute( $attribute );
				if ( null !== $value ) {
					$tag->set_attribute( $attribute, $value );
				}
			}

			return $tag->get_updated_html();
		}

		return '';
	}

	/**
	 * A post a provider draws with its own script, as a card of our own markup: the brand's icon, its author,
	 * date, and text, and a link to the URL. Only text comes from the provider, so its markup never reaches the page.
	 *
	 * @param object $data The oEmbed data.
	 * @param string $url  The trusted URL the card links to.
	 * @return string The card, or '' when the provider sent no text.
	 */
	public static function card( $data, $url ) {
		$text  = '';
		$after = '';
		$last  = '';
		$html  = new \WP_HTML_Tag_Processor( is_string( $data->html ?? null ) ? $data->html : '' );

		// The post's text is the first paragraph of the provider's no-script fallback.
		if ( $html->next_tag( 'p' ) ) {
			while ( $html->next_token() ) {
				$tag = $html->get_tag();

				if ( '#text' === $html->get_token_type() ) {
					$text .= $html->get_modifiable_text();
				} elseif ( 'BR' === $tag ) {
					$text .= "\n";
				} elseif ( 'P' === $tag && $html->is_tag_closer() ) {
					break;
				}
			}

			// Then the attribution, whose last link is the post's date.
			while ( $html->next_token() ) {
				$tag = $html->get_tag();

				if ( '#text' === $html->get_token_type() ) {
					$after .= $html->get_modifiable_text();
					$last  .= $html->get_modifiable_text();
				} elseif ( 'A' === $tag && ! $html->is_tag_closer() ) {
					$last = '';
				} elseif ( 'BLOCKQUOTE' === $tag ) {
					break;
				}
			}
		}

		// Reddit's fallback has no paragraph, only the title.
		if ( '' === trim( $text ) && isset( $data->title ) && is_string( $data->title ) ) {
			$text = $data->title;
		}

		// A comment's card, not the whole post: X allows posts of 25,000 characters.
		$text = trim( $text );
		if ( mb_strlen( $text ) > 500 ) {
			$text = rtrim( mb_substr( $text, 0, 500 ) ) . '…';
		}

		$paragraphs = '';
		foreach ( preg_split( '/\n\s*\n/', trim( $text ) ) as $paragraph ) {
			if ( '' !== trim( $paragraph ) ) {
				// No raw newlines, which wpautop would turn into paragraphs of its own.
				$paragraphs .= '<p>' . str_replace( "\n", '<br>', esc_html( trim( $paragraph ) ) ) . '</p>';
			}
		}

		if ( '' === $paragraphs ) {
			return '';
		}

		$provider = isset( $data->provider_name ) && is_string( $data->provider_name ) && '' !== $data->provider_name ? $data->provider_name : (string) wp_parse_url( $url, PHP_URL_HOST );
		/* translators: %s: Where the post is from, e.g. X or Bluesky. */
		$footer = '<a href="' . esc_url( $url ) . '" rel="nofollow ugc">' . esc_html( sprintf( __( 'View on %s', 'jetpack-comments' ), $provider ) ) . '</a>';

		// Core's social link icons, in each brand's color but X's black, which a dark theme would lose.
		$brands = array(
			'x'              => array( 'x', 'currentColor' ),
			'bluesky social' => array( 'bluesky', '#1185fe' ),
			'reddit'         => array( 'reddit', '#ff4500' ),
		);
		$brand  = $brands[ strtolower( $provider ) ] ?? array( '', '' );
		$icon   = '';
		$header = array();

		if ( '' !== $brand[0] && function_exists( 'block_core_social_link_get_icon' ) ) {
			$svg = new \WP_HTML_Tag_Processor( block_core_social_link_get_icon( $brand[0] ) );
			if ( $svg->next_tag( 'svg' ) ) {
				$svg->set_attribute( 'style', "fill:{$brand[1]};width:1.25em;height:1.25em;vertical-align:-0.25em" );
				$icon = $svg->get_updated_html() . ' ';
			}
		}

		$author = isset( $data->author_name ) && is_string( $data->author_name ) ? $data->author_name : '';
		if ( '' !== $author ) {
			// Bluesky's name carries the handle; X's is only in its attribution.
			if ( ! str_contains( $author, '(@' ) && preg_match( '/\(@\w+\)/', $after, $handle ) ) {
				$author .= ' ' . $handle[0];
			}

			$profile  = isset( $data->author_url ) && is_string( $data->author_url ) ? esc_url( $data->author_url, array( 'https' ) ) : '';
			$header[] = $profile ? '<a href="' . $profile . '" rel="nofollow ugc">' . esc_html( $author ) . '</a>' : esc_html( $author );
		}

		if ( 'reddit' === $brand[0] && preg_match( '#/r/(\w+)/#', $url, $community ) ) {
			$header[] = esc_html( 'r/' . $community[1] );
		}

		// X writes the day out in English, Bluesky the moment in UTC.
		$last = trim( $last );
		$time = preg_match( '/^(?:[A-Z][a-z]+ \d{1,2}, \d{4}|\d{4}-\d\d-\d\dT[\d:.]+Z)$/', $last ) ? strtotime( $last ) : false;
		if ( $time ) {
			$header[] = '<time datetime="' . gmdate( 'Y-m-d', $time ) . '">' . esc_html( wp_date( get_option( 'date_format' ), $time, new \DateTimeZone( 'UTC' ) ) ) . '</time>';
		}

		$header = $icon . implode( ' &middot; ', $header );
		$small  = 'font-size:0.875em;';

		// Inline, as the players' sizing is, so the card holds its shape where the form's stylesheet is not loaded.
		return '<blockquote class="jetpack-comments__embed-card" cite="' . esc_url( $url ) . '" style="margin:0;padding:1em;border:1px solid;' . ( $brand[1] ? "border-inline-start:4px solid {$brand[1]};" : '' ) . 'border-radius:8px;font-style:normal">'
			. ( '' !== $header ? '<p style="margin-block-start:0;' . $small . '">' . $header . '</p>' : '' )
			. $paragraphs
			. '<p style="margin-block-end:0;' . $small . '">' . $footer . '</p></blockquote>';
	}

	/**
	 * The URL to ask the provider about. Core's list predates X's rename, and X's endpoint answers for both hosts.
	 *
	 * @param string $url A URL.
	 * @return string
	 */
	private static function lookup_url( $url ) {
		return (string) preg_replace( '#^(https?://)(?:www\.)?x\.com/#i', '$1twitter.com/', $url );
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

		if ( '' === $url || false === _wp_oembed_get_object()->get_provider( self::lookup_url( $url ), array( 'discover' => false ) ) ) {
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
			$text = $link ? '<a href="' . esc_url( $link ) . '" rel="nofollow ugc">' . esc_html( $link ) . '</a>' : esc_html( $raw );

			return '' === $text ? null : Block_Editor::paragraph( $text );
		}

		if ( null === $render ) {
			$block['attrs'] = array( 'url' => $url );
			$content        = esc_html( $url );
		} else {
			// The preview's own lookup, so the comment shows what the commenter saw; the delimiters are stripped after.
			$block['attrs'] = array();
			$content        = '';
			$data           = $render ? self::data( $url ) : false;

			if ( is_object( $data ) ) {
				$content = self::player( $data );
				$content = '' === $content ? self::card( $data, $url ) : $content;
			}

			if ( '' === $content ) {
				$content = '<a href="' . esc_url( $url ) . '" rel="nofollow ugc">' . esc_html( $url ) . '</a>';
			} else {
				wp_enqueue_style( 'wp-block-embed' );

				// Providers size the frame to the post's content width, wider than a nested comment.
				$tags = new \WP_HTML_Tag_Processor( $content );
				while ( $tags->next_tag( 'iframe' ) ) {
					// Pixels only: Spotify sends width="100%", which is no ratio.
					$width  = (string) $tags->get_attribute( 'width' );
					$height = (string) $tags->get_attribute( 'height' );
					$ratio  = ctype_digit( $width ) && ctype_digit( $height ) && (int) $width && (int) $height ? "aspect-ratio:$width/$height;height:auto;" : '';
					$style  = $tags->get_attribute( 'style' );
					$tags->set_attribute( 'style', "max-width:100%;$ratio" . ( is_string( $style ) ? $style : '' ) );
				}
				$content = $tags->get_updated_html();
			}
		}

		$html = "\n<figure class=\"wp-block-embed\"><div class=\"wp-block-embed__wrapper\">\n$content\n</div></figure>\n";

		$block['innerBlocks']  = array();
		$block['innerHTML']    = $html;
		$block['innerContent'] = array( $html );

		return $block;
	}
}

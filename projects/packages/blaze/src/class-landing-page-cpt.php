<?php
/**
 * Hidden CPT used to host AI-generated Blaze landing pages.
 *
 * The CPT is:
 *  - not public (no archive, not in search, not in nav menus, no admin UI),
 *  - publicly queryable (the random-slug URL works), and
 *  - REST-enabled so DSP can create/update entries via the WPCOM proxy.
 *
 * Each landing page is a self-contained HTML document stored in
 * `post_content`. When the public URL is hit, the theme is bypassed and
 * the document is served inside a sandboxed iframe, so its (AI-generated,
 * attacker-influenceable) markup cannot run scripts or reach the merchant's
 * origin, cookies, or parent DOM.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use WP_Post;

/**
 * Blaze landing-page CPT.
 */
class Landing_Page_CPT {

	const POST_TYPE  = 'blaze_landing_page';
	const URL_PREFIX = 'blaze-lp';
	const SLUG_BYTES = 16;

	/**
	 * Meta keys for landing-page metadata. Stored as post meta so the
	 * post_content stays a clean HTML document.
	 */
	const META_PRODUCT_ID = '_blaze_landing_product_id';
	const META_MODE       = '_blaze_landing_mode';
	const META_CAMPAIGN   = '_blaze_landing_campaign_id';

	/**
	 * Wire hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_filter( 'template_include', array( __CLASS__, 'render_raw_document' ), PHP_INT_MAX );
	}

	/**
	 * Register the CPT.
	 *
	 * @return void
	 */
	public static function register() {
		register_post_type(
			self::POST_TYPE,
			array(
				'labels'              => array(
					'name'          => __( 'Blaze Landing Pages', 'jetpack-blaze' ),
					'singular_name' => __( 'Blaze Landing Page', 'jetpack-blaze' ),
				),
				'public'              => false,
				'publicly_queryable'  => true,
				'exclude_from_search' => true,
				'show_ui'             => false,
				'show_in_menu'        => false,
				'show_in_nav_menus'   => false,
				'show_in_admin_bar'   => false,
				'show_in_rest'        => true,
				'rest_base'           => 'blaze-landing-pages',
				'rest_namespace'      => 'jetpack/v4',
				'rewrite'             => array(
					'slug'       => self::URL_PREFIX,
					'with_front' => false,
					'feeds'      => false,
					'pages'      => false,
				),
				'has_archive'         => false,
				'supports'            => array( 'title', 'editor', 'custom-fields' ),
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'delete_with_user'    => false,
			)
		);

		register_post_meta(
			self::POST_TYPE,
			self::META_PRODUCT_ID,
			array(
				'type'         => 'integer',
				'single'       => true,
				'show_in_rest' => true,
			)
		);
		register_post_meta(
			self::POST_TYPE,
			self::META_MODE,
			array(
				'type'         => 'string',
				'single'       => true,
				'show_in_rest' => true,
			)
		);
		register_post_meta(
			self::POST_TYPE,
			self::META_CAMPAIGN,
			array(
				'type'         => 'integer',
				'single'       => true,
				'show_in_rest' => true,
			)
		);
	}

	/**
	 * Bypass the theme on landing-page requests and emit the stored HTML.
	 *
	 * The stored `post_content` is a complete HTML document (or HTML
	 * fragment). We send a minimal header/body wrapper only when the
	 * content does not already include `<html>`.
	 *
	 * @param string $template Theme template that would otherwise load.
	 * @return string|void
	 */
	public static function render_raw_document( $template ) {
		if ( ! is_singular( self::POST_TYPE ) ) {
			return $template;
		}

		$post = get_post();
		if ( ! $post instanceof WP_Post || self::POST_TYPE !== $post->post_type ) {
			return $template;
		}

		nocache_headers();
		header( 'Content-Type: text/html; charset=utf-8' );
		header( 'X-Robots-Tag: noindex, nofollow, noarchive', true );
		// Outer-frame hardening (clickjacking + base-tag hijack). The untrusted
		// document itself is isolated in the sandboxed iframe built below.
		header( "Content-Security-Policy: frame-ancestors 'none'; base-uri 'none'", true );
		header( 'X-Content-Type-Options: nosniff', true );
		header( 'Referrer-Policy: no-referrer', true );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Wrapper is built from escaped values; the untrusted document is escaped into the iframe srcdoc and isolated by the sandbox.
		echo self::render_sandboxed( $post->post_title, (string) $post->post_content );
		exit;
	}

	/**
	 * Render the stored landing-page HTML inside a sandboxed iframe.
	 *
	 * The AI-generated document is attacker-influenceable (product data feeds
	 * the prompt) and is served on the merchant's own origin, so it is a
	 * stored-XSS surface. We isolate it in an iframe whose `sandbox` lacks
	 * `allow-scripts` and `allow-same-origin`: JavaScript cannot execute and
	 * the content runs in a unique opaque origin with no access to the
	 * merchant's cookies, storage, or parent DOM. CSS still renders.
	 *
	 * The default sandbox keeps the conversion link working (popups +
	 * user-activated top navigation). The policy is filterable for stricter
	 * variants.
	 *
	 * @param string $title   Document title for the outer frame.
	 * @param string $content Stored landing-page HTML (full document or fragment).
	 * @return string Outer HTML document embedding the sandboxed iframe.
	 */
	private static function render_sandboxed( $title, $content ) {
		$lang = get_bloginfo( 'language' );

		/**
		 * Filter the iframe `sandbox` policy for rendered landing pages.
		 *
		 * Never add `allow-scripts` together with `allow-same-origin`: that
		 * combination lets the framed document remove its own sandbox.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $sandbox Space-separated sandbox tokens.
		 */
		$sandbox = (string) apply_filters(
			'jetpack_blaze_landing_page_iframe_sandbox',
			'allow-popups allow-top-navigation-by-user-activation'
		);

		return sprintf(
			'<!doctype html><html lang="%1$s"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>%2$s</title><style>html,body{margin:0;padding:0;height:100%%}.blaze-lp-frame{border:0;display:block;width:100%%;height:100vh}</style></head><body><iframe class="blaze-lp-frame" sandbox="%3$s" referrerpolicy="no-referrer" title="%2$s" srcdoc="%4$s"></iframe></body></html>',
			esc_attr( $lang ),
			esc_html( $title ),
			esc_attr( $sandbox ),
			esc_attr( $content )
		);
	}

	/**
	 * Sanitize an AI-generated HTML document before storing it.
	 *
	 * Default policy is "HTML + CSS, no JS". `<script>` blocks and `on*`
	 * event attributes are removed. CSS in `<style>` and `style=""` is kept.
	 *
	 * The policy can be relaxed (e.g. for a sandboxed iframe variant) via
	 * the `jetpack_blaze_landing_page_allow_js` filter.
	 *
	 * @param string $html Raw HTML.
	 * @return string Sanitized HTML.
	 */
	public static function sanitize_html( $html ) {
		$html = (string) $html;

		/**
		 * Whether to allow JavaScript in landing-page HTML.
		 *
		 * Default false. Flip to true once a sandboxed render path is in place.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $allow_js Whether to keep <script> and on* attributes.
		 */
		$allow_js = (bool) apply_filters( 'jetpack_blaze_landing_page_allow_js', false );
		if ( $allow_js ) {
			return $html;
		}

		// Strip script blocks entirely.
		$html = preg_replace( '#<script\b[^>]*>.*?</script\s*>#is', '', $html );
		$html = preg_replace( '#<script\b[^>]*/?>#is', '', (string) $html );
		// Strip inline event handlers (on*="…" or on*='…' or on*=value).
		$html = preg_replace( '#\son[a-z]+\s*=\s*"[^"]*"#i', '', (string) $html );
		$html = preg_replace( "#\son[a-z]+\s*=\s*'[^']*'#i", '', (string) $html );
		$html = preg_replace( '#\son[a-z]+\s*=\s*[^\s>]+#i', '', (string) $html );
		// Strip javascript: URLs in href/src.
		$html = preg_replace( '#(href|src)\s*=\s*(["\'])\s*javascript:[^"\']*\2#i', '$1=$2#$2', (string) $html );

		return (string) $html;
	}

	/**
	 * Generate a random URL-safe slug.
	 *
	 * @return string
	 */
	public static function generate_slug() {
		$bytes = random_bytes( self::SLUG_BYTES );
		// Base64-url, no padding.
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Benign: URL-safe encoding of random bytes for a slug, not obfuscation.
		return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' );
	}

	/**
	 * Upsert a landing page.
	 *
	 * If `$slug` is provided and matches an existing landing-page post,
	 * the post is updated. Otherwise a new one is created with a fresh
	 * random slug.
	 *
	 * @param array $args Upsert arguments: `html` (required AI-generated HTML),
	 *                    `title` (defaults to product name), `mode` (required,
	 *                    e.g. 'woocommerce'), `product_id` (required),
	 *                    `campaign_id`, and `slug` (optional existing slug to
	 *                    upsert in place).
	 * @return array|\WP_Error { id, slug, url } or WP_Error.
	 */
	public static function upsert( array $args ) {
		$html = isset( $args['html'] ) ? (string) $args['html'] : '';
		if ( '' === $html ) {
			return new \WP_Error( 'jetpack_blaze_landing_missing_html', __( 'Missing HTML payload.', 'jetpack-blaze' ) );
		}
		$mode       = isset( $args['mode'] ) ? sanitize_key( $args['mode'] ) : '';
		$product_id = isset( $args['product_id'] ) ? (int) $args['product_id'] : 0;
		if ( '' === $mode || 0 === $product_id ) {
			return new \WP_Error( 'jetpack_blaze_landing_missing_meta', __( 'mode and product_id are required.', 'jetpack-blaze' ) );
		}

		$sanitized_html = self::sanitize_html( $html );
		$title          = isset( $args['title'] ) && is_string( $args['title'] )
			? sanitize_text_field( $args['title'] )
			: sprintf( 'Blaze landing — product %d', $product_id );

		$slug        = isset( $args['slug'] ) ? sanitize_title( $args['slug'] ) : '';
		$existing_id = 0;
		if ( '' !== $slug ) {
			$existing = get_page_by_path( $slug, OBJECT, self::POST_TYPE );
			if ( $existing instanceof WP_Post ) {
				$existing_id = (int) $existing->ID;
			}
		}

		if ( '' === $slug ) {
			$slug = self::generate_slug();
		}

		$postarr = array(
			'post_type'    => self::POST_TYPE,
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => wp_slash( $sanitized_html ),
		);

		// The HTML is a complete, self-contained document that we already
		// sanitized (scripts/JS stripped) in self::sanitize_html(). Blog-token
		// REST requests run as a user without `unfiltered_html`, so KSES would
		// strip `<!doctype>`, `<html>`, `<head>` and `<style>` tags on save —
		// keeping the CSS as visible text and breaking the page. Disable the
		// KSES content filters around the write and restore them right after.
		kses_remove_filters();
		try {
			if ( $existing_id > 0 ) {
				$postarr['ID'] = $existing_id;
				$post_id       = wp_update_post( $postarr, true );
			} else {
				$post_id = wp_insert_post( $postarr, true );
			}
		} finally {
			kses_init_filters();
		}
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		update_post_meta( $post_id, self::META_MODE, $mode );
		update_post_meta( $post_id, self::META_PRODUCT_ID, $product_id );
		if ( ! empty( $args['campaign_id'] ) ) {
			update_post_meta( $post_id, self::META_CAMPAIGN, (int) $args['campaign_id'] );
		}

		return array(
			'id'   => (int) $post_id,
			'slug' => $slug,
			'url'  => get_permalink( $post_id ),
		);
	}

	/**
	 * Look up a landing page by its slug.
	 *
	 * @param string $slug Slug.
	 * @return WP_Post|null
	 */
	public static function get_by_slug( $slug ) {
		$slug = sanitize_title( (string) $slug );
		if ( '' === $slug ) {
			return null;
		}
		$post = get_page_by_path( $slug, OBJECT, self::POST_TYPE );
		return $post instanceof WP_Post ? $post : null;
	}

	/**
	 * Delete a landing page by slug.
	 *
	 * @param string $slug Slug.
	 * @return bool
	 */
	public static function delete_by_slug( $slug ) {
		$post = self::get_by_slug( $slug );
		if ( null === $post ) {
			return false;
		}
		return (bool) wp_delete_post( (int) $post->ID, true );
	}
}

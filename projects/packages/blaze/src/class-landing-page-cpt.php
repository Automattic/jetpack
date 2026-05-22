<?php
/**
 * Hidden CPT for Blaze AI landing pages.
 *
 * A landing page is defined by STRUCTURED fields — headline, subheadline,
 * highlights, CTA, plus product and brand data — stored in sanitized post
 * meta. It is NOT arbitrary HTML: the AI generates copy, not markup. On the
 * public URL the theme is bypassed and a fixed, package-owned template renders
 * those fields, styled by the package's own stylesheet. Because nothing
 * untrusted is stored as markup or CSS, this never fights the platform's
 * content sanitization (KSES / WPCOM filters).
 *
 * The CPT is:
 *  - not public (no archive, not in search, not in nav menus, no admin UI),
 *  - publicly queryable (the random-slug URL works), and
 *  - REST-enabled so the WPCOM proxy can create/update entries.
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
	 * Prefix for all landing-page field meta keys (protected meta).
	 */
	const META_PREFIX = '_blaze_landing_';

	const META_PRODUCT_ID = '_blaze_landing_product_id';
	const META_MODE       = '_blaze_landing_mode';
	const META_CAMPAIGN   = '_blaze_landing_campaign_id';
	const META_HIGHLIGHTS = '_blaze_landing_highlights';

	const ASSET_VERSION  = '1.0.0';
	const MAX_HIGHLIGHTS = 6;

	/**
	 * Scalar landing-page fields and the WordPress sanitizer registered for
	 * each. The sanitizer runs automatically on save (via register_post_meta)
	 * and the values are escaped again at render — no raw markup is ever stored.
	 *
	 * @return array<string,string> Field name => sanitize callback.
	 */
	private static function fields() {
		return array(
			'headline'     => 'sanitize_text_field',
			'subheadline'  => 'sanitize_text_field',
			'cta_text'     => 'sanitize_text_field',
			'cta_url'      => 'esc_url_raw',
			'product_name' => 'sanitize_text_field',
			'price'        => 'sanitize_text_field',
			'currency'     => 'sanitize_text_field',
			'image_url'    => 'esc_url_raw',
			'brand_name'   => 'sanitize_text_field',
			'logo_url'     => 'esc_url_raw',
			'accent_color' => 'sanitize_hex_color',
		);
	}

	/**
	 * Wire hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'init', array( __CLASS__, 'register' ) );
		add_filter( 'template_include', array( __CLASS__, 'render' ), PHP_INT_MAX );
	}

	/**
	 * Register the CPT and its field meta.
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
				'show_in_rest'        => false,
				'rewrite'             => array(
					'slug'       => self::URL_PREFIX,
					'with_front' => false,
					'feeds'      => false,
					'pages'      => false,
				),
				'has_archive'         => false,
				'supports'            => array( 'title' ),
				'capability_type'     => 'post',
				'map_meta_cap'        => true,
				'delete_with_user'    => false,
			)
		);

		foreach ( self::fields() as $field => $sanitizer ) {
			register_post_meta(
				self::POST_TYPE,
				self::META_PREFIX . $field,
				array(
					'type'              => 'string',
					'single'            => true,
					'show_in_rest'      => false,
					'sanitize_callback' => $sanitizer,
				)
			);
		}

		register_post_meta(
			self::POST_TYPE,
			self::META_MODE,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => false,
				'sanitize_callback' => 'sanitize_key',
			)
		);
		register_post_meta(
			self::POST_TYPE,
			self::META_PRODUCT_ID,
			array(
				'type'              => 'integer',
				'single'            => true,
				'show_in_rest'      => false,
				'sanitize_callback' => 'absint',
			)
		);
		register_post_meta(
			self::POST_TYPE,
			self::META_CAMPAIGN,
			array(
				'type'              => 'integer',
				'single'            => true,
				'show_in_rest'      => false,
				'sanitize_callback' => 'absint',
			)
		);
	}

	/**
	 * Bypass the theme on landing-page requests and render the template.
	 *
	 * @param string $template Theme template that would otherwise load.
	 * @return string|void
	 */
	public static function render( $template ) {
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
		header( "Content-Security-Policy: frame-ancestors 'none'; base-uri 'none'", true );
		header( 'X-Content-Type-Options: nosniff', true );
		header( 'Referrer-Policy: no-referrer', true );

		// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- render_template() escapes every dynamic value with esc_html/esc_url/esc_attr.
		echo self::render_template( $post );
		exit;
	}

	/**
	 * Read the stored landing-page fields for a post.
	 *
	 * @param int $post_id Post ID.
	 * @return array<string,mixed> Field values; `highlights` is a string array.
	 */
	private static function get_fields( $post_id ) {
		$out = array();
		foreach ( array_keys( self::fields() ) as $field ) {
			$out[ $field ] = (string) get_post_meta( $post_id, self::META_PREFIX . $field, true );
		}
		$highlights        = get_post_meta( $post_id, self::META_HIGHLIGHTS, true );
		$out['highlights'] = is_array( $highlights ) ? $highlights : array();
		return $out;
	}

	/**
	 * Render the landing page from its structured fields.
	 *
	 * @param WP_Post $post Landing-page post.
	 * @return string Full HTML document.
	 */
	private static function render_template( $post ) {
		$f       = self::get_fields( $post->ID );
		$lang    = get_bloginfo( 'language' );
		$css_url = plugins_url( 'css/landing-page.css', __FILE__ );
		$cta     = '' !== $f['cta_text'] ? $f['cta_text'] : __( 'Shop now', 'jetpack-blaze' );
		$price   = trim( $f['price'] . ( '' !== $f['currency'] ? ' ' . $f['currency'] : '' ) );
		$brand   = '' !== $f['brand_name'] ? $f['brand_name'] : get_bloginfo( 'name' );

		ob_start();
		?>
<!doctype html>
<html lang="<?php echo esc_attr( $lang ); ?>">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title><?php echo esc_html( $post->post_title ); ?></title>
		<?php
		wp_enqueue_style( 'jetpack-blaze-landing', $css_url, array(), self::ASSET_VERSION );
		wp_print_styles( 'jetpack-blaze-landing' );
		?>
		<?php if ( '' !== $f['accent_color'] ) : ?>
<style>:root{--blaze-accent:<?php echo esc_html( $f['accent_color'] ); ?>}</style>
		<?php endif; ?>
</head>
<body class="blaze-lp">
<header class="blaze-lp-header">
		<?php if ( '' !== $f['logo_url'] ) : ?>
	<img class="blaze-lp-logo" src="<?php echo esc_url( $f['logo_url'] ); ?>" alt="<?php echo esc_attr( $brand ); ?>">
		<?php else : ?>
	<span class="blaze-lp-brand"><?php echo esc_html( $brand ); ?></span>
		<?php endif; ?>
</header>
<main class="blaze-lp-main">
	<section class="blaze-lp-hero">
		<?php if ( '' !== $f['image_url'] ) : ?>
		<div class="blaze-lp-media">
			<img src="<?php echo esc_url( $f['image_url'] ); ?>" alt="<?php echo esc_attr( '' !== $f['product_name'] ? $f['product_name'] : $f['headline'] ); ?>">
		</div>
		<?php endif; ?>
		<div class="blaze-lp-copy">
		<?php if ( '' !== $f['headline'] ) : ?>
			<h1 class="blaze-lp-headline"><?php echo esc_html( $f['headline'] ); ?></h1>
		<?php endif; ?>
		<?php if ( '' !== $f['subheadline'] ) : ?>
			<p class="blaze-lp-sub"><?php echo esc_html( $f['subheadline'] ); ?></p>
		<?php endif; ?>
		<?php if ( '' !== $price ) : ?>
			<p class="blaze-lp-price"><?php echo esc_html( $price ); ?></p>
		<?php endif; ?>
		<?php if ( '' !== $f['cta_url'] ) : ?>
			<a class="blaze-lp-cta" href="<?php echo esc_url( $f['cta_url'] ); ?>"><?php echo esc_html( $cta ); ?></a>
		<?php endif; ?>
		</div>
	</section>
		<?php if ( ! empty( $f['highlights'] ) ) : ?>
	<ul class="blaze-lp-highlights">
			<?php foreach ( $f['highlights'] as $highlight ) : ?>
		<li><?php echo esc_html( (string) $highlight ); ?></li>
			<?php endforeach; ?>
	</ul>
		<?php endif; ?>
</main>
<footer class="blaze-lp-footer"><?php echo esc_html( $brand ); ?></footer>
</body>
</html>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * Generate a random URL-safe slug.
	 *
	 * @return string
	 */
	public static function generate_slug() {
		$bytes = random_bytes( self::SLUG_BYTES );
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Benign: URL-safe encoding of random bytes for a slug, not obfuscation.
		return rtrim( strtr( base64_encode( $bytes ), '+/', '-_' ), '=' );
	}

	/**
	 * Create or update a landing page from structured fields.
	 *
	 * Scalar fields are sanitized by their registered meta sanitize_callback;
	 * highlights are sanitized item by item here.
	 *
	 * @param array $args Landing-page fields: `mode` (required, e.g.
	 *                    'woocommerce'), `product_id` (required), `headline`,
	 *                    `subheadline`, `cta_text`, `cta_url`, `product_name`,
	 *                    `price`, `currency`, `image_url`, `brand_name`,
	 *                    `logo_url`, `accent_color`, `highlights` (string[]),
	 *                    `campaign_id`, `slug` (optional, upsert in place).
	 * @return array|\WP_Error Array with id, slug, url; or WP_Error.
	 */
	public static function upsert( array $args ) {
		$mode       = isset( $args['mode'] ) ? sanitize_key( $args['mode'] ) : '';
		$product_id = isset( $args['product_id'] ) ? (int) $args['product_id'] : 0;
		if ( '' === $mode || 0 === $product_id ) {
			return new \WP_Error( 'jetpack_blaze_landing_missing_meta', __( 'mode and product_id are required.', 'jetpack-blaze' ) );
		}

		$headline     = isset( $args['headline'] ) ? sanitize_text_field( (string) $args['headline'] ) : '';
		$product_name = isset( $args['product_name'] ) ? sanitize_text_field( (string) $args['product_name'] ) : '';
		if ( '' === $headline && '' === $product_name ) {
			return new \WP_Error( 'jetpack_blaze_landing_missing_content', __( 'A headline or product name is required.', 'jetpack-blaze' ) );
		}

		if ( '' !== $product_name ) {
			$title = $product_name;
		} elseif ( isset( $args['title'] ) && is_string( $args['title'] ) ) {
			$title = sanitize_text_field( $args['title'] );
		} else {
			$title = $headline;
		}

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

		// post_content stays empty: the page is rendered from structured meta by
		// our template, so there is no markup for content sanitizers to touch.
		$postarr = array(
			'post_type'    => self::POST_TYPE,
			'post_status'  => 'publish',
			'post_title'   => $title,
			'post_name'    => $slug,
			'post_content' => '',
		);

		if ( $existing_id > 0 ) {
			$postarr['ID'] = $existing_id;
			$post_id       = wp_update_post( $postarr, true );
		} else {
			$post_id = wp_insert_post( $postarr, true );
		}
		if ( is_wp_error( $post_id ) ) {
			return $post_id;
		}

		// Scalar fields: stored raw, sanitized by their registered meta callback.
		foreach ( array_keys( self::fields() ) as $field ) {
			if ( array_key_exists( $field, $args ) ) {
				update_post_meta( $post_id, self::META_PREFIX . $field, (string) $args[ $field ] );
			}
		}

		// Highlights: a short list of plain-text bullets.
		if ( isset( $args['highlights'] ) && is_array( $args['highlights'] ) ) {
			$highlights = array();
			foreach ( $args['highlights'] as $highlight ) {
				$clean = sanitize_text_field( (string) $highlight );
				if ( '' !== $clean ) {
					$highlights[] = $clean;
				}
			}
			$highlights = array_slice( $highlights, 0, self::MAX_HIGHLIGHTS );
			update_post_meta( $post_id, self::META_HIGHLIGHTS, $highlights );
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

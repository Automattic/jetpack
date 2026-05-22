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
	const META_GEN_IMAGES = '_blaze_landing_gen_images';

	const ASSET_VERSION  = '1.1.0';
	const MAX_HIGHLIGHTS = 6;
	const MAX_GEN_IMAGES = 8;

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
		$gen_images        = get_post_meta( $post_id, self::META_GEN_IMAGES, true );
		$out['gen_images'] = is_array( $gen_images ) ? $gen_images : array();
		$out['product_id'] = (int) get_post_meta( $post_id, self::META_PRODUCT_ID, true );
		$out['mode']       = (string) get_post_meta( $post_id, self::META_MODE, true );
		return $out;
	}

	/**
	 * Load the live WooCommerce product behind a landing page, when available.
	 *
	 * The landing renders on the merchant site, so the product (price, gallery,
	 * permalink) is read live from WooCommerce rather than copied at creation
	 * time. Returns null when WooCommerce or the product is unavailable, so the
	 * template can fall back to stored meta.
	 *
	 * @param array $f Stored fields (see get_fields()).
	 * @return \WC_Product|null
	 */
	private static function get_wc_product( $f ) {
		if ( 'woocommerce' !== $f['mode'] || $f['product_id'] <= 0 || ! function_exists( 'wc_get_product' ) ) {
			return null;
		}
		$product = wc_get_product( $f['product_id'] );
		return $product instanceof \WC_Product ? $product : null;
	}

	/**
	 * Build the ordered list of image URLs to show: the product's featured image,
	 * its WooCommerce gallery, then any AI-generated lifestyle images. Falls back
	 * to the stored image_url when there is no live product.
	 *
	 * @param array            $f       Stored fields.
	 * @param \WC_Product|null $product Live product, if any.
	 * @return string[] De-duplicated image URLs.
	 */
	private static function get_images( $f, $product ) {
		$urls = array();
		if ( $product instanceof \WC_Product ) {
			$ids = array_merge( array( $product->get_image_id() ), $product->get_gallery_image_ids() );
			foreach ( $ids as $id ) {
				$url = $id ? wp_get_attachment_image_url( (int) $id, 'large' ) : '';
				if ( $url ) {
					$urls[] = $url;
				}
			}
		} elseif ( '' !== $f['image_url'] ) {
			$urls[] = $f['image_url'];
		}
		foreach ( $f['gen_images'] as $gen ) {
			$gen = esc_url_raw( (string) $gen );
			if ( '' !== $gen ) {
				$urls[] = $gen;
			}
		}
		return array_values( array_unique( $urls ) );
	}

	/**
	 * Pick an accent color from the active theme's palette so the landing's own
	 * accents (CTA, dividers) match the store.
	 *
	 * The earlier "first non-neutral slug" approach grabbed pale secondary tints.
	 * Instead we drop obvious neutrals, prefer well-known brand slugs
	 * (primary/accent/brand), and otherwise choose the most saturated color at a
	 * usable lightness — that reliably lands on the brand color (e.g. a gold)
	 * rather than a near-white cream.
	 *
	 * @return string Hex color or ''.
	 */
	private static function theme_accent_color() {
		if ( ! function_exists( 'wp_get_global_settings' ) ) {
			return '';
		}
		$palette = wp_get_global_settings( array( 'color', 'palette' ) );
		$colors  = array();
		if ( isset( $palette['theme'] ) && is_array( $palette['theme'] ) ) {
			$colors = $palette['theme'];
		} elseif ( is_array( $palette ) ) {
			$colors = $palette;
		}

		$skip       = array( 'base', 'background', 'foreground', 'contrast', 'text', 'white', 'black', 'light', 'dark', 'neutral' );
		$prefer     = array( 'primary', 'accent', 'brand' );
		$candidates = array();
		foreach ( $colors as $color ) {
			$slug = isset( $color['slug'] ) ? strtolower( (string) $color['slug'] ) : '';
			$hex  = isset( $color['color'] ) ? sanitize_hex_color( (string) $color['color'] ) : null;
			if ( '' === $slug || ! $hex ) {
				continue;
			}
			$is_neutral = false;
			foreach ( $skip as $needle ) {
				if ( false !== strpos( $slug, $needle ) ) {
					$is_neutral = true;
					break;
				}
			}
			if ( ! $is_neutral ) {
				$candidates[ $slug ] = $hex;
			}
		}
		if ( empty( $candidates ) ) {
			return '';
		}

		foreach ( $prefer as $needle ) {
			foreach ( $candidates as $slug => $hex ) {
				if ( false !== strpos( $slug, $needle ) ) {
					return $hex;
				}
			}
		}

		$best     = '';
		$best_sat = -1.0;
		foreach ( $candidates as $hex ) {
			list( $sat, $light ) = self::hex_saturation_lightness( $hex );
			if ( $light < 0.15 || $light > 0.82 ) {
				continue;
			}
			if ( $sat > $best_sat ) {
				$best_sat = $sat;
				$best     = $hex;
			}
		}
		// If everything was too light/dark, fall back to the first candidate.
		return '' !== $best ? $best : reset( $candidates );
	}

	/**
	 * Compute the HSL saturation and lightness (0..1) of a hex color.
	 *
	 * @param string $hex A sanitized hex color (#rgb or #rrggbb).
	 * @return array{0:float,1:float} [ saturation, lightness ].
	 */
	private static function hex_saturation_lightness( $hex ) {
		$hex = ltrim( $hex, '#' );
		if ( 3 === strlen( $hex ) ) {
			$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
		}
		$r   = hexdec( substr( $hex, 0, 2 ) ) / 255;
		$g   = hexdec( substr( $hex, 2, 2 ) ) / 255;
		$b   = hexdec( substr( $hex, 4, 2 ) ) / 255;
		$max = max( $r, $g, $b );
		$min = min( $r, $g, $b );
		$l   = ( $max + $min ) / 2;
		$d   = $max - $min;
		$s   = $d > 0.0 ? $d / ( 1 - abs( 2 * $l - 1 ) ) : 0.0;
		return array( $s, $l );
	}

	/**
	 * Render the landing page from its structured fields.
	 *
	 * @param WP_Post $post Landing-page post.
	 * @return string Full HTML document.
	 */
	private static function render_template( $post ) {
		$f       = self::get_fields( $post->ID );
		$product = self::get_wc_product( $f );
		$images  = self::get_images( $f, $product );
		$accent  = self::theme_accent_color();

		$headline = '' !== $f['headline'] ? $f['headline'] : ( $product ? $product->get_name() : $post->post_title );
		$cta      = '' !== $f['cta_text'] ? $f['cta_text'] : __( 'Shop now', 'jetpack-blaze' );
		$cta_url  = $f['cta_url'];
		if ( '' === $cta_url && $product ) {
			$cta_url = $product->add_to_cart_url();
		}

		$price_html = $product ? $product->get_price_html() : '';
		if ( '' === $price_html && '' !== $f['price'] ) {
			$price_html = esc_html( trim( $f['price'] . ( '' !== $f['currency'] ? ' ' . $f['currency'] : '' ) ) );
		}

		$main_image = array_shift( $images );

		ob_start();
		?>
<!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php echo esc_attr( get_bloginfo( 'charset' ) ); ?>">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title><?php echo esc_html( $headline ); ?></title>
		<?php
		// Enqueue our stylesheet, then let wp_head() print it together with the
		// theme's global styles (theme.json palette + typography) and block CSS,
		// so the page inherits the store's look.
		wp_enqueue_style( 'jetpack-blaze-landing', plugins_url( 'css/landing-page.css', __FILE__ ), array(), self::ASSET_VERSION );
		wp_head();
		?>
		<?php if ( '' !== $accent ) : ?>
<style>:root{--blaze-accent:<?php echo esc_html( $accent ); ?>}</style>
		<?php endif; ?>
</head>
<body <?php body_class( 'blaze-lp' ); ?>>
		<?php self::render_site_chrome( 'header' ); ?>
<main class="blaze-lp-main">
	<section class="blaze-lp-hero">
		<div class="blaze-lp-gallery">
		<?php if ( $main_image ) : ?>
			<figure class="blaze-lp-gallery-main">
				<img src="<?php echo esc_url( $main_image ); ?>" alt="<?php echo esc_attr( $headline ); ?>">
			</figure>
			<?php if ( ! empty( $images ) ) : ?>
			<ul class="blaze-lp-gallery-thumbs">
				<?php foreach ( $images as $img ) : ?>
				<li><img src="<?php echo esc_url( $img ); ?>" alt="<?php echo esc_attr( $headline ); ?>" loading="lazy"></li>
				<?php endforeach; ?>
			</ul>
			<?php endif; ?>
		<?php endif; ?>
		</div>
		<div class="blaze-lp-copy">
			<h1 class="blaze-lp-headline"><?php echo esc_html( $headline ); ?></h1>
		<?php if ( '' !== $f['subheadline'] ) : ?>
			<p class="blaze-lp-sub"><?php echo esc_html( $f['subheadline'] ); ?></p>
		<?php endif; ?>
		<?php if ( '' !== $price_html ) : ?>
			<div class="blaze-lp-price">
				<?php echo wp_kses_post( $price_html ); ?>
			</div>
		<?php endif; ?>
		<?php if ( '' !== $cta_url ) : ?>
			<p class="blaze-lp-cta-wrap">
				<a class="blaze-lp-cta" href="<?php echo esc_url( $cta_url ); ?>"><?php echo esc_html( $cta ); ?></a>
			</p>
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
		<?php
		self::render_site_chrome( 'footer' );
		wp_footer();
		?>
</body>
</html>
		<?php
		return (string) ob_get_clean();
	}

	/**
	 * Render the store's real header or footer so the landing matches the site.
	 *
	 * Block themes expose header/footer as template parts; classic themes get a
	 * minimal branded fallback (logo or site name) so the page still looks owned.
	 *
	 * @param string $part 'header' or 'footer'.
	 * @return void
	 */
	private static function render_site_chrome( $part ) {
		if (
			function_exists( 'wp_is_block_theme' ) && wp_is_block_theme()
			&& function_exists( 'block_template_part' )
		) {
			block_template_part( $part );
			return;
		}

		if ( 'header' === $part ) {
			echo '<header class="blaze-lp-fallback-header">';
			if ( function_exists( 'has_custom_logo' ) && has_custom_logo() ) {
				echo get_custom_logo(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- core markup.
			} else {
				echo '<span class="blaze-lp-brand">' . esc_html( get_bloginfo( 'name' ) ) . '</span>';
			}
			echo '</header>';
		} else {
			echo '<footer class="blaze-lp-fallback-footer">' . esc_html( get_bloginfo( 'name' ) ) . '</footer>';
		}
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
	 *                    `gen_images` (string[] of AI image URLs),
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

		// AI-generated lifestyle images: a short list of absolute URLs (hosted by
		// DSP). Shown in the gallery alongside the live WooCommerce images.
		if ( isset( $args['gen_images'] ) && is_array( $args['gen_images'] ) ) {
			$gen_images = array();
			foreach ( $args['gen_images'] as $gen_image ) {
				$clean = esc_url_raw( (string) $gen_image );
				if ( '' !== $clean ) {
					$gen_images[] = $clean;
				}
			}
			$gen_images = array_slice( $gen_images, 0, self::MAX_GEN_IMAGES );
			update_post_meta( $post_id, self::META_GEN_IMAGES, $gen_images );
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

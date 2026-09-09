<?php
/**
 * Front-end banner for plans in their final week, in grace, or post-grace.
 * Admins only; visitors never see it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * What the banner renders from, or null if it shouldn't show.
 *
 * Feeds and embeds render markup of their own the bar would corrupt.
 *
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_frontend_banner_data(): ?array {
	if ( is_feed() || is_embed() ) {
		return null;
	}
	return wpcom_expiry_notices_banner_data();
}

/**
 * Enqueue the banner's JS/CSS on wp_enqueue_scripts.
 */
function wpcom_expiry_notices_enqueue_frontend_banner_assets() {
	$data = wpcom_expiry_notices_frontend_banner_data();
	if ( null === $data ) {
		return;
	}
	wpcom_expiry_notices_enqueue_surface(
		'expiry-notices-banner',
		'wpcomExpiryBanner',
		array(
			'metaKey'    => Expiry_Notice_Dismiss::banner_meta_key(),
			'trackProps' => wpcom_expiry_notices_track_props( $data['state'], $data['is_owner'], 'frontend' ),
		),
		'expiry-notices-frontend-banner'
	);
}
add_action( 'wp_enqueue_scripts', 'wpcom_expiry_notices_enqueue_frontend_banner_assets' );

/**
 * Body class the stylesheet keys theme offsets on.
 *
 * @param string[] $classes Body classes.
 * @return string[]
 */
function wpcom_expiry_notices_frontend_banner_body_class( array $classes ): array {
	if ( null !== wpcom_expiry_notices_frontend_banner_data() ) {
		$classes[] = 'has-wpcom-expiry-banner';
	}
	return $classes;
}
add_filter( 'body_class', 'wpcom_expiry_notices_frontend_banner_body_class' );

/**
 * Render the banner at the top of <body>, so the absolute positioning used on
 * small screens anchors to the page and not to a theme wrapper.
 */
function wpcom_expiry_notices_render_frontend_banner() {
	$data = wpcom_expiry_notices_frontend_banner_data();
	if ( null === $data ) {
		return;
	}

	$urls           = $data['urls'];
	$is_dismissible = $data['is_dismissible'];
	?>
	<div id="wpcom-expiry-frontend-banner" class="wpcom-expiry-frontend-banner<?php echo $is_dismissible ? ' wpcom-expiry-frontend-banner--dismissible' : ''; ?>" role="region" aria-label="<?php esc_attr_e( 'Plan expiry notice', 'jetpack-mu-wpcom' ); ?>" data-wpcom-expiry-banner>
		<span class="wpcom-expiry-frontend-banner__text"><?php echo esc_html( wpcom_expiry_notices_banner_sentence( $data['state'], $data['is_owner'] ) ); ?></span>
		<?php if ( null !== $urls ) : ?>
			<?php wpcom_expiry_notices_render_cta_link( $urls['primary'], 'primary', 'wpcom-expiry-frontend-banner__cta' ); ?>
		<?php endif; ?>
		<?php if ( $is_dismissible ) : ?>
			<button type="button" class="wpcom-expiry-frontend-banner__dismiss" data-wpcom-expiry-dismiss aria-label="<?php esc_attr_e( 'Dismiss', 'jetpack-mu-wpcom' ); ?>">
				<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z"/></svg>
			</button>
		<?php endif; ?>
	</div>
	<?php
}
add_action( 'wp_body_open', 'wpcom_expiry_notices_render_frontend_banner' );

/**
 * Themes that never call wp_body_open get the banner from the footer; the
 * script then moves it to the top of <body>.
 */
function wpcom_expiry_notices_render_frontend_banner_fallback() {
	if ( ! did_action( 'wp_body_open' ) ) {
		wpcom_expiry_notices_render_frontend_banner();
	}
}
add_action( 'wp_footer', 'wpcom_expiry_notices_render_frontend_banner_fallback' );

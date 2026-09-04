<?php
/**
 * Front-end banner for plans in their final week, in grace, or post-grace.
 * Admins only; visitors never see it.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * Resolve the data needed to render the banner, or null if it shouldn't show.
 *
 * Memoized: the enqueue, body-class, and render hooks all ask per pageview,
 * and each read costs a user-meta lookup and a site-slug resolution.
 *
 * @param bool $flush Drop the memo. For tests, which move the fixture under a
 *                    process that has already answered once.
 * @return array{state:array,is_dismissible:bool,urls:array}|null
 */
function wpcom_expiry_notices_frontend_banner_data( bool $flush = false ): ?array {
	// Distinct from null, which is a real answer worth remembering.
	static $memo = false;

	if ( $flush ) {
		$memo = false;
		return null;
	}

	if ( false !== $memo ) {
		return $memo;
	}

	$memo  = null;
	$state = wpcom_expiry_notices_eligible_state();
	if ( null === $state ) {
		return $memo;
	}

	// The early reminder is a Dashboard-only nudge; the front-end has no
	// equivalent quiet corner for it.
	if ( wpcom_expiry_notices_is_early_warning( $state ) ) {
		return $memo;
	}

	if ( ! Expiry_Notice_Dismiss::should_show_banner( $state ) ) {
		return $memo;
	}

	$memo = array(
		'state'          => $state,
		'is_dismissible' => Expiry_Notice_Dismiss::is_dismissible( $state ),
		'urls'           => wpcom_expiry_notices_banner_urls( $state, wpcom_expiry_notices_current_frontend_url() ),
	);

	return $memo;
}

/**
 * The URL of the current front-end page, for checkout to send the user back to.
 * Transient query args are stripped so the return trip doesn't replay them.
 */
function wpcom_expiry_notices_current_frontend_url(): string {
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
	if ( '' === $request_uri ) {
		return home_url( '/' );
	}
	return home_url( remove_query_arg( wp_removable_query_args(), $request_uri ) );
}

/**
 * Whether this request is a page the banner belongs on. Feeds, embeds, and the
 * Customizer preview render markup of their own the bar would corrupt.
 */
function wpcom_expiry_notices_frontend_banner_should_render(): bool {
	if ( is_feed() || is_embed() || is_customize_preview() ) {
		return false;
	}
	return null !== wpcom_expiry_notices_frontend_banner_data();
}

/**
 * Enqueue + localize the banner's JS/CSS on wp_enqueue_scripts.
 */
function wpcom_expiry_notices_enqueue_frontend_banner_assets() {
	$data = wpcom_expiry_notices_frontend_banner_data();
	if ( null === $data || ! wpcom_expiry_notices_frontend_banner_should_render() ) {
		return;
	}

	$asset_handle = jetpack_mu_wpcom_enqueue_assets( 'expiry-notices-frontend-banner', array( 'js', 'css' ) );
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_enqueue_tracking_scripts( $asset_handle );
	wp_localize_script(
		$asset_handle,
		'wpcomExpiryFrontendBanner',
		array(
			'metaKey'       => Expiry_Notice_Dismiss::META_BANNER,
			'state'         => $data['state']['state'],
			'daysRemaining' => isset( $data['state']['days_remaining'] ) ? (int) $data['state']['days_remaining'] : 0,
			'productSlug'   => isset( $data['state']['product_slug'] ) ? (string) $data['state']['product_slug'] : '',
		)
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
 * Render the banner markup on wp_footer. Fixed positioning puts it under the
 * admin bar wherever it lands in the DOM.
 */
function wpcom_expiry_notices_render_frontend_banner() {
	$data = wpcom_expiry_notices_frontend_banner_data();
	if ( null === $data || ! wpcom_expiry_notices_frontend_banner_should_render() ) {
		return;
	}
	wpcom_expiry_notices_render_frontend_banner_html( $data['state'], $data['urls'], $data['is_dismissible'] );
}
add_action( 'wp_footer', 'wpcom_expiry_notices_render_frontend_banner' );

/**
 * Render the banner DOM.
 *
 * @param array<string,mixed> $state          Expiry state.
 * @param array<string,array> $urls           CTA URLs from wpcom_expiry_notices_banner_urls().
 * @param bool                $is_dismissible Whether the notice can be dismissed.
 */
function wpcom_expiry_notices_render_frontend_banner_html( array $state, array $urls, bool $is_dismissible ): void {
	$text = wpcom_expiry_notices_admin_banner_heading( $state ) . '. ' . wpcom_expiry_notices_admin_banner_body( $state );
	?>
	<div id="wpcom-expiry-frontend-banner" class="wpcom-expiry-frontend-banner" role="status">
		<span class="wpcom-expiry-frontend-banner__text"><?php echo esc_html( $text ); ?></span>
		<a
			class="wpcom-expiry-frontend-banner__cta"
			href="<?php echo esc_url( $urls['primary']['url'] ); ?>"
			<?php if ( isset( $urls['primary']['message'] ) ) : ?>
				data-support-message="<?php echo esc_attr( $urls['primary']['message'] ); ?>"
			<?php endif; ?>
		>
			<?php echo esc_html( $urls['primary']['label'] ); ?>
		</a>
		<?php if ( $is_dismissible ) : ?>
			<button type="button" class="wpcom-expiry-frontend-banner__dismiss" aria-label="<?php esc_attr_e( 'Dismiss', 'jetpack-mu-wpcom' ); ?>">
				<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="m13.06 12 6.47-6.47-1.06-1.06L12 10.94 5.53 4.47 4.47 5.53 10.94 12l-6.47 6.47 1.06 1.06L12 13.06l6.47 6.47 1.06-1.06L13.06 12Z"/></svg>
			</button>
		<?php endif; ?>
	</div>
	<?php
}

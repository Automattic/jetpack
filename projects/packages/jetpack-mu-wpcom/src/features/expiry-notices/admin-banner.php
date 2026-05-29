<?php
/**
 * Wp-admin banner notice for plans approaching expiry, in grace, or post-grace.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;

/**
 * Resolve the data needed to render the banner, or null if it shouldn't show.
 * Shared by the enqueue and render hooks.
 *
 * @return array{state:array,cadence_secs:int,is_expired:bool,urls:array}|null
 */
function wpcom_expiry_notices_admin_banner_data(): ?array {
	if ( ! current_user_can( 'manage_options' ) ) {
		return null;
	}

	$state = Expiry_Data::get_expiry_state();
	if ( null === $state || Expiry_Data::STATE_ACTIVE === $state['state'] ) {
		return null;
	}

	if ( ! Expiry_Notice_Dismiss::should_show_banner( $state ) ) {
		return null;
	}

	$cadence_secs = Expiry_Notice_Dismiss::banner_cadence_seconds( $state );

	// Scope progression: cadence > 0 (approaching, >7 days out) shows on
	// Dashboard only; cadence 0 (final-7-days, grace, post-grace) is global.
	if ( $cadence_secs > 0 ) {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'dashboard' !== $screen->id ) {
			return null;
		}
	}

	return array(
		'state'        => $state,
		'cadence_secs' => $cadence_secs,
		'is_expired'   => in_array(
			$state['state'],
			array( Expiry_Data::STATE_EXPIRED_GRACE, Expiry_Data::STATE_EXPIRED ),
			true
		),
		'urls'         => Expiry_Data::get_cta_urls( $state, wpcom_expiry_notices_current_admin_url() ),
	);
}

/**
 * Enqueue + localize the banner's JS/CSS on admin_enqueue_scripts so the
 * stylesheet lands in <head>.
 */
function wpcom_expiry_notices_enqueue_admin_banner_assets() {
	$data = wpcom_expiry_notices_admin_banner_data();
	if ( null === $data ) {
		return;
	}

	$asset_handle = jetpack_mu_wpcom_enqueue_assets( 'expiry-notices-admin-banner', array( 'js', 'css' ) );
	wp_localize_script(
		$asset_handle,
		'wpcomExpiryBanner',
		array(
			'metaKey'       => Expiry_Notice_Dismiss::META_BANNER,
			'state'         => $data['state']['state'],
			'daysRemaining' => isset( $data['state']['days_remaining'] ) ? (int) $data['state']['days_remaining'] : 0,
			'productSlug'   => isset( $data['state']['product_slug'] ) ? (string) $data['state']['product_slug'] : '',
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_expiry_notices_enqueue_admin_banner_assets' );

/**
 * Render the banner markup on admin_notices.
 */
function wpcom_expiry_notices_render_admin_banner() {
	$data = wpcom_expiry_notices_admin_banner_data();
	if ( null === $data ) {
		return;
	}

	wpcom_expiry_notices_render_admin_banner_html(
		$data['state'],
		$data['urls'],
		$data['cadence_secs'],
		$data['is_expired']
	);
}
add_action( 'admin_notices', 'wpcom_expiry_notices_render_admin_banner' );

/**
 * Render the banner DOM.
 *
 * @param array<string,mixed> $state        Expiry state.
 * @param array<string,array> $urls         CTA URLs from Expiry_Data::get_cta_urls().
 * @param int                 $cadence_secs Banner cadence (0 = every session).
 * @param bool                $is_expired   Whether the state is expired/grace.
 */
function wpcom_expiry_notices_render_admin_banner_html( array $state, array $urls, int $cadence_secs, bool $is_expired ): void {
	// Approaching > 7 days is a warning; everything else is an error.
	$is_warning   = $cadence_secs > 0 && Expiry_Data::STATE_APPROACHING === $state['state'];
	$notice_class = $is_warning ? 'notice-warning' : 'notice-error';
	$message      = wpcom_expiry_notices_admin_banner_message( $state, $is_expired );
	$remind_days  = $cadence_secs > 0 ? (int) round( $cadence_secs / DAY_IN_SECONDS ) : 0;
	$is_grace     = Expiry_Data::STATE_EXPIRED_GRACE === $state['state'];
	?>
	<div id="wpcom-expiry-banner" class="notice <?php echo esc_attr( $notice_class ); ?>">
		<p><?php echo esc_html( $message ); ?></p>
		<p class="wpcom-expiry-banner__actions">
			<a class="button button-primary" href="<?php echo esc_url( $urls['primary']['url'] ); ?>">
				<?php echo esc_html( $urls['primary']['label'] ); ?>
			</a>
			<?php if ( $remind_days > 0 ) : ?>
				<button type="button" class="button wpcom-expiry-banner__remind">
					<?php
					printf(
						/* translators: %d is days remaining until the next banner appearance. */
						esc_html( _n( 'Remind me in %d day', 'Remind me in %d days', $remind_days, 'jetpack-mu-wpcom' ) ),
						(int) $remind_days // phpcs needs an explicit cast/escape; phan sees it as redundant. @phan-suppress-current-line PhanRedundantCondition
					);
					?>
				</button>
			<?php elseif ( $is_grace ) : ?>
				<a class="button" href="<?php echo esc_url( $urls['secondary']['url'] ); ?>">
					<?php echo esc_html( $urls['secondary']['label'] ); ?>
				</a>
			<?php endif; ?>
		</p>
	</div>
	<?php
}

/**
 * Compose the banner message for the given state.
 *
 * @param array<string,mixed> $state      Expiry state.
 * @param bool                $is_expired Whether the state is expired/grace.
 */
function wpcom_expiry_notices_admin_banner_message( array $state, bool $is_expired ): string {
	$plan = isset( $state['plan_name'] ) && is_string( $state['plan_name'] ) ? $state['plan_name'] : '';

	if ( $is_expired ) {
		// Post-grace: site has already been moved to Free (the banner keeps
		// running on Simple sites after the downgrade). Grace: still on the
		// paid plan, downgrade is imminent.
		$is_post_grace = Expiry_Data::STATE_EXPIRED === ( $state['state'] ?? '' );
		if ( $is_post_grace ) {
			if ( '' !== $plan ) {
				return sprintf(
					/* translators: %s is the plan name (e.g. Business). */
					__( 'Your %s plan has expired. Your site has been moved to the Free plan. You no longer have access to plugins, custom themes, or additional storage. Upgrade your plan to restore your site.', 'jetpack-mu-wpcom' ),
					$plan
				);
			}
			return __( 'Your plan has expired. Your site has been moved to the Free plan. You no longer have access to plugins, custom themes, or additional storage. Upgrade your plan to restore your site.', 'jetpack-mu-wpcom' );
		}
		if ( '' !== $plan ) {
			return sprintf(
				/* translators: %s is the plan name (e.g. Business). */
				__( 'Your %s plan has expired. Your site will be moved to the Free plan. That means losing plugins, custom themes, and additional storage. Renew now to keep your site as it is.', 'jetpack-mu-wpcom' ),
				$plan
			);
		}
		return __( 'Your plan has expired. Your site will be moved to the Free plan. That means losing plugins, custom themes, and additional storage. Renew now to keep your site as it is.', 'jetpack-mu-wpcom' );
	}

	$days = isset( $state['days_remaining'] ) ? (int) $state['days_remaining'] : 0;

	if ( '' !== $plan ) {
		return sprintf(
			/* translators: %1$s is the plan name (e.g. Business). %2$d is the number of days remaining. */
			_n(
				'Your %1$s plan expires in %2$d day. After that, your site moves to the Free plan, which means losing access to plugins, custom themes, and additional storage.',
				'Your %1$s plan expires in %2$d days. After that, your site moves to the Free plan, which means losing access to plugins, custom themes, and additional storage.',
				$days,
				'jetpack-mu-wpcom'
			),
			$plan,
			$days
		);
	}

	return sprintf(
		/* translators: %d is the number of days remaining. */
		_n(
			'Your plan expires in %d day. After that, your site moves to the Free plan, which means losing access to plugins, custom themes, and additional storage.',
			'Your plan expires in %d days. After that, your site moves to the Free plan, which means losing access to plugins, custom themes, and additional storage.',
			$days,
			'jetpack-mu-wpcom'
		),
		$days
	);
}

/**
 * Build the full URL of the current admin page so checkout can redirect back.
 * Strips transient query args (`settings-updated`, `_wpnonce`, etc.) so the
 * redirected user doesn't re-trigger one-shot admin notices or hit stale
 * nonces on return.
 */
function wpcom_expiry_notices_current_admin_url(): string {
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
	if ( '' === $request_uri ) {
		return admin_url();
	}
	$request_uri = remove_query_arg( wp_removable_query_args(), $request_uri );
	$admin_path  = preg_replace( '#^/?wp-admin/?#', '', $request_uri );
	return admin_url( ltrim( $admin_path, '/' ) );
}

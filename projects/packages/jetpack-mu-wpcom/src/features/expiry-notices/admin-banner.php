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
 * @return array{state:array,is_early_warning:bool,is_dismissible:bool,urls:array}|null
 */
function wpcom_expiry_notices_admin_banner_data(): ?array {
	if ( ! current_user_can( 'manage_options' ) ) {
		return null;
	}

	// The Simple notice this replaces excluded VIP sites, and swapping the
	// notices was never meant to change who sees one. Guarded because
	// wpcom_is_vip() only exists on wpcom.
	if ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) {
		return null;
	}

	$state = Expiry_Data::get_expiry_state();
	if ( null === $state || Expiry_Data::STATE_ACTIVE === $state['state'] ) {
		return null;
	}

	if ( ! Expiry_Notice_Dismiss::should_show_banner( $state ) ) {
		return null;
	}

	// Scope progression: the gentle pre-window reminder shows on the Dashboard
	// only; every other visible state — final 7 days, grace, post-grace — shows
	// on all wp-admin screens.
	$is_early_warning = wpcom_expiry_notices_is_early_warning( $state );
	if ( $is_early_warning ) {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'dashboard' !== $screen->id ) {
			return null;
		}
	}

	return array(
		'state'            => $state,
		'is_early_warning' => $is_early_warning,
		'is_dismissible'   => Expiry_Notice_Dismiss::is_dismissible( $state ),
		'urls'             => wpcom_expiry_notices_admin_banner_urls( $state ),
	);
}

/**
 * CTA URLs for the banner.
 *
 * Once the site has been reverted the ask is no longer "renew" but "put the
 * site back", and wp-admin labels that button "Restore site" where the other
 * surfaces say "Restore my site".
 *
 * @param array<string,mixed> $state Expiry state.
 * @return array<string,array>
 */
function wpcom_expiry_notices_admin_banner_urls( array $state ): array {
	$urls = Expiry_Data::get_cta_urls( $state, wpcom_expiry_notices_current_admin_url() );
	if ( Expiry_Data::STATE_EXPIRED === ( $state['state'] ?? '' ) ) {
		$urls['primary']['label'] = __( 'Restore site', 'jetpack-mu-wpcom' );
	}
	return $urls;
}

/**
 * Whether this is the early reminder: approaching expiry with more than the
 * final week to go. It is the one stage the banner keeps to the Dashboard, and
 * the one stage styled as a warning rather than an error.
 *
 * @param array<string,mixed> $state Expiry state.
 */
function wpcom_expiry_notices_is_early_warning( array $state ): bool {
	if ( Expiry_Data::STATE_APPROACHING !== ( $state['state'] ?? '' ) ) {
		return false;
	}
	$days = isset( $state['days_remaining'] ) ? (int) $state['days_remaining'] : 0;
	return $days > Expiry_Notice_Dismiss::FINAL_WINDOW_DAYS;
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
		$data['is_early_warning'],
		$data['is_dismissible']
	);
}
add_action( 'admin_notices', 'wpcom_expiry_notices_render_admin_banner' );

/**
 * Render the banner DOM.
 *
 * @param array<string,mixed> $state            Expiry state.
 * @param array<string,array> $urls             CTA URLs from Expiry_Data::get_cta_urls().
 * @param bool                $is_early_warning Whether this is the pre-final-week reminder.
 * @param bool                $is_dismissible   Whether the notice can be dismissed.
 */
function wpcom_expiry_notices_render_admin_banner_html( array $state, array $urls, bool $is_early_warning, bool $is_dismissible ): void {
	$notice_class = $is_early_warning ? 'notice-warning' : 'notice-error';
	$is_grace     = Expiry_Data::STATE_EXPIRED_GRACE === $state['state'];
	?>
	<div id="wpcom-expiry-banner" class="notice <?php echo esc_attr( $notice_class ); ?>">
		<p><strong><?php echo esc_html( wpcom_expiry_notices_admin_banner_heading( $state ) ); ?></strong></p>
		<p><?php echo esc_html( wpcom_expiry_notices_admin_banner_body( $state ) ); ?></p>
		<p class="wpcom-expiry-banner__actions">
			<a class="button button-primary" href="<?php echo esc_url( $urls['primary']['url'] ); ?>">
				<?php echo esc_html( $urls['primary']['label'] ); ?>
			</a>
			<?php if ( $is_grace ) : ?>
				<a class="button" href="<?php echo esc_url( $urls['secondary']['url'] ); ?>">
					<?php echo esc_html( $urls['secondary']['label'] ); ?>
				</a>
			<?php endif; ?>
			<?php if ( $is_dismissible ) : ?>
				<button type="button" class="button wpcom-expiry-banner__dismiss">
					<?php esc_html_e( 'Dismiss', 'jetpack-mu-wpcom' ); ?>
				</button>
			<?php endif; ?>
		</p>
	</div>
	<?php
}

/**
 * The banner heading: which plan, and how long it has left.
 *
 * Copy is the plan-expiry spec's per-stage headings. Every stage has a variant
 * without the plan name, for the rare purchase whose slug the Plans package
 * can't resolve to a short name.
 *
 * @param array<string,mixed> $state Expiry state.
 */
function wpcom_expiry_notices_admin_banner_heading( array $state ): string {
	$plan = isset( $state['plan_name'] ) && is_string( $state['plan_name'] ) ? $state['plan_name'] : '';
	$days = isset( $state['days_remaining'] ) ? (int) $state['days_remaining'] : 0;

	$has_expired = in_array(
		$state['state'] ?? '',
		array( Expiry_Data::STATE_EXPIRED_GRACE, Expiry_Data::STATE_EXPIRED ),
		true
	);

	if ( $has_expired ) {
		if ( '' === $plan ) {
			return __( 'Your plan has expired', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %s is the plan name (e.g. Business). */
			__( 'Your %s plan has expired', 'jetpack-mu-wpcom' ),
			$plan
		);
	}

	// A plan that is still expected to renew hasn't failed yet, so it gets a
	// neutral count rather than the language of an expiry deadline. Asserting a
	// failed renewal would be wrong for someone who just switched auto-renew on.
	if ( ! empty( $state['auto_renew'] ) && $days > 0 ) {
		if ( '' === $plan ) {
			return sprintf(
				/* translators: %d is the number of days remaining. */
				_n( 'Your plan has %d day remaining', 'Your plan has %d days remaining', $days, 'jetpack-mu-wpcom' ),
				$days
			);
		}
		return sprintf(
			/* translators: %1$s is the plan name (e.g. Business). %2$d is the number of days remaining. */
			_n(
				'Your %1$s plan has %2$d day remaining',
				'Your %1$s plan has %2$d days remaining',
				$days,
				'jetpack-mu-wpcom'
			),
			$plan,
			$days
		);
	}

	// Never "expired" while the day of expiry is still running: a plan can
	// still renew at any hour of it.
	if ( 0 === $days ) {
		if ( '' === $plan ) {
			return __( 'Your plan expires today', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %s is the plan name (e.g. Business). */
			__( 'Your %s plan expires today', 'jetpack-mu-wpcom' ),
			$plan
		);
	}

	if ( '' === $plan ) {
		return sprintf(
			/* translators: %d is the number of days remaining. */
			_n( 'Your plan expires in %d day', 'Your plan expires in %d days', $days, 'jetpack-mu-wpcom' ),
			$days
		);
	}
	return sprintf(
		/* translators: %1$s is the plan name (e.g. Business). %2$d is the number of days remaining. */
		_n(
			'Your %1$s plan expires in %2$d day',
			'Your %1$s plan expires in %2$d days',
			$days,
			'jetpack-mu-wpcom'
		),
		$plan,
		$days
	);
}

/**
 * The banner body: what the site loses, and what to do about it.
 *
 * Each stage has a variant quoting the plan's storage allowance and one saying
 * "additional storage", for slugs with no storage figure on record.
 *
 * @param array<string,mixed> $state Expiry state.
 */
function wpcom_expiry_notices_admin_banner_body( array $state ): string {
	$storage_gb = Expiry_Data::get_plan_storage_gb( isset( $state['product_slug'] ) ? (string) $state['product_slug'] : '' );
	$days       = isset( $state['days_remaining'] ) ? (int) $state['days_remaining'] : 0;
	$auto_renew = ! empty( $state['auto_renew'] );

	if ( Expiry_Data::STATE_EXPIRED === ( $state['state'] ?? '' ) ) {
		// Reverting an Atomic site also takes it private; a Simple site stays
		// public, so only Atomic mentions it.
		if ( ! empty( $state['is_atomic'] ) ) {
			if ( null === $storage_gb ) {
				return __( 'Your site has been moved to the Free plan and set to private. You no longer have access to plugins, custom themes, or additional storage. Upgrade your plan to restore your site.', 'jetpack-mu-wpcom' );
			}
			return sprintf(
				/* translators: %d is a number of gigabytes of storage. */
				__( 'Your site has been moved to the Free plan and set to private. You no longer have access to plugins, custom themes, or %d GB of storage. Upgrade your plan to restore your site.', 'jetpack-mu-wpcom' ),
				$storage_gb
			);
		}
		if ( null === $storage_gb ) {
			return __( 'Your site has been moved to the Free plan. You no longer have access to plugins, custom themes, or additional storage. Upgrade your plan to restore your site.', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %d is a number of gigabytes of storage. */
			__( 'Your site has been moved to the Free plan. You no longer have access to plugins, custom themes, or %d GB of storage. Upgrade your plan to restore your site.', 'jetpack-mu-wpcom' ),
			$storage_gb
		);
	}

	if ( Expiry_Data::STATE_EXPIRED_GRACE === ( $state['state'] ?? '' ) ) {
		// "If renewal doesn't go through" only makes sense while a renewal
		// attempt is still scheduled.
		if ( $auto_renew ) {
			if ( null === $storage_gb ) {
				return __( 'If renewal doesn’t go through, your site will move to the Free plan. That means losing plugins, custom themes, and additional storage. But it’s not too late. Renew now to keep your site as it is.', 'jetpack-mu-wpcom' );
			}
			return sprintf(
				/* translators: %d is a number of gigabytes of storage. */
				__( 'If renewal doesn’t go through, your site will move to the Free plan. That means losing plugins, custom themes, and %d GB of storage. But it’s not too late. Renew now to keep your site as it is.', 'jetpack-mu-wpcom' ),
				$storage_gb
			);
		}
		if ( null === $storage_gb ) {
			return __( 'Your site will move to the Free plan. That means losing plugins, custom themes, and additional storage. But it’s not too late. Renew now to keep your site as it is.', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %d is a number of gigabytes of storage. */
			__( 'Your site will move to the Free plan. That means losing plugins, custom themes, and %d GB of storage. But it’s not too late. Renew now to keep your site as it is.', 'jetpack-mu-wpcom' ),
			$storage_gb
		);
	}

	// Everything below is still before expiry. A plan with a renewal attempt
	// still to come is described conditionally; one that cannot renew itself is
	// described as a certainty.
	if ( $auto_renew ) {
		if ( $days <= Expiry_Notice_Dismiss::FINAL_WINDOW_DAYS ) {
			if ( null === $storage_gb ) {
				return __( 'If renewal doesn’t go through, your site will move to the Free plan and you’ll lose plugins, custom themes, and additional storage. Renew now to keep everything in place.', 'jetpack-mu-wpcom' );
			}
			return sprintf(
				/* translators: %d is a number of gigabytes of storage. */
				__( 'If renewal doesn’t go through, your site will move to the Free plan and you’ll lose plugins, custom themes, and %d GB of storage. Renew now to keep everything in place.', 'jetpack-mu-wpcom' ),
				$storage_gb
			);
		}
		if ( null === $storage_gb ) {
			return __( 'If renewal doesn’t go through, your site will move to the Free plan, and you’ll lose access to plugins, custom themes, and additional storage.', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %d is a number of gigabytes of storage. */
			__( 'If renewal doesn’t go through, your site will move to the Free plan, and you’ll lose access to plugins, custom themes, and %d GB of storage.', 'jetpack-mu-wpcom' ),
			$storage_gb
		);
	}

	if ( 0 === $days ) {
		if ( null === $storage_gb ) {
			return __( 'Unless you renew your plan, your site will move to the Free plan, and you’ll lose plugins, custom themes, and additional storage. Renew now to keep everything in place.', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %d is a number of gigabytes of storage. */
			__( 'Unless you renew your plan, your site will move to the Free plan, and you’ll lose plugins, custom themes, and %d GB of storage. Renew now to keep everything in place.', 'jetpack-mu-wpcom' ),
			$storage_gb
		);
	}

	if ( $days <= Expiry_Notice_Dismiss::FINAL_WINDOW_DAYS ) {
		if ( null === $storage_gb ) {
			return __( 'Your site will move to the Free plan and you’ll lose plugins, custom themes, and additional storage. Renew now to keep everything in place.', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %d is a number of gigabytes of storage. */
			__( 'Your site will move to the Free plan and you’ll lose plugins, custom themes, and %d GB of storage. Renew now to keep everything in place.', 'jetpack-mu-wpcom' ),
			$storage_gb
		);
	}

	// The early reminder names the date: "in 45 days" is hard to place on a
	// calendar, and there is still time to plan around it.
	$expiry_date = (string) wp_date( (string) get_option( 'date_format' ), (int) $state['expiry_ts'] );
	if ( '' === $expiry_date ) {
		// No usable date format; fall back to the wording that doesn't name one.
		if ( null === $storage_gb ) {
			return __( 'Your site will move to the Free plan, which means you’ll lose access to plugins, custom themes, and additional storage.', 'jetpack-mu-wpcom' );
		}
		return sprintf(
			/* translators: %d is a number of gigabytes of storage. */
			__( 'Your site will move to the Free plan, which means you’ll lose access to plugins, custom themes, and %d GB of storage.', 'jetpack-mu-wpcom' ),
			$storage_gb
		);
	}
	if ( null === $storage_gb ) {
		return sprintf(
			/* translators: %s is the expiration date. */
			__( 'After %s, your site will move to the Free plan, which means you’ll lose access to plugins, custom themes, and additional storage.', 'jetpack-mu-wpcom' ),
			$expiry_date
		);
	}
	return sprintf(
		/* translators: %1$s is the expiration date. %2$d is a number of gigabytes of storage. */
		__( 'After %1$s, your site will move to the Free plan, which means you’ll lose access to plugins, custom themes, and %2$d GB of storage.', 'jetpack-mu-wpcom' ),
		$expiry_date,
		$storage_gb
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

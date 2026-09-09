<?php
/**
 * Sitewide plan-expiry notices: shared infrastructure loader.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Owner;

// @codeCoverageIgnoreStart
require_once __DIR__ . '/class-expiry-data.php';
require_once __DIR__ . '/class-expiry-domain.php';
require_once __DIR__ . '/class-expiry-notice-dismiss.php';
require_once __DIR__ . '/class-expiry-owner.php';
require_once __DIR__ . '/class-expiry-wpcom.php';
// @codeCoverageIgnoreEnd

// @codeCoverageIgnoreStart -- shadowed by the test stub in tests/lib/functions-wordpress.php.
if ( ! function_exists( 'wpcom_expiry_get_purchases' ) ) {
	/**
	 * Source of purchase data for the expiry-notices feature. Pre-definable
	 * by a test mu-plugin without redeclaring `wpcom_get_site_purchases()`
	 * (which has no `function_exists` guard upstream and would fatal).
	 *
	 * @return array
	 *
	 * @phan-suppress PhanRedefineFunction -- phan sees both this and the test stub as definitions even though only one loads at runtime.
	 */
	function wpcom_expiry_get_purchases() {
		if ( function_exists( 'wpcom_get_site_purchases' ) ) {
			return wpcom_get_site_purchases();
		}
		return array();
	}
}
// @codeCoverageIgnoreEnd

/**
 * Whether the new expiry notices are switched on for this site.
 *
 * The rollout that gated this is finished, so the answer is yes unless something
 * says otherwise. Kept as a function rather than inlined because it is the one
 * predicate both halves of the swap read: the notices themselves, and the
 * suppression of the ones they replace -- wpcomsh's Atomic banner here, and the
 * legacy plan-renew prompt on the WordPress.com side. They must never disagree,
 * or a site ends up showing both notices or neither.
 */
function wpcom_expiry_notices_is_enabled_for_site(): bool {
	/**
	 * Filters whether the new expiry notices are enabled for this site.
	 *
	 * Both the new notices and the suppression of the ones they replace read
	 * this, so overriding it moves the whole swap together. Left in place after
	 * the rollout as the way to hold a single site back.
	 *
	 * @since $$next-version$$
	 *
	 * @param bool $enabled    Whether the site is on the new expiry notices.
	 * @param int  $percentage Share of sites the rollout targets. Always 100 now
	 *                         that it is complete; passed so that callbacks
	 *                         declaring both parameters keep working.
	 */
	return (bool) apply_filters( 'wpcom_expiry_notices_enabled', true, 100 );
}

/**
 * The expiry state this user should be shown something about, or null.
 *
 * The audience test every surface shares. Memoized because several hooks reach
 * it per admin pageview -- each surface enqueues and renders -- and nothing can
 * change the answer mid-request.
 *
 * @param bool $flush Drop the memo. For tests, which move the purchase fixture
 *                    under a process that has already answered once.
 * @return array<string,mixed>|null
 */
function wpcom_expiry_notices_eligible_state( bool $flush = false ): ?array {
	// Distinct from null, which is a real answer worth remembering.
	static $memo = false;

	if ( $flush ) {
		$memo = false;
		return null;
	}

	if ( false !== $memo ) {
		return $memo;
	}

	$memo = null;

	if ( ! current_user_can( 'manage_options' ) ) {
		return $memo;
	}

	// Excluded to match the Simple notice this replaces. Guarded because
	// `wpcom_is_vip()` only exists on wpcom.
	if ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) {
		return $memo;
	}

	$state = \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data::get_expiry_state();
	if ( null === $state || \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data::STATE_ACTIVE === $state['state'] ) {
		return $memo;
	}

	$memo = $state;
	return $memo;
}

/**
 * The "Your {plan} plan has expired" heading, shared by the banner and the modal.
 *
 * @param array<string,mixed> $state Expiry state.
 */
function wpcom_expiry_notices_expired_heading( array $state ): string {
	$plan = isset( $state['plan_name'] ) && is_string( $state['plan_name'] ) ? $state['plan_name'] : '';

	// Every stage has a variant without the plan name, for the rare purchase
	// whose slug the Plans package can't resolve to a short name.
	if ( '' === $plan ) {
		return __( 'Your plan has expired', 'jetpack-mu-wpcom' );
	}

	return sprintf(
		/* translators: %s is the plan name (e.g. Business). */
		__( 'Your %s plan has expired', 'jetpack-mu-wpcom' ),
		$plan
	);
}

/**
 * Whether the revert this feature describes applies to this site, now.
 *
 * Past the grace period this waits on the sticker rather than the date, because
 * the revert runs off the subscription-removal record and can lag the state by
 * days. Before then the changes are still ahead, which only Atomic faces.
 *
 * @param array<string,mixed> $state Expiry state.
 */
function wpcom_expiry_notices_revert_applies_to_site( array $state ): bool {
	if ( \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data::STATE_EXPIRED === ( $state['state'] ?? '' ) ) {
		return wpcom_has_blog_sticker( 'blog-transfer-reverted', get_wpcom_blog_id() );
	}

	return \Automattic\Jetpack\Constants::is_true( 'IS_ATOMIC' );
}

/**
 * The CTA a reverted site gets, pointing at support rather than checkout.
 *
 * Buying the plan again does not undo the revert, so only support can help with
 * what the notice says was lost. `url` is the fallback for a click the Help
 * Center could not answer.
 *
 * @param array<string,mixed> $state Expiry state.
 * @return array{label:string,url:string,message:string}
 */
function wpcom_expiry_notices_support_cta( array $state ): array {
	$plan = isset( $state['plan_name'] ) && is_string( $state['plan_name'] ) ? $state['plan_name'] : '';

	if ( '' === $plan ) {
		$message = __( 'My plan expired and I need your help getting it restored.', 'jetpack-mu-wpcom' );
	} else {
		$message = sprintf(
			/* translators: %s is the plan name (e.g. Business). */
			__( 'My %s plan expired and I need your help getting it restored.', 'jetpack-mu-wpcom' ),
			$plan
		);
	}

	return array(
		'label'   => __( 'Contact support', 'jetpack-mu-wpcom' ),
		// Where the Help Center package itself sends people when it cannot open
		// in place, so a click still lands somewhere useful without its bundle.
		'url'     => 'https://wordpress.com/help?help-center=home',
		'message' => $message,
	);
}

/**
 * The body of a banner-style notice: what the site loses and what to do about
 * it, or -- for an admin who cannot renew -- whose plan it is instead.
 *
 * The non-owner sentence is the one the Plans page uses, so the two agree. It
 * replaces the body, since every stage's body ends by asking for a renewal.
 *
 * @param array<string,mixed> $state    Expiry state.
 * @param bool                $is_owner Whether the viewer can renew.
 */
function wpcom_expiry_notices_banner_body( array $state, bool $is_owner ): string {
	if ( $is_owner ) {
		return wpcom_expiry_notices_admin_banner_body( $state );
	}
	return __( 'This plan was purchased by a different WordPress.com account. To manage this plan, log in to that account or contact the account owner.', 'jetpack-mu-wpcom' );
}

/**
 * The Tracks props every surface's events carry.
 *
 * Booleans go as the strings 'true'/'false': the PHP and JS Tracks clients
 * encode a real boolean differently, and a funnel has to read both the same.
 *
 * @param array<string,mixed> $state    Expiry state.
 * @param bool                $is_owner Whether the viewer can renew, and so was offered a CTA.
 * @param string              $surface  Where the notice showed.
 * @return array{state:string,days_remaining:int,product_slug:string,is_plan_owner:string,surface:string}
 */
function wpcom_expiry_notices_track_props( array $state, bool $is_owner, string $surface ): array {
	return array(
		'state'          => (string) ( $state['state'] ?? '' ),
		'days_remaining' => isset( $state['days_remaining'] ) ? (int) $state['days_remaining'] : 0,
		'product_slug'   => isset( $state['product_slug'] ) ? (string) $state['product_slug'] : '',
		'is_plan_owner'  => $is_owner ? 'true' : 'false',
		'surface'        => $surface,
	);
}

/**
 * Enqueue a surface's bundle with its data on `window.$global`.
 *
 * Inline JSON rather than wp_localize_script(), which casts every top-level
 * scalar to a string and would hand the client "" for a false. The Tracks
 * transport rides along because Atomic wp-admin loads none of its own, and
 * without it `window._tkq` stays an ordinary array that is dropped on unload.
 *
 * @param string              $asset  Build entry name.
 * @param string              $global Name of the window property the data lands on.
 * @param array<string,mixed> $data   What the script renders from.
 * @param string[]            $types  Asset types to enqueue.
 */
function wpcom_expiry_notices_enqueue_surface( string $asset, string $global, array $data, array $types = array( 'js', 'css' ) ): void {
	$json = wp_json_encode( $data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_HEX_APOS );
	if ( false === $json ) {
		return;
	}
	$handle = jetpack_mu_wpcom_enqueue_assets( $asset, $types );
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_enqueue_tracking_scripts( $handle );
	wp_add_inline_script( $handle, 'window.' . $global . ' = ' . $json . ';', 'before' );
}

/**
 * The current admin screen's id, or '' outside wp-admin.
 */
function wpcom_expiry_notices_current_screen_id(): string {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	return $screen ? (string) $screen->id : '';
}

/**
 * Whether the current screen is a block editor: post editor, site editor, or
 * block widgets.
 */
function wpcom_expiry_notices_is_block_editor_screen(): bool {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	return $screen ? $screen->is_block_editor() : false;
}

/**
 * What a banner surface renders from, or null if none should show.
 *
 * The early reminder is a Dashboard-only nudge; every later stage shows on
 * every wp-admin screen and on the front end. `urls` is null when the viewer
 * cannot renew.
 *
 * @return array{state:array,is_early_warning:bool,is_dismissible:bool,is_owner:bool,urls:array|null}|null
 */
function wpcom_expiry_notices_banner_data(): ?array {
	$state = wpcom_expiry_notices_eligible_state();
	if ( null === $state || ! Expiry_Notice_Dismiss::should_show_banner( $state ) ) {
		return null;
	}

	$is_early_warning = wpcom_expiry_notices_is_early_warning( $state );
	if ( $is_early_warning && 'dashboard' !== wpcom_expiry_notices_current_screen_id() ) {
		return null;
	}

	$is_owner = Expiry_Owner::current_user_is_owner( $state );

	return array(
		'state'            => $state,
		'is_early_warning' => $is_early_warning,
		'is_dismissible'   => Expiry_Notice_Dismiss::is_dismissible( $state ),
		'is_owner'         => $is_owner,
		'urls'             => $is_owner ? wpcom_expiry_notices_banner_urls( $state, wpcom_expiry_notices_current_url() ) : null,
	);
}

/**
 * CTA URLs for a banner surface.
 *
 * Only a reverted site is sent to support: one that never carried a transfer
 * lost plan features and nothing else, and buying the plan again does give those
 * back. The banner shows on every site, so this has to be asked, not assumed.
 *
 * @param array<string,mixed> $state       Expiry state.
 * @param string              $redirect_to Where checkout sends the user back to.
 * @return array<string,array>
 */
function wpcom_expiry_notices_banner_urls( array $state, string $redirect_to ): array {
	$urls = Expiry_Data::get_cta_urls( $state, $redirect_to );
	if ( Expiry_Data::STATE_EXPIRED !== ( $state['state'] ?? '' ) ) {
		return $urls;
	}

	if ( wpcom_expiry_notices_revert_applies_to_site( $state ) ) {
		$urls['primary'] = wpcom_expiry_notices_support_cta( $state );
	} else {
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
		return wpcom_expiry_notices_expired_heading( $state );
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

	$stage = $state['state'] ?? '';

	// Past grace by the calendar but still Atomic and un-reverted: none of what
	// the post-grace copy claims has happened yet, and renewing still prevents
	// it, so describe it the way the grace period does.
	if ( Expiry_Data::STATE_EXPIRED === $stage
		&& ! wpcom_expiry_notices_revert_applies_to_site( $state )
		&& Constants::is_true( 'IS_ATOMIC' ) ) {
		$stage = Expiry_Data::STATE_EXPIRED_GRACE;
	}

	if ( Expiry_Data::STATE_EXPIRED === $stage ) {
		// A revert takes the site private and deletes what it lists, and buying
		// the plan again brings none of it back -- so this half asks for support.
		if ( wpcom_expiry_notices_revert_applies_to_site( $state ) ) {
			if ( null === $storage_gb ) {
				return __( 'Your site has been moved to the Free plan and set to private. You no longer have access to plugins, custom themes, or additional storage. Contact support to get help restoring it.', 'jetpack-mu-wpcom' );
			}
			return sprintf(
				/* translators: %d is a number of gigabytes of storage. */
				__( 'Your site has been moved to the Free plan and set to private. You no longer have access to plugins, custom themes, or %d GB of storage. Contact support to get help restoring it.', 'jetpack-mu-wpcom' ),
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

	if ( Expiry_Data::STATE_EXPIRED_GRACE === $stage ) {
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
 * Load the surfaces for this request, unless something has held this site back.
 *
 * On `init` rather than at file load. This file is required on `plugins_loaded`,
 * and every hook any surface registers fires later still, so waiting keeps the
 * requires off the bootstrap at no cost.
 */
function wpcom_expiry_notices_maybe_load_surfaces() {
	if ( ! wpcom_expiry_notices_is_enabled_for_site() ) {
		return;
	}
	if ( is_admin() ) {
		require_once __DIR__ . '/admin-banner.php';
		require_once __DIR__ . '/admin-modal.php';
		require_once __DIR__ . '/editor-notice.php';
	} else {
		require_once __DIR__ . '/frontend-banner.php';
	}
}
add_action( 'init', 'wpcom_expiry_notices_maybe_load_surfaces' ); // @codeCoverageIgnore

/**
 * Whether the front-end banner will render on this request.
 *
 * The one predicate the other front-end banners read to stand down. Callable
 * from `init`, so it does not ask conditional query tags.
 */
function wpcom_expiry_notices_frontend_banner_is_due(): bool {
	if ( is_admin() || is_customize_preview() || ! wpcom_expiry_notices_is_enabled_for_site() ) {
		return false;
	}
	return null !== wpcom_expiry_notices_banner_data();
}

/**
 * Take the one front-end banner slot on Simple when the expiry banner is due.
 *
 * WordPress.com's resolver shows a single banner per request, picked from a
 * fixed key list; a key it does not know leaves it nothing to show.
 *
 * @param array<string,callable> $banners Banners registered so far.
 * @return array<string,callable>
 */
function wpcom_expiry_notices_claim_wpcom_banner_slot( array $banners ): array {
	if ( ! wpcom_expiry_notices_frontend_banner_is_due() ) {
		return $banners;
	}
	return array( 'wpcom_expiry_banner' => '__return_null' );
}
add_filter( 'wpcom_register_banners', 'wpcom_expiry_notices_claim_wpcom_banner_slot', PHP_INT_MAX ); // @codeCoverageIgnore

/**
 * Register the dismiss meta keys. Gated on admin / REST so we don't pay the
 * register_meta cost on every front-end request.
 */
function wpcom_expiry_notices_register_meta() {
	if ( ! is_admin() && ! ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) {
		return;
	}
	if ( ! wpcom_expiry_notices_is_enabled_for_site() ) {
		return;
	}
	\Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Notice_Dismiss::register_user_meta();
}
add_action( 'init', 'wpcom_expiry_notices_register_meta' ); // @codeCoverageIgnore
// `init` alone never registers these on a REST request: WP defines REST_REQUEST
// in rest_api_loaded() on `parse_request`, which fires after `init`, so the
// guard above bails and the write silently no-ops -- the endpoint drops an
// unregistered meta key and still answers 200. Every dismissal arrives over
// REST, so without this hook none of them persist.
add_action( 'rest_api_init', 'wpcom_expiry_notices_register_meta' ); // @codeCoverageIgnore

/**
 * The URL of the current page, for checkout to send the user back to.
 *
 * One-shot query args (`settings-updated`, `updated`, ...) are dropped so the
 * return trip doesn't replay them.
 */
function wpcom_expiry_notices_current_url(): string {
	$request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : ''; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated -- isset() is the validation; the sniff wants a second one.
	$request_uri = remove_query_arg( wp_removable_query_args(), $request_uri );

	if ( is_admin() ) {
		$admin_path = (string) wp_parse_url( admin_url(), PHP_URL_PATH );
		return 0 === strpos( $request_uri, $admin_path )
			? admin_url( substr( $request_uri, strlen( $admin_path ) ) )
			: admin_url();
	}
	return home_url( '' === $request_uri ? '/' : $request_uri );
}

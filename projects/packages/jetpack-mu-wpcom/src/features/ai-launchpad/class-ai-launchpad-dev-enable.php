<?php
/**
 * AI Launchpad no-CLI test-enable handler.
 *
 * Lets a tester turn the AI Launchpad on (and reset its state) for a site
 * straight from the browser, removing the `wp option update
 * wpcom_ai_launchpad_enabled 1` / reset-script SSH steps that testing otherwise
 * requires. Modeled on the existing wpcom query-param overrides
 * (wpcom-dashboard-redesign-override.php `?enable-dashboard-redesign=1`,
 * jetpack stats `?enable_new_stats=1`), which likewise flip a feature straight
 * from a `$_GET` flag.
 *
 * Recognized query args (on any admin page, for a `manage_options` user):
 *   ?enable-ai-launchpad=1  Set wpcom_ai_launchpad_enabled to 1.
 *   ?enable-ai-launchpad=0  Delete wpcom_ai_launchpad_enabled (turn back off).
 *   ?reset-ai-launchpad=1   Clear the wizard / AI-output / dismissed / task-status
 *                           options so the wizard runs fresh.
 *
 * Each action redirects to the clean AI Launchpad page URL so a refresh does not
 * re-fire it.
 *
 * Hooked on `admin_menu`, not `admin_init`: when the feature is OFF its admin
 * page is unregistered, and WordPress runs the `user_can_access_admin_page()`
 * check (and dies with "you are not allowed to access this page") in
 * wp-admin/menu.php — which loads *before* `admin_init`. `admin_menu` fires
 * inside that same file but before the access check, so handling it there lets
 * the launchpad page's own URL self-enable instead of dying first.
 *
 * Gate: `current_user_can( 'manage_options' )` only — no nonce, matching the
 * wpcom precedents, so the URL stays bookmarkable/shareable. NOTE: this ships to
 * production on real sites, where it lets any paid-site admin self-enable the
 * (otherwise OFF) feature on their own site. That exposure was reviewed and
 * accepted as an interim testing affordance; tighten the gate before the
 * controlled rollout (DOTOBRD-456) if the feature must stay invisible to
 * customers.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Handles the AI Launchpad test-enable / reset query params.
 */
class AI_Launchpad_Dev_Enable {

	/**
	 * The per-site enablement option, mirrored from AI_Launchpad::is_enabled_for_site().
	 */
	const OPTION_ENABLED = 'wpcom_ai_launchpad_enabled';

	/**
	 * Options cleared by a reset, matching docs/bin/reset-ai-launchpad-test-site.sh.
	 * The first three reference the REST controller's canonical constants so a
	 * rename there can't silently leave the reset clearing a stale option name.
	 */
	const RESET_OPTIONS = array(
		AI_Launchpad_REST::OPTION_WIZARD,
		AI_Launchpad_REST::OPTION_AI_OUTPUT,
		AI_Launchpad_REST::OPTION_DISMISSED,
		'launchpad_checklist_tasks_statuses', // Shared completion option; no dedicated constant.
	);

	/**
	 * Register the admin-request handler.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'maybe_handle_request' ) );
	}

	/**
	 * Acts on the test-enable / reset query params, then redirects to the clean
	 * AI Launchpad page URL so a refresh does not re-fire the action.
	 *
	 * @return void
	 */
	public static function maybe_handle_request() {
		$redirect = self::handle();

		if ( '' === $redirect ) {
			return;
		}

		wp_safe_redirect( $redirect );
		exit;
	}

	/**
	 * Applies the requested option changes and returns where to send the user.
	 * Split from the redirect/exit so it can be unit-tested. No-op (and cheap) on
	 * the overwhelming majority of admin requests, which carry neither param.
	 *
	 * @return string The URL to redirect to, or '' when there is nothing to do
	 *                (no recognized param, or the user lacks the capability).
	 */
	public static function handle() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Intentional no-nonce toggle, see file docblock; cap-gated below.
		$enable = isset( $_GET['enable-ai-launchpad'] );
		$reset  = isset( $_GET['reset-ai-launchpad'] );

		if ( ! $enable && ! $reset ) {
			return '';
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return '';
		}

		$disabling = false;

		if ( $enable ) {
			$value = sanitize_text_field( wp_unslash( $_GET['enable-ai-launchpad'] ) );
			if ( '0' === $value ) {
				delete_option( self::OPTION_ENABLED );
				$disabling = true;
			} else {
				update_option( self::OPTION_ENABLED, 1 );
			}
		}

		if ( $reset ) {
			foreach ( self::RESET_OPTIONS as $option ) {
				delete_option( $option );
			}
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		// Disabling removes the (eligibility-gated) launchpad page, so land on the
		// dashboard rather than the now-inaccessible page. Otherwise go to the
		// launchpad: the redirect starts a fresh request where the menu
		// re-registers. (On a site without a paid plan the page stays gated, but
		// that is out of scope — the feature requires a paid plan.)
		if ( $disabling ) {
			return admin_url();
		}

		return admin_url( 'admin.php?page=' . \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::MENU_SLUG );
	}
}

AI_Launchpad_Dev_Enable::register();

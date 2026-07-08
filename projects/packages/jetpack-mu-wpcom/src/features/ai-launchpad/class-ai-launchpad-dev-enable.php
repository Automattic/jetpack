<?php
/**
 * AI Launchpad no-CLI test-enable handler.
 *
 * Lets a tester turn the AI Launchpad on (and reset its state) for a site straight from the browser.
 *
 * Recognized query args (on any admin page, for a `manage_options` user):
 *   ?enable-ai-launchpad=1  Set wpcom_ai_launchpad_enabled to 1.
 *   ?enable-ai-launchpad=0  Delete wpcom_ai_launchpad_enabled (turn back off).
 *   ?reset-ai-launchpad=1   Clear the wizard / AI-output / dismissed / skipped / task-status options so the wizard runs fresh.
 *
 * Hooked on `admin_menu`, not `admin_init`: when the feature is OFF its page is unregistered and
 * `user_can_access_admin_page()` dies before `admin_init`; `admin_menu` fires before that check, so the page's own
 * URL can self-enable instead of dying first.
 *
 * Gate: `current_user_can( 'manage_options' )` only — no nonce, so the URL stays bookmarkable. This ships to
 * production, where it lets any paid-site admin self-enable the (otherwise OFF) feature on their own site; tighten
 * the gate before the controlled rollout if the feature must stay invisible to customers.
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
	 * Options cleared by a reset.
	 *
	 * The first three reference the REST controller's constants so a rename there can't leave a stale option name here.
	 */
	const RESET_OPTIONS = array(
		AI_Launchpad_REST::OPTION_WIZARD,
		AI_Launchpad_REST::OPTION_AI_OUTPUT,
		AI_Launchpad_REST::OPTION_DISMISSED,
		AI_Launchpad_REST::OPTION_SKIPPED,
		AI_Launchpad_REST::OPTION_COMPLETED,
		'launchpad_checklist_tasks_statuses', // Shared completion option; no dedicated constant.
	);

	/**
	 * Redirect targets returned by handle(), kept as abstract tokens (not URLs) so handle() can be unit-tested.
	 */
	const REDIRECT_NONE      = '';
	const REDIRECT_PAGE      = 'page';
	const REDIRECT_DASHBOARD = 'dashboard';

	/**
	 * Register the admin-request handler.
	 *
	 * @return void
	 */
	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'maybe_handle_request' ) );
	}

	/**
	 * Acts on the test-enable / reset query params, then redirects so a refresh does not re-fire the action.
	 *
	 * Disabling lands on the dashboard (the gated page is gone); everything else lands on the AI Launchpad page.
	 *
	 * @return void
	 */
	public static function maybe_handle_request() {
		$target = self::handle();

		if ( self::REDIRECT_NONE === $target ) {
			return;
		}

		$url = self::REDIRECT_DASHBOARD === $target
			? admin_url()
			: admin_url( 'admin.php?page=' . \Automattic\Jetpack\Jetpack_Mu_Wpcom\AI_Launchpad::MENU_SLUG );

		wp_safe_redirect( $url );
		exit;
	}

	/**
	 * Applies the requested option changes and returns where to send the user, as one of the REDIRECT_* tokens.
	 *
	 * Split from the redirect/exit so it can be unit-tested in isolation.
	 *
	 * @return string One of the REDIRECT_* constants (REDIRECT_NONE when there is
	 *                nothing to do: no recognized param, or no capability).
	 */
	public static function handle() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Intentional no-nonce toggle, see file docblock; cap-gated below.
		$enable = isset( $_GET['enable-ai-launchpad'] );
		$reset  = isset( $_GET['reset-ai-launchpad'] );

		if ( ! $enable && ! $reset ) {
			return self::REDIRECT_NONE;
		}

		if ( ! current_user_can( 'manage_options' ) ) {
			return self::REDIRECT_NONE;
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

		// Disabling removes the gated launchpad page, so land on the dashboard rather than the now-inaccessible page.
		return $disabling ? self::REDIRECT_DASHBOARD : self::REDIRECT_PAGE;
	}
}

AI_Launchpad_Dev_Enable::register();

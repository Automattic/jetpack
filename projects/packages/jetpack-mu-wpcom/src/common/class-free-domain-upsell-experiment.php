<?php
/**
 * Resolves the calypso_omnibar_free_domain_upsell_20260825 experiment variation server-side.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Host;

/**
 * Reads the omnibar free-domain upsell variation for the current user.
 *
 * The experiment moves the "Free domain with an annual plan" upsell from the
 * wp-admin sidebar notice (control; the free_to_paid_plan and
 * monthly_to_annual_plan messages) to a persistent "Free domain" chip in the
 * admin bar / omnibar (treatment). It only targets Simple sites, so there is
 * no Atomic path.
 *
 * On Simple sites, a real page render (wp-admin or front end) uses the assigning
 * ExPlat call, so eligible users are enrolled where the two experiences diverge.
 * Non-page contexts (REST — including the omnibar admin-bar endpoint — AJAX and
 * cron) use the non-assigning read: serving data must never create an assignment.
 * The resolved variation is transient-cached per user, mirroring
 * Launchpad_Personalization_Experiment.
 */
class Free_Domain_Upsell_Experiment {

	const EXPERIMENT_NAME = 'calypso_omnibar_free_domain_upsell_20260825';

	/**
	 * The current user's variation: 'control' or 'treatment'.
	 *
	 * @return string
	 */
	public static function get_variation() {
		/**
		 * Overrides the resolved variation (testing / manual QA). Return 'treatment' or 'control', or null to use ExPlat.
		 *
		 * @param string|null $override The forced variation, or null.
		 */
		$override = apply_filters( 'wpcom_free_domain_upsell_variation', null );
		if ( null !== $override ) {
			return self::normalize( $override );
		}

		$user_id = get_current_user_id();
		if ( ! $user_id ) {
			return 'control';
		}

		$cache_key = 'free-domain-upsell-variation-' . $user_id;
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return (string) $cached;
		}

		$raw = self::fetch_variation();

		// An unassigned user reads as null. Don't cache that, so the next page
		// render can still create the assignment.
		if ( null === $raw ) {
			return 'control';
		}

		$variation = self::normalize( $raw );
		set_transient( $cache_key, $variation, HOUR_IN_SECONDS );

		return $variation;
	}

	/**
	 * Fetch the raw variation name from ExPlat, or null.
	 *
	 * @return string|null
	 */
	private static function fetch_variation() {
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return null;
		}

		if ( self::is_page_render() ) {
			if ( function_exists( '\ExPlat\assign_current_user' ) ) {
				return \ExPlat\assign_current_user( self::EXPERIMENT_NAME );
			}
			return null;
		}

		if ( function_exists( '\ExPlat\get_current_user_assignment' ) ) {
			// The \ExPlat\ helpers live in wpcom, outside this monorepo, so Phan can't see this one.
			// @phan-suppress-next-line PhanUndeclaredFunction
			return \ExPlat\get_current_user_assignment( self::EXPERIMENT_NAME );
		}

		return null;
	}

	/**
	 * Whether this request renders a page a user actually sees, as opposed to a
	 * data request (REST, AJAX, cron) that must never create an assignment.
	 *
	 * @return bool
	 */
	private static function is_page_render() {
		if ( Constants::is_true( 'REST_REQUEST' ) ) {
			return false;
		}
		if ( wp_doing_ajax() || wp_doing_cron() ) {
			return false;
		}
		return true;
	}

	/**
	 * Map any variation onto a known value; unknown becomes 'control'.
	 *
	 * @param string|null $variation The raw variation name.
	 * @return string
	 */
	private static function normalize( $variation ) {
		return 'treatment' === $variation ? 'treatment' : 'control';
	}
}

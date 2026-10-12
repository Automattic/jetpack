<?php
/**
 * AI Launchpad: the free DIFM offer banner's eligibility and experiment assignment.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Data;
use Automattic\Jetpack\Status\Host;

/**
 * Decides whether the Site Setup page shows the free DIFM offer banner.
 *
 * The rules are the same as the Calypso banners on /themes/<site> and /sites/<site>
 * (client/dashboard/utils/difm-offer.ts), so one user sees the same offer on every surface.
 */
class AI_Launchpad_Difm_Offer {

	/**
	 * The ExPlat experiment. A placeholder until the experiment is registered, the same name Calypso uses.
	 */
	const EXPERIMENT = 'wpcom_difm_post_signup_offer_placeholder';

	/**
	 * The only variation that shows the banner.
	 */
	const TREATMENT = 'treatment';

	/**
	 * The Calypso preference the Calypso banners also write, so one dismissal hides the offer everywhere.
	 */
	const DISMISSED_PREFERENCE = 'hosting-dashboard-difm-offer-dismissed';

	/**
	 * The oldest site, in days, that still gets the offer.
	 */
	const MAX_SITE_AGE_DAYS = 7;

	/**
	 * Free, Personal and Premium, every term, and the Personal trial. Same list as Calypso's ELIGIBLE_PLAN_SLUGS.
	 */
	const ELIGIBLE_PLAN_SLUGS = array(
		'free_plan',
		'personal-bundle-monthly',
		'wp-personal-bundle-free-trial-monthly',
		'personal-bundle',
		'personal-bundle-2y',
		'personal-bundle-3y',
		'value_bundle_monthly',
		'value_bundle',
		'value_bundle-2y',
		'value_bundle-3y',
	);

	/**
	 * Calypso's englishLocales, in its slug format.
	 */
	const ENGLISH_LOCALES = array( 'en', 'en-gb' );

	/**
	 * The offer for the current user and site, or null when the banner must not show.
	 *
	 * The user is assigned to the experiment only after every other check passes, so an
	 * ineligible user never enters it.
	 *
	 * @param int|null $now Unix time to judge the site age against. Defaults to time().
	 * @return array{variation:string,image_url:string,cta_url:string}|null
	 */
	public static function get_offer( $now = null ) {
		if ( ! self::is_eligible( null === $now ? time() : $now ) ) {
			return null;
		}

		if ( self::TREATMENT !== self::get_variation() ) {
			return null;
		}

		return array(
			'variation' => self::TREATMENT,
			'image_url' => plugins_url( 'images/difm-offer-illustration.svg', __FILE__ ),
			'cta_url'   => self::get_cta_url(),
		);
	}

	/**
	 * The CTA destination: the Calypso site overview, which opens the offer modal from the
	 * `difm-offer` parameter. The base is built as the AI assistant banner builds its CTA.
	 *
	 * Raw escaping, not esc_url(): the URL goes out in JSON, and esc_url() would turn `&` into `&#038;`.
	 *
	 * @return string
	 */
	private static function get_cta_url() {
		return esc_url_raw(
			add_query_arg(
				array(
					'difm-offer' => 'open',
					'source'     => 'site-setup',
				),
				wpcom_get_calypso_origin() . '/sites/' . wpcom_get_site_slug()
			)
		);
	}

	/**
	 * Every check that comes before the experiment assignment, cheapest and most decisive first.
	 *
	 * @param int $now Unix time to judge the site age against.
	 * @return bool
	 */
	private static function is_eligible( $now ) {
		// Eligible plans never run on Atomic, and the checks below read Simple-only data.
		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return false;
		}

		$blog_id = get_current_blog_id();

		return self::has_eligible_plan()
			&& self::is_recent_site( $now )
			&& self::is_english_user()
			&& ! wpcom_has_blog_sticker( 'a4a-is-dev-site', $blog_id )
			&& ! wpcom_has_blog_sticker( 'difm-lite-in-progress', $blog_id )
			&& ! self::is_dismissed();
	}

	/**
	 * Whether the site's plan is one the offer is for. A Simple site with no plan bundle is on the Free plan.
	 *
	 * Fails closed when the purchases helper is missing: an empty list would otherwise read as Free.
	 *
	 * @return bool
	 */
	private static function has_eligible_plan() {
		if ( ! function_exists( 'wpcom_expiry_get_purchases' ) ) {
			return false;
		}

		// Real plan bundles only, as in wpcom_ai_assistant_banner_tracks_props(): the slug fallback
		// would also match add-ons such as Professional Email Premium.
		$bundles = wp_list_filter( (array) wpcom_expiry_get_purchases(), array( 'product_type' => 'bundle' ) );
		$plan    = Expiry_Data::pick_primary_plan_purchase( $bundles );
		$slug    = $plan && isset( $plan->product_slug ) && is_string( $plan->product_slug ) ? $plan->product_slug : 'free_plan';

		return in_array( $slug, self::ELIGIBLE_PLAN_SLUGS, true );
	}

	/**
	 * Whether the site is at most MAX_SITE_AGE_DAYS old.
	 *
	 * Reads the blog's `registered` date, the source of `created_at` in the sites API. It is a GMT
	 * `Y-m-d H:i:s` string. There is no lower bound, as in Calypso.
	 *
	 * @param int $now Unix time to judge the site age against.
	 * @return bool
	 */
	private static function is_recent_site( $now ) {
		if ( ! function_exists( 'get_blog_details' ) ) {
			return false;
		}

		$details    = get_blog_details( get_current_blog_id() );
		$registered = is_object( $details ) && isset( $details->registered ) ? (string) $details->registered : '';
		$created_at = strtotime( $registered . ' UTC' );

		// A never-set registered date is all zeros, which parses to a time before the epoch.
		if ( false === $created_at || $created_at <= 0 ) {
			return false;
		}

		return $now - $created_at <= self::MAX_SITE_AGE_DAYS * DAY_IN_SECONDS;
	}

	/**
	 * Whether the user's interface language is English, in Calypso's slug format.
	 *
	 * WordPress.com stores slugs such as `en` and `en-gb`; core stores `en_US` and `en_GB`. Both map
	 * onto Calypso's set, where `en` is US English.
	 *
	 * @return bool
	 */
	private static function is_english_user() {
		$slug = str_replace( '_', '-', strtolower( (string) get_user_locale() ) );
		if ( 'en-us' === $slug ) {
			$slug = 'en';
		}

		return in_array( $slug, self::ENGLISH_LOCALES, true );
	}

	/**
	 * Whether the user dismissed the offer on any surface. Fails closed when the preferences are unreadable.
	 *
	 * @return bool
	 */
	private static function is_dismissed() {
		if ( ! function_exists( 'get_user_attribute' ) ) {
			return true;
		}

		$preferences = get_user_attribute( get_current_user_id(), 'calypso_preferences' );

		return is_array( $preferences ) && ! empty( $preferences[ self::DISMISSED_PREFERENCE ] );
	}

	/**
	 * The user's experiment variation. Assigns the user on first call.
	 *
	 * @return string|null
	 */
	private static function get_variation() {
		/**
		 * Overrides the DIFM offer experiment assignment on the Site Setup page, for testing.
		 *
		 * The eligibility checks still apply; only the assignment is replaced.
		 *
		 * @param bool|null $override True to force the treatment, false to force control, or null to ask ExPlat.
		 */
		$override = apply_filters( 'wpcom_ai_launchpad_difm_offer_override_is_treatment', null );
		if ( null !== $override ) {
			return $override ? self::TREATMENT : 'control';
		}

		if ( ! function_exists( '\ExPlat\assign_current_user' ) ) {
			return null;
		}

		return \ExPlat\assign_current_user( self::EXPERIMENT );
	}
}

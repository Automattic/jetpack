<?php
/**
 * Determine whether or not to show an front end notice.
 *
 * @package WPCOMSH_Frontend_Notices
 */

/**
 * Shows a full page frontend notice when site is expired.
 */
class WPCOMSH_Frontend_Notices {
	/**
	 * Initializes the plugin.
	 */
	public static function action_wp_enqueue_script() {

		if ( self::should_display_expired_plan_notice() ) {
			return self::render_expired_plan_notice();
		}

		// Show for all proxied users, so they are aware of the upcoming changes.
		if ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST ) {
			if ( self::should_display_expiring_plan_notice() ) {
				return self::render_expiring_plan_notice();
			}
		}
	}

	/**
	 * Determines if the plan expired notice should display.
	 *
	 * The notice displays three days after plan expiration, and only to logged out users.
	 *
	 * @return bool
	 */
	public static function should_display_expired_plan_notice() {

		// We only have English strings right now.
		if ( ! self::is_english_locale() ) {
			return false;
		}

		$current_purchase = self::get_current_purchase();
		if ( ! $current_purchase ) {
			return false;
		}
		$seconds_after_expiration = time() - strtotime( $current_purchase->expiry_date );

		// Only show the notice after the plan is expired for at least three days.
		if ( $seconds_after_expiration < 3 * DAY_IN_SECONDS ) {
			return false;
		}
		return true;
	}

	/**
	 * Determines if the plan expiring notice should display.
	 *
	 * If the toggle for gifting is ON and auto-renew is OFF, we will display the banner:
	 *  - 60 days before the annual plan expiration
	 *  - 7 days before the monthly plan’s expiration.
	 *
	 * @return bool
	 */
	public static function should_display_expiring_plan_notice() {
		// If wpcom_gifting_subscription is off, don't display the banner. This is synced via Jetpack.
		$gift_toggle = (bool) get_option( 'wpcom_gifting_subscription', true );
		if ( false === $gift_toggle ) {
			return false;
		}

		$plan_purchase = self::get_plan_purchase();

		// Without plan we don't show the banner
		if ( ! $plan_purchase ) {
			return false;
		}

		// If auto-renew is ON we don't display the banner
		if ( ! empty( $plan_purchase->auto_renew ) ) {
			return false;
		}

		// We will display the banner:
		// - 60 days before the annual plan expiration
		// - 7 days before the monthly plan expiration
		$days_of_warning          = false !== strpos( $plan_purchase->product_slug, 'monthly' ) ? 7 : 60;
		$seconds_until_expiration = strtotime( $plan_purchase->expiry_date ) - time();

		if ( $seconds_until_expiration < $days_of_warning * DAY_IN_SECONDS ) {
			return true;
		}

		// Unpredicted scenarios don't show the banner
		return false;
	}

	/**
	 * Get hosting plan purchase from the current site.
	 *
	 * @return object|null
	 */
	private static function get_plan_purchase() {
		// Only site plans (monthly, yearly, yearly x2)
		$plan_slugs = array(
			'starter-plan',
			'pro-plan',
			'personal-bundle',
			'value_bundle',
			'business-bundle',
			'ecommerce-bundle',
		);

		$purchases = wpcom_get_site_purchases();

		foreach ( $purchases as $purchase ) {
			$filter = array_filter(
				$plan_slugs,
				function( $plan_slug ) use ( $purchase ) {
					return strpos( $purchase->product_slug, $plan_slug ) !== false;
				}
			);

			if ( count( $filter ) > 0 ) {
				return $purchase;
			}
		}

		return null;
	}

	/**
	 * Gets the current purchase from the Atomic Persistent Data object.
	 *
	 * @return object|null
	 */
	private static function get_current_purchase() {
		$persistent_data = new Atomic_Persistent_Data();

		$current_purchase = null;
		if ( $persistent_data && $persistent_data->WPCOM_PURCHASES ) { // phpcs:ignore WordPress.NamingConventions
			$purchases        = json_decode( $persistent_data->WPCOM_PURCHASES ); // phpcs:ignore WordPress.NamingConventions
			$atomic_purchases = self::get_atomic_purchases( $purchases );
			if ( ! empty( $atomic_purchases ) ) {
				$current_purchase = self::get_correct_purchase( $atomic_purchases );
			}
		}

		/**
		 * Filter $current_purchase for local development. See FrontendNoticesTest for test data.
		 *
		 * @var array $current_purchase A current purchase to use.
		 */
		return apply_filters( 'wpcomsh_frontend_notices_current_purchase', $current_purchase );
	}

	/**
	 * Get the Atomic supported purchases from the purchases array.
	 *
	 * @param array $purchases The purchases array.
	 *
	 * @return array The Atomic supported purchases.
	 */
	private static function get_atomic_purchases( $purchases ) {
		if ( ! is_array( $purchases ) ) {
			return array();
		}

		return array_filter(
			$purchases,
			function( $purchase ) {
				return wpcom_purchase_has_feature( $purchase, WPCOM_Features::ATOMIC );
			}
		);
	}

	/**
	 * Get the correct purchase from the atomic purchases array.
	 *
	 * @param array $atomic_purchases The purchases array.
	 *
	 * @return array{product_slug: string, product_id: string, product_type: string, subscribed_date: string, expiry_date: string, ownership_id: string } The correct purchase.
	 */
	private static function get_correct_purchase( $atomic_purchases ) {
		usort(
			$atomic_purchases,
			function( $purchase1, $purchase2 ) {
				if ( strtotime( $purchase1->expiry_date ) === strtotime( $purchase2->expiry_date ) ) {
					return 0;
				}
				return ( strtotime( $purchase1->expiry_date ) > strtotime( $purchase2->expiry_date ) ) ? -1 : 1;
			}
		);

		return $atomic_purchases[0];
	}

	/**
	 * Sets the plan level of the expired site.
	 *
	 * @param object $purchase The correct purchase.
	 * @return string|null
	 */
	private static function get_plan_level( $purchase ) {
		$slug = $purchase->product_slug;
		if ( strpos( $slug, 'personal' ) !== false ) {
			return 'personal';
		} elseif ( strpos( $slug, 'value_bundle' ) !== false || 'bundle_pro' === $slug ) {
			return 'premium';
		} elseif ( strpos( $slug, 'business' ) !== false ) {
			return 'business';
		} elseif ( strpos( $slug, 'ecommerce' ) !== false ) {
			return 'ecommerce';
		} elseif ( strpos( $slug, 'pro' ) !== false ) {
			return 'pro';
		}
		return null;
	}

	/**
	 * Renders a expired site page.
	 */
	private static function render_expired_plan_notice() {
		$current_purchase = self::get_current_purchase();
		if ( ! $current_purchase ) {
			return;
		}

		$data['plan_level'] = sanitize_text_field( self::get_plan_level( $current_purchase ) );
		$data['i18n']       = array(
			'title'       => esc_html__( 'This site is going offline soon.', 'wpcomsh' ),
			'description' => esc_html__( 'If you enjoy the site, please let the site owner know their plan has expired. Maybe their contact information is on the site?', 'wpcomsh' ),
			'action'      => esc_html__( 'Continue to site', 'wpcomsh' ),
		);

		wp_enqueue_style( 'recoleta-font', '//s1.wp.com/i/fonts/recoleta/css/400.min.css', array(), WPCOMSH_VERSION );
		wp_enqueue_style( 'expired-site-style', plugins_url( 'expired-plan-notices.css', __FILE__ ), array(), WPCOMSH_VERSION );
		wp_register_script( 'expired-site-actions', plugins_url( 'actions.js', __FILE__ ), array(), WPCOMSH_VERSION, false );
		wp_localize_script( 'expired-site-actions', 'wpcomsh_epn_data', $data );
		wp_enqueue_script( 'expired-site-actions', plugins_url( 'actions.js', __FILE__ ), array(), WPCOMSH_VERSION, false );
		wp_set_script_translations( 'expired-site-actions', 'wpcomsh' );
	}

	/**
	 * Renders a expiring site page.
	 */
	private static function render_expiring_plan_notice() {
		$current_purchase = self::get_current_purchase();
		if ( ! $current_purchase ) {
			return;
		}

		$product_slug    = $current_purchase->product_slug;
		$subscription_id = $current_purchase->subscription_id;

		$data['checkout_link'] = 'https://wordpress.com/checkout/' . $product_slug . '/gift/' . $subscription_id;
		$data['i18n']          = array(
			'title'       => __(
				'Gift a renewal',
				'wpcomsh'
			),
			'subtitle'    => __(
				'Renew this site before it expires!',
				'wpcomsh'
			),
			'button_text' => __(
				'Renew',
				'wpcomsh'
			),
		);

		wp_enqueue_style( 'recoleta-font', '//s1.wp.com/i/fonts/recoleta/css/400.min.css', array(), WPCOMSH_VERSION );
		wp_enqueue_style( 'expiring-site-style', plugins_url( 'expiring-plan-notices.css', __FILE__ ), array(), WPCOMSH_VERSION );
		wp_register_script( 'expiring-site-actions', plugins_url( 'expiring-actions.js', __FILE__ ), array(), WPCOMSH_VERSION, false );
		wp_enqueue_script( 'expiring-site-actions', plugins_url( 'expiring-actions.js', __FILE__ ), array(), WPCOMSH_VERSION, false );
		wp_localize_script( 'expiring-site-actions', 'wpcomsh_expiring_data', $data );
		wp_set_script_translations( 'expiring-site-actions', 'wpcomsh' );
	}

	/**
	 * Determines if the current locale is English.
	 *
	 * @return bool
	 */
	private static function is_english_locale() {
		return strpos( get_locale(), 'en_' ) !== false;
	}

}

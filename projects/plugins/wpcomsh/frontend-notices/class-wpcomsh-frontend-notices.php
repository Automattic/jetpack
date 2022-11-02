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

		if ( ! self::should_display_expired_plan_notice() ) {
			return;
		}
		self::render_expired_plan_notice();
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
	 * Determines if the current locale is English.
	 *
	 * @return bool
	 */
	private static function is_english_locale() {
		return strpos( get_locale(), 'en_' ) !== false;
	}

}

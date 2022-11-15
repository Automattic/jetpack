<?php // phpcs:ignore WordPress.File.FileName.InvalidClassFileName
/**
 * Show the gifting banner on Simple & Atomic sites.
 * This file is duplicated in WPCOM and WPCOMSH.
 * WPCOM: public_html/wp-content/blog-plugins/gifting-banner.php
 * WPCOMSH: wpcomsh/frontend-notices/gifting-banner.php
 * See: p9Jlb4-5v7-p2
 *
 * @package gifting-banner
 */

/**
 * Class Gifting_Banner
 */
class Gifting_Banner {

	/**
	 * The current purchased plan of the blog.
	 * Used to pass data between methods.
	 *
	 * @var object|null
	 */
	public $current_plan;

	/**
	 * Maybe show the gifting banner for the current site.
	 */
	public function maybe_show_gifting_banner() {
		// Hide the gifting banner behind a8c proxy.
		if ( ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST ) ||
			( defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST ) ) {

			if ( $this->should_display_expiring_plan_notice() ) {
				// Inject the gifting banner after the launch banner.
				if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
					add_action( 'wp_head', array( $this, 'inject_gifting_banner_wpcomsh' ), 1103 );
				} else {
					add_action( 'wp_head', array( $this, 'inject_gifting_banner_wpcom' ), 1103 );
				}
			}
		}
	}

	/**
	 * Determines if the plan expiring notice should display.
	 *
	 * @return bool
	 */
	public function should_display_expiring_plan_notice() {
		$this->current_plan = $this->get_plan_purchase();

		// If site doesn't have valid plan -> don't show the banner.
		if ( ! $this->current_plan ) {
			return false;
		}

		// Create parity between WPCOM and WPCOMSH for auto_renew.
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			$this->current_plan->user_allows_auto_renew = $this->current_plan->auto_renew;
		}

		// Test if gifting is enabled - We default to the inverse of auto-renew but configured options take precedence.
		if ( ! get_option( 'wpcom_gifting_subscription', ! $this->current_plan->user_allows_auto_renew ) ) {
			return false;
		}

		/*
		 * We will display the banner:
		 * - 60 days before the annual plan expiration.
		 * - 7 days before the monthly plan expiration.
		 */
		$days_of_warning          = false !== strpos( $this->current_plan->product_slug, 'monthly' ) ? 7 : 60;
		$seconds_until_expiration = strtotime( $this->current_plan->expiry_date ) - time();

		if ( $seconds_until_expiration < $days_of_warning * DAY_IN_SECONDS ) {
			// Show the banner.
			return true;
		}

		return false;
	}

	/**
	 * Get checkout link.
	 */
	public function get_checkout_link() {
		return 'https://wordpress.com/checkout/' . $this->current_plan->product_slug . '/gift/' . $this->current_plan->subscription_id;
	}

	/**
	 * Inject the gifting banner on WPCOM.
	 */
	public function inject_gifting_banner_wpcom() {
		$data                  = array();
		$data['checkout_link'] = $this->get_checkout_link();
		$data['i18n']          = array(
			'title'       => __(
				'Enjoy this site?',
				'gifting-banner'
			),
			'subtitle'    => __(
				'Gift the author a WordPress.com membership.',
				'gifting-banner'
			),
			'button_text' => __(
				'Renew',
				'gifting-banner'
			),
		);
		// Change the version if associated files are updated, current: 20221103.
		wp_enqueue_style( 'gifting-banner', plugins_url( 'gifting-banner/css/gifting-banner.css', __FILE__ ), array(), '20221103' );
		wp_enqueue_script( 'gifting-banner', plugins_url( 'gifting-banner/js/gifting-banner.js', __FILE__ ), array(), '20221103', true );
		wp_localize_script( 'gifting-banner', 'gifting_banner', $data );
		wp_set_script_translations( 'gifting-banner', 'gifting-banner' );
	}

	/**
	 * Inject the gifting banner on WPCOMSH.
	 */
	public function inject_gifting_banner_wpcomsh() {
		$data                  = array();
		$data['checkout_link'] = $this->get_checkout_link();
		$data['i18n']          = array(
			'title'       => __(
				'Enjoy this site?',
				'wpcomsh'
			),
			'subtitle'    => __(
				'Gift the author a WordPress.com membership.',
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
	 * Get hosting plan purchase from the current site.
	 * See: 1118-gh-Automattic/wpcomsh
	 *
	 * @return object|null
	 */
	private static function get_plan_purchase() {
		$purchases = wpcom_get_site_purchases();

		foreach ( $purchases as $purchase ) {
			if ( wpcom_purchase_has_feature( $purchase, WPCOM_Features::SUBSCRIPTION_GIFTING ) ) {
				return $purchase;
			}
		}

		return null;
	}
}

/**
 * Load the Gifting Banner.
 */
$gifting_banner = new Gifting_Banner();
add_action( 'init', array( $gifting_banner, 'maybe_show_gifting_banner' ) );

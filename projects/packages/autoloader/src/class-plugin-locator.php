<?php
/* HEADER */ // phpcs:ignore

/**
 * This class scans the WordPress installation to find active plugins.
 */
class Plugin_Locator {

	/**
	 * The path processor for finding plugin paths.
	 *
	 * @var Path_Processor
	 */
	private $path_processor;

	/**
	 * The constructor.
	 *
	 * @param Path_Processor $path_processor The Path_Processor instance.
	 */
	public function __construct( $path_processor ) {
		$this->path_processor = $path_processor;
	}

	/**
	 * Finds the path to the current plugin.
	 *
	 * @return string $path The path to the current plugin.
	 *
	 * @throws \RuntimeException If the current plugin does not have an autoloader.
	 */
	public function find_current_plugin() {
		// Escape from `vendor/__DIR__` to root plugin directory.
		$plugin_directory = dirname( dirname( __DIR__ ) );

		// Use the path processor to ensure that this is an autoloader we're referencing.
		$path = $this->path_processor->find_directory_with_autoloader( $plugin_directory, array() );
		if ( false === $path ) {
			throw new \RuntimeException( 'Failed to locate plugin ' . $plugin_directory );
		}

		return $path;
	}

	/**
	 * Checks a given option for plugin paths.
	 *
	 * @param string $option_name  The option that we want to check for plugin information.
	 * @param bool   $site_option  Indicates whether or not we want to check the site option.
	 *
	 * @return array $plugin_paths The list of absolute paths we've found.
	 */
	public function find_using_option( $option_name, $site_option = false ) {
		$raw = $site_option ? get_site_option( $option_name ) : get_option( $option_name );
		if ( false === $raw ) {
			return array();
		}

		return $this->convert_plugins_to_paths( $raw );
	}

	/**
	 * Checks for plugins in the `action` request parameter.
	 *
	 * @param string[] $allowed_actions The actions that we're allowed to return plugins for.
	 *
	 * @return array $plugin_paths The list of absolute paths we've found.
	 */
	public function find_using_request_action( $allowed_actions ) {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended

		$woo_activating_plugins = $this->find_activating_plugins_in_woo_request();

		if ( $woo_activating_plugins ) {
			return $this->convert_plugins_to_paths( $woo_activating_plugins );
		}

		/**
		 * Note: we're not actually checking the nonce here because it's too early
		 * in the execution. The pluggable functions are not yet loaded to give
		 * plugins a chance to plug their versions. Therefore we're doing the bare
		 * minimum: checking whether the nonce exists and it's in the right place.
		 * The request will fail later if the nonce doesn't pass the check.
		 */
		if ( empty( $_REQUEST['_wpnonce'] ) ) {
			return array();
		}

		$action = isset( $_REQUEST['action'] ) ? wp_unslash( $_REQUEST['action'] ) : false;
		if ( ! in_array( $action, $allowed_actions, true ) ) {
			return array();
		}

		$plugin_slugs = array();
		switch ( $action ) {
			case 'activate':
			case 'deactivate':
				if ( empty( $_REQUEST['plugin'] ) ) {
					break;
				}

				$plugin_slugs[] = wp_unslash( $_REQUEST['plugin'] );
				break;

			case 'activate-selected':
			case 'deactivate-selected':
				if ( empty( $_REQUEST['checked'] ) ) {
					break;
				}

				$plugin_slugs = wp_unslash( $_REQUEST['checked'] );
				break;
		}

		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		return $this->convert_plugins_to_paths( $plugin_slugs );
	}

	/**
	 * Inspects the request to determine if this is a Woo plugin actiation request. If it is,
	 * returns the list of activating plugin slugs.
	 *
	 * @return array|false Returns an array of plugin slugs or false if this is not a Woo plugin
	 *                     activation request.
	 */
	private function find_activating_plugins_in_woo_request() {
		// Check for a Woo plugin activation request.
		if ( ! isset( $_SERVER['REQUEST_URI'] ) || false === strpos( $_SERVER['REQUEST_URI'], 'wc-admin/plugins/activate' ) ) {
			return false;
		}

		$input              = json_decode( file_get_contents( 'php://input' ) );
		$activating_plugins = isset( $input->plugins ) ? $input->plugins : null;

		if ( ! isset( $activating_plugins ) ) {
			return false;
		}

		$activating_plugins = explode( ',', $activating_plugins );

		if ( ! is_array( $activating_plugins ) ) {
			return false;
		}

		// These plugins are from the list in Automattic\WooCommerce\Admin\Features\Onboarding::get_onboarding_allowed_plugins.
		$allowed_plugins = array(
			'facebook-for-woocommerce'            => 'facebook-for-woocommerce/facebook-for-woocommerce.php',
			'mailchimp-for-woocommerce'           => 'mailchimp-for-woocommerce/mailchimp-woocommerce.php',
			'creative-mail-by-constant-contact'   => 'creative-mail-by-constant-contact/creative-mail-plugin.php',
			'kliken-marketing-for-google'         => 'kliken-marketing-for-google/kliken-marketing-for-google.php',
			'jetpack'                             => 'jetpack/jetpack.php',
			'woocommerce-services'                => 'woocommerce-services/woocommerce-services.php',
			'woocommerce-gateway-stripe'          => 'woocommerce-gateway-stripe/woocommerce-gateway-stripe.php',
			'woocommerce-paypal-payments'         => 'woocommerce-paypal-payments/woocommerce-paypal-payments.php',
			'klarna-checkout-for-woocommerce'     => 'klarna-checkout-for-woocommerce/klarna-checkout-for-woocommerce.php',
			'klarna-payments-for-woocommerce'     => 'klarna-payments-for-woocommerce/klarna-payments-for-woocommerce.php',
			'woocommerce-square'                  => 'woocommerce-square/woocommerce-square.php',
			'woocommerce-shipstation-integration' => 'woocommerce-shipstation-integration/woocommerce-shipstation.php',
			'woocommerce-payfast-gateway'         => 'woocommerce-payfast-gateway/gateway-payfast.php',
			'woo-paystack'                        => 'woo-paystack/woo-paystack.php',
			'woocommerce-payments'                => 'woocommerce-payments/woocommerce-payments.php',
			'woocommerce-gateway-eway'            => 'woocommerce-gateway-eway/woocommerce-gateway-eway.php',
			'woo-razorpay'                        => 'woo-razorpay/woo-razorpay.php',
			'mollie-payments-for-woocommerce'     => 'mollie-payments-for-woocommerce/mollie-payments-for-woocommerce.php',
			'payu-india'                          => 'payu-india/index.php',
			'mailpoet'                            => 'mailpoet/mailpoet.php',
			'woocommerce-mercadopago'             => 'woocommerce-mercadopago/woocommerce-mercadopago.php',
		);

		$plugin_slugs = array();

		foreach ( $activating_plugins as $plugin ) {
			$path           = isset( $allowed_plugins[ $plugin ] ) ? $allowed_plugins[ $plugin ] : false;
			$plugin_slugs[] = $path;
		}

		return $plugin_slugs;
	}

	/**
	 * Given an array of plugin slugs or paths, this will convert them to absolute paths and filter
	 * out the plugins that are not directory plugins. Note that array keys will also be included
	 * if they are plugin paths!
	 *
	 * @param string[] $plugins Plugin paths or slugs to filter.
	 *
	 * @return string[]
	 */
	private function convert_plugins_to_paths( $plugins ) {
		if ( ! is_array( $plugins ) || empty( $plugins ) ) {
			return array();
		}

		// We're going to look for plugins in the standard directories.
		$path_constants = array( WP_PLUGIN_DIR, WPMU_PLUGIN_DIR );

		$plugin_paths = array();
		foreach ( $plugins as $key => $value ) {
			$path = $this->path_processor->find_directory_with_autoloader( $key, $path_constants );
			if ( $path ) {
				$plugin_paths[] = $path;
			}

			$path = $this->path_processor->find_directory_with_autoloader( $value, $path_constants );
			if ( $path ) {
				$plugin_paths[] = $path;
			}
		}

		return $plugin_paths;
	}
}

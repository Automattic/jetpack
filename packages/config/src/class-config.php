<?php
/**
 * The base Jetpack configuration class file.
 *
 * @package automattic/jetpack-config
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\JITMS\JITM;
use Automattic\Jetpack\Connection\Plugin;
use Automattic\Jetpack\Plugin\Tracking as Plugin_Tracking;
use Automattic\Jetpack\Sync\Main as Sync_Main;

/**
 * The configuration class.
 */
class Config {

	const FEATURE_ENSURED         = 1;
	const FEATURE_NOT_AVAILABLE   = 0;
	const FEATURE_ALREADY_ENSURED = -1;

	/**
	 * The initial setting values.
	 *
	 * @var Array
	 */
	protected $config = array(
		'jitm'       => false,
		'connection' => false,
		'sync'       => false,
		'tracking'   => false,
		'tos'        => false,
	);

	/**
	 * Initialization options stored here.
	 *
	 * @var array
	 */
	protected $feature_options = array();

	/**
	 * Creates the configuration class instance.
	 */
	public function __construct() {
		/**
		 * Adding the config handler to run on priority 2 because the class itself is
		 * being constructed on priority 1.
		 */
		add_action( 'plugins_loaded', array( $this, 'on_plugins_loaded' ), 2 );

	}

	/**
	 * Require a feature to be initialized. It's up to the package consumer to actually add
	 * the package to their composer project. Declaring a requirement using this method
	 * instructs the class to initialize it.
	 *
	 * @param String $feature the feature slug.
	 * @param array  $options Additional options, optional.
	 */
	public function ensure( $feature, array $options = array() ) {
		$this->config[ $feature ] = true;

		$this->set_feature_options( $feature, $options );
	}

	/**
	 * Runs on plugins_loaded hook priority with priority 2.
	 *
	 * @action plugins_loaded
	 */
	public function on_plugins_loaded() {
		if ( $this->config['connection'] ) {
			$this->ensure_class( 'Automattic\Jetpack\Connection\Manager' )
				&& $this->ensure_feature( 'connection' );
		}

		if ( $this->config['tracking'] ) {
			$this->ensure_class( 'Automattic\Jetpack\Terms_Of_Service' )
				&& $this->ensure_class( 'Automattic\Jetpack\Tracking' )
				&& $this->ensure_feature( 'tracking' );
		}

		if ( $this->config['sync'] ) {
			$this->ensure_class( 'Automattic\Jetpack\Sync\Main' )
				&& $this->ensure_feature( 'sync' );
		}

		if ( $this->config['jitm'] ) {
			$this->ensure_class( 'Automattic\Jetpack\JITMS\JITM' )
				&& $this->ensure_feature( 'jitm' );
		}
	}

	/**
	 * Returns true if the required class is available and alerts the user if it's not available
	 * in case the site is in debug mode.
	 *
	 * @param String $classname a fully qualified class name.
	 * @return Boolean whether the class is available.
	 */
	protected function ensure_class( $classname ) {
		$available = class_exists( $classname );

		if ( ! $available && defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			trigger_error( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_trigger_error
				sprintf(
					/* translators: %1$s is a PHP class name. */
					esc_html__(
						'Unable to load class %1$s. Please add the package that contains it using composer and make sure you are requiring the Jetpack autoloader',
						'jetpack'
					),
					esc_html( $classname )
				),
				E_USER_NOTICE
			);
		}

		return $available;
	}

	/**
	 * Ensures a feature is enabled, sets it up if it hasn't already been set up.
	 * Run the options method (if exists) every time the method is called.
	 *
	 * @param String $feature slug of the feature.
	 * @return Integer either FEATURE_ENSURED, FEATURE_ALREADY_ENSURED or FEATURE_NOT_AVAILABLE constants.
	 */
	protected function ensure_feature( $feature ) {
		$method = 'enable_' . $feature;
		if ( ! method_exists( $this, $method ) ) {
			return self::FEATURE_NOT_AVAILABLE;
		}

		$method_options = 'ensure_options_' . $feature;
		if ( method_exists( $this, $method_options ) ) {
			$this->{ $method_options }();
		}

		if ( did_action( 'jetpack_feature_' . $feature . '_enabled' ) ) {
			return self::FEATURE_ALREADY_ENSURED;
		}

		$this->{ $method }();

		/**
		 * Fires when a specific Jetpack package feature is initalized using the Config package.
		 *
		 * @since 8.2.0
		 */
		do_action( 'jetpack_feature_' . $feature . '_enabled' );

		return self::FEATURE_ENSURED;
	}

	/**
	 * Dummy method to enable Terms of Service.
	 */
	protected function enable_tos() {
		return true;
	}

	/**
	 * Enables the tracking feature. Depends on the Terms of Service package, so enables it too.
	 */
	protected function enable_tracking() {

		// Enabling dependencies.
		$this->ensure_feature( 'tos' );

		$terms_of_service = new Terms_Of_Service();
		$tracking         = new Plugin_Tracking();
		if ( $terms_of_service->has_agreed() ) {
			add_action( 'init', array( $tracking, 'init' ) );
		} else {
			/**
			 * Initialize tracking right after the user agrees to the terms of service.
			 */
			add_action( 'jetpack_agreed_to_terms_of_service', array( $tracking, 'init' ) );
		}

		return true;
	}

	/**
	 * Enables the JITM feature.
	 */
	protected function enable_jitm() {
		JITM::configure();

		return true;
	}

	/**
	 * Enables the Sync feature.
	 */
	protected function enable_sync() {
		Sync_Main::configure();

		return true;
	}

	/**
	 * Enables the Connection feature.
	 */
	protected function enable_connection() {
		Manager::configure();

		return true;
	}

	/**
	 * Setup the Connection options.
	 */
	protected function ensure_options_connection() {
		$options = $this->get_feature_options( 'connection' );

		if ( ! empty( $options['slug'] ) ) {
			// The `slug` and `name` are removed from the options because they need to be passed as arguments.
			$slug = $options['slug'];
			unset( $options['slug'] );

			$name = $slug;
			if ( ! empty( $options['name'] ) ) {
				$name = $options['name'];
				unset( $options['name'] );
			}

			( new Plugin( $slug ) )->add( $name, $options );
		}

		return true;
	}

	/**
	 * Temporary save initialization options for a feature.
	 *
	 * @param string $feature The feature slug.
	 * @param array  $options The options.
	 *
	 * @return bool
	 */
	protected function set_feature_options( $feature, array $options ) {
		if ( $options ) {
			$this->feature_options[ $feature ] = $options;
		}

		return true;
	}

	/**
	 * Get initialization options for a feature from the temporary storage.
	 *
	 * @param string $feature The feature slug.
	 *
	 * @return array
	 */
	protected function get_feature_options( $feature ) {
		return empty( $this->feature_options[ $feature ] ) ? array() : $this->feature_options[ $feature ];
	}

}

<?php

/**
 * This class will handle rolling out features to a percentage of users. Should only be used for sites connected to
 * WordPress.com since this calls home to get the percentage.
 *
 * This should help us to minimize breakage by rolling out at a small percentage and increasing that over time.
 *
 * @since 4.4.0
 */
class Jetpack_Feature_Rollout {
	/**
	 * @var Jetpack_Feature_Rollout
	 */
	private static $instance = null;

	/**
	 * False if the value has not been initialized with a call to WordPress.com, or an associative array if the
	 * we have the enabled features and their percentages.
	 *
	 * @var bool|array
	 */
	protected $features;

	/**
	 * The option name for storing the features.
	 *
	 * @var string
	 */
	const JETPACK_FEATURES_OPTION_NAME = 'feature_rollout';

	/**
	 * The transient name for determining when to refetch features
	 *
	 * @var string
	 */
	const JETPACK_FEATURES_TRANSIENT_NAME = 'jetpack_feature_rollout';

	/**
	 * The URL to make a GET request to in order to get the features that are enabled.
	 *
	 * @var string
	 */
	const JETPACK_FEATURES_REQUEST_URL = 'https://jetpack.com/get-feature-rollout/';

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Feature_Rollout();
		}

		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'wordpress_init' ), 1 );
	}

	/**
	 * Initialize the class after WordPress is initialized.
	 */
	function wordpress_init() {
		if ( ! $this->should_load() ) {
			return;
		}

		$this->features = Jetpack_Options::get_option( self::JETPACK_FEATURES_OPTION_NAME );

		// If we haven't already fetched features at least once or if we need to fetch again, then fetch.
		if ( false === $this->features || false === get_transient( self::JETPACK_FEATURES_TRANSIENT_NAME ) ) {
			$this->update_features_option_and_transient();
		}
	}

	/**
	 * Returns a boolean for whether we should load the Jetpack_Feature_Rollout functionality.
	 *
	 * This method is mocked in PHPUnit to ensure that we load the class.
	 *
	 * @return bool
	 */
	function should_load() {
		return Jetpack::is_active();
	}

	/**
	 * Will fetch features from WordPress.com if the features transient is not set.
	 *
	 * This method is mocked in PHPUnit tests so that we can simulate different
	 * values being returned from WordPress.com.
	 */
	function fetch_features_from_wpcom() {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client();
		$xml->query( 'jetpack.getFeatureRollout' );

		if ( $xml->isError() ) {
			return $xml->get_jetpack_error();
		} else {
			return $xml->getResponse();
		}
	}

	/**
	 * Fetches features from WordPress.com via the fetch_features_from_wpcom() method and then stores the features
	 * and sets a transient to minimize requests.
	 */
	function update_features_option_and_transient() {
		$fetched = $this->fetch_features_from_wpcom();

		if ( is_wp_error( $fetched ) ) {
			$features = false;
			$transient_duration = 5 * MINUTE_IN_SECONDS;
		} else {
			$features = (array) $fetched;
			$transient_duration = HOUR_IN_SECONDS;
		}

		// Only update the features option if we successfully retrieved features.
		if ( false !== $features ) {
			Jetpack_Options::update_option( self::JETPACK_FEATURES_OPTION_NAME, $features, true );
			$this->features = $features;
		}

		set_transient( self::JETPACK_FEATURES_TRANSIENT_NAME, '1', $transient_duration );
	}

	/**
	 * Returns a boolean for whether the featured is enabled or not.
	 *
	 * @param string $feature The name of the featured.
	 *
	 * @return bool           Is the feature enabled?
	 */
	function is_enabled( $feature ) {
		$is_enabled = (
			isset( $this->features, $this->features[ $feature ] ) &&
			! empty( $this->features[ $feature ] )
		);

		/**
		 * Fires on every call to Jetpack_Feature_Rollout:is_enabled() and allows a developer to
		 * force a certain feature to be on.
		 *
		 * @since 4.4.0
		 *
		 * @param bool $is_enabled Is the feature enabled?
		 * @param string $feature  The name of the feature that is being  checked.
		 */
		return (bool) apply_filters( 'jetpack_feature_rollout_enabled', $is_enabled, $feature );
	}

	/**
	 * Gets the array of features that have been returned from WordPress.com.
	 *
	 * @return array|bool
	 */
	function get_features() {
		return $this->features;
	}
}

Jetpack_Feature_Rollout::init();

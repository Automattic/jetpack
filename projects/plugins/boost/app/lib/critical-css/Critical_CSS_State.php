<?php
/**
 * Critical CSS state.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Provider_State;
use Automattic\Jetpack_Boost\Lib\Transient;

/**
 * Critical CSS State
 */
class Critical_CSS_State {

	const NOT_GENERATED = 'not_generated';
	const SUCCESS       = 'success';
	const FAIL          = 'error';
	const REQUESTING    = 'requesting';

	const KEY_PREFIX = 'critical_css_state-';

	/**
	 * Critical CSS state.
	 *
	 * @var self::NOT_GENERATED|self::SUCCESS|self::FAIL|self::REQUESTING
	 */
	protected $state;

	/**
	 * Critical CSS state error.
	 *
	 * @var mixed
	 */
	protected $state_error;

	/**
	 * Formatted sources array created from providers.
	 *
	 * @var Source_Provider_State[]
	 */
	protected $provider_states = array();

	/**
	 * Epoch time when was Critical CSS last created.
	 *
	 * @var int
	 */
	protected $created;

	/**
	 * Epoch time when was Critical CSS last updated.
	 *
	 * @var int
	 */
	protected $updated;

	/**
	 * A string to identify between multiple requests for Critical CSS. Defaults to 'local'.
	 *
	 * @var string
	 */
	protected $request_name;

	/**
	 * Posts for which the Critical CSS request is created. Limit provider groups to only the ones related to posts in
	 * this array.
	 *
	 * @var int[]
	 */
	protected $context_posts = array();

	/**
	 * Constructor.
	 */
	public function __construct( $request_name = 'local' ) {

		$this->request_name = $request_name;
		$state              = $this->get_state_transient();

		$this->created     = $state['created'];
		$this->updated     = $state['updated'];
		$this->state       = $state['state'];
		$this->state_error = empty( $state['state_error'] ) ? null : $state['state_error'];

		foreach ( $state['sources'] as $provider_key => $provider_state ) {

			// @TODO: Remove this
			if ( ! isset( $provider_state['urls'] ) ) {
				unset( $provider_state );
				continue;
			}

			$this->provider_states[ $provider_key ] = new Source_Provider_State( $provider_state );
		}

		// @TODO: This shouldn't be a part of providers/Source_Provider_State.php on line 40the constructor.
		// Check to see if the request is stuck at an unfinished state and mark it as failed if so.
		if ( self::REQUESTING === $this->state && ( microtime( true ) - $this->created ) > HOUR_IN_SECONDS ) {
			$this->set_as_failed( __( 'Timeout while waiting for Critical CSS from the Boost Service.', 'jetpack-boost' ) );
		}
	}

	private function get_state_transient() {
		return Transient::get(
			$this->get_key(),
			array(
				'created'     => microtime( true ),
				'updated'     => microtime( true ),
				'state'       => null,
				'state_error' => null,
				'sources'     => array(),
			)
		);
	}

	public function maybe_set_status() {
		if ( $this->get_total_providers_count() === $this->get_processed_providers_count() ) {
			// Only consider the generation a success if at least one provider was successful
			if ( $this->get_providers_success_count() > 0 ) {
				$this->state = self::SUCCESS;
			} else {
				$this->state = self::FAIL;
			}

			$this->save_state_transient();
		}
	}

	/**
	 * Save the Critical CSS state.
	 */
	private function save_state_transient() {
		$provider_states = array();
		foreach ( $this->provider_states as $key => $provider_state ) {
			$provider_states[ $key ] = $provider_state->get_status();
		}
		Transient::set(
			$this->get_key(),
			array(
				'created'     => $this->created,
				'updated'     => microtime( true ),
				'state'       => $this->state,
				'state_error' => $this->state_error,
				'sources'     => $provider_states,
			)
		);
	}

	/**
	 * Add a context to the Critical CSS state.
	 *
	 * @return string
	 */
	public function add_request_context( $post ) {
		$this->context_posts[] = $post;
	}

	/**
	 * Set Critical CSS state as failed.
	 *
	 * @param string $error Critical CSS error.
	 */
	public function set_as_failed( $error ) {
		$this->state       = self::FAIL;
		$this->state_error = $error;
		foreach ( $this->provider_states as $provider_state ) {
			$provider_state->cancel_request();
		}
		$this->save_state_transient();
	}

	/**
	 * Get Critical CSS state status.
	 *
	 * @return mixed
	 */
	public function get_status() {

		$status = array(
			'status'          => $this->state,
			'created'         => $this->created,
			'updated'         => $this->updated,
			'status_error'    => $this->state_error,
			'provider_states' => $this->provider_states,
			'progress'        => $this->get_percent_complete(),
			'success_count'   => $this->get_providers_success_count(),
		);

		if ( $this->is_pending() ) {
			$status['pending_provider_keys']  = $this->get_provider_urls();
			$status['provider_success_ratio'] = $this->get_provider_success_ratios();
		}

		return $status;
	}

	/**
	 * Set source success.
	 *
	 * @param string $key Provider key.
	 *
	 */
	public function set_source_success( $key ) {
		if ( isset( $this->provider_states[ $key ] ) ) {
			$this->provider_states[ $key ]->set_as_success();
			$this->save_if_complete();
			$this->save_state_transient();
		}
	}

	/**
	 * Set source error.
	 *
	 * @param string $provider_key Provider key.
	 * @param array  $error        Provider error.
	 *
	 */
	public function set_provider_state_error( $provider_key, $error ) {
		if ( isset( $this->provider_states[ $provider_key ] ) ) {
			$this->provider_states[ $provider_key ]->set_as_failed( $error );
			$this->save_if_complete();
			$this->save_state_transient();
		}
	}

	/**
	 * Get the transient key name.
	 *
	 * @return string
	 */
	public function get_key() {
		return self::KEY_PREFIX . $this->request_name;
	}

	/**
	 * Set source status.
	 *
	 * @param string $key    Provider key.
	 * @param string $status Provider status.
	 *
	 *
	 */
	private function save_if_complete() {
		if ( 100 === $this->get_percent_complete() ) {
			$this->state = self::SUCCESS;

			/**
			 * Fires when Critical CSS has been generated - whether locally or remotely.
			 *
			 * @since 1.5.2
			 */
			do_action( 'jetpack_boost_critical_css_generated', $this->state );
			$this->save_state_transient();
		}
	}

	/**
	 * Request Critical CSS to be generated based on passed URL providers.
	 *
	 * @param array $providers Providers.
	 */
	public function create_request( $providers ) {
		$this->state   = self::REQUESTING;
		$this->sources = $providers;
		$this->created = microtime( true );

		$this->save_state_transient();
	}

	/**
	 * Get providers sources.
	 *
	 * @param array $providers Providers.
	 *
	 * @return array
	 */
	protected function get_provider_sources( $providers ) {
		$sources = array();

		foreach ( $providers as $provider ) {
			$provider_name = $provider::get_provider_name();

			// For each provider,
			// Gather a list of URLs that are going to be used as Critical CSS source.
			foreach ( $provider::get_critical_source_urls( $this->context_posts ) as $group => $urls ) {
				$key = $provider_name . '_' . $group;

				// For each URL
				// Track the state and errors in a state array.
				$provider_state = $this->provider_states[ $key ];
				if ( $provider_state->is_successful() ) {
					continue;
				}
				$provider_state->create_request( apply_filters( 'jetpack_boost_critical_css_urls', $urls ), $provider::get_success_ratio() );
			}
		}

		return $sources;
	}

	public function has_pending_provider( $provider_filter = array() ) {
		$providers_states = $this->provider_states;
		if ( ! empty( $provider_filter ) ) {
			foreach ( $provider_filter as $key ) {
				unset( $providers_states[ $key ] );
			}
		}
		$pending = false;
		foreach ( $providers_states as $provider_state ) {
			if ( $provider_state->is_requesting() ) {
				$pending = true;
				break;
			}
		}
		return $pending;
	}

	/**
	 * Returns true if all provider keys have finished processing (whether successful or not).
	 *
	 * @return bool
	 */
	public function is_done() {
		return self::SUCCESS === $this->state;
	}

	/**
	 * Return true if the Critical CSS state is empty.
	 *
	 * @return bool
	 */
	public function is_empty() {
		return empty( $this->state );
	}

	/**
	 * Return true if the Critical CSS is being requested.
	 *
	 * @return bool
	 */
	public function is_pending() {
		return self::REQUESTING === $this->state;
	}

	/**
	 * Return true if a fatal error occurred during the Critical CSS generation process.
	 *
	 * @return bool
	 */
	public function is_fatal_error() {
		return self::FAIL === $this->state;
	}

	/**
	 * Has there been any HTML/CSS structure changes since the last Critical CSS generation?
	 */
	public static function is_fresh() {
		return Transient::get( 'is_ccss_fresh', false );
	}

	public static function set_fresh( $is_fresh = true ) {
		Transient::set( 'is_ccss_fresh', $is_fresh );
	}

	/**
	 * Get the provider urls.
	 *
	 * @return array
	 */
	public function get_provider_urls() {
		$results = array();
		foreach ( $this->provider_states as $key => $provider_state ) {
			$results[ $key ] = $provider_state->get_urls();
		}
		return $results;
	}

	/**
	 * Get the success ratio for the provider.
	 *
	 * @return array
	 */
	private function get_provider_success_ratios() {
		$results = array();
		foreach ( $this->provider_states as $key => $provider_state ) {
			$results[ $key ] = $provider_state->get_success_ratio();
		}
		return $results;
	}

	private function get_total_providers_count() {
		return count( $this->provider_states );
	}

	/**
	 * Returns the number of requests that were processed whether there was an error.
	 *
	 * @return int
	 */
	private function get_processed_providers_count() {
		$count = 0;
		foreach ( $this->provider_states as $provider ) {
			if ( ! $provider->is_requesting() ) {
				++$count;
			}
		}
		return $count;
	}

	/**
	 * Returns the number of requests that were successfully finished. i.e.: number of blocks stored.
	 *
	 * @return int
	 */
	private function get_providers_success_count() {
		/**
		 * Note:
		 * "Success" is currently considered anything that's not Requesting.
		 * That's because Critical CSS generation can also end with failure.
		 */
		$count = 0;
		foreach ( $this->provider_states as $provider_state ) {
			if ( $provider_state->is_successful() ) {
				++$count;
			}
		}

		return $count;
	}

	/**
	 * Returns the percentage of requests that are finished processing successfully even though there are some providers having some error.
	 *
	 * @return int
	 */
	private function get_percent_complete() {
		return $this->get_processed_providers_count() * 100 / max( 1, $this->get_total_providers_count() );
	}

	/**
	 * Reset the Critical CSS state.
	 */
	public static function reset() {
		Transient::delete_by_prefix( self::KEY_PREFIX );
	}

}

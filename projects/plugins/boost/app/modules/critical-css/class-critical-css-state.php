<?php
/**
 * Critical CSS state.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Transient;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Providers\Provider;

/**
 * Critical CSS State
 */
class Critical_CSS_State {

	const NOT_GENERATED = 'not_generated';
	const SUCCESS       = 'success';
	const FAIL          = 'error';
	const REQUESTING    = 'requesting';

	const KEY = 'critical_css_state';

	/**
	 * Critical CSS state.
	 *
	 * @var mixed
	 */
	private $state;

	/**
	 * Critical CSS state error.
	 *
	 * @var mixed
	 */
	private $state_error;

	/**
	 * Formatted sources array created from providers.
	 *
	 * @see get_provider_sources
	 * @var array
	 * @todo: Maybe rename to providers
	 */
	private $sources = array();

	/**
	 * Epoch time when was Critical CSS last updated.
	 *
	 * @var int
	 */
	private $created;

	/**
	 * Constructor.
	 */
	public function __construct() {

		$state = Transient::get(
			self::KEY,
			array(
				'created'     => microtime( true ),
				'state'       => null,
				'state_error' => null,
				'sources'     => array(),
			)
		);

		$this->created     = $state['created'];
		$this->state       = $state['state'];
		$this->state_error = empty( $state['state_error'] ) ? null : $state['state_error'];
		$this->sources     = $this->verify_sources( $state['sources'] );
	}

	/**
	 * Save the Critical CSS state.
	 */
	public function save() {
		Transient::set(
			self::KEY,
			array(
				'created'     => $this->created,
				'state'       => $this->state,
				'state_error' => $this->state_error,
				'sources'     => $this->sources,
			)
		);
	}

	/**
	 * Set Critical CSS state as failed.
	 *
	 * @param string $error Critical CSS error.
	 */
	public function set_as_failed( $error ) {
		$this->state       = self::FAIL;
		$this->state_error = $error;
		foreach ( $this->sources as $source_key => $source ) {
			$this->sources[ $source_key ]['status'] = self::FAIL;
			$this->sources[ $source_key ]['error']  = null;
		}
		$this->save();
	}

	/**
	 * Get Critical CSS state error.
	 *
	 * @return mixed
	 */
	public function get_state_error() {
		return $this->state_error;
	}

	/**
	 * Set source success.
	 *
	 * @todo Maybe rename to set_provider_success.
	 *
	 * @param string $key Provider key.
	 */
	public function set_source_success( $key ) {
		$this->set_source_status( $key, self::SUCCESS );
	}

	/**
	 * Set source error.
	 *
	 * @todo Maybe rename to set_provider_error.
	 *
	 * @param string $key Provider key.
	 * @param array  $error Provider error.
	 */
	public function set_source_error( $key, $error ) {
		if ( isset( $this->sources[ $key ] ) ) {
			$this->sources[ $key ]['error'] = $error;
			$this->set_source_status( $key, self::FAIL );
		}
	}

	/**
	 * Set source status.
	 *
	 * @todo Maybe rename to set_provider_status.
	 *
	 * @param string $key Provider key.
	 * @param string $status Provider status.
	 */
	private function set_source_status( $key, $status ) {
		if ( isset( $this->sources[ $key ] ) ) {
			$this->sources[ $key ]['status'] = $status;
		}

		if ( 100 === $this->get_percent_complete() ) {
			$this->state = self::SUCCESS;
		}

		$this->save();
	}

	/**
	 * Request Critical CSS to be generated based on passed URL providers.
	 *
	 * @param array $providers Providers.
	 */
	public function create_request( $providers ) {
		$this->state   = self::REQUESTING;
		$this->sources = $this->get_provider_sources( $providers ); // TODO: Maybe rename sources to providers.
		$this->created = microtime( true );
		$this->save();
	}

	/**
	 * Get the core providers' status.
	 *
	 * @param array $keys Providers keys.
	 *
	 * @return string
	 */
	public function get_core_providers_status( $keys ) {
		$errors = $this->collate_column( 'error' );
		$status = 'success';

		foreach ( $errors as $key => $error ) {
			if ( ! empty( $error ) && in_array( $key, $keys, true ) ) {
				$status = 'error';
				break;
			}
		}

		return $status;
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

		/**
		 * Provider.
		 *
		 * @var $provider Provider
		 */
		foreach ( $providers as $provider ) {
			$provider_name = $provider::get_provider_name();

			// For each provider,
			// Gather a list of URLs that are going to be used as Critical CSS source.
			foreach ( $provider::get_critical_source_urls() as $group => $urls ) {
				$key = $provider_name . '_' . $group;

				// For each URL
				// Track the state and errors in a state array.
				$sources[ $key ] = array(
					'urls'          => $urls,
					'status'        => self::REQUESTING,
					'error'         => null,
					'success_ratio' => $provider::get_success_ratio(),
				);
			}
		}

		return $sources;
	}

	/**
	 * Get providers errors.
	 *
	 * @return array
	 */
	public function get_providers_errors() {
		$errors = $this->collate_column( 'error' );

		return array_filter( $errors );
	}

	/**
	 * Returns the start time of this Critical CSS request.
	 *
	 * @return int
	 */
	public function get_created_time() {
		return $this->created;
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
	 * Given a column, collate all provider sources returning the specified
	 * column for each one.
	 *
	 * @param string $column Provider's source property name.
	 *
	 * @return array
	 */
	private function collate_column( $column ) {
		$results = array_fill_keys( array_keys( $this->sources ), array() );

		foreach ( $this->sources as $source_key => $source ) {
			if ( isset( $source[ $column ] ) ) {
				$results[ $source_key ] = $source[ $column ];
			}
		}

		return $results;
	}

	/**
	 * Get the provider urls.
	 *
	 * @return array
	 */
	public function get_provider_urls() {
		return $this->collate_column( 'urls' );
	}

	/**
	 * Get the success ratio for the provider.
	 *
	 * @return array
	 */
	public function get_provider_success_ratios() {
		return $this->collate_column( 'success_ratio' );
	}

	/**
	 * Returns the number of requests that were processed whether there was an error.
	 *
	 * @return int
	 */
	public function get_processed_providers_count() {
		$source_status = $this->collate_column( 'status' );
		$successes     = array();

		foreach ( $source_status as $status ) {
			/**
			 * Note:
			 * "Success" is currently considered anything that's not Requesting.
			 * That's because Critical CSS generation can also end with failure.
			 */
			if ( self::REQUESTING !== $status ) {
				$successes[] = $status;
			}
		}

		return count( $successes );
	}

	/**
	 * Returns the number of requests that were successfully finished. i.e.: number of blocks stored.
	 *
	 * @return int
	 */
	public function get_providers_success_count() {
		$source_status = $this->collate_column( 'status' );
		$successes     = array();

		foreach ( $source_status as $status ) {
			/**
			 * Note:
			 * "Success" is currently considered anything that's not Requesting.
			 * That's because Critical CSS generation can also end with failure.
			 */
			if ( self::SUCCESS === $status ) {
				$successes[] = $status;
			}
		}

		return count( $successes );
	}

	/**
	 * Returns the percentage of requests that are finished processing successfully even though there are some providers having some error.
	 *
	 * @return int
	 */
	public function get_percent_complete() {
		return $this->get_processed_providers_count() * 100 / max( 1, count( $this->sources ) );
	}

	/**
	 * Reset the Critical CSS state.
	 */
	public function reset() {
		Transient::delete( self::KEY );
	}

	/**
	 * Verify Provider source array, dropping sources which don't contain valid data (i.e.: from older Boost versions)
	 *
	 * @param array $sources - Data on Provider sources, raw from storage.
	 */
	protected function verify_sources( $sources ) {
		if ( ! is_array( $sources ) ) {
			return null;
		}

		// Ensure any source error contains a type.
		return array_filter(
			$sources,
			function ( $source_details ) {
				if ( is_array( $source_details['error'] ) ) {
					foreach ( $source_details['error'] as $error ) {
						if ( empty( $error['type'] ) ) {
							return false;
						}
					}
				}

				return true;
			}
		);
	}
}

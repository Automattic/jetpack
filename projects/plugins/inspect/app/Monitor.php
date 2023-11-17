<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack_Inspect;

use Automattic\Jetpack\Packages\Async_Option\Async_Option;
use Automattic\Jetpack_Inspect\Monitor\Observable;

/**
 * The Monitor class.
 */
class Monitor {

	/**
	 * The observable object.
	 *
	 * @var Observable
	 */
	protected $observer;

	/**
	 * The option name.
	 *
	 * @var String
	 */
	protected $name;

	/**
	 * Whether to bypass the filter.
	 *
	 * @var Boolean
	 * */
	protected $bypass_filter = false;

	/**
	 * The async option object.
	 *
	 * @var Async_Option
	 */
	protected $option;

	/**
	 * Creates a Monitor object.
	 *
	 * @param String     $name the option name.
	 * @param Observable $observable the object to attach hooks to.
	 */
	public function __construct( $name, $observable ) {
		$this->name     = $name;
		$this->observer = $observable;
		$this->option   = jetpack_inspect_option( $name );
	}

	/**
	 * Initializes the object.
	 */
	public function initialize() {

		if ( defined( 'DOING_CRON' ) && DOING_CRON ) {
			return false;
		}

		if ( $this->is_enabled() ) {
			$this->observer->attach_hooks();
		}

		add_action( 'shutdown', array( $this, 'save' ) );
	}

	/**
	 * Ensures that the hooks are attached.
	 */
	public function ensure_enabled() {
		if ( $this->is_enabled() ) {
			return;
		}
		$this->observer->attach_hooks();
		add_action( 'shutdown', array( $this, 'log' ) );
	}

	/**
	 * Returns true whether the request url matches the filter.
	 *
	 * @param String $url the request URL.
	 */
	protected function match_request_filter( $url ) {
		if ( $this->bypass_filter ) {
			return true;
		}

		$filter = $this->get_filter();
		if ( ! $filter ) {
			return true;
		}

		// https://example.com/?foo=bar will match "*example[s].com*.
		if ( str_contains( $filter, '*' ) || ( str_contains( $filter, '[' ) && str_contains( $filter, ']' ) ) ) {
			return fnmatch( $filter, $url );
		}

		// https://example.com/?foo=bar will match "https://example.com/?foo=bar".
		if ( $filter[0] === $filter[ strlen( $filter ) - 1 ] && $filter[0] === '"' ) {
			$filter = substr( $filter, 1, - 1 );
			return $filter === $url;
		}

		// https://example.com/?foo=bar will match example.com.
		return str_contains( $url, $filter );
	}

	/**
	 * Saves the log data.
	 */
	public function save() {

		$log_data = $this->observer->get();
		if ( ! $log_data ) {
			return;
		}

		foreach ( $log_data as $data ) {

			if ( empty( $data ) || ! $this->match_request_filter( $data['url'] ) ) {
				continue;
			}

			// @TODO: Create a Log object. This will do for now.
			$url = $data['url'];
			unset( $data['url'] );

			$log_name = $this->name;
			if ( isset( $data['error'] ) ) {
				$log_name = 'wp_error';
			}

			$log = array(
				'url'     => $url,
				$log_name => $data,
			);

			Log::insert( $url, $log );
		}
	}

	/**
	 * Generate keys for wp options dynamically
	 *   Example keys:
	 *      * observer_incoming
	 *      * observer_outgoing
	 *
	 * @param String $name option name.
	 */
	private function key( $name ) {
		return "{$this->name}_{$name}";
	}

	/**
	 * Returns the Monitor status.
	 */
	public function is_enabled() {
		return jetpack_inspect_get_option( 'monitor_status' ) && $this->option->get()['enabled'];
	}

	/**
	 * Returns the currently set filter.
	 */
	public function get_filter() {
		return $this->option->get()['filter'];
	}
}

<?php

namespace Automattic\Jetpack_Inspect;

use Automattic\Jetpack_Inspect\Monitor\Observable;

class Monitor {

	protected Observable $observer;
	protected string     $name;
	protected bool       $bypass_filter = false;

	protected Async_Option\Async_Option $option;

	public function __construct( string $name, Observable $observable ) {
		$this->name     = $name;
		$this->observer = $observable;
		$this->option   = jetpack_inspect_option( $name );
	}

	public function initialize() {

		if ( defined( "DOING_CRON" ) && DOING_CRON ) {
			return false;
		}

		if ( $this->is_enabled() ) {
			$this->observer->attach_hooks();
		}

		add_action( 'shutdown', [ $this, 'save' ] );
	}

	public function ensure_enabled() {
		if ( $this->is_enabled() ) {
			return;
		}
		$this->observer->attach_hooks();
		add_action( 'shutdown', [ $this, 'log' ] );
	}

	protected function match_request_filter( $url ): bool {
		if ( $this->bypass_filter ) {
			return true;
		}

		$filter = $this->get_filter();
		if ( ! $filter ) {
			return true;
		}

		// https://example.com/?foo=bar will match "*example[s].com*
		if ( str_contains( $filter, '*' ) || ( str_contains( $filter, '[' ) && str_contains( $filter, ']' ) ) ) {
			return fnmatch( $filter, $url );
		}

		// https://example.com/?foo=bar will match "https://example.com/?foo=bar"
		if ( $filter[0] === $filter[ strlen( $filter ) - 1 ] && $filter[0] === '"' ) {
			$filter = substr( $filter, 1, - 1 );
			return $filter === $url;
		}

		// https://example.com/?foo=bar will match example.com
		return str_contains( $url, $filter );
	}

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

			$log = [
				'url'     => $url,
				$log_name => $data,
			];


			Log::insert( $url, $log );
		}


	}

	/**
	 * Generate keys for wp options dynamically
	 *   Example keys:
	 *      * observer_incoming
	 *      * observer_outgoing
	 */
	private function key( $name ) {
		return "{$this->name}_{$name}";
	}

	public function is_enabled() {
		return jetpack_inspect_get_option( 'monitor_status' ) && $this->option->get()['enabled'];
	}

	public function get_filter() {
		return $this->option->get()['filter'];
	}



}

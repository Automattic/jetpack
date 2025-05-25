<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;

class LCP_Analyzer {
	/** @var LCP_State */
	private $state;

	/** @var LCP_Storage */
	private $storage;

	/**
	 * @since 4.0.0
	 */
	public function __construct() {
		$this->state   = new LCP_State();
		$this->storage = new LCP_Storage();
	}

	/**
	 * Start the LCP analysis process
	 *
	 * @return array The current state data
	 */
	public function start() {
		// Get cornerstone pages to analyze
		$pages = $this->get_cornerstone_pages();

		// Store those pages in the LCP State
		$this->state
			->prepare_request()
			->set_pages( $pages )
			->set_pending_pages( $pages )
			->save();

		// Get the data
		$data = $this->state->get();

		// Start the analysis process
		$this->analyze_pages( $pages );

		// Clear previous LCP analysis data from storage
		$this->storage->clear();

		return $data;
	}

	/**
	 * Start a partial analysis for the given pages.
	 * Sets status to pending and updates only the pages that are in the $pages array.
	 * Pages that are not in the $pages array will not be updated.
	 *
	 * @param array $pages The pages to analyze.
	 * @return array The current state data
	 */
	public function start_partial_analysis( $pages ) {
		$current_pages = $this->state->get_pages();

		$this->state
			->prepare_request()
			->set_pages( $current_pages )
			->set_pending_pages( $pages )
			->save();

		$this->analyze_pages( $pages );

		// @todo - Clear previous LCP analysis data from storage for pages in the $pages array.
		// We currently don't have a way to do this.

		return $this->state->get();
	}

	/**
	 * Get cornerstone pages for analysis
	 *
	 * @return array
	 */
	protected function get_cornerstone_pages() {
		$pages                  = array();
		$cornerstone_pages_list = Cornerstone_Utils::get_list();

		foreach ( $cornerstone_pages_list as $url ) {
			$pages[] = Cornerstone_Utils::prepare_provider_data( $url );
		}

		return $pages;
	}

	/**
	 * Run analysis for the given pages
	 *
	 * @param array $pages Pages to analyze
	 */
	private function analyze_pages( $pages ) {
		$payload = array(
			'pages'     => $pages,
			'requestId' => md5( wp_json_encode( $pages ) . time() ),
		);
		return Boost_API::post( 'lcp', $payload );
	}

	/**
	 * Get the current state
	 *
	 * @return LCP_State
	 */
	public function get_state() {
		return $this->state;
	}

	/**
	 * Get the storage instance
	 *
	 * @return LCP_Storage
	 */
	public function get_storage() {
		return $this->storage;
	}
}

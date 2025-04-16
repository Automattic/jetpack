<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Cornerstone_Provider;

class LCP_Analyzer {
	/** @var LCP_State */
	private $state;

	/**
	 * Start the LCP analysis process
	 *
	 * @return array The current state data
	 */
	public function start() {
		// Get cornerstone pages to analyze
		$pages = $this->get_cornerstone_pages();

		// Store those pages in the LCP State
		$this->state = new LCP_State();
		$this->state->prepare_request()
				->set_pending_pages( $pages )
				->save();

		// Get the data
		$data = $this->state->get();

		// Start the analysis process
		$this->analyze_pages( $pages );

		// Clear previous LCP analysis data from storage
		$storage = new LCP_Storage();
		$storage->clear();

		return $data;
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
			$pages[] = array(
				'key' => Cornerstone_Provider::get_provider_key( $url ),
				'url' => $url,
			);
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
		return Boost_API::post( 'analyze-lcp', $payload );
	}

	/**
	 * Get the current state
	 *
	 * @return LCP_State
	 */
	public function get_state() {
		return $this->state;
	}
}

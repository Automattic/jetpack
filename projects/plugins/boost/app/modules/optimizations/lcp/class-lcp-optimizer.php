<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Boost_Core\Lib\Boost_API;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Providers\Cornerstone_Provider;

class LCP_Optimizer {
	/** @var LCP_State */
	private $state;

	/**
	 * Start the LCP optimization process
	 *
	 * @return array The current state data
	 */
	public function start() {
		// Get cornerstone pages to optimize
		$pages = $this->get_cornerstone_pages();

		// Store those pages in the LCP State
		$this->state = new LCP_State();
		$this->state->prepare_request()
				->set_pending_pages( $pages )
				->save();

		// Get the data
		$data = $this->state->get();

		// Start the optimization process
		// This would call an API or run a local process
		$this->optimize_pages( $pages );

		// Clear previous LCP optimization data from storage
		// TODO: Uncomment this when we have a storage class
		// $storage = new LCP_Storage();
		// $storage->clear();

		return $data;
	}

	/**
	 * Get cornerstone pages for optimization
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
	 * Run optimization for the given pages
	 * This is where you'd implement the actual LCP optimization logic
	 *
	 * @param array $pages Pages to optimize
	 */
	private function optimize_pages( $pages ) {
		$payload = array(
			'pages'     => $pages,
			'requestId' => md5( wp_json_encode( $pages ) . time() ),
		);
		return Boost_API::post( 'optimize-lcp', $payload );
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

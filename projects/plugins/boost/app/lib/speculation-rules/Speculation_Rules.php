<?php
/**
 * Speculation Rules implementation for cornerstone pages
 *
 * @package Boost
 * @since $$next-version$$
 */

namespace Automattic\Jetpack_Boost\Lib\Speculation_Rules;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Setup;

/**
 * Class to handle speculation rules for cornerstone pages
 */
class Speculation_Rules implements Has_Setup, Changes_Page_Output {

	/**
	 * Initialize the speculation rules
	 *
	 * @since $$next-version$$
	 * @return void
	 */
	public function setup() {

		// Check if prerender cornerstone pages is enabled
		$is_prerender_cornerstone_pages = jetpack_boost_ds_get( 'prerender_cornerstone_pages' );
		if ( ! $is_prerender_cornerstone_pages ) {
			return;
		}

		// Use WP core action to add speculation rules
		add_action( 'wp_load_speculation_rules', array( $this, 'add_cornerstone_rules' ) );
	}

	/**
	 * Add speculation rules for cornerstone pages
	 *
	 * @param \WP_Speculation_Rules $speculation_rules The speculation rules instance.
	 * @since $$next-version$$
	 * @return void
	 */
	public function add_cornerstone_rules( $speculation_rules ) {
		// Get cornerstone URLs
		$cornerstone_urls = $this->get_cornerstone_urls();
		if ( empty( $cornerstone_urls ) ) {
			return;
		}

		// Add prerender rule for cornerstone pages with moderate eagerness
		$speculation_rules->add_rule(
			'prerender',
			'cornerstone-pages-prerender',
			array(
				'source'    => 'list',
				'urls'      => $cornerstone_urls,
				'eagerness' => 'moderate',
			)
		);
	}

	/**
	 * Get the list of cornerstone page URLs
	 *
	 * @since $$next-version$$
	 * @return array Array of cornerstone page URLs
	 */
	private function get_cornerstone_urls() {
		$cornerstone_urls = jetpack_boost_ds_get( 'cornerstone_pages_list' );
		if ( empty( $cornerstone_urls ) ) {
			return array();
		}

		return $cornerstone_urls;
	}
}

<?php
/**
 * Speculation Rules implementation for cornerstone pages
 *
 * @package Boost
 * @since $$next-version$$
 */

namespace Automattic\Jetpack_Boost\Lib\Speculation_Rules;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
/**
 * Class to handle speculation rules for cornerstone pages
 */
class Speculation_Rules implements Has_Setup {

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

		// remove the protocol and domain from the list of cornerstone urls
		$home_url         = wp_parse_url( home_url() );
		$domain           = $home_url['host'];
		$protocol         = $home_url['scheme'];
		$cornerstone_urls = array_map(
			function ( $url ) use ( $protocol, $domain ) {
				return trailingslashit( str_replace( $protocol . '://' . $domain, '', $url ) );
			},
			$cornerstone_urls
		);

		// Add prerender rule for cornerstone pages with moderate eagerness
		$speculation_rules->add_rule(
			'prerender',
			'cornerstone-pages-prerender',
			array(
				'source'    => 'document',
				'where'     => array(
					'href_matches' => $cornerstone_urls,
				),
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
		$cornerstone_urls = Cornerstone_Utils::get_list();
		if ( empty( $cornerstone_urls ) ) {
			return array();
		}

		return $cornerstone_urls;
	}
}

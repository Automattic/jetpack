<?php
/**
 * Speculation Rules implementation for cornerstone pages
 *
 * @package Boost
 * @since 3.13.0
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Lib\Cornerstone\Cornerstone_Utils;
/**
 * Class to handle speculation rules for cornerstone pages
 */
class Speculation_Rules implements Feature, Changes_Output_On_Activation, Optimization {

	/**
	 * Get the slug for this module.
	 *
	 * @return string
	 */
	public static function get_slug() {
		return 'speculation_rules';
	}

	/**
	 * Check if the feature is available
	 *
	 * @return bool
	 */
	public static function is_available() {
		return true;
	}

	/**
	 * Initialize the speculation rules
	 *
	 * @since 3.13.0
	 * @return void
	 */
	public function setup() {
		// Use WP core action to add speculation rules
		add_action( 'wp_load_speculation_rules', array( $this, 'add_cornerstone_rules' ) );
	}

	/**
	 * Add speculation rules for cornerstone pages
	 *
	 * @param \WP_Speculation_Rules $speculation_rules The speculation rules instance.
	 * @since 3.13.0
	 * @return void
	 */
	public function add_cornerstone_rules( $speculation_rules ) {
		$cornerstone_urls = $this->get_cornerstone_urls();
		if ( empty( $cornerstone_urls ) ) {
			return;
		}

		$home_url         = wp_parse_url( home_url() );
		$origin           = $home_url['scheme'] . '://' . $home_url['host'];
		$port             = $home_url['port'] ?? null;
		$cornerstone_urls = array_map(
			function ( $url ) use ( $home_url, $origin, $port ) {
				if ( null === $port ) {
					return trailingslashit( str_replace( $origin, '', $url ) );
				}

				$parts = wp_parse_url( $url );
				if ( ( $parts['scheme'] ?? null ) !== $home_url['scheme']
					|| ( $parts['host'] ?? null ) !== $home_url['host']
					|| ( $parts['port'] ?? null ) !== $port
					|| isset( $parts['user'] )
					|| isset( $parts['pass'] )
				) {
					return trailingslashit( $url );
				}

				// Keep query strings and fragments in the pattern.
				return trailingslashit( ( $parts['path'] ?? '' ) . strpbrk( $url, '?#' ) );
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
	 * @since 3.13.0
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

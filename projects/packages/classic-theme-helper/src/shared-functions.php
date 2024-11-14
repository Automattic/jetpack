<?php
/**
 * Theme Tools: Functions shared between several features.
 *
 * @package automattic/jetpack-classic-theme-helper
 */

if ( ! function_exists( 'jetpack_mastodon_get_instance_list' ) ) {

	/**
	 * Build a list of Mastodon instance hosts.
	 * That list can be extended via a filter.
	 *
	 * @since 0.4.3 in Classic Theme Helper (previously in Jetpack since 11.8)
	 *
	 * @return array
	 */
	function jetpack_mastodon_get_instance_list() {
		$mastodon_instance_list = array(
			// Regex pattern to match any .tld for the mastodon host name.
			'#https?:\/\/(www\.)?mastodon\.(\w+)(\.\w+)?#',
			// Regex pattern to match any .tld for the mstdn host name.
			'#https?:\/\/(www\.)?mstdn\.(\w+)(\.\w+)?#',
			'counter.social',
			'fosstodon.org',
			'gc2.jp',
			'hachyderm.io',
			'infosec.exchange',
			'mas.to',
			'pawoo.net',
		);

		/**
		 * Filter the list of Mastodon instances.
		 *
		 * @since 0.4.3 in Classic Theme Helper (previously in Jetpack since 11.8)
		 *
		 * @module widgets, theme-tools
		 *
		 * @param array $mastodon_instance_list Array of Mastodon instances.
		 */
		return (array) apply_filters( 'jetpack_mastodon_instance_list', $mastodon_instance_list );
	}
}

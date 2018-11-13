<?php
/**
 * Module Name: Plugin Search Hints
 * Module Description: Make suggestions when people search the plugin directory for things that Jetpack already does for them.
 * Sort Order: 50
 * Recommendation Order: 1
 * First Introduced: 6.8
 * Requires Connection: No
 * Auto Activate: Yes
 */

/**
 * @todo Convert into a Jetpack module. Autoload/enable.
 *
 * @todo Wrap it in a class, proper instantiation, etc.
 *
 * @todo Improve our logging of searches to ensure we're capturing everything.
 *
 * @todo Handle different scenarios:
 * - Jetpack installed, active, not connected; prompt to connect to get feature
 * - Installed, active, feature not enabled; prompt to enable
 * - Installed, active, feature enabled; link to settings
 * - Activate module via AJAX, then prompt to configure/settings
 */

/**
 * Intercept the plugins API response and add in an appropriate card for Jetpack
 */
add_filter( 'plugins_api_result', function( $result, $action, $args ) {
	// @todo Move this to somewhere else, and build out a big mapping.
	// @todo Build dynamically from a combination of module headers and descriptions
	$jetpack_feature_map = array(
		'contact form' => array(
			'name' => 'Jetpack: Contact Form',
			'short_description' => 'Jetpack contains a complete Contact Form solution which allows you to build custom forms for collecting information from site visitors.',
		),
	);

	// Looks like a search query; it's matching time
	if ( ! empty( $args->search ) ) {
		// @todo Apply sanitization/normalization
		// Lowercase, trim, remove punctuation/special chars, decode url, remove 'jetpack'
		$term = $args->search;
		if ( ! empty( $jetpack_feature_map[ $term ] ) ) {
			// @todo load the live Jetpack plugin data locally and prefill this array, or else avoiding needing most of this if possible
			$inject = array(
				'name' => '',
				'slug' => 'jetpack',
				'version' => '',
				'author' => '',
				'author_profile' => '',
				'requires' => '',
				'tested' => '',
				'requires_php' => '',
				'rating' => 100,
				'ratings' => array('1'=>1,'2'=>2,'3'=>3,'4'=>4,'5'=>5),
				'num_ratings' => 100,
				'support_threads' => 100,
				'support_threads_resolved' => 100,
				'active_installs' => 3000000,
				'downloaded' => 10000000,
				'last_updated' => '',
				'added' => '',
				'homepage' => '',
				'download_link' => '',
				'tags' => array(),
				'donate_link' => '',
				'short_description' => '',
				'description' => '',
				'icons' => array(
					'1x'  => 'https://ps.w.org/jetpack/assets/icon.svg?rev=1791404',
					'2x'  => 'https://ps.w.org/jetpack/assets/icon-256x256.png?rev=1791404',
					'svg' => 'https://ps.w.org/jetpack/assets/icon.svg?rev=1791404',
				)
			);
			$inject = array_merge( $inject, $jetpack_feature_map[ $term ] );
			array_unshift( $result->plugins, $inject );
		}
	}
	return $result;
}, 10, 3 );

/**
 * Put some more appropriate links on our custom result cards.
 */
add_filter( 'plugin_install_action_links', function( $links, $plugin ) {
	if ( 'jetpack' == $plugin['slug'] ) {
		// @todo Introduce logic to handle different scenarios (see top of file)
		$links = array(
			'<button type="button" class="button">Activate Module</button>',
			'<a href="">More Information</a>',
		);
	}

	return $links;
}, 10, 2 );

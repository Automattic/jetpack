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

add_action( 'jetpack_modules_loaded', array( 'Jetpack_Plugin_Search', 'init' ) );

class Jetpack_Plugin_Search {
	public static function init() {
		static $instance = null;

		if ( ! $instance ) {
			$instance = new Jetpack_Plugin_Search();
		}

		return $instance;
	}

	function __construct() {
		add_action( 'init', array( &$this, 'action_init' ) );
	}

	function action_init() {
		add_filter( 'plugins_api_result', array( $this, 'inject_jetpack_module_suggestion' ), 10, 3 );
		add_filter( 'plugin_install_action_links', array( $this, 'insert_module_related_links' ), 10, 2 );
	}


	/**
	 * Intercept the plugins API response and add in an appropriate card for Jetpack
	 */
	public function inject_jetpack_module_suggestion( $result, $action, $args ) {
		// @todo Move this to somewhere else, and build out a big mapping.
		// @todo Build dynamically from a combination of module headers and descriptions
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
		$jetpack_modules_list = Jetpack_Admin::init()->get_modules();

		// Looks like a search query; it's matching time
		if ( ! empty( $args->search ) ) {
			l('Got a search query');

			// @todo Apply sanitization/normalization
			// Lowercase, trim, remove punctuation/special chars, decode url, remove 'jetpack'
			$normalized_term = strtolower( $args->search );
			$matching_module = null;

			function sort_by_sort_opt($m1, $m2) {
				return $m1['sort'] - $m2['sort'];
			};
			usort( $jetpack_modules_list, 'sort_by_sort_opt');
			foreach ( $jetpack_modules_list as $module_slug => $module_opts ) {
				$search_terms = $module_opts['name'] . ', ' . $module_opts['search_terms'];
				l( $search_terms );
				$terms_array = explode( ', ', $search_terms );
				if ( in_array( $normalized_term, $terms_array ) ) {
					$matching_module = $module_slug;
					break;
				}
			}

			l( $matching_module );

			if ( isset( $matching_module ) ) {
				// @todo load the live Jetpack plugin data locally and prefill this array, or else avoiding needing most of this if possible
				// include_once ABSPATH . '/wp-admin/includes/plugin-install.php';
				// $plugin_meta = plugins_api( 'plugin_information', array( 'slug' => 'jetpack' ) );

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
				$inject = array_merge( $inject, $jetpack_modules_list[ $matching_module ] );
				array_unshift( $result->plugins, $inject );
			}
		}
		return $result;
	}

	/**
	 * Put some more appropriate links on our custom result cards.
	 */
	public function insert_module_related_links( $links, $plugin ) {
		if ( 'jetpack' === $plugin['slug'] ) {
			// l($links);
			// l($plugin);
			// @todo Introduce logic to handle different scenarios (see top of file)
			$links = array(
				'<button type="button" class="button">Activate Module</button>',
				'<a href="">More Information</a>',
			);
		}

		return $links;
	}
}

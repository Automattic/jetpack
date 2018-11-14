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
 * @todo Handle different scenarios:
 * - Jetpack installed, active, not connected; prompt to connect to get feature
 * - Installed, active, feature not enabled; prompt to enable
 * - Installed, active, feature enabled; link to settings
 * - Activate module via AJAX, then prompt to configure/settings
 */

add_action( 'jetpack_modules_loaded', array( 'Jetpack_Plugin_Search', 'init' ) );
jetpack_require_lib( 'tracks/client' );

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
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';
		$jetpack_modules_list = Jetpack_Admin::init()->get_modules();

		// Never suggest this module.
		unset( $jetpack_modules_list['plugin-search'] );

		// Looks like a search query; it's matching time
		if ( ! empty( $args->search ) ) {

			// @todo Apply sanitization/normalization
			// Lowercase, trim, remove punctuation/special chars, decode url, remove 'jetpack'
			$this->track_search_term( $args->search );
			$normalized_term = $this->sanitize_search_term( $args->search );
			$matching_module = null;

			// Callback function to sort the array of modules by the sort option.
			function sort_by_sort_opt( $m1, $m2 ) {
				return $m1['sort'] - $m2['sort'];
			};
			usort( $jetpack_modules_list, 'sort_by_sort_opt' );

			foreach ( $jetpack_modules_list as $module_slug => $module_opts ) {
				$search_terms = strtolower( $module_opts['search_terms'] . ', ' . $module_opts['name'] );
				$terms_array  = explode( ', ', $search_terms );
				$terms_array  = array_map( 'strtolower', $terms_array );
				if ( in_array( $normalized_term, $terms_array ) ) {
					$matching_module = $module_slug;
					break;
				}
			}

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

				// Splice in the base module data
				$inject = array_merge( $inject, $jetpack_modules_list[ $matching_module ] );

				// Helps to determine if that an injected card.
				$inject['plugin-search'] = true;
				// Supplement name/description so that they clearly indicate this was added.
				$inject['name'] = sprintf(
					__( 'Jetpack: %s', 'Jetpack: Module Name' ),
					$jetpack_modules_list[ $matching_module ]['name']
				);
				$inject['short_description'] = sprintf(
					__( 'You already have Jetpack installed, and it provides this functionality. %s', 'You already have Jetpack installed... Module description.' ),
					$jetpack_modules_list[ $matching_module ]['short_description']
				);

				// Add it to the top of the list
				array_unshift( $result->plugins, $inject );
			}
		}
		return $result;
	}

	/**
	 * Take a raw search query and return something a bit more standardized and
	 * easy to work with.
	 *
	 * @param  String $term The raw search term
	 * @return String A simplified/sanitized version.
	 */
	private function sanitize_search_term( $term ) {
		$term = strtolower( urldecode( $term ) );

		// remove non-alpha/space chars
		$term = preg_replace( '/[^a-z ]/', '', $term );

		// remove strings that don't help matches
		$term = trim( str_replace( array( 'jetpack', 'jp', 'free', 'wordpress' ), '', $term ) );

		return $term;
	}

	/**
	 * Tracks every search term used in plugins search as 'jetpack_wpa_plugin_search_term'
	 *
	 * @param String $term The raw search term.
	 * @return true|WP_Error true for success, WP_Error if error occured.
	 */
	private function track_search_term( $term ) {
		return JetpackTracking::record_user_event( 'wpa_plugin_search_term', array( 'search_term' => $term ) );
	}

	/**
	 * Put some more appropriate links on our custom result cards.
	 */
	public function insert_module_related_links( $links, $plugin ) {
		if (
			! 'jetpack' === $plugin['slug'] ||
			! array_key_exists( 'plugin-search', $plugin ) ||
			// Make sure we show injected card only on first page.
			( array_key_exists( 'paged', $_GET ) && $_GET['paged'] > 1 )
			) {
			return $links;
		}

		// Jetpack installed, active, feature not enabled; prompt to enable.
		if ( Jetpack::is_active() && ! Jetpack::is_module_active( $plugin['module'] ) ) {
			$activate_url = admin_url( 'admin.php' ) . '?page=jetpack&#038;action=activate&#038;module=' . $plugin['module'] . '&#038;_wpnonce=' . $plugin['activate_nonce'];
			$links = array(
				'<button type="button" class="button primary" ><a href=' . $activate_url . '>' . __('Activate Module', 'jetpack') . '</a></button>',
			);
		// Jetpack installed, active, feature enabled; link to settings.
		} elseif ( Jetpack::is_active() && Jetpack::is_module_active( $plugin['module'] ) ) {
			$links = array(
				'<button type="button" class="button"><a href="' . $plugin['configure_url'] . '">' . __('Module Settings', 'jetpack') . '</a></button>',
			);
		}

		// Adds More Information link.
		$links[] = '<a href="' . $plugin['learn_more_button'] . '">' . __('More Information', 'jetpack') . '</a>';
		// Add some styling.
		$links[] = '<style>.plugin-card-jetpack { border: solid 2px green; }</style>';
		return $links;
	}
}

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
 * - Done: Installed, active, feature not enabled; prompt to enable
 * - Done: Installed, active, feature enabled; link to settings
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

	public function __construct() {
		add_action( 'init', array( &$this, 'action_init' ) );
	}

	public function action_init() {
		add_filter( 'plugins_api_result', array( $this, 'inject_jetpack_module_suggestion' ), 10, 3 );
		add_filter( 'plugin_install_action_links', array( $this, 'insert_module_related_links' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( $this, 'load_plugins_search_script' ) );
	}

	public function load_plugins_search_script( $hook ) {
		if( 'plugin-install.php' !== $hook ) {
			return;
		}

		wp_enqueue_script( 'plugin-search', plugins_url( 'modules/plugin-search/plugin-search.js', JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION, true );
		wp_localize_script(
			'plugin-search',
			'pluginSearchState',
			array(
				'jetpackWPNonce'       => wp_create_nonce( 'wp_rest' ),
				'manageSettingsString' => __( 'Module Settings', 'jetpack' ),
				'activateModuleString' => __( 'Activate Module', 'jetpack' ),
				'activatedString'      => __( 'Activated', 'jetpack' ),
				'activatingString'     => __( 'Activating', 'jetpack' ),
			)
		);
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
			$matching_module = null;

			// Lowercase, trim, remove punctuation/special chars, decode url, remove 'jetpack'
			$this->track_search_term( $args->search );
			$normalized_term = $this->sanitize_search_term( $args->search );

			usort( $jetpack_modules_list, array( $this, 'by_sorting_option' ) );

			// Try to match a passed search term with module's search terms
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
					'slug' => 'jetpack-plugin-search',
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
					),
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

		// remove non-alpha/space chars.
		$term = preg_replace( '/[^a-z ]/', '', $term );

		// remove strings that don't help matches.
		$term = trim( str_replace( array( 'jetpack', 'jp', 'free', 'wordpress' ), '', $term ) );

		return $term;
	}

	/**
	 * Tracks every search term used in plugins search as 'jetpack_wpa_plugin_search_term'
	 *
	 * @param String $term The raw search term.
	 * @return true|WP_Error true for success, WP_Error if error occurred.
	 */
	private function track_search_term( $term ) {
		return JetpackTracking::record_user_event( 'wpa_plugin_search_term', array( 'search_term' => $term ) );
	}

	/**
	 * Callback function to sort the array of modules by the sort option.
	 */
	private function by_sorting_option( $m1, $m2 ) {
		return $m1['sort'] - $m2['sort'];
	}

	/**
	 * Put some more appropriate links on our custom result cards.
	 */
	public function insert_module_related_links( $links, $plugin ) {
		if (
			! 'jetpack-plugin-search' === $plugin['slug'] ||
			// Make sure we show injected this card only on first page.
			( array_key_exists( 'paged', $_GET ) && $_GET['paged'] > 1 )
			) {
			return $links;
		}
		// Inject module data into js.
		wp_localize_script( 'plugin-search', 'jetpackModuleInfo', $plugin );

		// Jetpack installed, active, feature not enabled; prompt to enable.
		if ( Jetpack::is_active() && ! Jetpack::is_module_active( $plugin['module'] ) ) {
			$links = array(
				'<a id="plugin-select-activate" class="button activate-now"> ' . __( 'Activate Module', 'jetpack' ) . '</a>',
			);
		// Jetpack installed, active, feature enabled; link to settings.
		} elseif ( Jetpack::is_active() && Jetpack::is_module_active( $plugin['module'] ) ) {
			$links = array(
				'<a id="plugin-select-settings" class="button" href="' . $plugin['configure_url'] . '">' . __( 'Module Settings', 'jetpack' ) . '</a>',
			);
		}

		// Adds "More Information" link.
		$links[] = '<a href="' . $plugin['learn_more_button'] . '">' . __( 'More Information', 'jetpack' ) . '</a>';

		// Add some styling.
		$links[] = '<style>.plugin-card-jetpack-plugin-search { border: solid 2px green; }</style>';
		return $links;
	}
}

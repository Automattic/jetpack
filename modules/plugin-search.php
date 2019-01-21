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
	 * Get the plugin repo's data for Jetpack to populate the fields with.
	 *
	 * @return array|mixed|object|WP_Error
	 */
	public static function get_jetpack_plugin_data() {
		$data = get_transient( 'jetpack_plugin_data' );

		if ( ! $data || is_wp_error( $data ) ) {
			include_once( ABSPATH . 'wp-admin/includes/plugin-install.php' );
			$data = plugins_api( 'plugin_information', array(
				'slug' => 'jetpack',
				'is_ssl' => is_ssl(),
				'fields' => array(
					'banners' => true,
					'reviews' => true,
					'active_installs' => true,
					'versions' => false,
					'sections' => false,
				),
			) );
			set_transient( 'jetpack_plugin_data', $data, DAY_IN_SECONDS );
		}

		return $data;
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
				if ( in_array( $normalized_term, $terms_array ) ) {
					$matching_module = $module_slug;
					break;
				}
			}

			if ( isset( $matching_module ) ) {
				$inject = (array) self::get_jetpack_plugin_data();

				$overrides = array(
					'plugin-search' => true, // Helps to determine if that an injected card.
					'name' => sprintf(       // Supplement name/description so that they clearly indicate this was added.
						_x( 'Jetpack: %s', 'Jetpack: Module Name', 'jetpack' ),
						$jetpack_modules_list[ $matching_module ]['name']
					),
					'short_description' => sprintf(
						_x( 'You already have Jetpack installed, and it provides this functionality. %s', 'You already have Jetpack installed... Module description.', 'jetpack' ),
						$jetpack_modules_list[ $matching_module ]['short_description']
					),
					'requires_connection' => (bool) $jetpack_modules_list[ $matching_module ]['requires_connection'],
					'slug' => 'jetpack&plugin-search',
					'version' => JETPACK__VERSION,
					'icons' => array(
						'1x'  => 'https://ps.w.org/jetpack/assets/icon.svg?rev=1791404',
						'2x'  => 'https://ps.w.org/jetpack/assets/icon-256x256.png?rev=1791404',
						'svg' => 'https://ps.w.org/jetpack/assets/icon.svg?rev=1791404',
					),
				);

				// Splice in the base module data
				$inject = array_merge( $inject, $jetpack_modules_list[ $matching_module ], $overrides );

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
			'jetpack&plugin-search' !== $plugin['slug'] ||
			// Make sure we show injected this card only on first page.
			( array_key_exists( 'paged', $_GET ) && $_GET['paged'] > 1 )
			) {
			return $links;
		}
		// Inject module data into js.
		wp_localize_script( 'plugin-search', 'jetpackModuleInfo', $plugin );

		$links = array();

		// Jetpack installed, active, feature not enabled; prompt to enable.
		if (
            (
                Jetpack::is_active() ||
                (
                    Jetpack::is_development_mode() &&
                    ! $plugin[ 'requires_connection' ]
                )
            ) &&
			current_user_can( 'jetpack_activate_modules' ) &&
			! Jetpack::is_module_active( $plugin['module'] )
			) {
			$links = array(
				'<button id="plugin-select-activate" class="button activate-module-now" data-module="' . esc_attr( $plugin['module'] ) . '"> ' . esc_html__( 'Activate Module', 'jetpack' ) . '</button>',
			);
		// Jetpack installed, active, feature enabled; link to settings.
		} elseif (
			! empty( $plugin['configure_url'] ) &&
			current_user_can( 'jetpack_configure_modules' ) &&
			Jetpack::is_module_active( $plugin['module'] ) &&
            /** This filter is documented in class.jetpack-admin.php */
            apply_filters( 'jetpack_module_configurable_' . $plugin['module'], false )
			) {
			$links = array(
				'<a id="plugin-select-settings" href="' . esc_url( $plugin['configure_url'] ) . '">' . esc_html__( 'Module Settings', 'jetpack' ) . '</a>',
			);
		}

		// Adds "More Information" link.
		if ( ! empty( $plugin['learn_more_button'] ) ) {
			$links[] = '<a href="' . esc_url( $plugin['learn_more_button'] ) . '" target="_blank">' . esc_html__( 'More Information', 'jetpack' ) . '</a>';
		}

		// Add some styling.
		$links[] = '<style>.plugin-card-jetpackplugin-search { border: solid 2px green; }</style>';
		return $links;
	}
}

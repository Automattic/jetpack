<?php
/**
 * Managed plugins file.
 *
 * @package wpcomsh
 */

/**
 * Plugins that can't be deactivated.
 */
const WPCOM_CORE_ATOMIC_PLUGINS = array(
	'jetpack/jetpack.php',
	'akismet/akismet.php',
);

/**
 * Plugins that can be deactivated.
 */
const WPCOM_FEATURE_PLUGINS = array(
	'coblocks/class-coblocks.php',
	'full-site-editing/full-site-editing-plugin.php',
	'gutenberg/gutenberg.php',
	'layout-grid/index.php',
	'page-optimize/page-optimize.php',
);

/**
 * Check if plugin is managed.
 *
 * @param mixed $plugin_file Name of plugin file.
 *
 * @return bool
 */
function wpcomsh_is_managed_plugin( $plugin_file ) {
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC && class_exists( 'Atomic_Platform_Mu_Plugin' ) ) {
		return Atomic_Platform_Mu_Plugin::is_managed_plugin( $plugin_file );
	}

	return false;
}

/**
 * Checks if a plugin has been installed from the WP.com marketplace.
 *
 * @param string $plugin_file The plugin file name.
 * @return bool Whether the plugin has a matching marketplace purchase.
 */
function wpcomsh_is_marketplace_plugin( $plugin_file ) {
	if ( ! wpcomsh_is_managed_plugin( $plugin_file ) ) {
		return false;
	}

	$persistent_data = new Atomic_Persistent_Data();
	if ( ! $persistent_data ) { // phpcs:ignore WordPress.NamingConventions
		return false;
	}

	$marketplace_plugins = array();

	if ( ! empty( $persistent_data->WPCOM_MARKETPLACE ) ) { // phpcs:ignore WordPress.NamingConventions
		$marketplace_software = json_decode( $persistent_data->WPCOM_MARKETPLACE, true ); // phpcs:ignore WordPress.NamingConventions

		// If we don't have an array of marketplace plugins, this plugin can't be a marketplace plugin.
		if ( ! isset( $marketplace_software['plugins'] ) || ! is_array( $marketplace_software['plugins'] ) || array() === $marketplace_software['plugins'] ) {
			return false;
		}

		$marketplace_plugins = $marketplace_software['plugins'];
	} else {
		/*
		 * Some sites might have an empty `WPCOM_MARKETPLACE` field despite having software installed from
		 * the marketplace (mainly because this field has not been backfilled after its introduction).
		 *
		 * For those cases, we check against the purchases of a site as a fallback, but that only works for
		 * purchases of products with slugs that have not been shortened.
		 */
		$marketplace_purchases = wpcomsh_filter_marketplace_purchases_from_site_purchases();

		if ( empty( $marketplace_purchases ) ) {
			return false;
		}

		foreach ( $marketplace_purchases as $marketplace_purchase ) {
			$marketplace_plugins[] = preg_replace( array( '/(_monthly|_yearly)$/', '/_/' ), array( '', '-' ), $marketplace_purchase->product_slug );
		}
	}

	foreach ( $marketplace_plugins as $marketplace_plugin ) {
		if ( ( 0 === strpos( $plugin_file, $marketplace_plugin . '/' ) || 0 === strpos( $plugin_file, $marketplace_plugin . '.php' ) ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Filter marketplace product purchases from site purchases.
 *
 * @return array The filtered marketplace purchases.
 */
function wpcomsh_filter_marketplace_purchases_from_site_purchases() {
	$site_purchases = wpcom_get_site_purchases();

	return array_filter(
		$site_purchases,
		function ( $purchase ) {
			return in_array( $purchase->product_type, array( 'marketplace_plugin', 'saas_plugin' ), true );
		}
	);
}

/**
 * Disable the capability to deactivate the WPCOM_CORE_ATOMIC_PLUGINS.
 *
 * @param array  $caps    Array of required capabilities.
 * @param string $cap     Capability name.
 * @param int    $user_id The user ID.
 * @param array  $args    Adds the context to the cap. For the purpose of this callback: Plugin to be deactivated.
 * @return array Primitive caps.
 */
function wpcomsh_deactivate_plugin_cap( $caps, $cap, $user_id, $args ) {
	if ( 'deactivate_plugin' === $cap && in_array( $args[0], WPCOM_CORE_ATOMIC_PLUGINS, true ) ) {
		$caps[] = 'do_not_allow';
	}

	return $caps;
}
add_filter( 'map_meta_cap', 'wpcomsh_deactivate_plugin_cap', 10, 4 );

/**
 * Add managed plugins action links.
 */
function wpcomsh_managed_plugins_action_links() {
	foreach ( WPCOM_CORE_ATOMIC_PLUGINS as $plugin ) {
		if ( wpcomsh_is_managed_plugin( $plugin ) ) {
			add_filter( 'plugin_action_links_' . $plugin, 'wpcomsh_hide_plugin_deactivate_edit_links' );
			add_action( "after_plugin_row_{$plugin}", 'wpcomsh_show_plugin_auto_managed_notice', 10, 2 );
		} else {
			add_action( 'after_plugin_row_' . $plugin, 'wpcomsh_show_unmanaged_plugin_separator', PHP_INT_MAX );
		}
	}

	foreach ( WPCOM_FEATURE_PLUGINS as $plugin ) {
		if ( wpcomsh_is_managed_plugin( $plugin ) ) {
			add_action( 'after_plugin_row_' . $plugin, 'wpcomsh_show_plugin_auto_managed_notice', 10, 2 );
		} else {
			add_action( 'after_plugin_row_' . $plugin, 'wpcomsh_show_unmanaged_plugin_separator', PHP_INT_MAX );
		}
	}

	// Remove `delete` link for all managed plugins purchased from WordPress.com Marketplace.
	$all_plugin_files = array_keys( get_plugins() );
	foreach ( $all_plugin_files as $plugin_file ) {
		if ( ! wpcomsh_is_marketplace_plugin( $plugin_file ) ) {
			continue;
		}

		add_filter( 'plugin_action_links_' . $plugin_file, 'wpcomsh_hide_plugin_remove_link' );
		add_action( 'after_plugin_row_' . $plugin_file, 'wpcomsh_show_plugin_auto_managed_notice', 10, 2 );
	}
}
add_action( 'load-plugins.php', 'wpcomsh_managed_plugins_action_links' );

/**
 * Hide update notice for managed plugins.
 */
function wpcomsh_hide_update_notice_for_managed_plugins() {
	$plugin_files = array_keys( get_plugins() );

	foreach ( $plugin_files as $plugin ) {
		if ( wpcomsh_is_managed_plugin( $plugin ) ) {
			remove_action( 'after_plugin_row_' . $plugin, 'wp_plugin_update_row' );
		}
	}
}
add_action( 'load-plugins.php', 'wpcomsh_hide_update_notice_for_managed_plugins', 25 );

/**
 * Hide VaultPress from plugin list.
 */
function hide_vaultpress_from_plugin_list() {
	global $wp_list_table;
	unset( $wp_list_table->items['vaultpress/vaultpress.php'] );
}
add_action( 'pre_current_active_plugins', 'hide_vaultpress_from_plugin_list' );

/**
 * Hides must-use and drop-in plugins in Plugins list.
 */
add_filter( 'show_advanced_plugins', '__return_false' );

/**
 * Hide plugin deactivate edit links.
 *
 * @param mixed $links The nav links.
 *
 * @return array
 */
function wpcomsh_hide_plugin_deactivate_edit_links( $links ) {
	if ( ! is_array( $links ) ) {
		return array();
	}

	unset( $links['deactivate'] );
	unset( $links['edit'] );

	return $links;
}

/**
 * Hide plugin removal link.
 *
 * @param mixed $links The nav links.
 *
 * @return array
 */
function wpcomsh_hide_plugin_remove_link( $links ) {
	if ( ! is_array( $links ) ) {
		return array();
	}

	unset( $links['delete'] );

	return $links;
}

/**
 * Disable bulk plugin deactivation.
 *
 * @param array $actions The actions.
 *
 * @return array
 */
function wpcomsh_disable_bulk_plugin_deactivation( $actions ) {
	unset( $actions['deactivate-selected'] );

	return $actions;
}
add_filter( 'bulk_actions-plugins', 'wpcomsh_disable_bulk_plugin_deactivation' );

/**
 * Hide the Jetpack version number from the plugin list.
 * That version is managed by the Atomic platform.
 *
 * @param string[] $plugin_meta An array of the plugin's metadata, including
 *                              the version, author, author URI, and plugin URI.
 * @param string   $plugin_file Path to the plugin file relative to the plugins directory.
 * @param array    $plugin_data An array of plugin data.
 *
 * @return string[]
 */
function wpcom_hide_jetpack_version_number( $plugin_meta, $plugin_file, $plugin_data ) {
	if (
		is_array( $plugin_meta )
		&& isset( $plugin_data['slug'] )
		&& isset( $plugin_data['Version'] )
		&& 'jetpack' === $plugin_data['slug']
		&& false !== strpos( $plugin_meta[0], $plugin_data['Version'] )
	) {
		unset( $plugin_meta[0] );
	}

	return $plugin_meta;
}
add_filter( 'plugin_row_meta', 'wpcom_hide_jetpack_version_number', 10, 3 );

/**
 * Show plugin auto managed notice.
 *
 * @param string $file        The plugin file.
 * @param array  $plugin_data The plugin data.
 */
function wpcomsh_show_plugin_auto_managed_notice( $file, $plugin_data ) {
	$plugin_name = 'The plugin';
	$active      = is_plugin_active( $file ) ? ' active' : '';

	if ( ! empty( $plugin_data['Name'] ) ) {
		$plugin_name = $plugin_data['Name'];
	}

	/* translators: %s: plugin name */
	$message = sprintf( __( '%s is automatically managed for you.', 'wpcomsh' ), $plugin_name );

	if ( in_array( $file, WPCOM_FEATURE_PLUGINS, true ) ) {
		$message = __( 'This plugin was installed by WordPress.com and provides features offered in your plan subscription.', 'wpcomsh' );
	}

	echo '<tr class="plugin-update-tr' . esc_attr( $active ) . '">' .
			'<td colspan="4" class="plugin-update colspanchange">' .
				'<div class="notice inline notice-success notice-alt">' .
					'<p>' . esc_html( $message ) . '</p>' .
				'</div>' .
			'</td>' .
		'</tr>';
}

/**
 * Renders a separator row for plugins that are managed by WordPress.com but the user has currently
 * removed it and added an unmanaged version.
 *
 * @param string $file Plugin file name.
 */
function wpcomsh_show_unmanaged_plugin_separator( $file ) {
	$active = is_plugin_active( $file ) ? 'active' : '';

	printf(
		'<tr class="%s"><th colspan="4" scope="row" class="check-column"></th></tr>',
		esc_attr( $active )
	);
}

/**
 * The AMP plugin displays an error message in the dashboard when
 * it's installed in the wrong directory (i.e. not `amp`).
 *
 * When the plugin is managed by us, the AMP plugin incorrectly thinks it's
 * been installed in the wrong directory due to symlinking. So we disable
 * the error message when the installation directory is correct and managed
 * by us.
 *
 * However, some users might do it wrong and that could affect their
 * ability to have the plugin updated automatically.
 * We should keep the warning if that's the case.
 *
 * See https://github.com/Automattic/wp-calypso/issues/64104.
 */
function wpcomsh_maybe_remove_amp_incorrect_installation_notice() {
	if ( wpcomsh_is_managed_plugin( 'amp/amp.php' ) ) {
		remove_action( 'admin_notices', '_amp_incorrect_plugin_slug_admin_notice' );
	}
}
add_action( 'admin_head', 'wpcomsh_maybe_remove_amp_incorrect_installation_notice' );

/**
 * Remove VaultPress WP Admin notices.
 */
function wpcomsh_remove_vaultpress_wpadmin_notices() {
	if ( ! class_exists( 'VaultPress' ) ) {
		return;
	}

	$vp_instance = VaultPress::init();

	remove_action( 'user_admin_notices', array( $vp_instance, 'activated_notice' ) );
	remove_action( 'admin_notices', array( $vp_instance, 'activated_notice' ) );

	remove_action( 'user_admin_notices', array( $vp_instance, 'connect_notice' ) );
	remove_action( 'admin_notices', array( $vp_instance, 'connect_notice' ) );

	remove_action( 'user_admin_notices', array( $vp_instance, 'error_notice' ) );
	remove_action( 'admin_notices', array( $vp_instance, 'error_notice' ) );
}
add_action( 'admin_head', 'wpcomsh_remove_vaultpress_wpadmin_notices', 11 ); // Priority 11 so it runs after VaultPress `admin_head` hook.

/**
 * Disables a Yoast notification that displays when an outdated version of the Gutenberg plugin is installed.
 */
if ( wpcomsh_is_managed_plugin( 'gutenberg/gutenberg.php' ) ) {
	add_filter( 'yoast_display_gutenberg_compat_notification', '__return_false' );
}

/**
 * Detects new plugins and defaults them to be auto-updated.
 *
 * This is a pre-option filter for the auto_update_plugins option. Its purpose
 * is to default newly added plugins to being auto-updated. After that, if users
 * want to disable auto-updates for those plugins, they can.
 *
 * @param mixed $pre_auto_update_plugins Pre auto update plugins.
 *
 * @return bool
 */
function wpcomsh_auto_update_new_plugins_by_default( $pre_auto_update_plugins ) {
	// Listing plugins is a costly operation, so we only want to do this under certain circumstances.
	$look_for_new_plugins = false;

	/*
	 * Does this look like a Jetpack plugin update attempt?
	 *
	 * @see https://github.com/WordPress/wordpress-develop/blob/18ebf26bc3787e8ccc03438bd8375e4828030ca9/src/wp-admin/includes/class-wp-upgrader.php#L904
	 * @see https://github.com/Automattic/jetpack/blob/82d102a231c34585150056329879e0745c954974/projects/plugins/jetpack/json-endpoints/jetpack/class.jetpack-json-api-plugins-modify-endpoint.php#L331
	 */
	if (
		defined( 'XMLRPC_REQUEST' ) && XMLRPC_REQUEST &&
		HOUR_IN_SECONDS < ( time() - (int) get_option( 'auto_updater.lock', 0 ) )
	) {
		$look_for_new_plugins = true;
	}

	// We'd like admin operations via WP-CLI to have the latest auto-updated plugins list.
	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		$look_for_new_plugins = true;
	}

	/*
	 * Is Core doing update-related things?
	 *
	 * @see https://github.com/WordPress/wordpress-develop/blob/98c9ab835e9e1e2195d336fa0ef913debb76edca/src/wp-includes/update.php#L966
	 */
	if (
		doing_action( 'load-plugins.php' ) ||
		doing_action( 'load-update.php' ) ||
		doing_action( 'load-update-core.php' ) ||
		doing_action( 'wp_update_plugins' )
	) {
		$look_for_new_plugins = true;
	}

	if ( ! $look_for_new_plugins ) {
		return $pre_auto_update_plugins;
	}

	/*
	 * Remove this pre_option filter immediately because it:
	 * - calls get_option for the same option and will otherwise infinitely recurse.
	 * - updates auto_update_plugins on-demand an only needs to run once.
	 */
	$filter_removed = remove_filter( 'pre_option_auto_update_plugins', __FUNCTION__ );
	if ( ! $filter_removed ) {
		// Return immediately because it's not safe to continue.
		return $pre_auto_update_plugins;
	}

	$baseline_plugins_list = get_option( 'wpcomsh_plugins_considered_for_auto_update' );
	if ( ! function_exists( 'get_plugins' ) ) {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
	}

	$fresh_plugins_list  = array_keys( get_plugins() );
	$auto_update_plugins = get_option( 'auto_update_plugins', array() );

	$skip_new_plugins = false;

	if ( false === $baseline_plugins_list && ! empty( $auto_update_plugins ) ) {
		/*
		 * We don't yet have a baseline plugin list, so we can't identify new plugins.
		 *
		 * Since the site already has a non-empty auto_update_plugins option, let's assume it matches the admin's
		 * intention and leave it as-is. This should be the first and only time we are missing a baseline plugin list.
		 * Plugins added in the future should be auto-updated by default.
		 */
		$skip_new_plugins = true;
	}

	if ( false === $baseline_plugins_list ) {
		$baseline_plugins_list = array();
	}

	$new_unmanaged_plugins = array();

	if ( ! $skip_new_plugins ) {
		$new_plugins = array_diff( $fresh_plugins_list, $baseline_plugins_list );
		foreach ( $new_plugins as $new_plugin ) {
			if ( ! wpcomsh_is_managed_plugin( $new_plugin ) ) {
				$new_unmanaged_plugins[] = $new_plugin;
			}
		}
	}

	if ( ! empty( $new_unmanaged_plugins ) ) {
		$auto_update_plugins = array_unique( array_merge( $auto_update_plugins, $new_unmanaged_plugins ) );
		update_option( 'auto_update_plugins', $auto_update_plugins );
	}

	if ( $baseline_plugins_list != $fresh_plugins_list ) { //phpcs:ignore
		update_option( 'wpcomsh_plugins_considered_for_auto_update', $fresh_plugins_list, false );
	}

	return $auto_update_plugins;
}
add_filter( 'pre_option_auto_update_plugins', 'wpcomsh_auto_update_new_plugins_by_default' );

/**
 * Filter plugins_url for when __FILE__ is outside of WP_CONTENT_DIR
 *
 * @param string $url    The complete URL to the plugins directory including scheme and path.
 * @param string $path   Path relative to the URL to the plugins directory. Blank string
 *                       if no path is specified.
 * @param string $plugin The plugin file path to be relative to. Blank string if no plugin
 *                       is specified.
 * @return string Filtered URL.
 */
function wpcomsh_symlinked_plugins_url( $url, $path, $plugin ) {
	$url = preg_replace(
		'#((?<!/)/[^/]+)*/wp-content/plugins/wordpress/plugins/wpcomsh/([^/]+)/#',
		'/wp-content/mu-plugins/wpcomsh/',
		$url
	);

	if ( 'woocommerce-product-addons.php' === $plugin || 'woocommerce-gateway-stripe.php' === $plugin ) {
		$url = home_url( '/wp-content/plugins/' . basename( $plugin, '.php' ) );
	}

	return $url;
}
add_filter( 'plugins_url', 'wpcomsh_symlinked_plugins_url', 0, 3 );

/**
 * Get atomic managed plugin row auto update label
 *
 * @return string
 */
function wpcomsh_atomic_managed_plugin_row_auto_update_label() {
	/* translators: Message about how a managed plugin is updated. */
	return __( 'Updates managed by WordPress.com', 'wpcomsh' );
}
add_filter( 'atomic_managed_plugin_row_auto_update_label', 'wpcomsh_atomic_managed_plugin_row_auto_update_label' );

/**
 * Get atomic managed theme template auto update label
 *
 * @return string
 */
function wpcomsh_atomic_managed_theme_template_auto_update_label() {
	/* translators: Message about how a managed theme is updated. */
	return __( 'Updates managed by WordPress.com', 'wpcomsh' );
}
add_filter( 'atomic_managed_theme_template_auto_update_label', 'wpcomsh_atomic_managed_theme_template_auto_update_label' );

/**
 * Get atomic managed plugin auto update debug label
 *
 * @return string
 */
function wpcomsh_atomic_managed_plugin_auto_update_debug_label() {
	/* translators: Information about how a managed plugin is updated, for debugging purposes. */
	return __( 'Updates managed by WordPress.com', 'wpcomsh' );
}
add_filter( 'atomic_managed_plugin_auto_update_debug_label', 'wpcomsh_atomic_managed_plugin_auto_update_debug_label' );

/**
 * Get atomic managed theme auto update debug label
 *
 * @return string
 */
function wpcomsh_atomic_managed_theme_auto_update_debug_label() {
	/* translators: Information about how a managed theme is updated, for debugging purposes. */
	return __( 'Updates managed by WordPress.com', 'wpcomsh' );
}
add_filter( 'atomic_managed_theme_auto_update_debug_label', 'wpcomsh_atomic_managed_theme_auto_update_debug_label' );

/**
 * Filter to exclude the managed plugin from the list of plugins to update.
 * It overrides the site transient update_plugins.
 *
 * @param mixed $current Transient object with the list of plugins to update.
 * @return mixed
 */
function wpcomsh_remove_managed_plugins_from_update_plugins( $current ) {
	if ( is_object( $current ) && is_array( $current->response ) ) {
		foreach ( array_keys( $current->response ) as $plugin_key ) {
			if ( wpcomsh_is_managed_plugin( $plugin_key ) ) {
				unset( $current->response[ $plugin_key ] );
			}
		}
	}
	return $current;
}

add_filter( 'site_transient_update_plugins', 'wpcomsh_remove_managed_plugins_from_update_plugins' );

<?php
/**
 * Plugin Name: WordPress.com Site Helper
 * Description: A helper for connecting WordPress.com sites to external host infrastructure.
 * Version: 1.0
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

// Needed as Pressable has different path for wpcomsh than normally.
define( 'WPCOMSH__PLUGIN_DIR_PATH', WP_CONTENT_DIR . '/mu-plugins/wpcomsh' );
define( 'WPCOMSH__PLUGIN_FILE', WPCOMSH__PLUGIN_DIR_PATH . '/wpcomsh.php' );

require_once( 'constants.php' );
require_once( 'footer-credit/footer-credit.php' );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once WPCOMSH__PLUGIN_DIR_PATH . '/class.cli-commands.php';
}

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
add_action(
	'admin_head',
	'wpcomsh_remove_vaultpress_wpadmin_notices',
	11 // Priority 11 so it runs after VaultPress `admin_head` hook
);

function wpcomsh_register_plugins_action_links() {
	// Hide WPComSH "Deactivate" and "Edit" links on WP Admin Plugins page
	add_filter(
		'plugin_action_links_' . plugin_basename( WPCOMSH__PLUGIN_FILE ),
		'wpcomsh_hide_wpcomsh_plugin_links'
	);

	// If Jetpack is loaded, hide its "Deactivate" and "Edit" links on WP Admin Plugins page
	if ( defined( 'JETPACK__PLUGIN_FILE' ) ) {
		$jetpack_basename = plugin_basename( JETPACK__PLUGIN_FILE );

		add_filter(
			'plugin_action_links_' . $jetpack_basename,
			'wpcomsh_hide_plugin_deactivate_edit_links'
		);
		add_action(
			'after_plugin_row_' . $jetpack_basename,
			'wpcomsh_show_plugin_auto_managed_notice',
		10, 2 );
	}

	$vaultpress_plugin_file = WP_PLUGIN_DIR . '/vaultpress/vaultpress.php';

	// If VaultPress is loaded, hide its "Deactivate" and "Edit" links on WP Admin Plugins page
	if ( file_exists( $vaultpress_plugin_file ) ) {
		$vaultpress_basename = plugin_basename( $vaultpress_plugin_file );

		add_filter(
			'plugin_action_links_' . $vaultpress_basename,
			'wpcomsh_hide_plugin_deactivate_edit_links'
		);

		add_action(
			"after_plugin_row_" . $vaultpress_basename,
			"wpcomsh_show_plugin_auto_managed_notice",
		10, 2 );
	}

	// If Akismet is loaded, hide its "Deactivate" and "Edit" links on WP Admin Plugins page
	if ( defined( 'AKISMET__PLUGIN_DIR' ) ) {
		$akismet_basename = plugin_basename( AKISMET__PLUGIN_DIR . '/akismet.php' );

		add_filter(
			'plugin_action_links_' . $akismet_basename,
			'wpcomsh_hide_plugin_deactivate_edit_links'
		);

		add_action(
			"after_plugin_row_" . $akismet_basename,
			"wpcomsh_show_plugin_auto_managed_notice",
			10, 2 );
	}
}

add_action( 'admin_init', 'wpcomsh_register_plugins_action_links' );

function wpcomsh_hide_wpcomsh_plugin_links() {
	return array();
}

function wpcomsh_hide_plugin_deactivate_edit_links( $links ) {
	unset( $links['deactivate'] );
	unset( $links['edit'] );

	return $links;
}

function wpcomsh_show_plugin_auto_managed_notice( $file, $plugin_data ) {
	$plugin_name = 'The plugin';

	if ( array_key_exists( 'Name', $plugin_data ) ) {
		$plugin_name = $plugin_data['Name'];
	}

	$message = sprintf( __( '%s is automatically managed for you.' ), $plugin_name );

	echo
		'<tr class="plugin-update-tr active">' .
			'<td colspan="3" class="plugin-update colspanchange">' .
				'<div class="notice inline notice-warning notice-alt">' .
					"<p>{$message}</p>" .
				'</div>' .
			'</td>' .
		'</tr>';
}

function wpcomsh_register_theme_hooks() {
	add_filter(
		'jetpack_wpcom_theme_skip_download',
		'wpcomsh_jetpack_wpcom_theme_skip_download',
		10,
		2
	);

	add_filter(
		'jetpack_wpcom_theme_delete',
		'wpcomsh_jetpack_wpcom_theme_delete',
		10,
		2
	);
}
add_action( 'init', 'wpcomsh_register_theme_hooks' );

/**
 * Filters a user's capabilities depending on specific context and/or privilege.
 *
 * @param array  $required_caps Returns the user's actual capabilities.
 * @param string $cap           Capability name.
 * @return array Primitive caps.
 */
function wpcomsh_map_caps( $required_caps, $cap ) {
	require_once( 'functions.php' );

	switch ( $cap ) {

		// Disallow editing 3rd party WPCom premium themes.
		case 'edit_themes':
			if ( ! wpcomsh_can_manage_themes() ) {
				$required_caps[] = 'do_not_allow';

				break;
			}

			$theme = wp_get_theme();
			if ( wpcomsh_is_wpcom_premium_theme( $theme->get_stylesheet() )
			     && 'Automattic' !== $theme->get( 'Author' ) ) {
				$required_caps[] = 'do_not_allow';
			}
			break;

		// Disallow managing plugins for WPCom free plan.
		case 'activate_plugins':
		case 'install_plugins':
		case 'edit_plugins':
		case 'delete_plugins':
		case 'upload_plugins':
		case 'update_plugins':
			if ( ! wpcomsh_can_manage_plugins() ) {
				$required_caps[] = 'do_not_allow';
			}

			break;

		// Disallow managing themes for WPCom free plan.
		case 'switch_themes':
		case 'install_themes':
		case 'update_themes':
		case 'delete_themes':
		case 'upload_themes':
			if ( ! wpcomsh_can_manage_themes() ) {
				$required_caps[] = 'do_not_allow';
			}

			break;
	}

	return $required_caps;
}
add_action( 'map_meta_cap', 'wpcomsh_map_caps', 10, 2 );

function wpcomsh_remove_theme_delete_button( $prepared_themes ) {
	require_once( 'functions.php' );

	foreach ( $prepared_themes as $theme_slug => $theme_data ) {
		if ( wpcomsh_is_wpcom_theme( $theme_slug ) ) {
			$prepared_themes[ $theme_slug ]['actions']['delete'] = '';
		}
	}

	return $prepared_themes;
}
add_filter( 'wp_prepare_themes_for_js', 'wpcomsh_remove_theme_delete_button' );


function wpcomsh_jetpack_wpcom_theme_skip_download( $result, $theme_slug ) {
	require_once( 'functions.php' );

	$theme_type = wpcomsh_get_wpcom_theme_type( $theme_slug );

	// If we are dealing with a non WPCom theme, don't interfere.
	if ( ! $theme_type ) {
		return false;
	}

	if ( wpcomsh_is_theme_symlinked( $theme_slug ) ) {
		error_log( "WPComSH: WPCom theme with slug: {$theme_slug} is already installed/symlinked." );

		return new WP_Error(
			'wpcom_theme_already_installed',
			'The WPCom theme is already installed/symlinked.'
		);
	}

	$was_theme_symlinked = wpcomsh_symlink_theme( $theme_slug, $theme_type );

	if ( is_wp_error( $was_theme_symlinked ) ) {
		return $was_theme_symlinked;
	}

	wpcomsh_delete_theme_cache( $theme_slug );

	// Skip the theme installation as we've "installed" (symlinked) it manually above.
	add_filter(
		'jetpack_wpcom_theme_install',
		function() use( $was_theme_symlinked ) {
			return $was_theme_symlinked;
		},
		10,
		2
	);

	// If the installed WPCom theme is a child theme, we need to symlink its parent theme
	// as well.
	if ( wpcomsh_is_wpcom_child_theme( $theme_slug ) ) {
		$was_parent_theme_symlinked = wpcomsh_symlink_parent_theme( $theme_slug );

		if ( ! $was_parent_theme_symlinked ) {
			return new WP_Error(
				'wpcom_theme_installation_falied',
				"Can't install specified WPCom theme. Check error log for more details."
			);
		}
	}

	return true;
}

function wpcomsh_jetpack_wpcom_theme_delete( $result, $theme_slug ) {
	require_once( 'functions.php' );

	if (
		! wpcomsh_is_wpcom_theme( $theme_slug ) ||
		! wpcomsh_is_theme_symlinked( $theme_slug )
	) {
		return false;
	}

	// If a theme is a child theme, we first need to unsymlink the parent theme.
	if ( wpcomsh_is_wpcom_child_theme( $theme_slug ) ) {
		$was_parent_theme_unsymlinked = wpcomsh_delete_symlinked_parent_theme( $theme_slug );

		if ( ! $was_parent_theme_unsymlinked ) {
			return new WP_Error(
				'wpcom_theme_deletion_falied',
				"Can't delete specified WPCom theme. Check error log for more details."
			);
		}
	}

	$was_theme_unsymlinked = wpcomsh_delete_symlinked_theme( $theme_slug );

	return $was_theme_unsymlinked;
}

function wpcomsh_remove_dashboard_widgets() {
	remove_meta_box( 'pressable_dashboard_widget', 'dashboard', 'normal' );
}
add_action( 'wp_dashboard_setup', 'wpcomsh_remove_dashboard_widgets' );


/**
 * Filter attachment URLs if the 'wpcom_attachment_subdomain' option is present.
 * Local image files will be unaffected, as they will pass a file_exists check.
 * Files stored remotely will be filtered to have the correct URL.
 *
 * Once the files have been transferred, the 'wpcom_attachment_subdomain' will
 * be removed, preventing further stats.
 *
 * @param string $url The attachment URL
 * @param int $post_id The post id
 * @return string The filtered attachment URL
 */
function wpcomsh_get_attachment_url( $url, $post_id ) {
	$attachment_subdomain = get_option( 'wpcom_attachment_subdomain' );
	if ( $attachment_subdomain ) {
		if ( $file = get_post_meta( $post_id, '_wp_attached_file', true ) ) {
			$local_file = WP_CONTENT_DIR . '/uploads/' . $file;
			if ( ! file_exists( $local_file ) ) {
				return esc_url( 'https://' . $attachment_subdomain . '/' . $file );
			}
		}
	}
	return $url;
}
add_filter( 'wp_get_attachment_url', 'wpcomsh_get_attachment_url', 11, 2 );

/**
 * If a user is logged in to WordPress.com, log him in automatically to wp-login
 */
add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );

/**
 * When a request is made to Jetpack Themes API, we need to distinguish between a WP.com theme
 * and a WP.org theme in the response. This function adds/modifies the `theme_uri` field of a theme
 * changing it to `https://wordpress.com/theme/{$theme_slug}` if a theme is a WP.com one.
 *
 * @param array $formatted_theme Array containing the Jetpack Themes API data to be sent to wpcom
 *
 * @return array The original or modified theme info array
 */
function wpcomsh_add_wpcom_suffix_to_theme_endpoint_response( $formatted_theme ) {
	if ( ! array_key_exists( 'id', $formatted_theme ) ) {
		return $formatted_theme;
	}

	$theme_slug = $formatted_theme['id'];

	if ( wpcomsh_is_wpcom_theme( $theme_slug ) ) {
		$formatted_theme['theme_uri'] = "https://wordpress.com/theme/{$theme_slug}";
	}

	return $formatted_theme;
}
add_filter( 'jetpack_format_theme_details', 'wpcomsh_add_wpcom_suffix_to_theme_endpoint_response' );

function wpcomsh_disable_bulk_plugin_deactivation( $actions ) {
	if ( array_key_exists( 'deactivate-selected', $actions ) ) {
		unset( $actions['deactivate-selected'] );
	}

	return $actions;
}
add_filter( 'bulk_actions-plugins', 'wpcomsh_disable_bulk_plugin_deactivation' );

function wpcomsh_admin_enqueue_style() {
	wp_enqueue_style(
		'wpcomsh-admin-style',
		plugins_url( 'assets/admin-style.css', WPCOMSH__PLUGIN_FILE )
	);
}
add_action( 'admin_enqueue_scripts', 'wpcomsh_admin_enqueue_style', 999 );

function wpcomsh_add_masterbar() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	if ( version_compare( JETPACK__VERSION, '4.8', '>=' ) ) {
		return;
	}

	require_once dirname( __FILE__ ) . '/masterbar/masterbar.php';
	Jetpack::dns_prefetch( array(
		'//s0.wp.com',
		'//s1.wp.com',
		'//s2.wp.com',
		'//0.gravatar.com',
		'//1.gravatar.com',
		'//2.gravatar.com',
	) );
	new A8C_WPCOM_Masterbar;
}

add_action( 'jetpack_modules_loaded', 'wpcomsh_add_masterbar', 1 );

function wpcomsh_allow_custom_wp_options( $options ) {
	// For storing the plan of the site.
	$options[] = 'at_plan_slug';

	return $options;
}
add_filter( 'jetpack_options_whitelist', 'wpcomsh_allow_custom_wp_options' );

<?php
/**
 * Collection of hooks that apply feature checks on Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Disables theme and plugin related capabilities if the site doesn't have the required features.
 *
 * @param string[] $caps Primitive capabilities required of the user.
 * @param string   $cap  Capability being checked.
 * @return string[] Filtered primitive caps.
 */
function wpcomsh_map_feature_cap( $caps, $cap ) {

	switch ( $cap ) {
		case 'update_core':
		case 'update_languages':
			// Restrict access to Home > Updates on sites that can't manage plugins.
			if ( ! wpcom_site_has_feature( WPCOM_Features::MANAGE_PLUGINS ) ) {
				$caps[] = 'do_not_allow';
			}
			break;

		case 'update_themes':
		case 'delete_themes':
			if ( ! wpcom_site_has_feature( WPCOM_Features::INSTALL_THEMES ) ) {
				$caps[] = 'do_not_allow';
			}
			break;

		case 'install_themes':
			// Don't restrict `install_themes` when installing from WP.com.
			if ( wpcomsh_is_theme_install_request() ) {
				break;
			}

			if ( ! wpcom_site_has_feature( WPCOM_Features::INSTALL_THEMES ) ) {
				$caps[] = 'do_not_allow';
			}
			break;

		case 'edit_themes':
			if ( ! wpcom_site_has_feature( WPCOM_Features::EDIT_THEMES ) ) {
				$caps[] = 'do_not_allow';
			}
			break;

		case 'upload_themes':
			if ( ! wpcom_site_has_feature( WPCOM_Features::UPLOAD_THEMES ) ) {
				$caps[] = 'do_not_allow';
			}
			break;

		case 'activate_plugins':
		case 'install_plugins':
		case 'update_plugins':
			/*
			 * Requests like /sites/207323956/plugins rely on the activate_plugins capability.
			 * Allow sites with the LIST_INSTALLED_PLUGINS feature to list the installed plugins.
			 */
			if ( wpcomsh_is_plugin_list_request() && wpcom_site_has_feature( WPCOM_Features::LIST_INSTALLED_PLUGINS ) ) {
				break;
			}

			/*
			 * Specifically allow install and activate permissions for WooCommerce onboarding plugins.
			 */
			if (
				wpcom_site_has_feature( WPCOM_Features::INSTALL_WOO_ONBOARDING_PLUGINS )
				&& (
					wpcomsh_is_woocommerce_onboarding_plugin_request()
					|| wpcomsh_is_woocommerce_connect_request()
				)
			) {
				break;
			}

			if ( ! wpcom_site_has_feature( WPCOM_Features::INSTALL_PLUGINS ) ) {
				$caps[] = 'do_not_allow';
			}
			break;

		case 'upload_plugins':
			if ( ! wpcom_site_has_feature( WPCOM_Features::UPLOAD_PLUGINS ) ) {
				$caps[] = 'do_not_allow';
			}
			break;

		case 'edit_plugins':
			if ( ! wpcom_site_has_feature( WPCOM_Features::EDIT_PLUGINS ) ) {
				$caps[] = 'do_not_allow';
			}
			break;
	}

	return $caps;
}
add_filter( 'map_meta_cap', 'wpcomsh_map_feature_cap', 10, 2 );

/**
 * Whether the current request is an XML-RPC request from Calypso to list plugins.
 *
 * @return bool
 */
function wpcomsh_is_plugin_list_request() {
	return wpcomsh_is_xmlrpc_request_matching( '@^/sites/([^/]+)/plugins$@' );
}

/**
 * Whether the current request is an XML-RPC request from Calypso to install a WP.com theme.
 *
 * @return bool
 */
function wpcomsh_is_theme_install_request() {
	return wpcomsh_is_xmlrpc_request_matching( '@/sites/(.+)/themes/(.+)/install@' );
}

/**
 * Whether the current request is a REST API request from the WooCommerce onboarding tasks
 * trying to fetch a recommended payment gateway, or perform installation/activation of a plugin.
 *
 * @return bool
 */
function wpcomsh_is_woocommerce_onboarding_plugin_request() {
	$wp_json_prefix = preg_quote( rest_get_url_prefix(), '@' );

	// Check if we're looking up payment gateway suggestions.
	if ( wpcomsh_is_wp_rest_request_matching( '@^/' . $wp_json_prefix . '/wc-admin/payment-gateway-suggestions@' ) ) {
		return true;
	}

	$editable_methods = wpcomsh_get_rest_methods_as_array( \WP_REST_Server::EDITABLE );

	if ( ! wpcomsh_is_wp_rest_request_matching( '@^/' . $wp_json_prefix . '/wc-admin/plugins/install@', $editable_methods ) && ! wpcomsh_is_wp_rest_request_matching( '@^/' . $wp_json_prefix . '/wc-admin/plugins/activate@', $editable_methods ) ) {
		return false;
	}

	$wp_referer = wp_get_referer();

	if ( empty( $wp_referer ) ) {
		return false;
	}

	// Check if we're requesting a plugin installation or activation from WooCommerce onboarding tasks.

	// User is retrying install from the payment gateway install/setup page.
	if ( str_starts_with( $wp_referer, admin_url( 'admin.php?page=wc-admin&task=payments&id=' ) ) ) {
		return true;
	}

	$permitted_admin_paths = array(
		// Payments onboarding task
		'admin.php?page=wc-admin&task=payments',
		// WooCommerce Payments onboarding task
		'admin.php?page=wc-admin&task=woocommerce-payments',
		// Tax onboarding task
		'admin.php?page=wc-admin&task=tax',
		// WooCommerce Settings -> Payments tab
		'admin.php?page=wc-settings&tab=checkout',
	);

	foreach ( $permitted_admin_paths as $permitted_admin_path ) {
		if ( $wp_referer === admin_url( $permitted_admin_path ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Whether the current request is a REST API request to perform a
 * WooCommerce connection activity.
 *
 * @return bool
 */
function wpcomsh_is_woocommerce_connect_request() {
	$wp_json_prefix = preg_quote( rest_get_url_prefix(), '@' );

	$editable_methods = wpcomsh_get_rest_methods_as_array( \WP_REST_Server::EDITABLE );

	$permitted_connect_api_paths = array(
		'/wc-admin/plugins/connect-jetpack' => \WP_REST_Server::READABLE,
		'/wc-admin/plugins/connect-square'  => $editable_methods,
		'/wc-admin/plugins/connect-wcpay'   => $editable_methods,
	);

	foreach ( $permitted_connect_api_paths as $permitted_connect_api_path => $supported_methods ) {
		if ( wpcomsh_is_wp_rest_request_matching( '@^/' . $wp_json_prefix . $permitted_connect_api_path . '@', $supported_methods ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Helper method to split an HTTP method string from one of the REST constants in {@see \WP_REST_Server}
 *
 * @param string $method The HTTP method(s), generally drawn from constants in \WP_REST_Server.
 * @return string[]
 */
function wpcomsh_get_rest_methods_as_array( $method ) {
	return array_map(
		'trim',
		explode( ',', $method )
	);
}

/**
 * If this site does NOT have the 'options-permalink' feature, remove the Settings > Permalinks submenu item.
 */
function wpcomsh_maybe_remove_permalinks_menu_item() {
	if ( wpcom_site_has_feature( WPCOM_Features::OPTIONS_PERMALINK ) ) {
		return;
	}
	remove_submenu_page( 'options-general.php', 'options-permalink.php' );
}
add_action( 'admin_menu', 'wpcomsh_maybe_remove_permalinks_menu_item' );

/**
 * If this site does NOT have the 'options-permalink' feature, disable the /wp-admin/options-permalink.php page.
 * But always allow proxied users to access the permalink options page.
 */
function wpcomsh_maybe_disable_permalink_page() {
	if ( wpcom_site_has_feature( WPCOM_Features::OPTIONS_PERMALINK ) ) {
		return;
	}
	if ( ! ( defined( 'AT_PROXIED_REQUEST' ) && AT_PROXIED_REQUEST ) ) {
		wp_die(
			esc_html__( 'You do not have permission to access this page.', 'wpcomsh' ),
			'',
			array(
				'back_link' => true,
				'response'  => 403,
			)
		);
	} else {
		add_action(
			'admin_notices',
			function () {
				echo '<div class="notice notice-warning"><p>' . esc_html__( 'Proxied only: You can see this because you are proxied. Do not use this if you don\'t know why you are here.', 'wpcomsh' ) . '</p></div>';
			}
		);
	}
}
add_action( 'load-options-permalink.php', 'wpcomsh_maybe_disable_permalink_page' );

/**
 * Restricts the allowed mime types if the site have does NOT have access to the required feature.
 *
 * @param array $mimes Mime types keyed by the file extension regex corresponding to those types.
 * @return array Allowed mime types.
 */
function wpcomsh_maybe_restrict_mimetypes( $mimes ) {
	$disallowed_mimes = array();
	if ( ! wpcom_site_has_feature( WPCOM_Features::UPGRADED_UPLOAD_FILETYPES ) ) {
		// Copied from WPCOM (see `WPCOM_UPLOAD_FILETYPES_FOR_UPGRADES` in `.config/wpcom-options.php`).
		$upgraded_upload_filetypes = 'mp3 m4a wav ogg zip txt tiff bmp';
		$disallowed_mimes          = array_merge( $disallowed_mimes, explode( ' ', $upgraded_upload_filetypes ) );
	}

	if ( ! wpcom_site_has_feature( WPCOM_Features::VIDEOPRESS ) ) {
		// Copied from WPCOM (see `WPCOM_UPLOAD_FILETYPES_FOR_VIDEOS` in `.config/wpcom-options.php`).
		// The `ttml` extension is set by `wp-content/mu-plugins/videopress/subtitles.php`.
		$video_upload_filetypes = 'ogv mp4 m4v mov wmv avi mpg 3gp 3g2 ttml';
		$disallowed_mimes       = array_merge( $disallowed_mimes, explode( ' ', $video_upload_filetypes ) );
	}

	foreach ( $disallowed_mimes as $disallowed_mime ) {
		foreach ( $mimes as $ext_pattern => $mime ) {
			if ( strpos( $ext_pattern, $disallowed_mime ) !== false ) {
				unset( $mimes[ $ext_pattern ] );
			}
		}
	}

	return $mimes;
}
add_filter( 'upload_mimes', 'wpcomsh_maybe_restrict_mimetypes', PHP_INT_MAX );

/**
 * Redirect plugins.php and plugin-install.php to their Calypso counterparts if this site doesn't have the
 * MANAGE_PLUGINS feature.
 */
function wpcomsh_maybe_redirect_to_calypso_plugin_pages() {
	$request_uri = wp_unslash( $_SERVER['REQUEST_URI'] ); // phpcs:ignore
	// Quick exit if on non-plugin page.
	if ( false === strpos( $request_uri, '/wp-admin/plugin' ) ) {
		return;
	}

	if ( wpcom_site_has_feature( WPCOM_Features::MANAGE_PLUGINS ) ) {
		return;
	}

	if ( ! class_exists( 'Automattic\Jetpack\Status' ) ) {
		return;
	}

	$site = ( new Automattic\Jetpack\Status() )->get_site_suffix();

	// Redirect to calypso when user is trying to install plugin.
	if ( 0 === strpos( $request_uri, '/wp-admin/plugin-install.php' ) ) {
		wp_safe_redirect( 'https://wordpress.com/plugins/' . $site );
		exit;
	}
}
add_action( 'plugins_loaded', 'wpcomsh_maybe_redirect_to_calypso_plugin_pages' );

/**
 * This function manages the feature that allows the user to hide the "WP.com Footer Credit".
 * The footer credit feature lives in a separate platform-agnostic repository, so we rely on filters to manage it.
 * Pressable Footer Credit repository: https://github.com/Automattic/at-pressable-footer-credit
 *
 * @return bool
 */
function wpcomsh_gate_footer_credit_feature() {
	return wpcom_site_has_feature( WPCOM_Features::NO_WPCOM_BRANDING );
}
add_filter( 'wpcom_better_footer_credit_can_customize', 'wpcomsh_gate_footer_credit_feature' );

/**
 * Remove the Jetpack > Dashboard menu if the site doesn't have the required feature.
 */
function wpcomsh_maybe_remove_jetpack_dashboard_menu_item() {
	if ( wpcom_site_has_feature( WPCOM_Features::JETPACK_DASHBOARD ) ) {
		return;
	}

	remove_submenu_page( 'jetpack', 'jetpack#/dashboard' );
}
add_action( 'admin_menu', 'wpcomsh_maybe_remove_jetpack_dashboard_menu_item', 1000 ); // Jetpack uses 998.

/**
 * Remove Jetpack > Manage menu item as part of the wpcom navigation redesign.
 * For more context, see https://github.com/Automattic/dotcom-forge/issues/5824.
 */
function wpcomsh_remove_jetpack_manage_menu_item() {
	if ( ! class_exists( 'Jetpack' ) || ! class_exists( 'Jetpack_Options' ) || get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return;
	}
	$blog_id = Jetpack_Options::get_option( 'id' );
	remove_submenu_page( 'jetpack', 'https://jetpack.com/redirect/?source=cloud-manage-dashboard-wp-menu&#038;site=' . $blog_id );
}

add_action( 'admin_menu', 'wpcomsh_remove_jetpack_manage_menu_item', 1001 ); // Automattic\Jetpack\Admin_UI\Admin_Menu uses 1000.

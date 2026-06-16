<?php
/**
 * Limit Global Styles on WP.com to paid plans.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;
use Automattic\Jetpack\Plans;

/**
 * Checks if Global Styles should be limited on the given site.
 *
 * @param  int $blog_id Blog ID.
 * @return bool Whether Global Styles are limited.
 */
function wpcom_should_limit_global_styles( $blog_id = 0 ) {
	/**
	 * Filter to force a limited Global Styles scenario. Useful for unit testing.
	 *
	 * @param bool $force_limit_global_styles Whether Global Styles are forced to be limited.
	 */
	$force_limit_global_styles = apply_filters( 'wpcom_force_limit_global_styles', false );
	if ( $force_limit_global_styles ) {
		return true;
	}

	if ( ! $blog_id ) {
		$blog_id = get_wpcom_blog_id();
	}

	// Do not limit Global Styles on theme demo sites.
	if ( wpcom_has_blog_sticker( 'theme-demo-site', $blog_id ) ) {
		return false;
	}

	// Do not limit Global Styles on Big Sky free trial sites. Those sites will
	// have their own paywall to go through.
	if ( wpcom_has_blog_sticker( 'big-sky-free-trial', $blog_id ) ) {
		return false;
	}

	// Do not limit Global Styles if the site's plan grants the feature.
	if ( wpcom_site_has_feature( WPCOM_Features::GLOBAL_STYLES, $blog_id ) ) {
		return false;
	}

	// Do not limit Global Styles on sites created before we made it a paid feature (2022-12-15),
	// that had already used Global Styles.
	if ( wpcom_premium_global_styles_is_site_exempt( $blog_id ) ) {
		return false;
	}

	// Do not limit Global Styles when live previewing a Premium theme without a Premium plan or higher
	// because the live preview already shows an upgrade notice, and we avoid duplication.
	if ( wpcom_global_styles_is_previewing_premium_theme_without_premium_plan( $blog_id ) ) {
		return false;
	}

	return true;
}

/**
 * Enqueues the WP.com Global Styles scripts and styles for the block editor.
 *
 * @return void
 */
function wpcom_global_styles_enqueue_block_editor_assets() {
	if ( ! wpcom_should_limit_global_styles() ) {
		return;
	}

	$calypso_domain = 'https://wordpress.com';
	if (
		! empty( $_GET['origin'] ) && // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		in_array(
			$_GET['origin'], // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			array(
				'http://calypso.localhost:3000',
				'https://wpcalypso.wordpress.com',
				'https://horizon.wordpress.com',
			),
			true
		)
	) {
		$calypso_domain = sanitize_text_field( wp_unslash( $_GET['origin'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	$site_slug = method_exists( '\WPCOM_Masterbar', 'get_calypso_site_slug' )
		? \WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() )
		: wp_parse_url( home_url( '/' ), PHP_URL_HOST );

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-global-styles-editor/wpcom-global-styles-editor.asset.php';

	wp_enqueue_script(
		'wpcom-global-styles-editor',
		plugins_url( 'build/wpcom-global-styles-editor/wpcom-global-styles-editor.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-global-styles-editor/wpcom-global-styles-editor.js' ),
		true
	);
	wp_set_script_translations( 'wpcom-global-styles-editor', 'jetpack-mu-wpcom' );

	Common\wpcom_enqueue_tracking_scripts( 'wpcom-global-styles-editor' );

	$learn_more_about_styles_support_url = 'https://wordpress.com/support/using-styles/#access-to-styles';
	$learn_more_about_styles_post_id     = 192200;
	if ( class_exists( 'WPCom_Languages' ) ) {
		$learn_more_about_styles_post_id = WPCom_Languages::localize_url( $learn_more_about_styles_post_id );
	}

	$plan_slug   = wpcom_get_global_styles_upsell_plan_slug();
	$plan_name   = Plans::get_plan_short_name( $plan_slug );
	$upgrade_url = "$calypso_domain/plans/$site_slug?plan=$plan_slug&feature=style-customization";

	wp_localize_script(
		'wpcom-global-styles-editor',
		'wpcomGlobalStyles',
		array(
			'upgradeUrl'                 => $upgrade_url,
			'wpcomBlogId'                => get_wpcom_blog_id(),
			'planName'                   => $plan_name,
			'learnMoreAboutStylesUrl'    => $learn_more_about_styles_support_url,
			'learnMoreAboutStylesPostId' => $learn_more_about_styles_post_id,
			'hasCustomDesign'            => wpcom_site_has_feature( WPCOM_Features::CUSTOM_DESIGN ),
		)
	);
	wp_enqueue_style(
		'wpcom-global-styles-editor',
		plugins_url( 'build/wpcom-global-styles-editor/wpcom-global-styles-editor.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-global-styles-editor/wpcom-global-styles-editor.css' )
	);
}
add_action( 'enqueue_block_editor_assets', 'wpcom_global_styles_enqueue_block_editor_assets' );

/**
 * Enqueues the WP.com Global Styles scripts and styles for the front end.
 *
 * @return void
 */
function wpcom_global_styles_enqueue_assets() {
	if ( ! wpcom_should_show_global_styles_admin_bar() ) {
		return;
	}

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-global-styles-frontend/wpcom-global-styles-frontend.asset.php';
	wp_enqueue_script(
		'wpcom-global-styles-frontend',
		plugins_url( 'build/wpcom-global-styles-frontend/wpcom-global-styles-frontend.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-global-styles-frontend/wpcom-global-styles-frontend.js' ),
		true
	);
	wp_add_inline_script(
		'wpcom-global-styles-frontend',
		'const launchBarUserData = ' . wp_json_encode(
			array(
				'blogId' => get_wpcom_blog_id(),
			),
			JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
		),
		'before'
	);
	Common\wpcom_enqueue_tracking_scripts( 'wpcom-global-styles-frontend' );

	wp_enqueue_style(
		'wpcom-global-styles-frontend',
		plugins_url( 'build/wpcom-global-styles-frontend/wpcom-global-styles-frontend.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-global-styles-frontend/wpcom-global-styles-frontend.css' )
	);
}
add_action( 'wp_enqueue_scripts', 'wpcom_global_styles_enqueue_assets' );

/**
 * Removes the user styles from a site with limited global styles.
 *
 * @param WP_Theme_JSON_Data $theme_json Class to access and update the underlying data.
 * @return WP_Theme_JSON_Data Filtered data.
 */
function wpcom_block_global_styles_frontend( $theme_json ) {
	if ( ! wpcom_should_limit_global_styles() || wpcom_is_previewing_global_styles() ) {
		return $theme_json;
	}

	$limited_theme_json = array();

	$theme_json_data = $theme_json->get_data();

	/**
	 * If the site has Custom Design paid addon, we only want to return the CSS part of the styles.
	 */
	if ( isset( $theme_json_data['styles']['css'] ) && wpcom_site_has_feature( WPCOM_Features::CUSTOM_DESIGN ) ) {
		$limited_theme_json['styles']['css'] = $theme_json_data['styles']['css'];
		$limited_theme_json['version']       = $theme_json_data['version'] ?? WP_Theme_JSON::LATEST_SCHEMA;
	}

	if ( class_exists( 'WP_Theme_JSON_Data' ) ) {
		return new WP_Theme_JSON_Data( $limited_theme_json, 'custom' );
	}

	/*
	 * If `WP_Theme_JSON_Data` is missing, then the site is running an old
	 * version of WordPress we cannot block the user styles properly.
	 */
	return $theme_json;
}
add_filter( 'wp_theme_json_data_user', 'wpcom_block_global_styles_frontend' );

/**
 * Tracks when global styles are updated or reset after the post has actually been saved.
 *
 * @param int     $blog_id Blog ID.
 * @param WP_Post $post    Post data.
 * @param bool    $updated This value is true if the post existed and was updated.
 */
function wpcom_track_global_styles( $blog_id, $post, $updated ) {
	// If the post isn't updated then we know the gs cpt is being created.
	$event_name = 'wpcom_core_global_styles_create';

	// These properties are for debugging purposes and should be eventually edited or removed.
	$event_props = array(
		'should_limit' => (bool) wpcom_should_limit_global_styles(),
		'is_simple'    => ! function_exists( 'wpcomsh_record_tracks_event' ),
		'theme'        => get_stylesheet(),
	);

	if ( $updated ) {
		// This is a fragile way of checking if the global styles cpt is being reset, we might need to update this condition in the future.
		$global_style_keys      = array_keys( json_decode( $post->post_content, true ) ?? array() );
		$is_empty_global_styles = count( array_diff( $global_style_keys, array( 'version', 'isGlobalStylesUserThemeJSON' ) ) ) === 0;

		// By default, we know that we are at least updating.
		$event_name = 'wpcom_core_global_styles_customize';

		// If we are updating to empty contents then we know for sure we are resetting the contents.
		if ( $is_empty_global_styles ) {
			$event_name = 'wpcom_core_global_styles_reset';
		}
	}

	// Invoke the correct function based on the underlying infrastructure.
	if ( function_exists( 'wpcomsh_record_tracks_event' ) ) {
		wpcomsh_record_tracks_event( $event_name, $event_props );
	} elseif ( function_exists( 'require_lib' ) && function_exists( 'tracks_record_event' ) ) {
		require_lib( 'tracks/client' );
		tracks_record_event( get_current_user_id(), $event_name, $event_props );
	}

	// Delegate logging to the underlying infrastructure.
	do_action( 'global_styles_log', $event_name );
}
add_action( 'save_post_wp_global_styles', 'wpcom_track_global_styles', 10, 3 );

/**
 * Check if a `wp_global_styles` post contains custom Global Styles.
 *
 * @param array $wp_global_styles_post The `wp_global_styles` post.
 * @return bool Whether the post contains custom Global Styles.
 */
function wpcom_global_styles_in_use_by_wp_global_styles_post( array $wp_global_styles_post = array() ) {
	if ( ! isset( $wp_global_styles_post['post_content'] ) ) {
		return false;
	}

	$global_styles_content = json_decode( $wp_global_styles_post['post_content'], true ) ?? array();

	// Some keys are ignored because they are not relevant to a custom style
	// behaviours are not relevant if blank - as they where when included during GB16.4 and later removed.
	$ignored_keys = array( 'version', 'isGlobalStylesUserThemeJSON' );

	if ( wpcom_site_has_feature( WPCOM_Features::CUSTOM_DESIGN ) ) {
		unset( $global_styles_content['styles']['css'] );
	}

	$theme_base_css = WP_Theme_JSON_Resolver::get_theme_data()->get_stylesheet( array( 'custom-css' ) ) ?? '';

	$theme_base_css = preg_replace( '/\s+/', '', $theme_base_css );
	$custom_css     = preg_replace( '/\s+/', '', $global_styles_content['styles']['css'] ?? '' );

	if ( $theme_base_css === $custom_css || empty( $global_styles_content['styles']['css'] ) ) {
		unset( $global_styles_content['styles']['css'] );
	}

	if ( empty( $global_styles_content['styles'] ) ) {
		unset( $global_styles_content['styles'] );
	}

	if ( isset( $global_styles_content['behaviors'] ) && empty( $global_styles_content['behaviors'] ) ) {
		$ignored_keys[] = 'behaviors';
	}

	$global_style_keys    = array_keys( $global_styles_content );
	$global_styles_in_use = count( array_diff( $global_style_keys, $ignored_keys ) ) > 0;

	return $global_styles_in_use;
}

/**
 * Checks if the current user can edit the `wp_global_styles` post type.
 *
 * @param int $blog_id Blog ID.
 * @return bool Whether the current user can edit the `wp_global_styles` post type.
 */
function wpcom_simple_sites_global_styles_current_user_can_edit_wp_global_styles( $blog_id ) {
	switch_to_blog( $blog_id );
	$wp_global_styles_cpt = get_post_type_object( 'wp_global_styles' );
	restore_current_blog();
	return current_user_can( $wp_global_styles_cpt->cap->publish_posts );
}

/**
 * Checks if the current blog has custom styles in use.
 *
 * @return bool Returns true if custom styles are in use.
 */
function wpcom_global_styles_in_use() {
	/*
	 * If `WP_Theme_JSON_Resolver` is missing, then the site is running an old version
	 * of WordPress, so we cannot determine whether the site has custom styles.
	 */
	if ( ! class_exists( 'WP_Theme_JSON_Resolver' ) ) {
		return false;
	}

	$user_cpt = WP_Theme_JSON_Resolver::get_user_data_from_wp_global_styles( wp_get_theme() );

	$global_styles_in_use = wpcom_global_styles_in_use_by_wp_global_styles_post( $user_cpt );

	if ( $global_styles_in_use ) {
		do_action( 'global_styles_log', 'global_styles_in_use' );
	} else {
		do_action( 'global_styles_log', 'global_styles_not_in_use' );
	}

	return $global_styles_in_use;
}

/**
 * Checks whether the site is exempt from Premium Global Styles because
 * it was created before the Premium Global Styles launch date (2022-12-15)
 * and had already customized its Global Styles.
 *
 * We use blog stickers and other strategies to only perform the intensive check
 * when strictly needed.
 *
 * @param  int $blog_id Blog ID.
 * @return bool Whether the site is exempt from Premium Global Styles.
 */
function wpcom_premium_global_styles_is_site_exempt( $blog_id = 0 ) {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog      = get_blog_details( $blog_id, false );
		$is_simple = is_blog_wpcom( $blog );
		$is_atomic = is_blog_atomic( $blog );
	} elseif ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		$is_simple = false;
		$is_atomic = true;
	} else {
		$is_simple = false;
		$is_atomic = false;
	}

	if ( ! $is_simple && ! $is_atomic ) {
		return false;
	}

	// If the exemption check has already been performed, just return if the site is exempt.
	if ( wpcom_has_blog_sticker( 'wpcom-premium-global-styles-exemption-checked', $blog_id ) ) {
		return wpcom_has_blog_sticker( 'wpcom-premium-global-styles-exempt', $blog_id );
	}

	// Simple sites created after we made GS a paid feature (2022-12-15) are never exempt.
	if ( $is_simple && $blog_id >= 213403000 ) {
		return false;
	}

	// Atomic sites created before we started limiting GS on Summer Special sites (2025-10-11) are always exempt.
	if ( $is_atomic && $blog_id <= 249177000 ) {
		return true;
	}

	/**
	 * It's important to have this condition after the 'wpcom-premium-global-styles-exemption-checked' blog sticker is checked!
	 *
	 * Atomic sites do not have site exemptions because previously all Atomic sites were on Business/eCommerce.
	 * Also, the summer special applies only to new sites.
	 *
	 * If plugins will be available on all SITES, not just new sites, this might not be true.
	 * However, this shouldn't be a problem because the site should already have the sticker already applied on their site from the time they were on simple.
	 */
	if ( ! $is_simple ) {
		return false;
	}

	// If the current user cannot modify the `wp_global_styles` CPT, the exemption check is not needed;
	// other conditions will determine whether they can use GS.
	if ( ! wpcom_simple_sites_global_styles_current_user_can_edit_wp_global_styles( $blog_id ) ) {
		return false;
	}

	switch_to_blog( $blog_id );

	$note = 'Automated sticker. See https://wp.me/p7DVsv-fY6#comment-44778';
	$user = 'a8c'; // A non-empty string avoids storing the current user as author of the sticker change.

	add_blog_sticker( 'wpcom-premium-global-styles-exemption-checked', $note, $user, $blog_id );

	$global_styles_used = false;

	$wp_global_styles_posts = get_posts(
		array(
			'post_type'   => 'wp_global_styles',
			'numberposts' => 100,
		)
	);
	foreach ( $wp_global_styles_posts as $wp_global_styles_post ) {
		if ( wpcom_global_styles_in_use_by_wp_global_styles_post( $wp_global_styles_post->to_array() ) ) {
			$global_styles_used = true;
			break;
		}
	}

	if ( $global_styles_used ) {
		add_blog_sticker( 'wpcom-premium-global-styles-exempt', $note, $user, $blog_id );
	}

	restore_current_blog();

	return $global_styles_used;
}

/**
 * Returns whether the global style notice should be shown or not in the admin bar.
 *
 * @return bool Whether the global styles notice should be rendered.
 */
function wpcom_should_show_global_styles_admin_bar() {
	static $should_show_global_styles_admin_bar = null;
	if ( $should_show_global_styles_admin_bar !== null ) {
		return $should_show_global_styles_admin_bar;
	}

	// Only show notice in the frontend.
	if ( is_admin() ) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	$current_user_id = get_current_user_id();

	if ( ! $current_user_id ) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	$current_blog_id = get_wpcom_blog_id();

	if ( ! (
		is_user_member_of_blog( $current_user_id, $current_blog_id ) &&
		current_user_can( 'manage_options' )
	) ) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	if ( wpcom_has_blog_sticker( 'difm-lite-in-progress', $current_blog_id ) ) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	// The site is being previewed in Calypso or Gutenberg.
	if (
		isset( $_GET['iframe'] ) && 'true' === $_GET['iframe'] && ( // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not a form action
			( isset( $_GET['theme_preview'] ) && 'true' === $_GET['theme_preview'] ) || // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not a form action
			( isset( $_GET['preview'] ) && 'true' === $_GET['preview'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not a form action
		) ||
		isset( $_GET['widgetPreview'] ) || // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not a form action (Gutenberg < 9.2)
		isset( $_GET['widget-preview'] ) || // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not a form action (Gutenberg >= 9.2)
		( isset( $_GET['hide_banners'] ) && $_GET['hide_banners'] === 'true' )  // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Not a form action
	) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	// Do not show the notice when previewed in the customizer
	if ( is_customize_preview() ) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	// No banner for agency-managed sites.
	if ( ! empty( get_option( 'is_fully_managed_agency_site' ) ) ) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	if ( ! wpcom_should_limit_global_styles() || ! wpcom_global_styles_in_use() ) {
		$should_show_global_styles_admin_bar = false;
		return $should_show_global_styles_admin_bar;
	}

	$should_show_global_styles_admin_bar = true;
	return $should_show_global_styles_admin_bar;
}
/**
 * Renders the global style notice in the admin bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object.
 */
function wpcom_display_global_styles_notice_admin_bar( $wp_admin_bar ) {
	if ( ! wpcom_should_show_global_styles_admin_bar() ) {
		return;
	}

	if ( method_exists( '\WPCOM_Masterbar', 'get_calypso_site_slug' ) ) {
		$site_slug = WPCOM_Masterbar::get_calypso_site_slug( get_current_blog_id() );
	} else {
		$home_url  = home_url( '/' );
		$site_slug = wp_parse_url( $home_url, PHP_URL_HOST );
	}

	$gs_upgrade_plan = wpcom_get_global_styles_upsell_plan_slug();
	$upgrade_url     = "https://wordpress.com/plans/$site_slug?plan=$gs_upgrade_plan&feature=style-customization";

	$support_url = function_exists( 'localized_wpcom_url' )
		? localized_wpcom_url( 'https://wordpress.com/support/using-styles/' )
		: 'https://wordpress.com/support/using-styles/';

	$message = sprintf(
		/* translators: %1$s - documentation URL, %2$s - the name of the required plan */
		__(
			'Your site includes <a href="%1$s" target="_blank">premium styles</a> that are only visible to visitors after upgrading to the %2$s plan or higher.',
			'jetpack-mu-wpcom'
		),
		$support_url,
		Plans::get_plan_short_name( $gs_upgrade_plan )
	);

	if ( wpcom_is_previewing_global_styles() ) {
		$preview_url = add_query_arg( 'hide-global-styles', '' );
	} else {
		$preview_url = remove_query_arg( 'hide-global-styles' );
	}

	$wp_admin_bar->add_node(
		array(
			'id'    => 'wpcom-global-styles',
			'title' => __( 'Upgrade required', 'jetpack-mu-wpcom' ),
			'href'  => $upgrade_url,
		)
	);

	$wp_admin_bar->add_node(
		array(
			'parent' => 'wpcom-global-styles',
			'id'     => 'wpcom-global-styles-description',
			'title'  =>
				'<button class="wpcom-global-styles-close">
					<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path d="m249 849-42-42 231-231-231-231 42-42 231 231 231-231 42 42-231 231 231 231-42 42-231-231-231 231Z"/></svg>
				</button>' .
				wp_kses(
					$message,
					array(
						'a' => array(
							'href'   => array(),
							'target' => array(),
						),
					)
				),
		)
	);

	$wp_admin_bar->add_node(
		array(
			'parent' => 'wpcom-global-styles',
			'id'     => 'wpcom-global-styles-upgrade',
			'title'  => esc_html__( 'Upgrade now', 'jetpack-mu-wpcom' ),
			'href'   => $upgrade_url,
		)
	);

	$wp_admin_bar->add_node(
		array(
			'parent' => 'wpcom-global-styles',
			'id'     => 'wpcom-global-styles-reset',
			'title'  => esc_html__( 'Remove premium styles', 'jetpack-mu-wpcom' ),
			'href'   => admin_url( 'site-editor.php?p=/styles' ),
		)
	);

	$wp_admin_bar->add_group(
		array(
			'parent' => 'wpcom-global-styles',
			'id'     => 'wpcom-global-styles-preview',
			'meta'   => array(
				'class' => 'ab-sub-secondary',
			),
		)
	);
	$wp_admin_bar->add_node(
		array(
			'parent' => 'wpcom-global-styles-preview',
			'id'     => 'wpcom-global-styles-preview-button',
			'title'  => '<label><input type="checkbox" ' . ( wpcom_is_previewing_global_styles() ? 'checked' : '' ) . '><span></span></label>' . esc_html__( 'Preview premium styles', 'jetpack-mu-wpcom' ),
			'href'   => $preview_url,
		)
	);
}
add_action( 'admin_bar_menu', 'wpcom_display_global_styles_notice_admin_bar', 499 ); // Before "Launch site".

/**
 * Include the Rest API that returns the global style information for a give WordPress site.
 */
require_once __DIR__ . '/api/class-global-styles-status-rest-api.php';

/**
 * Checks if the necessary conditions are met in order to establish that the supplied user should be considered as previewing Global Styles.
 *
 * @param int|null $user_id User id to check.
 *
 * @return bool
 */
function wpcom_is_previewing_global_styles( ?int $user_id = null ) {
	if ( null === $user_id ) {
		$user_id = get_current_user_id();
	}

	if ( 0 === $user_id ) {
		return false;
	}

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	return ! isset( $_GET['hide-global-styles'] ) && user_can( $user_id, 'manage_options' );
}

/**
 * Checks whether the site has access to the Global Styles feature when the editor is live previewing a Premium theme without a Premium plan or higher.
 *
 * @param int $blog_id The WPCOM blog ID.
 * @return bool Whether the site has access to Global Styles when live previewing.
 */
function wpcom_global_styles_is_previewing_premium_theme_without_premium_plan( $blog_id ) {
	if ( ! isset( $_GET['wp_theme_preview'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		// Not live previewing.
		return false;
	}
	$wp_theme_preview = sanitize_text_field( wp_unslash( $_GET['wp_theme_preview'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	$is_previewing_premium_theme = str_starts_with( $wp_theme_preview, 'premium/' );
	if ( ! $is_previewing_premium_theme ) {
		// Not a premium theme.
		return false;
	}

	// Check for a Premium plan or higher by checking if can use global styles.
	$has_premium_plan_or_higher = wpcom_site_has_feature( WPCOM_Features::GLOBAL_STYLES, $blog_id );

	return ! $has_premium_plan_or_higher;
}

/**
 * We return the upsell plan required for the current Global Styles plan requirement.
 *
 * @return string
 */
function wpcom_get_global_styles_upsell_plan_slug() {
	return 'personal-bundle';
}

add_filter( 'wpcom_customize_css_plan_slug', 'wpcom_get_global_styles_upsell_plan_slug' );

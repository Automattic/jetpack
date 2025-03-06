<?php
/**
 * Replaces the 'Site Visibility' privacy options selector with a Calypso link.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Client;

/**
 * Load dependencies.
 */
require_once __DIR__ . '/../../utils.php';

/**
 * Whether the current site is connected to Jetpack.
 *
 * @return bool
 */
function is_jetpack_connected() {
	// @phan-suppress-next-line PhanUndeclaredClassMethod
	return class_exists( 'Jetpack' ) && Jetpack::is_connection_ready();
}

/**
 * Generate the links for sharing the site.
 */
function wp_ajax_wpcom_generate_site_preview_link() {
	check_ajax_referer( 'wpcom_site_visibility_site_preview_link' );

	$blog_id = get_wpcom_blog_id();
	$body    = Client::wpcom_json_api_request_as_user(
		"/sites/$blog_id/preview-links",
		'2',
		array(
			'method' => 'POST',
		)
	);

	if ( is_wp_error( $body ) ) {
		wp_send_json_error( $body );
		return;
	}

	$response = json_decode( wp_remote_retrieve_body( $body ) );
	if ( ! is_array( $response ) ) {
		echo wp_json_encode( $response );
		die( 0 );
	}
	echo wp_json_encode( $response[0] );
	die( 0 );
}
add_action( 'wp_ajax_wpcom_generate_site_preview_link', 'wp_ajax_wpcom_generate_site_preview_link' );

/**
 * Delete the links for sharing the site.
 */
function wp_ajax_wpcom_delete_site_preview_link() {
	check_ajax_referer( 'wpcom_site_visibility_site_preview_link' );

	if ( ! isset( $_POST['code'] ) ) {
		wp_send_json_error(
			array(
				'error' => 'Missing code',
			)
		);
		return;
	}

	$code    = sanitize_text_field( wp_unslash( $_POST['code'] ) );
	$blog_id = get_wpcom_blog_id();
	$body    = Client::wpcom_json_api_request_as_user(
		"/sites/$blog_id/preview-links/$code",
		'2',
		array(
			'method' => 'DELETE',
		)
	);

	if ( is_wp_error( $body ) ) {
		return $body;
	}

	$response = json_decode( wp_remote_retrieve_body( $body ) );
	return rest_ensure_response( $response );
}
add_action( 'wp_ajax_wpcom_delete_site_preview_link', 'wp_ajax_wpcom_delete_site_preview_link' );

/**
 * Get the links for sharing the site.
 */
function wpcom_get_site_preview_link() {
	$blog_id = get_wpcom_blog_id();
	$body    = Client::wpcom_json_api_request_as_user(
		"/sites/$blog_id/preview-links"
	);

	if ( is_wp_error( $body ) ) {
		return $body;
	}

	$response = json_decode( wp_remote_retrieve_body( $body ) );
	if ( ! is_array( $response ) ) {
		return $response;
	}
	return $response[0];
}

/**
 * Load assets
 */
function replace_site_visibility_load_assets() {
	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-replace-site-visibility', array( 'js', 'css' ) );

	$jetpack_status = new Automattic\Jetpack\Status();

	$data = wp_json_encode(
		array(
			'homeUrl'                => home_url( '/' ),
			'siteId'                 => get_wpcom_blog_id(),
			'siteSlug'               => $jetpack_status->get_site_suffix(),
			'isWpcomStagingSite'     => (bool) get_option( 'wpcom_is_staging_site' ),
			'isUnlaunchedSite'       => get_option( 'launch-status' ) === 'unlaunched',
			'hasSitePreviewLink'     => function_exists( 'wpcom_site_has_feature' ) && wpcom_site_has_feature( \WPCOM_Features::SITE_PREVIEW_LINKS ),
			'sitePreviewLink'        => wpcom_get_site_preview_link(),
			'sitePreviewLinkNonce'   => wp_create_nonce( 'wpcom_site_visibility_site_preview_link' ),
			'blogPublic'             => get_option( 'blog_public' ),
			'wpcomComingSoon'        => get_option( 'wpcom_coming_soon' ),
			'wpcomPublicComingSoon'  => get_option( 'wpcom_public_coming_soon' ),
			'wpcomDataSharingOptOut' => (bool) get_option( 'wpcom_data_sharing_opt_out' ),
		)
	);

	wp_add_inline_script(
		$handle,
		"var JETPACK_MU_WPCOM_SITE_VISIBILITY = $data;",
		'before'
	);
}

/**
 * Replaces the 'Site Visibility' privacy options selector with a Calypso link.
 */
function replace_site_visibility() {
	// We are not either in Simple or Atomic.
	if ( ! class_exists( 'Automattic\Jetpack\Status' ) ) {
		return;
	}

	$jetpack_status = new Automattic\Jetpack\Status();

	if ( ! is_jetpack_connected() && $jetpack_status->is_private_site() ) {
		$settings_url    = esc_url_raw( sprintf( '/wp-admin/admin.php?page=jetpack' ) );
		$manage_label    = __( 'Jetpack is disconnected & site is private. Reconnect Jetpack to manage site visibility settings.', 'jetpack-mu-wpcom' );
		$escaped_content = '<a href="' . esc_url( $settings_url ) . '">' . esc_html( $manage_label ) . '</a>';
	} elseif ( ! is_jetpack_connected() ) {
		return;
	} else {
		$escaped_content = <<<HTML
<fieldset id="wpcom-site-visibility">
	<img src="images/loading.gif" alt="Loading..." width="16" height="16">
</fieldset>
HTML;

		replace_site_visibility_load_assets();
	}

	?>
<noscript>
<p><?php echo wp_json_encode( $escaped_content, JSON_HEX_TAG | JSON_HEX_AMP ); ?></p>
</noscript>
<script>
( function() {
	var widgetArea = document.querySelector( '.option-site-visibility td' );
	if ( ! widgetArea ) {
		return;
	}
	widgetArea.innerHTML = <?php echo wp_json_encode( $escaped_content, JSON_HEX_TAG | JSON_HEX_AMP ); ?>;
} )()
</script>
		<?php
}
add_action( 'blog_privacy_selector', 'replace_site_visibility' );

/**
 * Allow the options of the 'Site Visibility' settings.
 *
 * @param array $allowed_options The allowed options list.
 */
function allowed_options_wpcom_site_visibility( $allowed_options ) {
	$wpcom_site_visibility_options = array(
		'reading' => array(
			'wpcom_coming_soon',
			'wpcom_public_coming_soon',
			'wpcom_data_sharing_opt_out',
		),
	);

	return add_allowed_options( $wpcom_site_visibility_options, $allowed_options );
}
add_filter( 'allowed_options', 'allowed_options_wpcom_site_visibility' );

add_filter( 'wpcom_should_update_privacy_selector', '__return_false' );

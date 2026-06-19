<?php
/**
 * Mailchimp Block.
 *
 * @since 7.1.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Mailchimp;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\External_Connections;
use Automattic\Jetpack\Status\Host;
use Jetpack;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if (
		( defined( 'IS_WPCOM' ) && IS_WPCOM )
		|| Jetpack::is_connection_ready()
	) {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => __NAMESPACE__ . '\load_assets',
			)
		);

		register_admin_settings();
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Mailchimp block registration/dependency declaration.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array  $attr - Array containing the Mailchimp block attributes.
 * @param string $content - Mailchimp block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	require_once __DIR__ . '/render.php';
	return load_assets_implementation( $attr, $content );
}

/**
 * Registers the settings to manage the Mailchimp connection.
 */
function register_admin_settings() {
	Assets::register_script(
		'jetpack-mailchimp-admin-extra-settings',
		Jetpack_Gutenberg::get_blocks_directory() . '/mailchimp/admin.js',
		JETPACK__PLUGIN_FILE,
		array(
			'textdomain' => 'jetpack',
		)
	);

	External_Connections::add_settings_for_service(
		'writing',
		array(
			'service'      => 'mailchimp',
			'title'        => __( 'Mailchimp', 'jetpack' ),
			'signup_link'  => 'https://public-api.wordpress.com/rest/v1.1/sharing/mailchimp/signup',
			'description'  => __( 'Allow users to sign up to your Mailchimp mailing list.', 'jetpack' ),
			'script'       => 'jetpack-mailchimp-admin-extra-settings',
			'support_link' => array(
				'wpcom'   => 'https://wordpress.com/support/wordpress-editor/blocks/mailchimp-block/',
				'jetpack' => 'mailchimp-block',
			),
		)
	);

	add_action( 'load-options.php', __NAMESPACE__ . '\update_settings' );
}

/**
 * Update the site options that are related to Mailchimp.
 */
function update_settings() {
	$action      = ! empty( $_REQUEST['action'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['action'] ) ) : '';
	$option_page = ! empty( $_REQUEST['option_page'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['option_page'] ) ) : '';
	$audience    = ! empty( $_REQUEST['jetpack-mailchimp-audience'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['jetpack-mailchimp-audience'] ) ) : '';
	if ( $action !== 'update' || $option_page !== 'writing' || ! current_user_can( 'manage_options' ) || $audience === '' ) {
		return;
	}

	check_admin_referer( 'writing-options' );

	$site_id = Connection_Manager::get_site_id();
	if ( is_wp_error( $site_id ) ) {
		return;
	}

	if ( $audience === 'none' ) {
		$data = array(
			'follower_list_id' => '0',
			'keyring_id'       => '0',
		);
	} else {
		$connection = External_Connections::get_connection( 'mailchimp' );
		if ( empty( $connection ) ) {
			return;
		}
		$data = array(
			'follower_list_id' => $audience,
			'keyring_id'       => $connection['ID'],
		);
	}

	if ( ( new Host() )->is_wpcom_simple() ) {
		require_lib( 'mailchimp' );
		$response = \MailchimpApi::save_settings( $site_id, $data );
	} else {
		$response = Client::wpcom_json_api_request_as_user(
			sprintf( '/sites/%d/mailchimp/settings', $site_id ),
			'1.1',
			array( 'method' => 'POST' ),
			$data,
			'rest'
		);
	}
	if ( is_wp_error( $response ) ) {
		add_settings_error( 'general', 'settings_updated', __( 'Settings save failed.', 'jetpack' ), 'error' );
	}
}

<?php
/**
 * WordPress.com sidebar notice
 *
 * Adds WordPress.com upsell notice to WordPress sidebar.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
	return;
}

/**
 * Enqueue assets needed by the WordPress.com sidebar notice.
 */
function wpcom_enqueue_sidebar_notice_assets() {
	wp_enqueue_script(
		'wpcom-sidebar-notice',
		plugins_url( 'wpcom-sidebar-notice.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);

	wp_enqueue_style(
		'wpcom-sidebar-notice',
		plugins_url( 'build/wpcom-sidebar-notice/wpcom-sidebar-notice.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);

	$notice = wpcom_get_sidebar_notice();
	if ( $notice ) {
		$link = $notice['link'];
		if ( str_starts_with( $link, '/' ) ) {
			$link = 'https://wordpress.com' . $link;
		}

		$user_id    = null;
		$user_login = null;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			global $current_user;
			$user_id    = $current_user->ID;
			$user_login = $current_user->user_login;
		} else {
			$connection_manager = new Connection_Manager();
			$wpcom_user_data    = $connection_manager->get_connected_user_data();
			if ( $wpcom_user_data ) {
				$user_id    = $wpcom_user_data['ID'];
				$user_login = $wpcom_user_data['login'];
			}
		}

		$data = array(
			'url'          => esc_url( $link ),
			'text'         => wp_kses( $notice['content'], array() ),
			'action'       => wp_kses( $notice['cta'], array() ),
			'dismissible'  => $notice['dismissible'],
			'dismissLabel' => esc_html__( 'Dismiss', 'jetpack-mu-wpcom' ),
			'id'           => $notice['id'],
			'featureClass' => $notice['feature_class'],
			'dismissNonce' => wp_create_nonce( 'wpcom_dismiss_sidebar_notice' ),
			'tracks'       => $notice['tracks'],
			'user'         => array(
				'ID'       => $user_id,
				'username' => $user_login,
			),
		);

		wp_add_inline_script(
			'wpcom-sidebar-notice',
			'window.wpcomSidebarNotice = ' . wp_json_encode( $data ) . ';'
		);
	}
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_sidebar_notice_assets' );

/**
 * Returns the first available sidebar notice.
 *
 * @return array | null
 */
function wpcom_get_sidebar_notice() {
	if ( is_agency_managed_site() ) {
		return null;
	}
	$message_path = 'calypso:sites:sidebar_notice';

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_lib( 'jetpack-jitm/jitm-engine' );
		$jitm_engine = new \JITM\Engine();

		$current_user = wp_get_current_user();
		$user_id      = $current_user->ID;
		$user_roles   = implode( ',', $current_user->roles );
		$query_string = array( 'message_path' => $message_path );

		$message = $jitm_engine->get_top_messages( $message_path, $user_id, $user_roles, $query_string );
	} else {
		$jitm    = \Automattic\Jetpack\JITMS\JITM::get_instance();
		$message = $jitm->get_messages( $message_path, wp_json_encode( array( 'message_path' => $message_path ) ), false );
	}

	if ( ! isset( $message[0] ) ) {
		return null;
	}

	// Serialize message as object (on Simple sites we have an array, on Atomic sites we have an object).
	$message = json_decode( wp_json_encode( $message[0] ) );

	return array(
		'content'       => $message->content->message,
		'cta'           => $message->CTA->message, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		'link'          => $message->CTA->link, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		'dismissible'   => $message->is_dismissible,
		'feature_class' => $message->feature_class,
		'id'            => $message->id,
		'tracks'        => $message->tracks ?? null,
	);
}

/**
 * Handle AJAX requests to dismiss a sidebar notice.
 */
function wpcom_dismiss_sidebar_notice() {
	check_ajax_referer( 'wpcom_dismiss_sidebar_notice' );
	if ( isset( $_REQUEST['id'] ) && isset( $_REQUEST['feature_class'] ) ) {
		$id            = sanitize_text_field( wp_unslash( $_REQUEST['id'] ) );
		$feature_class = sanitize_text_field( wp_unslash( $_REQUEST['feature_class'] ) );
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			require_lib( 'jetpack-jitm/jitm-engine' );
			\JITM\Engine::dismiss( $id, $feature_class );
		} else {
			$jitm = \Automattic\Jetpack\JITMS\JITM::get_instance();
			$jitm->dismiss( $id, $feature_class );
		}
	}
	wp_die();
}
add_action( 'wp_ajax_wpcom_dismiss_sidebar_notice', 'wpcom_dismiss_sidebar_notice' );

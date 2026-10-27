<?php
/**
 * WordPress.com admin notice
 *
 * Shows the top JITM for the admin notice message path as a notice on every wp-admin screen.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

const WPCOM_ADMIN_NOTICE_MESSAGE_PATH = 'calypso:sites:admin_notice';

/**
 * Returns the top JITM for the admin notice message path.
 *
 * @return object|null
 */
function wpcom_get_admin_notice() {
	$message_path = WPCOM_ADMIN_NOTICE_MESSAGE_PATH;

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_lib( 'jetpack-jitm/jitm-engine' );
		$current_user = wp_get_current_user();
		$messages     = ( new \JITM\Engine() )->get_top_messages(
			$message_path,
			$current_user->ID,
			implode( ',', $current_user->roles ),
			array( 'message_path' => $message_path )
		);
	} else {
		$messages = \Automattic\Jetpack\JITMS\JITM::get_instance()->get_messages( $message_path, array( 'message_path' => $message_path ), false );
	}

	if ( empty( $messages ) || ! is_array( $messages ) ) {
		return null;
	}

	// Atomic drops dismissed messages without reindexing, and Simple returns arrays rather than objects.
	return json_decode( wp_json_encode( reset( $messages ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) );
}

/**
 * Prints the admin notice and enqueues the script that tracks and dismisses it.
 */
function wpcom_add_admin_notice() {
	// The block and site editors hide admin notices.
	$screen = get_current_screen();
	if ( $screen && $screen->is_block_editor() ) {
		return;
	}

	/** This filter is documented in projects/packages/jitm/src/class-jitm.php */
	if ( ! apply_filters( 'jetpack_just_in_time_msgs', true ) ) {
		return;
	}

	$notice = wpcom_get_admin_notice();
	if ( ! $notice || empty( $notice->content->message ) ) {
		return;
	}

	$message = '<p>' . wp_kses( $notice->content->message, array() ) . '</p>';
	$cta     = $notice->CTA ?? null; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	if ( ! empty( $cta->message ) && ! empty( $cta->link ) ) {
		$link     = str_starts_with( $cta->link, '/' ) ? 'https://wordpress.com' . $cta->link : $cta->link;
		$message .= '<p><a href="' . esc_url( $link ) . '" class="button">' . wp_kses( $cta->message, array() ) . '</a></p>';
	}

	wp_admin_notice(
		$message,
		array(
			'id'             => 'wpcom-admin-notice',
			'type'           => 'info',
			'dismissible'    => ! empty( $notice->is_dismissible ),
			'paragraph_wrap' => false,
		)
	);

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$current_user = wp_get_current_user();
		$user         = array(
			'ID'       => $current_user->ID,
			'username' => $current_user->user_login,
		);
	} else {
		$wpcom_user_data = ( new Connection_Manager() )->get_connected_user_data();
		$user            = array(
			'ID'       => $wpcom_user_data['ID'] ?? null,
			'username' => $wpcom_user_data['login'] ?? null,
		);
		// Simple sites load the Tracks script on every admin page; Atomic sites don't.
		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
	}

	$data   = array(
		'id'           => $notice->id,
		'featureClass' => $notice->feature_class,
		'dismissNonce' => wp_create_nonce( 'wpcom_dismiss_sidebar_notice' ),
		'tracks'       => $notice->tracks ?? null,
		'user'         => $user,
	);
	$handle = jetpack_mu_wpcom_enqueue_assets( 'wpcom-admin-notice', array( 'js' ) );
	wp_add_inline_script( $handle, 'window.wpcomAdminNotice = ' . wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';', 'before' );
}
add_action( 'admin_notices', 'wpcom_add_admin_notice' );

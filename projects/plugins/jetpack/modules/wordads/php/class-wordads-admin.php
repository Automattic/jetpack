<?php
/**
 * WordAds Admin.
 *
 * @package automattic/jetpack
 */

/**
 * The standard set of admin pages for the user if Jetpack is installed
 */
class WordAds_Admin {

	/**
	 * WordAds_Admin Constructor.
	 *
	 * @since 4.5.0
	 */
	public function __construct() {
		if ( current_user_can( 'manage_options' ) && isset( $_GET['ads_debug'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			WordAds_API::update_wordads_status_from_api();
			add_action( 'admin_notices', array( $this, 'debug_output' ) );
		}
	}

	/**
	 * Output the API connection debug
	 *
	 * @since 4.5.0
	 */
	public function debug_output() {
		global $wordads, $wordads_status_response;
		$response = $wordads_status_response;
		if ( empty( $response ) ) {
			$response = 'No response from API :(';
		} else {
			$response = print_r( $response, 1 ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_print_r
		}

		$status = $wordads->option( 'wordads_approved' ) ?
			array(
				'color'    => 'green',
				'approved' => 'Yes',
			) :
			array(
				'color'    => 'red',
				'approved' => 'No',
			);

		$type    = $wordads->option( 'wordads_approved' ) ? 'updated' : 'error';
		$message = sprintf(
			wp_kses(
				/* Translators: %1$s is the status color, %2$s is the status, %3$s is the response */
				__( '<p>Status: <span style="color:%1$s;">%2$s</span></p><pre>%3$s</pre>', 'jetpack' ),
				array(
					'p'    => array(),
					'span' => array(
						'style' => array(),
					),
					'pre'  => array(),
				)
			),
			esc_attr( $status['color'] ),
			esc_html( $status ),
			esc_html( $response )
		);

		wp_admin_notice(
			$message,
			array(
				'type'           => $type,
				'dismissible'    => true,
				'paragraph_wrap' => false,
			)
		);
	}
}

global $wordads_admin;
$wordads_admin = new WordAds_Admin();

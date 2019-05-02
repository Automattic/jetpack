<?php

/**
 * The standard set of admin pages for the user if Jetpack is installed
 */
class WordAds_Admin {

	/**
	 * @since 4.5.0
	 */
	function __construct() {
		global $wordads;

		if ( current_user_can( 'manage_options' ) && isset( $_GET['ads_debug'] ) ) {
			WordAds_API::update_wordads_status_from_api();
			add_action( 'admin_notices', array( $this, 'debug_output' ) );
		}
	}

	/**
	 * Output the API connection debug
	 *
	 * @since 4.5.0
	 */
	function debug_output() {
		global $wordads, $wordads_status_response;
		$response = $wordads_status_response;
		if ( empty( $response ) ) {
			$response = 'No response from API :(';
		} else {
			$response = print_r( $response, 1 );
		}

		$status = $wordads->option( 'wordads_approved' ) ?
			'<span style="color:green;">Yes</span>' :
			'<span style="color:red;">No</span>';

		$type = $wordads->option( 'wordads_approved' ) ? 'updated' : 'error';
		echo <<<HTML
		<div class="notice $type is-dismissible">
			<p>Status: $status</p>
			<pre>$response</pre>
		</div>
HTML;
	}
}

global $wordads_admin;
$wordads_admin = new WordAds_Admin();

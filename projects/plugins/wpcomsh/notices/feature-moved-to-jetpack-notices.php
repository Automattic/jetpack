<?php
/**
 * Handles notices regarding Simple site features that are "moved" to Jetpack after Atomic transfers.
 *
 * @package wpcomsh
 */

/**
 * Displays a dismissible admin notice on 'options-writing.php' informing the user that some settings have moved
 * to Jetpack Settings › Writing, or to My Jetpack › Features once settings consolidation is on.
 */
function wpcom_writing_features_moved_notice() {
	global $pagenow;
	if ( 'options-writing.php' === $pagenow ) {
		$has_dismissed = get_option( 'wpcom_writing_features_notice_dismissed' );
		if ( ! $has_dismissed ) {
			$my_jetpack = 'Automattic\Jetpack\My_Jetpack\Initializer';
			// @phan-suppress-next-line PhanUndeclaredClassReference -- My Jetpack ships with the Jetpack plugin, at a version wpcomsh does not control.
			if ( method_exists( $my_jetpack, 'is_settings_consolidation_enabled' ) && $my_jetpack::is_settings_consolidation_enabled() ) {
				$url = admin_url( 'admin.php?page=my-jetpack#/features' );
				// Translators: %1$s: Start HTML link tag with the URL to My Jetpack's Features page, %2$s: End HTML link tag.
				$message = __( 'Visit %1$sMy Jetpack › Features%2$s for more writing settings powered by Jetpack.', 'wpcomsh' );
			} else {
				$url = admin_url( 'admin.php?page=jetpack#/writing' );
				// Translators: %1$s: Start HTML link tag with the URL to Jetpack settings, %2$s: End HTML link tag.
				$message = __( 'Visit %1$sJetpack Settings%2$s for more writing settings powered by Jetpack.', 'wpcomsh' );
			}
			echo '<div class="notice notice-info is-dismissible" data-notice="options_writing"><p>' .
				sprintf(
					esc_html( $message ),
					'<a href="' . esc_url( $url ) . '">',
					'</a>'
				)
				. '</p></div>';
			add_action( 'admin_footer', 'add_wpcom_writing_features_moved_script' );
		}
	}
}
add_action( 'admin_notices', 'wpcom_writing_features_moved_notice' );

/**
 * Enqueues and outputs inline JavaScript in the admin footer for AJAX dismissal of notices.
 */
function add_wpcom_writing_features_moved_script() {
	$ajax_nonce = wp_create_nonce( 'dismiss_wpcom_writing_features_moved_nonce' );
	?>
	<script>
		document.addEventListener('DOMContentLoaded', function() {
			document.addEventListener('click', function(event) {
				if (event.target.closest('.notice[data-notice="options_writing"] .notice-dismiss')) {
					wp.ajax.post('dismiss_wpcom_writing_features_moved_notice', {
						nonce: <?php echo wp_json_encode( $ajax_nonce, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ); ?>
					});
				}
			});
		});
	</script>
	<?php
}

/**
 * Handles the AJAX request to dismiss the admin notice.
 */
function dismiss_wpcom_writing_features_moved_notice() {
	check_ajax_referer( 'dismiss_wpcom_writing_features_moved_nonce', 'nonce' );
	update_option( 'wpcom_writing_features_notice_dismissed', true );
	wp_die();
}
add_action( 'wp_ajax_dismiss_wpcom_writing_features_moved_notice', 'dismiss_wpcom_writing_features_moved_notice' );


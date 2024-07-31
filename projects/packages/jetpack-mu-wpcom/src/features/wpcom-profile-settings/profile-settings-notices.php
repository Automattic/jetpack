<?php
/**
 * Custom notices for wp-admin/profile.php
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Adds a notice for Automatticians informing them that the Toolbar always shows on the front end on Atomic sites if
 * they are connected to Autoproxxy.
 */
function maybe_show_wpcom_toolbar_proxy_notice() {
	$is_proxied = isset( $_SERVER['A8C_PROXIED_REQUEST'] )
			? sanitize_text_field( wp_unslash( $_SERVER['A8C_PROXIED_REQUEST'] ) )
			: defined( 'A8C_PROXIED_REQUEST' ) && A8C_PROXIED_REQUEST;
	$is_atomic  = defined( 'IS_ATOMIC' ) && IS_ATOMIC;

	if ( $is_proxied && $is_atomic ) {
		?>
		<style>
			.toolbar-autoproxxy-notice {
				color: #666;
				font-style: italic;
				margin-top: 5px;
			}
		</style>
		<script type="text/javascript">
			document.addEventListener('DOMContentLoaded', function () {
				// Find the Toolbar checkbox label container using the unique ID.
				var toolbarCheckboxLabel = document.querySelector('#admin_bar_front').parentNode;
				if (toolbarCheckboxLabel) {
					// Create a new div for the notice.
					var newDiv = document.createElement('div');
					newDiv.className = 'toolbar-autoproxxy-notice';
					newDiv.textContent = '<?php echo esc_js( __( 'The Toolbar is always visible on Atomic sites while connected to the Automattic proxy.', 'jetpack-mu-wpcom' ) ); ?>'

					// Insert the new div after the checkbox and label.
					toolbarCheckboxLabel.appendChild(newDiv);

					// Find and remove the <br> tag following the label to improve spacing.
					var brElement = toolbarCheckboxLabel.nextSibling;
					if (brElement && brElement.tagName === 'BR') {
						brElement.parentNode.removeChild(brElement);
					}
				}
			});
		</script>
		<?php
	}
}

add_action( 'admin_footer-profile.php', 'maybe_show_wpcom_toolbar_proxy_notice' );

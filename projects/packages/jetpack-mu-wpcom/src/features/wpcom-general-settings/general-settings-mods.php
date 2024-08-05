<?php
/**
 * Customizations for the /wp-admin/options-general.php page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Hide the Administration Email section in General Settings on Simple Classic sites.
 */
function wpcom_maybe_hide_admin_email_address() {
	$is_classic_site = get_option( 'wpcom_admin_interface' ) === 'wp-admin';
	$is_simple_site  = defined( 'IS_WPCOM' ) && IS_WPCOM;

	if ( $is_simple_site && $is_classic_site ) {
		add_action( 'admin_enqueue_scripts', 'wpcom_hide_admin_email_address' );
	}
}

/**
 * Hide the Administration Email section in General Settings.
 */
function wpcom_hide_admin_email_address() {
	/**
	 * Use the CSS :has selector to hide the admin email tr elegantly. However, some older browsers do not support :has.
	 * Fallback to hiding the elements in the tr. This leaves some white space because it doesn't remove the row.
	 */
	?>
	<style type="text/css">
		tr:has(#new_admin_email) {
			display: none;
		}

		#new_admin_email,
		#new-admin-email-description,
		label[for=new_admin_email] {
			display: none;
		}
	</style>
	<?php
	/**
	 * JavaScript is used to remove the whitespace of the row if we had to "fallback."
	 */
	?>
	<script type="text/javascript">
		document.addEventListener('DOMContentLoaded', function() {
			var emailField = document.getElementById('new_admin_email');
			if (emailField) {
				var parentRow = emailField.closest('tr');
				if (parentRow) {
					parentRow.style.display = 'none';
				}
			}
		});
	</script>
	<?php
}
add_action( 'load-options-general.php', 'wpcom_maybe_hide_admin_email_address' );

<?php
/**
 * Customizations for the /wp-admin/options-general.php page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Initialize customizations for the options-general admin page.
 */
function init_admin_email_address_customizations() {
	$is_classic_site = get_option( 'wpcom_admin_interface' ) === 'wp-admin';
	$is_simple_site  = defined( 'IS_WPCOM' ) && IS_WPCOM;

	if ( $is_simple_site && $is_classic_site ) {
		add_action( 'admin_enqueue_scripts', 'wpcom_hide_admin_email_address_section' );
	}
}

/**
 * Hide the Administration Email Address section in General Settings on Simple Classic sites.
 */
function wpcom_hide_admin_email_address_section() {
	?>
	<style type="text/css">
		/* The :has selector hides the admin email tr completely, but some older browsers do not support it. */
		tr:has(#new_admin_email) {
			display: none;
		}

		/* We fall back on hiding the elements in the tr. This leaves some white space because it doesn't remove the row. */
		#new_admin_email,
		#new-admin-email-description,
		label[for=new_admin_email] {
			display: none;
		}
	</style>
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
add_action( 'load-options-general.php', 'init_admin_email_address_customizations' );

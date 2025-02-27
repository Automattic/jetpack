<?php
/**
 * Prevent the site owner from editing user's account-level fields.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once __DIR__ . '/../../utils.php';

/**
 * Disable the account-level fields of the connected users to prevent the site owner from editing them.
 */
function wpcom_disable_account_level_fields_if_needed() {
	$user_id = ! empty( $_REQUEST['user_id'] ) ? absint( sanitize_text_field( wp_unslash( $_REQUEST['user_id'] ) ) ) : 0; // // phpcs:ignore WordPress.Security.NonceVerification

	// Do nothing if the user is not connected to WordPress.com.
	if ( ! $user_id || ! is_user_connected( $user_id ) ) {
		return;
	}

	?>
		<script type="text/javascript">
			document.addEventListener( 'DOMContentLoaded', function() {
				const fields = [
					/** Language */
					{ selector: '#locale' },
					/** First Name */
					{ selector: '#first_name' },
					/** Last Name */
					{ selector: '#last_name' },
					/** Nickname */
					{ selector: '#nickname' },
					/** Display name */
					{ selector: '#display_name' },
					/** Website */
					{ selector: '#url' },
					/** Biographical Info */
					{ selector: '#description', tagName: 'p' },
					/** Email */
					{ selector: '#email' },
				];

				for ( let i = 0; i < fields.length; i++ ) {
					const field = fields[i];
					const element = document.querySelector( field.selector );
					if ( ! element ) {
						continue;
					}

					if ( element.tagName === 'INPUT' ) {
						element.readOnly = true;
					} else {
						element.disabled = true;
					}

					/**
					 * Append the description to indicate the field cannot be changed.
					 */
					const tagName = field.tagName ? field.tagName : 'span';
					const description = document.createElement( tagName );
					description.className = 'description';
					// Use the `Tab` for spacing to align with other fields.
					description.innerHTML = "\t<?php echo esc_html__( 'It cannot be changed.', 'jetpack-mu-wpcom' ); ?>";
					element.parentNode.appendChild( description );
				}
			} );
		</script>
	<?php
}
add_action( 'admin_print_footer_scripts-user-edit.php', __NAMESPACE__ . '\wpcom_disable_account_level_fields_if_needed' );

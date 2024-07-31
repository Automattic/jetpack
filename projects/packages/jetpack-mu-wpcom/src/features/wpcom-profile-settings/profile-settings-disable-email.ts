/**
 * Disable the email field on Simple sites.
 */
const wpcom_profile_settings_disable_email_field = () => {
	const emailField = document.getElementById( 'email' ) as HTMLInputElement;
	if ( emailField ) {
		emailField.disabled = true;
	}
};

document.addEventListener( 'DOMContentLoaded', () => {
	wpcom_profile_settings_disable_email_field();
} );

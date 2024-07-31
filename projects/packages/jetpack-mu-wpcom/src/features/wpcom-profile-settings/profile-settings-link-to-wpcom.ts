/**
 * Disable the email field on Simple sites.
 */
const wpcom_profile_settings_disable_email_field = () => {
	if ( ! window.wpcomProfileSettingsLinkToWpcom?.isWpcomSimple ) {
		return;
	}
	const emailField = document.getElementById( 'email' ) as HTMLInputElement;
	if ( emailField ) {
		emailField.disabled = true;
	}
};

/**
 * Add a link to the WordPress.com profile settings page.
 */
const wpcom_profile_settings_add_links_to_wpcom = () => {
	const emailDescription = document.getElementById( 'email-description' );
	const newPasswordSection = document.getElementById( 'password' )?.querySelector( 'td' );
	const userSessionSection = document.querySelector( '.user-sessions-wrap' );

	userSessionSection?.remove();

	// Simple sites cannot set a password in wp-admin.
	if ( window.wpcomProfileSettingsLinkToWpcom?.isWpcomSimple && newPasswordSection ) {
		newPasswordSection.innerHTML = '';
	}

	const emailSettingsLink = window.wpcomProfileSettingsLinkToWpcom?.email?.link;
	const emailSettingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.email?.text;
	if ( emailDescription && emailSettingsLink && emailSettingsLinkText ) {
		const link = document.createElement( 'a' );
		link.href = emailSettingsLink;
		link.textContent = emailSettingsLinkText;
		emailDescription.appendChild( document.createElement( 'br' ) );
		emailDescription.appendChild( link );
	}

	const passwordSettingsLink = window.wpcomProfileSettingsLinkToWpcom?.password?.link;
	const passwordSettingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.password?.text;
	if ( newPasswordSection && passwordSettingsLink && passwordSettingsLinkText ) {
		const link = document.createElement( 'a' );
		link.href = passwordSettingsLink;
		link.textContent = passwordSettingsLinkText;
		link.style.display = 'block';
		if ( newPasswordSection.childElementCount > 0 ) {
			link.style.marginTop = '14px';
		}
		newPasswordSection.appendChild( link );
	}
};

document.addEventListener( 'DOMContentLoaded', () => {
	wpcom_profile_settings_add_links_to_wpcom();
	wpcom_profile_settings_disable_email_field();
} );

/**
 * Adds a link to the WordPress.com profile settings page.
 */
const wpcom_profile_settings_add_links_to_wpcom = () => {
	const emailDescription = document.getElementById( 'email-description' );
	const linkText = window.wpcomProfileSettingsLinkToWpcom?.emailSettingsLinkText;
	if ( emailDescription && linkText ) {
		const link = document.createElement( 'a' );
		link.href = 'https://wordpress.com/me/account/';
		link.textContent = linkText;
		emailDescription.appendChild( document.createElement( 'br' ) );
		emailDescription.appendChild( link );
	}
};

document.addEventListener( 'DOMContentLoaded', () => {
	wpcom_profile_settings_add_links_to_wpcom();
} );

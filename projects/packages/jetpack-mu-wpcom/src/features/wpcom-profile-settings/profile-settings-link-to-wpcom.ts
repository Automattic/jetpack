const wpcom_profile_settings_modify_language_section = () => {
	const section = document.querySelector( '.user-language-wrap' )?.querySelector( 'td' );
	const select = document.getElementById( 'locale' );
	const settingsLink = window.wpcomProfileSettingsLinkToWpcom?.language?.link;
	const settingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.language?.text;
	if ( settingsLink && settingsLinkText ) {
		const notice = document.createElement( 'p' );
		notice.className = 'description';
		notice.innerHTML = `<a href="${ settingsLink }">${ settingsLinkText }</a>`;
		section?.appendChild( notice );
		select?.remove();
	}
};

const wpcom_profile_settings_modify_name_section = () => {
	const table = document.querySelector( '.user-user-login-wrap' )?.parentElement;

	const tr = document.createElement( 'tr' );
	const th = document.createElement( 'th' );
	const td = document.createElement( 'td' );

	const settingsLink = window.wpcomProfileSettingsLinkToWpcom?.name?.link;
	const settingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.name?.text;
	if ( table && settingsLink && settingsLinkText ) {
		const h2 = document.createElement( 'h2' );
		h2.innerHTML = 'Name';
		h2.style = 'font-size: 1.2em';
		th.appendChild( h2 );

		const notice = document.createElement( 'p' );
		notice.className = 'description';
		notice.innerHTML = `<a href="${ settingsLink }">${ settingsLinkText }</a>`;
		td.appendChild( notice );

		tr.appendChild( th );
		tr.appendChild( td );
		table?.appendChild( tr );
		table?.parentElement?.previousElementSibling?.remove();
	}

	[
		'.user-user-login-wrap',
		'.user-first-name-wrap',
		'.user-last-name-wrap',
		'.user-nickname-wrap',
		'.user-display-name-wrap',
	].forEach( selector => {
		const field = document.querySelector( selector );
		if ( field ) {
			field.classList.add( 'hidden' );
		}
	} );
};

const wpcom_profile_settings_modify_email_section = () => {
	// Hide the email field except on Atomic Classic sites.
	if ( ! window.wpcomProfileSettingsLinkToWpcom?.isWpcomAtomicClassic ) {
		const field = document.getElementById( 'email' ) as HTMLInputElement;
		if ( field ) {
			field.classList.add( 'hidden' );
		}

		const description = document.getElementById( 'email-description' ) as HTMLInputElement;
		description?.remove();
	}

	const section = document.querySelector( '.user-email-wrap' )?.querySelector( 'td' );
	const settingsLink = window.wpcomProfileSettingsLinkToWpcom?.email?.link;
	const settingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.email?.text;
	if ( section && settingsLink && settingsLinkText ) {
		const notice = document.createElement( 'p' );
		notice.className = 'description';
		notice.innerHTML = `<a href="${ settingsLink }">${ settingsLinkText }</a>`;
		section.appendChild( notice );
	}
};

const wpcom_profile_settings_modify_website_section = () => {
	const section = document.querySelector( '.user-url-wrap' )?.querySelector( 'td' );
	const settingsLink = window.wpcomProfileSettingsLinkToWpcom?.website?.link;
	const settingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.website?.text;
	if ( section && settingsLink && settingsLinkText ) {
		const notice = document.createElement( 'p' );
		notice.className = 'description';
		notice.innerHTML = `<a href="${ settingsLink }">${ settingsLinkText }</a>`;
		section.appendChild( notice );
	}

	const field = section?.querySelector( 'input' );
	if ( field ) {
		field.classList.add( 'hidden' );
	}
};

const wpcom_profile_settings_modify_bio_section = () => {
	const section = document.querySelector( '.user-description-wrap' )?.querySelector( 'td' );
	const settingsLink = window.wpcomProfileSettingsLinkToWpcom?.bio?.link;
	const settingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.bio?.text;
	if ( section && settingsLink && settingsLinkText ) {
		const notice = document.createElement( 'p' );
		notice.className = 'description';
		notice.innerHTML = `<a href="${ settingsLink }">${ settingsLinkText }</a>`;
		section.appendChild( notice );
	}

	const field = section?.querySelector( 'textarea' );
	if ( field ) {
		field.classList.add( 'hidden' );
	}
	section?.querySelector( 'p' )?.remove();
};

const wpcom_profile_settings_modify_password_section = () => {
	const userSessionSection = document.querySelector( '.user-sessions-wrap' );
	userSessionSection?.remove();

	// We cannot set a password in wp-admin except on Atomic Classic sites.
	const newPasswordSection = document.getElementById( 'password' )?.querySelector( 'td' );
	if ( ! window.wpcomProfileSettingsLinkToWpcom?.isWpcomAtomicClassic && newPasswordSection ) {
		newPasswordSection.innerHTML = '';
	}

	const settingsLink = window.wpcomProfileSettingsLinkToWpcom?.password?.link;
	const settingsLinkText = window.wpcomProfileSettingsLinkToWpcom?.password?.text;
	if ( newPasswordSection && settingsLink && settingsLinkText ) {
		const notice = document.createElement( 'p' );
		notice.className = 'description';
		notice.innerHTML = `<a href="${ settingsLink }">${ settingsLinkText }</a>`;
		newPasswordSection.appendChild( notice );
	}
};

document.addEventListener( 'DOMContentLoaded', () => {
	wpcom_profile_settings_modify_language_section();
	wpcom_profile_settings_modify_name_section();
	wpcom_profile_settings_modify_email_section();
	wpcom_profile_settings_modify_website_section();
	wpcom_profile_settings_modify_bio_section();
	wpcom_profile_settings_modify_password_section();
} );

import { __, sprintf } from '@wordpress/i18n';

/**
 * Adds the Site Address (URL) and WordPress Address (URL) input fields to the General Settings page on Simple sites.
 */
const wpcomAddSiteUrl = () => {
	if ( typeof window.wpcomSiteUrl === 'undefined' ) {
		return;
	}

	const settingsTable = document.querySelector( 'table.form-table tbody' );
	if ( ! settingsTable ) {
		return;
	}

	const previousSibling =
		settingsTable.querySelector( '.site-icon-section' ) ||
		settingsTable.querySelectorAll( 'tr' )[ 1 ];
	if ( ! previousSibling ) {
		return;
	}

	// Create the Site Address (URL) row
	if ( ! document.getElementById( 'home' ) ) {
		const homeUrlLabel = __( 'Site Address (URL)', 'jetpack-mu-wpcom' );
		const homeUrlRow = document.createElement( 'tr' );
		homeUrlRow.innerHTML = `
					<th scope="row"><label for="home">${ homeUrlLabel }</label></th>
					<td><input type="url" id="home" value="${ window.wpcomSiteUrl.homeUrl }" class="regular-text code disabled" disabled="disabled" /></td>
			`;
		// On UI, `Site Address (URL)` is rendered after `WordPress Address (URL)`
		settingsTable.insertBefore( homeUrlRow, previousSibling.nextSibling );
	}

	// Create the WordPress Address (URL) row
	if ( ! document.getElementById( 'siteurl' ) ) {
		const siteUrlLabel = __( 'WordPress Address (URL)', 'jetpack-mu-wpcom' );
		const siteUrlRow = document.createElement( 'tr' );
		siteUrlRow.innerHTML = `
				<th scope="row"><label for="siteurl">${ siteUrlLabel }</label></th>
				<td><input type="url" id="siteurl" value="${ window.wpcomSiteUrl.siteUrl }" class="regular-text code disabled" disabled="disabled" /></td>
		`;
		settingsTable.insertBefore( siteUrlRow, previousSibling.nextSibling );
	}
};

/**
 * Adds domain settings links under the site URL input fields both on Simple and Atomic sites.
 */
function wpcomAddDomainSettingsLinks() {
	const settingsTable = document.querySelector( 'table.form-table tbody' );
	if ( ! settingsTable ) {
		return;
	}

	const previousSibling =
		( document.getElementById( 'home' ) as HTMLInputElement ) ||
		( document.getElementById( 'siteurl' ) as HTMLInputElement );
	if ( ! previousSibling ) {
		return;
	}

	const domainSettingsLink = document.createElement( 'p' );
	domainSettingsLink.className = 'description';
	domainSettingsLink.innerHTML = sprintf(
		// translators: %1$s is the site slug, %2$s is the URL to the General Settings page.
		__(
			'Buy a <a href="https://wordpress.com/domains/add/%1$s?redirect_to=%2$s">custom domain</a>, ' +
				'<a href="https://wordpress.com/domains/add/mapping/%1$s?redirect_to=%2$s">map</a> a domain you already own, ' +
				'or <a href="https://wordpress.com/domains/add/site-redirect/%1$s?redirect_to=%2$s">redirect</a> this site.' +
				' <a href="https://wordpress.com/domains/manage/%1$s/edit/%1$s">You can change your site address in Domain Settings</a>.',
			'jetpack-mu-wpcom'
		),
		window.wpcomSiteUrl.siteSlug,
		window.wpcomSiteUrl.optionsGeneralUrl
	);

	previousSibling.parentElement?.appendChild( domainSettingsLink );
}

document.addEventListener( 'DOMContentLoaded', function () {
	wpcomAddSiteUrl();
	wpcomAddDomainSettingsLinks();
} );

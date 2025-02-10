import { __, sprintf } from '@wordpress/i18n';
import { wpcomTrackEvent } from '../../common/tracks';

/**
 * Build the Fiverr CTA.
 * @param fragment - The document fragment for options general.
 */
const _wpcomBuildFiverrCta = ( fragment: DocumentFragment ) => {
	const fiverrCtaRow = document.getElementById( 'wpcom-fiverr-cta' )?.closest( 'tr' );
	if ( fiverrCtaRow ) {
		fragment.appendChild( fiverrCtaRow );
	}
};

/**
 * Set up the Fiverr CTA.
 */
function wpcomInitializeFiverrCta() {
	const fiverCta = document.querySelector( '.wpcom-fiverr-cta-button' );
	if ( fiverCta ) {
		fiverCta.addEventListener( 'click', e => {
			e.preventDefault();

			wpcomTrackEvent( 'wp_admin_site_icon_fiverr_logo_maker_cta_click', {
				cta_name: 'wp_admin_site_icon_fiverr_logo_maker',
			} );

			window.open( 'https://wp.me/logo-maker/?utm_campaign=general_settings', '_blank' );
		} );
	}
}

/**
 * Build the Site Address (URL) and WordPress Address (URL) input fields.
 * @param fragment - The document fragment for options general.
 */
const _wpcomBuildSiteUrl = ( fragment: DocumentFragment ) => {
	if ( typeof window.wpcomSiteUrl === 'undefined' ) {
		return;
	}

	// Create the WordPress Address (URL) row
	if ( ! document.getElementById( 'siteurl' ) ) {
		const siteUrlLabel = __( 'WordPress Address (URL)', 'jetpack-mu-wpcom' );
		const siteUrlRow = document.createElement( 'tr' );
		siteUrlRow.innerHTML = `
				<th scope="row"><label for="siteurl">${ siteUrlLabel }</label></th>
				<td><input type="url" id="siteurl" value="${ window.wpcomSiteUrl.siteUrl }" class="regular-text code disabled" disabled="disabled" /></td>
		`;
		fragment.appendChild( siteUrlRow );
	}

	// Create the Site Address (URL) row
	if ( ! document.getElementById( 'home' ) ) {
		const homeUrlLabel = __( 'Site Address (URL)', 'jetpack-mu-wpcom' );
		const homeUrlRow = document.createElement( 'tr' );
		homeUrlRow.innerHTML = `
					<th scope="row"><label for="home">${ homeUrlLabel }</label></th>
					<td><input type="url" id="home" value="${ window.wpcomSiteUrl.homeUrl }" class="regular-text code disabled" disabled="disabled" /></td>
			`;
		fragment.appendChild( homeUrlRow );
	}
};

/**
 * Adds domain settings links under the site URL input fields both on Simple and Atomic sites.
 * @param fragment - The document fragment for options general.
 */
function _wpcomBuildDomainSettingsLinks( fragment: DocumentFragment ) {
	if ( typeof window.wpcomSiteUrl === 'undefined' ) {
		return;
	}

	// Either WordPress Address (URL) or Site Address (URL), whichever comes last.
	const previousSibling =
		( fragment.getElementById( 'home' ) as HTMLInputElement ) ||
		( fragment.getElementById( 'siteurl' ) as HTMLInputElement ) ||
		document.getElementById( 'home' ) ||
		document.getElementById( 'siteurl' );
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

/**
 * Add the options general fragment.
 */
const wpcomAddOptionsGeneralFragment = () => {
	const fragment = document.createDocumentFragment();

	_wpcomBuildFiverrCta( fragment );
	_wpcomBuildSiteUrl( fragment );
	_wpcomBuildDomainSettingsLinks( fragment );

	// Insert the fragment after the site icon section.
	const siteIconSectionRow = document.querySelector( '.site-icon-section' );
	if ( siteIconSectionRow ) {
		// Insert the UI elements in a single operation to minimize reflow.
		siteIconSectionRow.parentNode?.insertBefore( fragment, siteIconSectionRow.nextSibling );
	}
};

document.addEventListener( 'DOMContentLoaded', function () {
	wpcomAddOptionsGeneralFragment();
	wpcomInitializeFiverrCta();
} );

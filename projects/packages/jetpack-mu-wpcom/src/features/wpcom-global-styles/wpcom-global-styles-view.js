/* global launchBarUserData */
import wpcomRequest from 'wpcom-proxy-request';
import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-global-styles-view.scss';

/**
 * REST API endpoint to update global styles.
 *
 * @param {string} globalStylesId - The ID of the global styles.
 * @param {string} siteIdOrSlug   - The ID or slug of the site.
 * @return {Promise}                The response from the REST API.
 */
const restGlobalStyles = async ( globalStylesId, siteIdOrSlug ) => {
	if ( ! globalStylesId || ! siteIdOrSlug ) {
		return false;
	}

	// TODO find a way to PUT from the frontend preview.

	return await wpcomRequest( {
		path: `/sites/${ encodeURIComponent( siteIdOrSlug ) }/global-styles/${ globalStylesId }`,
		apiNamespace: 'wp/v2',
		method: 'POST',
		body: {
			id: globalStylesId,
			settings: {},
			styles: {},
		},
	} );
};

/**
 * Records a Tracks click event.
 * @param {string} button - Identifier of the button that has been clicked.
 * @param {object} props  - Additional props to track.
 */
function recordEvent( button, props = {} ) {
	wpcomTrackEvent( 'wpcom_launchbar_button_click', {
		button,
		blog_id: launchBarUserData?.blogId,
		...props,
	} );
}

document.addEventListener( 'DOMContentLoaded', () => {
	const launchBanner = document.querySelector( '.launch-banner' );

	if ( ! launchBanner ) {
		return;
	}

	// Don't show the banner if the site is previewed via an iframe.
	if ( window.top !== window.self ) {
		return;
	}

	document.body.style.marginTop = '50px';
	document.body.style.scrollPaddingTop = '50px';
	launchBanner.style.display = null;

	const container = document;
	const popoverToggle = container.querySelector( '.launch-bar-global-styles-toggle' );
	const popover = container.querySelector( '.launch-bar-global-styles-popover' );
	const upgradeButton = container.querySelector( '.launch-bar-global-styles-upgrade' );
	const previewButtonCheckbox = container.querySelector(
		'.launch-bar-global-styles-preview input[type="checkbox"]'
	);
	const closeButton = container.querySelector( '.launch-bar-global-styles-close' );
	const resetButton = container.querySelector( '.launch-bar-global-styles__button--reset' );

	const limitedGlobalStylesNoticeAction =
		localStorage.getItem( 'limitedGlobalStylesNoticeAction' ) ?? 'show';
	if ( limitedGlobalStylesNoticeAction === 'show' ) {
		popover?.classList.remove( 'hidden' );
		recordEvent( 'wpcom_global_styles_gating_notice', { action: 'show' } );
	}

	popoverToggle?.addEventListener( 'click', event => {
		event.preventDefault();
		const action = popover?.classList.contains( 'hidden' ) ? 'show' : 'hide';
		recordEvent( 'wpcom_global_styles_gating_notice', { action } );
		localStorage.setItem( 'limitedGlobalStylesNoticeAction', action );
		popover?.classList.toggle( 'hidden' );
	} );

	closeButton?.addEventListener( 'click', event => {
		event.preventDefault();
		recordEvent( 'wpcom_global_styles_gating_notice', { action: 'hide' } );
		localStorage.setItem( 'limitedGlobalStylesNoticeAction', 'hide' );
		popover?.classList.add( 'hidden' );
	} );

	upgradeButton?.addEventListener( 'click', event => {
		event.preventDefault();
		recordEvent( 'wpcom_global_styles_gating_notice_upgrade' );
		window.location = upgradeButton.href;
	} );

	previewButtonCheckbox?.addEventListener( 'change', event => {
		event.preventDefault();
		recordEvent( 'wpcom_global_styles_gating_notice_preview', {
			action: previewButtonCheckbox.checked ? 'show' : 'hide',
		} );
		window.location = previewButtonCheckbox.dataset.href;
	} );

	resetButton?.addEventListener( 'click', async event => {
		event.preventDefault();
		recordEvent( 'wpcom_global_styles_gating_notice_reset_support' );
		const globalStylesId = resetButton.dataset.globalStylesId;
		const siteId = resetButton.dataset.blogId;
		if ( globalStylesId && siteId ) {
			resetButton?.classList.add( 'is-resetting' );
			const result = await restGlobalStyles( globalStylesId, siteId );
			if ( result ) {
				window.location.reload();
			} else {
				resetButton?.classList.remove( 'is-resetting' );
			}
		} else {
			window.open( resetButton.href, '_blank' ).focus();
		}
	} );
} );

/* global launchBarUserData */
import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-global-styles-view.scss';

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
	const popoverToggle = document.querySelector( '#wp-admin-bar-wpcom-global-styles' );
	const popover = document.querySelector( '#wp-admin-bar-wpcom-global-styles .ab-sub-wrapper' );
	const upgradeButton = document.querySelector( '#wp-admin-bar-wpcom-global-styles-upgrade a' );
	const previewButton = document.querySelector( '#wp-admin-bar-wpcom-global-styles-preview a' );
	const closeButton = document.querySelector( '#wpadminbar .wpcom-global-styles-close' );
	const resetButton = document.querySelector( '#wp-admin-bar-wpcom-global-styles-reset a' );

	if (
		! popoverToggle ||
		! popover ||
		! upgradeButton ||
		! previewButton ||
		! closeButton ||
		! resetButton
	) {
		return;
	}

	const limitedGlobalStylesNoticeAction =
		localStorage.getItem( 'limitedGlobalStylesNoticeAction' ) ?? 'show';
	if ( limitedGlobalStylesNoticeAction === 'show' ) {
		recordEvent( 'wpcom_global_styles_gating_notice', { action: 'show' } );
		popoverToggle.classList.add( 'hover' );
		popoverToggle.querySelector( '.ab-item' ).setAttribute( 'aria-expanded', 'true' );
		popover.style.display = 'block';
	} else {
		closeButton.style.display = 'none';
	}

	closeButton.addEventListener( 'click', event => {
		event.preventDefault();
		recordEvent( 'wpcom_global_styles_gating_notice', { action: 'hide' } );
		localStorage.setItem( 'limitedGlobalStylesNoticeAction', 'hide' );
		// Core adds a 180ms delay to the hover state, so we need to wait for that to complete before removing the class.
		setTimeout( () => popoverToggle.classList.remove( 'hover' ), 180 );
		popoverToggle.querySelector( '.ab-item' ).setAttribute( 'aria-expanded', 'false' );
		popover.style.removeProperty( 'display' );
		closeButton.style.display = 'none';
	} );

	upgradeButton.addEventListener( 'click', () => {
		recordEvent( 'wpcom_global_styles_gating_notice_upgrade' );
	} );

	previewButton.addEventListener( 'click', event => {
		event.preventDefault();
		const checkbox = previewButton.querySelector( 'input[type="checkbox"]' );
		if ( checkbox ) {
			checkbox.checked = ! checkbox.checked;
		}
		recordEvent( 'wpcom_global_styles_gating_notice_preview', {
			action: checkbox.checked ? 'show' : 'hide',
		} );
		window.location = previewButton.href;
	} );

	resetButton.addEventListener( 'click', () => {
		recordEvent( 'wpcom_global_styles_gating_notice_reset_support' );
	} );
} );

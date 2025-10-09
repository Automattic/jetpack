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
	const otherAdminBarItems = document.querySelectorAll(
		'#wpadminbar .quicklinks > ul > li:not(#wp-admin-bar-wpcom-global-styles)'
	);
	const container = document.querySelector( '#wp-admin-bar-wpcom-global-styles' );
	const popoverToggle = container.querySelector( '.ab-item' );
	const popover = container.querySelector( '.ab-sub-wrapper' );
	const upgradeButton = popover.querySelector( '#wp-admin-bar-wpcom-global-styles-upgrade a' );
	const previewButton = popover.querySelector( '#wp-admin-bar-wpcom-global-styles-preview a' );
	const closeButton = popover.querySelector( '.wpcom-global-styles-close' );
	const resetButton = popover.querySelector( '#wp-admin-bar-wpcom-global-styles-reset a' );

	if (
		! otherAdminBarItems.length ||
		! container ||
		! popoverToggle ||
		! popover ||
		! upgradeButton ||
		! previewButton ||
		! closeButton ||
		! resetButton
	) {
		return;
	}

	const showPopover = () => {
		container.classList.add( 'hover' );
		popoverToggle.setAttribute( 'aria-expanded', 'true' );
		popover.style.display = 'block';
		closeButton.style.visibility = 'visible';
	};

	const hidePopover = () => {
		// Core adds a 180ms delay to the hover state, so we need to wait for that to complete before removing the class.
		setTimeout( () => container.classList.remove( 'hover' ), 180 );
		popoverToggle.setAttribute( 'aria-expanded', 'false' );
		popover.style.removeProperty( 'display' );
	};

	const limitedGlobalStylesNoticeAction =
		localStorage.getItem( 'limitedGlobalStylesNoticeAction' ) ?? 'show';
	if ( limitedGlobalStylesNoticeAction === 'show' ) {
		recordEvent( 'wpcom_global_styles_gating_notice', { action: 'show' } );
		showPopover();

		otherAdminBarItems.forEach( item => {
			item.addEventListener( 'click', () => {
				hidePopover();
			} );
		} );
	}

	closeButton.addEventListener( 'click', event => {
		event.preventDefault();
		recordEvent( 'wpcom_global_styles_gating_notice', { action: 'hide' } );
		localStorage.setItem( 'limitedGlobalStylesNoticeAction', 'hide' );
		hidePopover();
		closeButton.style.removeProperty( 'visibility' );
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

	popoverToggle.addEventListener( 'click', () => {
		// On desktop devices, clicking on the popover redirects to the upgrade page.
		if ( ! ( 'ontouchstart' in window ) ) {
			recordEvent( 'wpcom_global_styles_gating_notice_upgrade' );
		}
	} );
} );

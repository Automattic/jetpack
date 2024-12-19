/* global wp, wpcomSidebarNoticeConfig */
import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-sidebar-notice.scss';

const wpcomSidebarNoticeRecordEvent = ( event, wpcomSidebarNoticeData ) => {
	if ( ! event ) {
		return;
	}
	wpcomTrackEvent(
		event.name,
		event.props,
		wpcomSidebarNoticeData.user.ID,
		wpcomSidebarNoticeData.user.username
	);
};

const wpcomShowSidebarNotice = wpcomSidebarNoticeData => {
	const adminMenu = document.querySelector( '#adminmenu' );
	if ( ! adminMenu || ! wpcomSidebarNoticeData ) {
		return;
	}

	// Render notice.
	adminMenu.insertAdjacentHTML(
		'afterbegin',
		`
			<li
				id="toplevel_page_site-notices"
				class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices"
				data-id="${ wpcomSidebarNoticeData.id }"
				data-feature-class="${ wpcomSidebarNoticeData.featureClass }"
			>
				<a href="${
					wpcomSidebarNoticeData.url
				}" class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices">
					<div class="wp-menu-name">
						<div class="upsell_banner">
							<div class="upsell_banner__icon dashicons" aria-hidden="true"></div>
							<div class="upsell_banner__text">${ wpcomSidebarNoticeData.text }</div>
							<button type="button" class="upsell_banner__action button">${
								wpcomSidebarNoticeData.action
							}</button>
							${
								wpcomSidebarNoticeData.dismissible
									? '<button type="button" class="upsell_banner__dismiss button button-link">' +
									  wpcomSidebarNoticeData.dismissLabel +
									  '</button>'
									: ''
							}
						</div>
					</div>
				</a>
			</li>
		`
	);

	// Record impression event in Tracks.
	wpcomSidebarNoticeRecordEvent( wpcomSidebarNoticeData.tracks?.display );

	const sidebarNotice = adminMenu.firstElementChild;
	sidebarNotice.addEventListener( 'click', event => {
		if (
			event.target.classList.contains( 'upsell_banner__dismiss' ) ||
			event.target.closest( '.upsell_banner__dismiss' )
		) {
			// Handle dismiss.
			event.preventDefault();
			wp.ajax.post( 'wpcom_dismiss_sidebar_notice', {
				id: sidebarNotice.dataset.id,
				feature_class: sidebarNotice.dataset.featureClass,
				_ajax_nonce: wpcomSidebarNoticeData.dismissNonce,
			} );
			sidebarNotice.remove();

			// Record dismiss event in Tracks.
			wpcomSidebarNoticeRecordEvent( wpcomSidebarNoticeData.tracks?.dismiss );
		} else {
			// Record click event in Tracks.
			wpcomSidebarNoticeRecordEvent( wpcomSidebarNoticeData.tracks?.click );
		}
	} );
};

const wpcomFetchSidebarNotice = async () => {
	try {
		const response = await fetch(
			`${ wpcomSidebarNoticeConfig.ajaxUrl }?action=wpcom_fetch_sidebar_notice&nonce=${ wpcomSidebarNoticeConfig.nonce }`
		);

		if ( response.status !== 200 ) {
			return;
		}

		const res = await response.json();

		if ( res.success && res.data ) {
			wpcomShowSidebarNotice( res.data );
		}
	} catch {
		// End silently
	}
};

document.addEventListener( 'DOMContentLoaded', wpcomFetchSidebarNotice );

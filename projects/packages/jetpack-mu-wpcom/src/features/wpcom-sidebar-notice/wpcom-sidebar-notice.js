/* global wp, wpcomSidebarNoticeConfig */
import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-sidebar-notice.scss';

const wpcomSidebarNoticeRecordEvent = ( event, sidebarNoticeData ) => {
	if ( ! event ) {
		return;
	}
	wpcomTrackEvent(
		event.name,
		event.props,
		sidebarNoticeData.user.ID,
		sidebarNoticeData.user.username
	);
};

const wpcomShowSidebarNotice = sidebarNoticeData => {
	const adminMenu = document.querySelector( '#adminmenu' );
	if ( ! adminMenu || ! sidebarNoticeData ) {
		return;
	}

	// Render notice.
	adminMenu.insertAdjacentHTML(
		'afterbegin',
		`
			<li
				id="toplevel_page_site-notices"
				class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices"
				data-id="${ sidebarNoticeData.id }"
				data-feature-class="${ sidebarNoticeData.featureClass }"
			>
				<a href="${
					sidebarNoticeData.url
				}" class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices">
					<div class="wp-menu-name">
						<div class="upsell_banner">
							<div class="upsell_banner__icon dashicons" aria-hidden="true"></div>
							<div class="upsell_banner__text">${ sidebarNoticeData.text }</div>
							<button type="button" class="upsell_banner__action button">${ sidebarNoticeData.action }</button>
							${
								sidebarNoticeData.dismissible
									? '<button type="button" class="upsell_banner__dismiss button button-link">' +
									  sidebarNoticeData.dismissLabel +
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
	wpcomSidebarNoticeRecordEvent( sidebarNoticeData.tracks?.display );

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
				_ajax_nonce: sidebarNoticeData.dismissNonce,
			} );
			sidebarNotice.remove();

			// Record dismiss event in Tracks.
			wpcomSidebarNoticeRecordEvent( sidebarNoticeData.tracks?.dismiss );
		} else {
			// Record click event in Tracks.
			wpcomSidebarNoticeRecordEvent( sidebarNoticeData.tracks?.click );
		}
	} );
};

const fetchSidebarNotice = async () => {
	try {
		const response = await fetch(
			`${ wpcomSidebarNoticeConfig.ajaxUrl }?action=fetch_sidebar_notice&nonce=${ wpcomSidebarNoticeConfig.nonce }`
		);

		if ( ! response.status === 200 ) {
			return;
		}

		const res = await response.json();

		if ( res.success && res.data ) {
			wpcomShowSidebarNotice( res.data );
		}
	} catch ( error ) {
		// End silently
	}
};

document.addEventListener( 'DOMContentLoaded', fetchSidebarNotice );

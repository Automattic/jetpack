/* global wp, wpcomSidebarNotice */

const wpcomSidebarNoticeRecordEvent = event => {
	if ( ! event ) {
		return;
	}
	window._tkq = window._tkq || [];
	window._tkq.push( [
		'identifyUser',
		wpcomSidebarNotice.user.ID,
		wpcomSidebarNotice.user.username,
	] );
	window._tkq.push( [ 'recordEvent', event.name, event.props ] );
};

const wpcomShowSidebarNotice = () => {
	const adminMenu = document.querySelector( '#adminmenu' );
	if ( ! adminMenu || typeof wpcomSidebarNotice === 'undefined' ) {
		return;
	}

	// Render notice.
	adminMenu.insertAdjacentHTML(
		'afterbegin',
		`
			<li
				id="toplevel_page_site-notices"
				class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices"
				data-id="${ wpcomSidebarNotice.id }"
				data-feature-class="${ wpcomSidebarNotice.featureClass }"
			>
				<a href="${
					wpcomSidebarNotice.url
				}" class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices">
					<div class="wp-menu-name">
						<div class="upsell_banner">
							<div class="upsell_banner__icon dashicons" aria-hidden="true"></div>
							<div class="upsell_banner__text">${ wpcomSidebarNotice.text }</div>
							<button type="button" class="upsell_banner__action button">${ wpcomSidebarNotice.action }</button>
							${
								wpcomSidebarNotice.dismissible
									? '<button type="button" class="upsell_banner__dismiss button button-link">' +
									  wpcomSidebarNotice.dismissLabel +
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
	wpcomSidebarNoticeRecordEvent( wpcomSidebarNotice.tracks?.display );

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
				_ajax_nonce: wpcomSidebarNotice.dismissNonce,
			} );
			sidebarNotice.remove();

			// Record dismiss event in Tracks.
			wpcomSidebarNoticeRecordEvent( wpcomSidebarNotice.tracks?.dismiss );
		} else {
			// Record click event in Tracks.
			wpcomSidebarNoticeRecordEvent( wpcomSidebarNotice.tracks?.click );
		}
	} );
};

document.addEventListener( 'DOMContentLoaded', wpcomShowSidebarNotice );

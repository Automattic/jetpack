/* global wp, wpcomSidebarNotice */

const wpcomShowSidebarNotice = () => {
	const adminMenu = document.querySelector( '#adminmenu' );
	if ( ! adminMenu || typeof wpcomSidebarNotice === 'undefined' ) {
		return;
	}

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
								wpcomSidebarNotice.dismissible === '1'
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

	const sidebarNotice = adminMenu.firstElementChild;

	sidebarNotice.addEventListener( 'click', event => {
		if (
			event.target.classList.contains( 'upsell_banner__dismiss' ) ||
			event.target.closest( '.upsell_banner__dismiss' )
		) {
			event.preventDefault();
			wp.ajax.post( 'wpcom_dismiss_sidebar_notice', {
				id: sidebarNotice.dataset.id,
				feature_class: sidebarNotice.dataset.featureClass,
				_ajax_nonce: wpcomSidebarNotice.dismissNonce,
			} );
			sidebarNotice.remove();
		}
	} );
};

document.addEventListener( 'DOMContentLoaded', wpcomShowSidebarNotice );

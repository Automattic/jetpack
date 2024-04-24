/* global wpcomSidebarNotice */

const wpcomShowSidebarNotice = () => {
	const adminMenu = document.querySelector( '#adminmenu' );
	if ( ! adminMenu || typeof wpcomSidebarNotice === 'undefined' ) {
		return;
	}

	adminMenu.insertAdjacentHTML(
		'afterbegin',
		`
			<li class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices" id="toplevel_page_site-notices">
				<a href="${ wpcomSidebarNotice.url }" class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices">
					<div class="wp-menu-name">
						<div class="upsell_banner">
							<div class="upsell_banner__icon dashicons" aria-hidden="true"></div>
							<div class="upsell_banner__text">${ wpcomSidebarNotice.text }</div>
							<button type="button" class="upsell_banner__action button button-primary">${ wpcomSidebarNotice.action }</button>
						</div>
					</div>
				</a>
			</li>
		`
	);
};

document.addEventListener( 'DOMContentLoaded', wpcomShowSidebarNotice );

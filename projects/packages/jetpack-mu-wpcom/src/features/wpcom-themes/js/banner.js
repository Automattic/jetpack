/* global wpcomThemesBanner */

document.addEventListener( 'DOMContentLoaded', () => {
	const themeBrowser = document.querySelector( '.theme-browser' );
	if ( ! themeBrowser ) {
		return;
	}

	document.documentElement.style.setProperty(
		'--wpcom-themes-banner-image',
		`url(${ wpcomThemesBanner.bannerBackground })`
	);

	themeBrowser.insertAdjacentHTML(
		'beforebegin',
		`
			<div class="wpcom-themes-banner hidden">
				<div class="wpcom-themes-banner__content">
					<img src="${ wpcomThemesBanner.logo }" alt="WordPress.com">
					<h3>${ wpcomThemesBanner.title }</h3>
					<p>${ wpcomThemesBanner.description }</p>
					<a href="${ wpcomThemesBanner.actionUrl }">${ wpcomThemesBanner.actionText }</a>
				</div>
			</div>
		`
	);

	const themesBanner = document.querySelector( '.wpcom-themes-banner' );

	const wpcomThemesObserver = new MutationObserver( () => {
		if (
			document.querySelector(
				'[data-sort="popular"].current, [data-sort="new"].current, [data-sort="block-themes"].current'
			) &&
			! document.querySelector( '.no-results p.no-themes' ) &&
			! document.querySelector( '.loading-content .spinner, .spinner.is-active' )
		) {
			themesBanner.classList.remove( 'hidden' );
		} else {
			themesBanner.classList.add( 'hidden' );
		}
	} );
	wpcomThemesObserver.observe( themeBrowser, { childList: true, subtree: true } );
	wpcomThemesObserver.observe( document.body, { attributes: true } );
} );

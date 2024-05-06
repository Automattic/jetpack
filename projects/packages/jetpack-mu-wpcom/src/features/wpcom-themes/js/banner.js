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
			<div class="wpcom-themes-banner">
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
			// Hide banner when loading results.
			document.querySelector( '.loading-content .spinner' ) ||
			// Hide banner on Favorites tab.
			document.querySelector( '[data-sort="favorites"].current' ) ||
			// Hide banner when using Feature Filter.
			document.querySelector( '.show-filters .filter-drawer' ) ||
			// Hide banner when searching (but only if there are results).
			( document.querySelector( '#wp-filter-search-input' )?.value &&
				! document.querySelector( '.no-results p.no-themes' ) )
		) {
			themesBanner.classList.add( 'hidden' );
		} else {
			themesBanner.classList.remove( 'hidden' );
		}
	} );
	wpcomThemesObserver.observe( themeBrowser, { childList: true } );
	wpcomThemesObserver.observe( document.body, { attributes: true } );
} );

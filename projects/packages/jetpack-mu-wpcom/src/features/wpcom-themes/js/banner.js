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
} );

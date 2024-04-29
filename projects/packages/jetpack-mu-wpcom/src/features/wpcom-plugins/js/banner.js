/* global wpcomPluginsBanner */

document.addEventListener( 'DOMContentLoaded', () => {
	const themeBrowser = document.querySelector( '#plugin-filter' );
	if ( ! themeBrowser ) {
		return;
	}

	document.documentElement.style.setProperty(
		'--wpcom-plugins-banner-image',
		`url(${ wpcomPluginsBanner.bannerBackground })`
	);

	themeBrowser.insertAdjacentHTML(
		'beforebegin',
		`
		<div class="wpcom-plugins-banner">
			<div class="wpcom-plugins-banner__content">
				<img src="${ wpcomPluginsBanner.logo }" alt="WordPress.com">
				<h3>${ wpcomPluginsBanner.title }</h3>
				<p>${ wpcomPluginsBanner.description }</p>
				<a href="${ wpcomPluginsBanner.actionUrl }">${ wpcomPluginsBanner.actionText }</a>
			</div>
		</div>
	`
	);
} );

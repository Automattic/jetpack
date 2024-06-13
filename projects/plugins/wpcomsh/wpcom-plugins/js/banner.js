/* global wpcomPluginsBanner */

document.addEventListener("DOMContentLoaded", () => {
	const pluginBrowser = document.querySelector("#plugin-filter");
	if (!pluginBrowser) {
		return;
	}

	document.documentElement.style.setProperty(
		"--wpcom-plugins-banner-image",
		`url(${wpcomPluginsBanner.bannerBackground})`
	);

	pluginBrowser.insertAdjacentHTML(
		"beforebegin",
		`
		<div class="wpcom-plugins-banner">
			<div class="wpcom-plugins-banner__content">
				<img src="${wpcomPluginsBanner.logo}" alt="WordPress.com">
				<h3>${wpcomPluginsBanner.title}</h3>
				<p>${wpcomPluginsBanner.description}</p>
				<a href="${wpcomPluginsBanner.actionUrl}">${wpcomPluginsBanner.actionText}</a>
			</div>
		</div>
	`
	);

	const wpcomPluginObserver = new MutationObserver(() => {
		if (
			!document.querySelector(".plugin-install-search .current") ||
			document.querySelector(".no-plugin-results")
		) {
			document
				.querySelector(".wpcom-plugins-banner")
				.classList.remove("hidden");
		} else {
			document.querySelector(".wpcom-plugins-banner").classList.add("hidden");
		}
	});
	wpcomPluginObserver.observe(document.getElementById("plugin-filter"), {
		childList: true,
	});
});

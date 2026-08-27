/**
 * Where the reader lands to buy a storage add-on for this site.
 *
 * A local seven-line rewrite of `@automattic/jetpack-components`'
 * `getProductCheckoutUrl`, which legacy imports. That package exposes
 * only two deep entry points — `./tools/jp-redirect` and a handful of
 * components — and `getProductCheckoutUrl` is not among them, so the
 * only way to reach it is the barrel. `use-connection.ts` records why
 * this dashboard cannot import that barrel at all: it pulls in SCSS that
 * wp-build's bundler will not resolve. Adding an export there is the
 * better long-term fix and belongs in that package with its own
 * changelog entry.
 *
 * Two deliberate differences from the helper it replaces.
 *
 * The site slug is a parameter with no fallback, and callers must not
 * render a link without one. The helper interpolates whatever it is
 * given, so an unknown slug produces `…/checkout/undefined/<product>`;
 * the same class of bug as passing `getRedirectUrl` an undefined `site`,
 * and `usage-details.tsx` documents that one.
 *
 * `redirect_to` is the page the reader is standing on rather than a
 * rebuilt `admin.php?page=jetpack-backup`. Legacy builds that string
 * from `JPBACKUP_INITIAL_STATE.adminUrl`, which the modernized page
 * deliberately does not emit (see `gates/license-key-link.tsx`), and
 * `JP_CONNECTION_INITIAL_STATE` carries no admin URL either. The current
 * URL is the same destination by construction — this section only
 * renders on the Backup dashboard — and it is absolute, which
 * `redirect_to` requires and a relative path could not give.
 *
 * Legacy passes `isUserConnected: true` unconditionally, so the helper's
 * `unlinked=1` branch is dead there; it is simply absent here.
 *
 * @param productSlug - The WordPress.com product slug to buy.
 * @param siteSuffix  - The site's Calypso slug, e.g. `example.wordpress.com`.
 * @return The Calypso checkout URL.
 */
export function storageAddonCheckoutUrl( productSlug: string, siteSuffix: string ): string {
	const url = new URL( `https://wordpress.com/checkout/${ siteSuffix }/${ productSlug }` );

	url.searchParams.set( 'redirect_to', window.location.href );
	url.searchParams.set( 'site', siteSuffix );

	return url.toString();
}

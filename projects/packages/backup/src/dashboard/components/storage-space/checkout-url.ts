import { getProductCheckoutUrl } from '@automattic/jetpack-components';

/**
 * Where the reader lands to buy a storage add-on for this site.
 *
 * A wrapper, not a reimplementation. The URL itself comes from
 * `@automattic/jetpack-components`, which is where legacy gets it and
 * where any future change to Calypso's checkout path will land. This
 * file exists only to hold the two decisions that are ours rather than
 * that helper's, and to keep them in one place instead of at both call
 * sites.
 *
 * The import is the package's barrel, unlike `usage-details.tsx`, which
 * reaches `getRedirectUrl` through the `./tools/jp-redirect` deep entry
 * point. There is no deep entry for this one — `exports` in that
 * package's `package.json` lists ten paths and no
 * `./tools/get-product-checkout-url` — and adding one is the tidier fix,
 * belonging in that package with its own changelog entry. The barrel is
 * safe in the meantime: `index.ts` is 84 lines of re-exports with no
 * top-level stylesheet import, and esbuild tree-shakes it to the one
 * function. Measured on the dashboard route, importing it this way
 * rather than writing the seven lines locally costs about a hundred
 * bytes. Note this package's own `use-connection.ts` warns off a barrel
 * — that warning is about `@automattic/jetpack-connection`, a different
 * package, whose barrel does pull in SCSS.
 *
 * **The site slug has no fallback, and callers must not render a link
 * without one.** The helper interpolates whatever it is given, so an
 * unknown slug produces `…/checkout/undefined/<product>` — the same
 * class of bug as passing `getRedirectUrl` an undefined `site`, which
 * `usage-details.tsx` documents. Requiring a `string` here is what makes
 * the caller decide.
 *
 * **`redirect_to` is the page the reader is standing on**, rather than a
 * rebuilt `admin.php?page=jetpack-backup`. Legacy builds that string
 * from `JPBACKUP_INITIAL_STATE.adminUrl`, which the modernized page
 * deliberately does not emit (see `gates/license-key-link.tsx`), and
 * `JP_CONNECTION_INITIAL_STATE` carries no admin URL either. The current
 * URL is the same destination by construction — this section only
 * renders on the Backup dashboard — and it is absolute, which
 * `redirect_to` requires and a relative path could not give.
 *
 * The final argument is `isUserConnected`, passed `true` as legacy
 * passes it. Its only effect is to suppress an `unlinked=1` query arg,
 * and this section renders only inside `<Gates>`, which has already
 * established a user connection by the time anything here is on screen.
 *
 * @param productSlug - The WordPress.com product slug to buy.
 * @param siteSuffix  - The site's Calypso slug, e.g. `example.wordpress.com`.
 * @return The Calypso checkout URL.
 */
export function storageAddonCheckoutUrl( productSlug: string, siteSuffix: string ): string {
	return getProductCheckoutUrl( productSlug, siteSuffix, window.location.href, true );
}

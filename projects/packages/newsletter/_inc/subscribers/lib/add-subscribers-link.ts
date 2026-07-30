import { getAdminUrl } from '@automattic/jetpack-script-data';
import type { AddSubscribersTab } from '../components/modals/add-subscribers-modal';

const NEWSLETTER_PAGE = 'admin.php?page=jetpack-newsletter';
const HASH_NAME = 'add-subscribers';

const TABS: AddSubscribersTab[] = [ 'manual', 'upload', 'substack' ];
const DEFAULT_TAB: AddSubscribersTab = 'manual';

/**
 * Link to the Subscribers page with the Add Subscribers modal open.
 *
 * Deep-linking rather than rendering the modal in place is deliberate on
 * surfaces outside the Subscribers page: it keeps that page's whole import
 * stack — react-query, the Dialog/Tabs primitives, csv parsing — out of their
 * bundles (wp-build ships each route as one IIFE, so a `React.lazy` boundary
 * would not have split it out), and it shows people where subscriber management
 * lives for the next time they need it.
 *
 * A hash rather than a search param because the Newsletter page is an SPA whose
 * router packs its own path and search into a single `p` param; the hash rides
 * alongside untouched, and {@link readAddSubscribersHash} clears it after use.
 *
 * @param tab - Which tab to open on. Defaults to Manual.
 * @return Absolute admin URL.
 */
export function getAddSubscribersUrl( tab: AddSubscribersTab = DEFAULT_TAB ): string {
	return getAdminUrl( `${ NEWSLETTER_PAGE }#${ HASH_NAME }=${ tab }` );
}

/**
 * Read an Add Subscribers deep link off a URL hash.
 *
 * Accepts the bare `#add-subscribers` as well as `#add-subscribers=<tab>`, so
 * links written before tabs were addressable keep working.
 *
 * @param hash - `window.location.hash`, including the leading `#`.
 * @return Whether the modal should open, and on which tab.
 */
export function readAddSubscribersHash( hash: string ): {
	open: boolean;
	tab: AddSubscribersTab;
} {
	// Capture any non-empty value rather than a restricted character class, so
	// that validation against TABS is the single thing deciding the tab. A
	// narrower pattern would make `=no-such-tab` fail to match at all — not
	// opening the modal — while `=nope` matched and fell back to Manual.
	const match = hash.match( new RegExp( `^#${ HASH_NAME }(?:=(.+))?$` ) );

	if ( ! match ) {
		return { open: false, tab: DEFAULT_TAB };
	}

	const requested = match[ 1 ] as AddSubscribersTab | undefined;

	return {
		open: true,
		tab: requested && TABS.includes( requested ) ? requested : DEFAULT_TAB,
	};
}

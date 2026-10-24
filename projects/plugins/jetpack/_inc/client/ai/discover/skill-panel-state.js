/**
 * Which skill is open in the side panel.
 *
 * The panel lives in boot's route inspector, beside the stage and outside the
 * AI Hub's tree, so the two share state through this module. The open skill is
 * URL state: boot keeps its route in `?p=`, and the panel's `skill=<slug>` is a
 * search param of that route (`?p=/?skill=seo-audit`, as Send keeps
 * `p=/log?entry=12`), which is all the route's inspector gate can see. The tab
 * stays in the real hash (`#/discover`), which boot ignores. Writing the URL
 * through `window.history` rather than the router keeps that hash: the router
 * would fold it into `p`. Boot's router patches `pushState` and
 * `replaceState`, so it notices every write here and asks the gate again.
 *
 * Kept free of styles and components: the route module, built without style
 * loaders, imports the gate from here.
 */

import { useSyncExternalStore } from '@wordpress/element';
import { getSkill } from './skills';

/** The panel's heading, which takes focus when a skill opens. */
export const PANEL_TITLE_ID = 'jetpack-ai-skill-panel-title';

/** The route search param that names the open skill. */
export const SKILL_PARAM = 'skill';

// Marks the history entries the page pushes itself. An entry carrying it always
// has an in-app entry behind it, so going back never leaves wp-admin.
export const IN_APP_HISTORY_KEY = 'jetpackAiHub';

// Boot's route lives in this query param, as a path plus its own search.
const ROUTE_PARAM = 'p';

// Any origin will do: only the route's path and search are read.
const ROUTE_BASE = 'https://route.invalid';

const DISCOVER_HASH = '#/discover';

// Skills had pages of their own at #/discover/<slug> before they opened in the
// side panel. An old link like that names the open skill in the hash instead.
const LEGACY_SKILL_HASH_PREFIX = DISCOVER_HASH + '/';

const isDiscoverEnabled = () => !! window?.jetpackAiSettings?.featureFlags?.[ 'ai-hub-discover' ];

/**
 * The page URL and boot's route inside it.
 *
 * @return {{url: URL, route: URL}} Both, as URLs to edit.
 */
function readUrl() {
	const url = new URL( window.location.href );
	return { url, route: new URL( url.searchParams.get( ROUTE_PARAM ) || '/', ROUTE_BASE ) };
}

/**
 * The address to write back: the route goes into `p`, or `p` leaves the URL
 * when the route is the bare root, as it was before any panel opened.
 *
 * @param {URL} url   - The page URL.
 * @param {URL} route - Boot's route.
 * @return {string} A same-document href.
 */
function writeUrl( url, route ) {
	const path = route.pathname + route.search + route.hash;
	if ( path === '/' ) {
		url.searchParams.delete( ROUTE_PARAM );
	} else {
		url.searchParams.set( ROUTE_PARAM, path );
	}
	return url.pathname + url.search + url.hash;
}

/**
 * The skill a slug names, when it can open here: Discover is on and the skill
 * runs on this kind of site. Anything else opens nothing.
 *
 * @param {unknown} slug - The param's value; the router may parse it as a number.
 * @return {object|undefined} The skill.
 */
export function getPanelSkill( slug ) {
	if ( ! isDiscoverEnabled() || ( typeof slug !== 'string' && typeof slug !== 'number' ) ) {
		return undefined;
	}
	return getSkill( String( slug ), window?.jetpackAiSettings?.isSelfHosted === true );
}

/**
 * The slug an old #/discover/<slug> hash names, valid or not.
 *
 * @return {string} The slug, or '' when the hash isn't one.
 */
function getLegacySkillSlug() {
	const { hash } = window.location;
	return hash.startsWith( LEGACY_SKILL_HASH_PREFIX )
		? hash.slice( LEGACY_SKILL_HASH_PREFIX.length )
		: '';
}

/**
 * The `skill` param as written, valid or not.
 *
 * @return {string} The slug, or '' for none.
 */
export function getSkillParam() {
	return readUrl().route.searchParams.get( SKILL_PARAM ) ?? '';
}

/**
 * The skill whose panel is open: the param names a skill this site can run,
 * and the Discover tab is showing. An old #/discover/<slug> link opens its
 * skill too, as it is: main.jsx rewrites it into the param when the page
 * loads, but not when one is typed or followed mid-session, since boot's
 * router is navigating then and a rewrite would cancel its view transition.
 *
 * @return {string} The slug, or '' when no panel is open.
 */
export function getOpenSkillSlug() {
	const legacySlug = getLegacySkillSlug();
	if ( legacySlug ) {
		return getPanelSkill( legacySlug )?.slug ?? '';
	}
	if ( window.location.hash !== DISCOVER_HASH ) {
		return '';
	}
	return getPanelSkill( getSkillParam() )?.slug ?? '';
}

/**
 * The route's inspector gate: show the panel while `skill` names a skill that
 * can open, or an old #/discover/<slug> hash does. The hash is read too, so a
 * link to another tab that still carries the param never draws an empty panel
 * before the hub drops it.
 *
 * @param {object} search - The route's parsed search params.
 * @return {boolean} Whether to show the inspector.
 */
export function isSkillPanelOpen( search ) {
	const legacySlug = getLegacySkillSlug();
	if ( legacySlug ) {
		return !! getPanelSkill( legacySlug );
	}
	return window.location.hash === DISCOVER_HASH && !! getPanelSkill( search?.[ SKILL_PARAM ] );
}

const listeners = new Set();
const emit = () => listeners.forEach( listener => listener() );

/**
 * Write a new address. Pushed entries carry the in-app marker; a replace keeps
 * the entry's own state, the router's keys included.
 *
 * @param {string}  href    - The address.
 * @param {boolean} replace - Replace the current entry instead of pushing one.
 */
function commit( href, replace ) {
	if ( replace ) {
		window.history.replaceState( window.history.state, '', href );
	} else {
		window.history.pushState( { [ IN_APP_HISTORY_KEY ]: true }, '', href );
	}
	emit();
}

/**
 * The address of a tab with no panel open, for the hub's own tab navigation:
 * any other tab closes the panel.
 *
 * @param {string} view - The view key, e.g. 'mcp/setup'.
 * @return {string} A same-document href.
 */
export function getViewHref( view ) {
	const { url, route } = readUrl();
	route.searchParams.delete( SKILL_PARAM );
	url.hash = '#/' + view;
	return writeUrl( url, route );
}

// How the panel that opens next was asked for, for its Tracks event.
let openSource = null;

/**
 * Open a skill's panel on the Discover tab. A push, so Back closes it.
 *
 * @param {string}  slug              - The skill.
 * @param {object}  [options]         - Options.
 * @param {boolean} [options.replace] - Replace the current entry, for an old link's landing.
 * @param {string}  [options.source]  - What opened it, for Tracks: 'card' (Discover's),
 *                                    'overview' (the Overview's) or 'link'.
 */
export function openSkillPanel( slug, { replace = false, source = 'link' } = {} ) {
	const { url, route } = readUrl();
	route.searchParams.set( SKILL_PARAM, slug );
	url.hash = DISCOVER_HASH;
	openSource = source;
	commit( writeUrl( url, route ), replace );
}

/**
 * Close the panel. A push, as Send's panel closes, so Back opens it again.
 *
 * @param {object}  [options]         - Options.
 * @param {boolean} [options.replace] - Replace the current entry, for a param that opens nothing.
 */
export function closeSkillPanel( { replace = false } = {} ) {
	const { url, route } = readUrl();
	// An old #/discover/<slug> link holds the skill in the hash instead.
	const isLegacy = !! getLegacySkillSlug();
	if ( ! route.searchParams.has( SKILL_PARAM ) && ! isLegacy ) {
		return;
	}
	route.searchParams.delete( SKILL_PARAM );
	if ( isLegacy ) {
		url.hash = DISCOVER_HASH;
	}
	commit( writeUrl( url, route ), replace );
}

/**
 * What opened the panel, read once: a Discover card's View skill, an Overview
 * card, or anything else (a link, an old bookmark, Back or Forward).
 *
 * @return {string} 'card', 'overview' or 'link'.
 */
export function takeOpenSource() {
	const source = openSource ?? 'link';
	openSource = null;
	return source;
}

const subscribeToUrl = onChange => {
	listeners.add( onChange );
	window.addEventListener( 'popstate', onChange );
	window.addEventListener( 'hashchange', onChange );
	return () => {
		listeners.delete( onChange );
		window.removeEventListener( 'popstate', onChange );
		window.removeEventListener( 'hashchange', onChange );
	};
};

/**
 * The open skill's slug, following the URL.
 *
 * @return {string} The slug, or '' when no panel is open.
 */
export function useOpenSkillSlug() {
	return useSyncExternalStore( subscribeToUrl, getOpenSkillSlug, () => '' );
}

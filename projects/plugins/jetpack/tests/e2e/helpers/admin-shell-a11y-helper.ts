import { createRequire } from 'module';
import { type Page } from '@playwright/test';
import { MOUNT_IDS, member, menuLink, waitForShown, withinDocument } from './admin-shell-helper';
import type { AxeResults, ElementContext, RunOptions } from 'axe-core';

export interface Announcement {
	politeness: string;
	text: string;
}

export interface PlaceholderSighting {
	inert: boolean;
	ariaHidden: boolean;
}

/** What the accessibility probe exposes on `window.__jpShellA11y`. */
interface A11yProbe {
	announcements: Announcement[];
	placeholders: PlaceholderSighting[];
}
type ProbeWindow = {
	__jpShellA11y: A11yProbe;
	axe: { run: ( context: ElementContext, options: RunOptions ) => Promise< AxeResults > };
};

const PLACEHOLDERS = '[data-shell-header], .jetpack-admin-shell-placeholder';

/**
 * Records live-region text and the short-lived header placeholders, before the page's scripts run.
 *
 * @param placeholderSelector - Placeholder elements: the client's, then the spike's.
 */
function a11yProbe( placeholderSelector: string ) {
	const LIVE = '[aria-live], [role="status"], [role="alert"], [role="log"]';
	const said: unknown[] = [];
	const placeholders: unknown[] = [];
	const seen = new WeakSet< Element >();

	const politeness = ( el: Element ) =>
		el.getAttribute( 'aria-live' ) ??
		( el.getAttribute( 'role' ) === 'alert' ? 'assertive' : 'polite' );

	const observer = new MutationObserver( records => {
		const touched = new Set< Element >();
		for ( const record of records ) {
			const target = record.target instanceof Element ? record.target : record.target.parentElement;
			const live = target?.closest( LIVE );
			if ( live ) {
				touched.add( live );
			}
			record.addedNodes.forEach( node => {
				if ( node instanceof Element ) {
					if ( node.matches( LIVE ) ) {
						touched.add( node );
					}
					node.querySelectorAll( LIVE ).forEach( el => touched.add( el ) );
				}
			} );
		}
		for ( const live of touched ) {
			const text = live.textContent?.trim();
			if ( text && politeness( live ) !== 'off' ) {
				said.push( { politeness: politeness( live ), text } );
			}
		}
		for ( const el of document.querySelectorAll< HTMLElement >( placeholderSelector ) ) {
			if ( ! seen.has( el ) && el.isConnected && getComputedStyle( el ).display !== 'none' ) {
				seen.add( el );
				placeholders.push( {
					inert: !! el.closest( '[inert]' ),
					ariaHidden: !! el.closest( '[aria-hidden="true"]' ),
				} );
			}
		}
	} );
	observer.observe( document, {
		subtree: true,
		childList: true,
		characterData: true,
		attributes: true,
		attributeFilter: [ 'style', 'class', 'hidden' ],
	} );

	( window as unknown as Record< string, unknown > ).__jpShellA11y = {
		announcements: said,
		placeholders,
	};
}

/**
 * Install the accessibility probe. Call before the first navigation, next to `installShellProbe()`.
 *
 * @param page - Page under test.
 */
export async function installA11yProbe( page: Page ): Promise< void > {
	await page.addInitScript( a11yProbe, PLACEHOLDERS );
}

/**
 * Forget what the probe has recorded, so the next read covers only what follows.
 *
 * @param page - Page under test.
 */
export async function resetA11yProbe( page: Page ): Promise< void > {
	await page.evaluate( () => {
		const probe = ( window as unknown as ProbeWindow ).__jpShellA11y;
		probe.announcements.length = 0;
		probe.placeholders.length = 0;
	} );
}

/**
 * Live-region text recorded since the last reset.
 *
 * @param page - Page under test.
 * @return Announcements in order.
 */
export function announcements( page: Page ): Promise< Announcement[] > {
	return page.evaluate( () => [
		...( window as unknown as ProbeWindow ).__jpShellA11y.announcements,
	] );
}

/**
 * Header placeholders that came on screen since the last reset.
 *
 * @param page - Page under test.
 * @return One entry per placeholder.
 */
export function placeholderSightings( page: Page ): Promise< PlaceholderSighting[] > {
	return page.evaluate( () => [
		...( window as unknown as ProbeWindow ).__jpShellA11y.placeholders,
	] );
}

/**
 * Every member container that is not on screen, with whether it is inert.
 *
 * @param page - Page under test.
 * @return Hidden apps.
 */
export function hiddenApps(
	page: Page
): Promise< { slug: string; state: string; inert: boolean }[] > {
	return page.evaluate( mountIds => {
		const shell = (
			window as unknown as {
				__jpShell: { read: () => { apps: Record< string, string > } };
			}
		 ).__jpShell.read();
		return Object.entries( shell.apps )
			.filter( ( [ , state ] ) => state !== 'visible' )
			.map( ( [ slug, state ] ) => {
				const el =
					document.querySelector( `[data-shell-page="${ slug }"]` ) ??
					document.getElementById( mountIds[ slug ] );
				return { slug, state, inert: !! el?.closest( '[inert]' ) };
			} );
	}, MOUNT_IDS );
}

/**
 * The page heading screen readers see for a member: hidden copies are left out.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 * @return Heading locator.
 */
export function mainHeading( page: Page, slug: string ) {
	return page.getByRole( 'heading', { level: 1, name: member( slug ).heading, exact: true } );
}

/**
 * Activate a sidebar item from the keyboard and wait for its app, without a full page load.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 */
export async function keyboardSwitchTo( page: Page, slug: string ): Promise< void > {
	await withinDocument( page, `switching to ${ slug } from the keyboard`, async () => {
		await menuLink( page, slug ).focus();
		await page.keyboard.press( 'Enter' );
		await waitForShown( page, slug );
	} );
}

/**
 * Where focus is: the member app holding it, `menu`, `body`, or `other`.
 *
 * @param page - Page under test.
 * @return Owner of the focused element.
 */
export function focusOwner( page: Page ): Promise< string > {
	return page.evaluate( mountIds => {
		// eslint-disable-next-line @wordpress/no-global-active-element -- The test reads the whole document.
		const el = document.activeElement;
		if ( ! el || el === document.body ) {
			return 'body';
		}
		const app = Object.keys( mountIds ).find( slug =>
			(
				document.querySelector( `[data-shell-page="${ slug }"]` ) ??
				document.getElementById( mountIds[ slug ] )
			)?.contains( el )
		);
		return app ?? ( el.closest( '#adminmenu' ) ? 'menu' : 'other' );
	}, MOUNT_IDS );
}

/**
 * The app container for `slug` and its ancestors that are `aria-hidden`, as `#id` or tag name.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 * @return Hidden elements, innermost first.
 */
export async function ariaHiddenAncestors( page: Page, slug: string ): Promise< string[] > {
	const hidden = await page.evaluate(
		( [ s, mountId ] ) => {
			const app =
				document.querySelector( `[data-shell-page="${ s }"]` ) ??
				document.getElementById( mountId );
			if ( ! app ) {
				return null;
			}
			const found: string[] = [];
			for ( let el: Element | null = app; el; el = el.parentElement ) {
				if ( el.getAttribute( 'aria-hidden' ) === 'true' ) {
					found.push( el.id ? `#${ el.id }` : el.tagName.toLowerCase() );
				}
			}
			return found;
		},
		[ slug, MOUNT_IDS[ slug ] ]
	);
	if ( ! hidden ) {
		throw new Error( `No app container for ${ slug } in the document` );
	}
	return hidden;
}

const axePath = createRequire( import.meta.url ).resolve( 'axe-core/axe.min.js' );

/**
 * Serious and critical WCAG 2.1 A/AA violations on the page as it is now, keyed by rule.
 *
 * @param page - Page under test.
 * @return Rule ID to the selectors of the failing nodes.
 */
export async function axeViolations( page: Page ): Promise< Record< string, string[] > > {
	if ( ! ( await page.evaluate( () => 'axe' in window ) ) ) {
		await page.addScriptTag( { path: axePath } );
	}
	const results: AxeResults = await page.evaluate( () =>
		( window as unknown as ProbeWindow ).axe.run( document, {
			runOnly: { type: 'tag', values: [ 'wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa' ] },
			resultTypes: [ 'violations' ],
		} )
	);
	return Object.fromEntries(
		results.violations
			.filter( v => v.impact === 'serious' || v.impact === 'critical' )
			.map( v => [ v.id, v.nodes.map( n => n.target.join( ' ' ) ) ] )
	);
}

/**
 * Violations a switch left that a full load of the same page doesn't have.
 *
 * @param page     - Page under test.
 * @param baseline - `axeViolations()` from a full load of the shown page.
 * @return Rule ID to failing selectors, for rules the baseline doesn't fail or fails on fewer nodes.
 */
export async function newViolations(
	page: Page,
	baseline: Record< string, string[] >
): Promise< Record< string, string[] > > {
	const now = await axeViolations( page );
	// Compare node counts, not selectors: the shell's DOM shifts axe's positional selectors.
	return Object.fromEntries(
		Object.entries( now ).filter(
			( [ rule, nodes ] ) => nodes.length > ( baseline[ rule ]?.length ?? 0 )
		)
	);
}

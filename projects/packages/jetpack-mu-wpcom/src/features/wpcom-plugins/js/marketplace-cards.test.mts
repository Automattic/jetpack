import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { JSDOM } from 'jsdom';

/**
 * A card as core's plugin list table prints it, needing WooCommerce.
 *
 * @param slug  - Plugin slug.
 * @param strip - Our strip template's attributes, or '' for a WordPress.org card.
 * @return The card's markup.
 */
function card( slug: string, strip: string ) {
	const template = strip
		? `<template class="wpcom-marketplace-strip" data-plugin="${ slug }" ${ strip }><div class="price">$10</div></template>`
		: '';

	return `<div class="plugin-card plugin-card-${ slug }">
		<div class="plugin-card-top">
			<div class="name column-name"><h3><a class="thickbox open-plugin-details-modal" href="#${ slug }">${ slug }</a></h3></div>
			<div class="desc column-description"><p>About ${ slug }.${ template }</p></div>
			<div class="plugin-dependencies">
				<p class="plugin-dependencies-explainer-text"><strong>Additional plugins are required</strong></p>
				<div class="plugin-dependency">WooCommerce <a class="thickbox open-plugin-details-modal" href="#woocommerce">More Details</a></div>
			</div>
		</div>
		<div class="plugin-card-bottom"><div class="vers column-rating">Rating</div></div>
	</div>`;
}

const dom = new JSDOM( `<!doctype html><form id="plugin-filter"><div id="the-list">
	${ card( 'bookings', 'data-installed="false" data-requires-label="Additional plugins will be installed"' ) }
	${ card( 'nelio', 'data-installed="false"' ) }
	${ card( 'akismet', '' ) }
</div></form>` );
const { document } = dom.window;
const parsed = new Promise( resolve => document.addEventListener( 'DOMContentLoaded', resolve ) );

/**
 * The first element matching a selector.
 *
 * @param selector - CSS selector.
 * @return The element.
 */
function query( selector: string ) {
	return document.querySelector( selector ) as HTMLElement;
}

describe( 'Marketplace cards', () => {
	before( async () => {
		// jsdom fires its own DOMContentLoaded too early for the script, so the page is loaded again once it is in.
		await parsed;
		Object.assign( globalThis, { document, MutationObserver: dom.window.MutationObserver } );
		await import( './marketplace-cards.js' );
		document.dispatchEvent( new dom.window.Event( 'DOMContentLoaded' ) );
	} );

	it( 'swaps our strip into Marketplace cards and leaves WordPress.org cards alone', () => {
		const bookings = query( '.plugin-card-bookings' );

		assert.equal(
			bookings.querySelector( '.plugin-card-bottom' )?.innerHTML,
			'<div class="price">$10</div>'
		);
		assert.ok( bookings.classList.contains( 'wpcom-marketplace-card' ) );
		assert.equal( bookings.dataset.plugin, 'bookings' );
		assert.equal( bookings.dataset.installed, 'false' );
		assert.equal( bookings.querySelector( 'template' ), null );

		assert.ok( query( '.plugin-card-akismet .plugin-card-bottom .column-rating' ) );
		assert.ok( ! query( '.plugin-card-akismet' ).classList.contains( 'wpcom-marketplace-card' ) );
	} );

	it( "keeps a dependency's More Details link out of the card's own details clicks", () => {
		const [ own, dependency ] = query( '.plugin-card-bookings' ).querySelectorAll< HTMLElement >(
			'a.open-plugin-details-modal'
		);

		assert.equal( own.dataset.wpcomMarketplaceTrack, 'details' );
		assert.equal( dependency.dataset.wpcomMarketplaceTrack, undefined );
	} );

	it( "relabels core's dependency notice only on cards that carry a label", () => {
		const heading = ( slug: string ) =>
			query( `.plugin-card-${ slug } .plugin-dependencies-explainer-text strong` ).textContent;

		assert.equal( heading( 'bookings' ), 'Additional plugins will be installed' );
		assert.equal( heading( 'nelio' ), 'Additional plugins are required' );
	} );

	it( 'finishes the cards live search brings in', async () => {
		query( '#plugin-filter' ).innerHTML =
			`<div id="the-list">${ card( 'jobs', 'data-installed="true"' ) }</div>`;
		await new Promise( resolve => setTimeout( resolve ) );

		assert.ok( query( '.plugin-card-jobs' ).classList.contains( 'wpcom-marketplace-card' ) );
	} );
} );

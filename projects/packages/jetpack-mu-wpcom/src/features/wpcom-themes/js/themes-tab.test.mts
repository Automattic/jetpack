import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import vm from 'node:vm';

type FakeNode = {
	tagName: string;
	href?: string;
	dataset: Record< string, string >;
	textContent: string;
	children: FakeNode[];
	appendChild: ( child: FakeNode ) => void;
	prepend: ( child: FakeNode ) => void;
};

type Config = { sort: string; label: string };

const file = new URL( './themes-tab.js', import.meta.url ).pathname;
const source = readFileSync( file, 'utf8' );

/**
 * The parts of an element the script touches.
 *
 * @param tagName - Element to stand in for.
 * @return A fake element.
 */
function fakeNode( tagName: string ): FakeNode {
	const node: FakeNode = {
		tagName,
		dataset: {},
		textContent: '',
		children: [],
		appendChild: child => {
			node.children.push( child );
		},
		prepend: child => {
			node.children.unshift( child );
		},
	};
	return node;
}

/**
 * Runs the script against a fake page.
 *
 * The script is a plain file served to the browser rather than a module, so it runs here the
 * way it runs there: top to bottom, against whatever globals exist. `filename` keeps coverage
 * attributed to the real file.
 *
 * @param list   - What `.wp-filter .filter-links` resolves to, or null.
 * @param config - The localized `wpcomThemesTab` object, or undefined.
 * @return The selectors the script queried.
 */
function run( list: FakeNode | null, config?: Config ): string[] {
	const selectors: string[] = [];
	const context = {
		document: {
			querySelector: ( selector: string ) => {
				selectors.push( selector );
				return list;
			},
			createElement: ( tagName: string ) => fakeNode( tagName ),
		},
		window: { wpcomThemesTab: config },
		wpcomThemesTab: config,
	};

	vm.createContext( context );
	new vm.Script( source, { filename: file } ).runInContext( context );

	return selectors;
}

describe( 'themes-tab', () => {
	it( 'adds the tab as the first filter link', () => {
		const list = fakeNode( 'ul' );
		list.children.push( fakeNode( 'li' ) );

		const selectors = run( list, { sort: 'wpcom', label: 'Marketplace' } );

		assert.deepEqual( selectors, [ '.wp-filter .filter-links' ] );
		assert.equal( list.children.length, 2 );

		const [ link ] = list.children[ 0 ].children;
		assert.equal( link.tagName, 'a' );
		assert.equal( link.href, '#' );
		assert.equal( link.dataset.sort, 'wpcom' );
		assert.equal( link.textContent, 'Marketplace' );
	} );

	it( 'does nothing when the screen has no filter links', () => {
		assert.doesNotThrow( () => run( null, { sort: 'wpcom', label: 'Marketplace' } ) );
	} );

	it( 'does nothing when the config is missing', () => {
		const list = fakeNode( 'ul' );

		run( list, undefined );

		assert.equal( list.children.length, 0 );
	} );
} );

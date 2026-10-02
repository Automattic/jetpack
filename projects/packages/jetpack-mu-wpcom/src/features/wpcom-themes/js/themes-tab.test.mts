import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import vm from 'node:vm';

type FakeNode = {
	tagName?: string;
	href?: string;
	dataset: Record< string, string >;
	textContent?: string;
	children: FakeNode[];
	appendChild: ( child: FakeNode ) => void;
	prepend: ( child: FakeNode ) => void;
};

/**
 * A stand-in for the elements the script touches.
 *
 * @param tagName - Element to stand in for.
 * @return A fake element.
 */
function node( tagName?: string ): FakeNode {
	const el: FakeNode = {
		tagName,
		dataset: {},
		children: [],
		appendChild: child => void el.children.push( child ),
		prepend: child => void el.children.unshift( child ),
	};
	return el;
}

it( 'adds the tab as the first filter link', () => {
	const list = node( 'ul' );
	list.children.push( node( 'li' ) );
	const config = { sort: 'wpcom', label: 'Marketplace' };

	// Run as the browser does — a plain file, not a module — with `filename` set so coverage
	// lands on the real path.
	const context = {
		document: {
			querySelector: () => list,
			createElement: node,
		},
		window: { wpcomThemesTab: config },
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	assert.equal( list.children.length, 2 );
	const [ link ] = list.children[ 0 ].children;
	assert.equal( link.dataset.sort, 'wpcom' );
	assert.equal( link.textContent, 'Marketplace' );
} );

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { it } from 'node:test';
import vm from 'node:vm';

type FakeNode = {
	tagName?: string;
	href?: string;
	className?: string;
	dataset: Record< string, string >;
	textContent?: string;
	children: FakeNode[];
	appendChild: ( child: FakeNode ) => void;
	prepend: ( child: FakeNode ) => void;
	classList: { contains: ( name: string ) => boolean };
	replaceWith: ( replacement: FakeNode ) => void;
	insertAdjacentElement: ( position: string, element: FakeNode ) => void;
	querySelector: ( selector: string ) => FakeNode | null;
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
		classList: { contains: name => ( el.className ?? '' ).split( ' ' ).includes( name ) },
		replaceWith: replacement => void el.children.push( replacement ),
		insertAdjacentElement: ( _position, element ) => void el.children.push( element ),
		querySelector: () => null,
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

it( "offers the plan a theme needs in place of core's install button", () => {
	const install = node( 'a' );
	install.className = 'button button-primary button-compact theme-install';
	const screenshot = node( 'div' );
	const card = node( 'div' );
	card.querySelector = selector => ( selector === '.theme-screenshot' ? screenshot : install );

	const theme = {
		upgrade_url: 'https://wordpress.com/checkout/example.org/business-bundle',
		upgrade_plan: 'Business plan',
	};
	const Theme = { prototype: { render: () => 'rendered' } };
	const config = { sort: 'wpcom', label: 'Marketplace', upgrade: 'Upgrade' };
	const context = {
		document: { querySelector: () => null, createElement: node },
		window: { wpcomThemesTab: config, wp: { themes: { view: { Theme } } } },
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	const returned = Theme.prototype.render.call( { el: card, model: { toJSON: () => theme } } );

	// Core installs on a click anywhere in .theme-install, so the button is replaced, not relabelled.
	const [ upgrade ] = install.children;
	assert.equal( returned, 'rendered' );
	assert.equal( upgrade.textContent, 'Upgrade' );
	assert.equal( upgrade.href, theme.upgrade_url );
	assert.equal( upgrade.className, 'button button-primary button-compact' );
	assert.equal( screenshot.children[ 0 ].textContent, 'Business plan' );
} );

it( 'leaves a theme the plan includes to core', () => {
	const card = node( 'div' );
	let asked = false;
	card.querySelector = () => {
		asked = true;
		return null;
	};

	const Theme = { prototype: { render: () => undefined } };
	const config = { sort: 'wpcom', label: 'Marketplace', upgrade: 'Upgrade' };
	const context = {
		document: { querySelector: () => null, createElement: node },
		window: { wpcomThemesTab: config, wp: { themes: { view: { Theme } } } },
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	Theme.prototype.render.call( { el: card, model: { toJSON: () => ( { slug: 'ury' } ) } } );

	assert.equal( asked, false );
} );

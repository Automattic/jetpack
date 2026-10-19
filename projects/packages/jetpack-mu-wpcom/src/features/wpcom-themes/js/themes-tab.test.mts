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
	hidden?: boolean;
	children: FakeNode[];
	appendChild: ( child: FakeNode ) => void;
	prepend: ( child: FakeNode ) => void;
	classList: { contains: ( name: string ) => boolean };
	replaceWith: ( replacement: FakeNode ) => void;
	insertAdjacentElement: ( position: string, element: FakeNode ) => void;
	querySelector: ( selector: string ) => FakeNode | null;
	setAttribute: ( name: string, value: string ) => void;
	attributes: Record< string, string >;
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
		attributes: {},
		setAttribute: ( name, value ) => void ( el.attributes[ name ] = value ),
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
		name: 'Example',
		upgrade_url: 'https://wordpress.com/checkout/example.org/example-bundle',
		plan_badge: 'Example plan',
	};
	const Theme = { prototype: { render: () => 'rendered' } };
	const config = {
		sort: 'wpcom',
		label: 'Marketplace',
		upgrade: 'Upgrade',
		upgradeLabel: 'Upgrade for %s',
	};
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
	assert.equal( screenshot.children[ 0 ].textContent, 'Example plan' );
	// Core names the theme in its own button labels, and a grid of cards needs that.
	assert.equal( upgrade.attributes[ 'aria-label' ], 'Upgrade for Example' );
} );

it( 'names the plan beside the author in the theme preview', () => {
	const install = node( 'a' );
	install.className = 'button button-primary theme-install';
	const author = node( 'h5' );
	author.className = 'theme-by';
	const overlay = node( 'div' );
	overlay.querySelector = selector => ( selector === '.theme-by' ? author : install );

	const theme = {
		name: 'Example',
		upgrade_url: 'https://wordpress.com/checkout/example.org/example-bundle',
		plan_badge: 'Example plan',
	};
	const Preview = { prototype: { render: () => 'rendered' } };
	const config = {
		sort: 'wpcom',
		label: 'Marketplace',
		upgrade: 'Upgrade',
		upgradeLabel: 'Upgrade for %s',
	};
	const context = {
		document: { querySelector: () => null, createElement: node },
		window: {
			wpcomThemesTab: config,
			wp: { themes: { view: { Theme: { prototype: { render: () => undefined } }, Preview } } },
		},
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	Preview.prototype.render.call( { el: overlay, model: { toJSON: () => theme } } );

	const [ badge ] = author.children;
	assert.equal( badge.textContent, 'Example plan' );
	assert.equal( badge.className, 'wpcom-themes-tab__plan' );
	assert.equal( install.children[ 0 ].className, 'button button-primary' );
} );

it( 'badges a theme the plan includes without taking its install away', () => {
	const install = node( 'a' );
	install.className = 'button button-primary button-compact theme-install';
	const screenshot = node( 'div' );
	const card = node( 'div' );
	card.querySelector = selector => ( selector === '.theme-screenshot' ? screenshot : install );

	const theme = { name: 'Example', plan_badge: 'Included with plan' };
	const Theme = { prototype: { render: () => 'rendered' } };
	const config = {
		sort: 'wpcom',
		label: 'Marketplace',
		upgrade: 'Upgrade',
		upgradeLabel: 'Upgrade for %s',
	};
	const context = {
		document: { querySelector: () => null, createElement: node },
		window: { wpcomThemesTab: config, wp: { themes: { view: { Theme } } } },
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	Theme.prototype.render.call( { el: card, model: { toJSON: () => theme } } );

	assert.equal( screenshot.children[ 0 ].textContent, 'Included with plan' );
	// Nothing replaced core's button, so its own install still runs.
	assert.equal( install.children.length, 0 );
} );

/**
 * Renders a partner theme's card against a store that answers however the test says.
 *
 * @param theme - The theme being rendered.
 * @param fetch - Stands in for the browser's own, which the script prices the theme with.
 * @return The badge's element and the buttons the card ended up with.
 */
async function priceCard( theme: Record< string, string >, fetch: () => Promise< unknown > ) {
	const install = node( 'a' );
	install.className = 'button button-primary button-compact theme-install';
	const screenshot = node( 'div' );
	const card = node( 'div' );
	card.querySelector = selector => ( selector === '.theme-screenshot' ? screenshot : install );

	const Theme = { prototype: { render: () => 'rendered' } };
	const config = {
		sort: 'wpcom',
		label: 'Marketplace',
		subscribe: 'Subscribe',
		subscribeLabel: 'Subscribe to %s',
		products: 'https://public-api.wordpress.com/rest/v1.1/products',
		price: '%s/mo, billed annually',
		priceWithPlan: '%1$s/mo, billed annually + %2$s',
	};
	const context = {
		document: { querySelector: () => null, createElement: node },
		window: { wpcomThemesTab: config, wp: { themes: { view: { Theme } } } },
		wpcomThemesTab: config,
		fetch,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	Theme.prototype.render.call( { el: card, model: { toJSON: () => theme } } );
	// The price arrives from the store rather than with the card.
	await new Promise( resolve => setTimeout( resolve, 0 ) );

	return { badge: screenshot.children[ 0 ], install };
}

const STORE = {
	ok: true,
	json: () => Promise.resolve( { theme_stax_yearly: { cost_per_month_display: '£7.42' } } ),
};

it( "prices a partner theme in the reader's own currency, and sells it", async () => {
	const { badge, install } = await priceCard(
		{
			name: 'STAX',
			price_product: 'theme_stax_yearly',
			price_plan: '',
			purchase_url: 'https://wordpress.com/checkout/example.org/theme_stax_yearly',
		},
		() => Promise.resolve( STORE )
	);

	assert.equal( badge.textContent, '£7.42/mo, billed annually' );
	assert.equal( badge.hidden, false );
	const [ subscribe ] = install.children;
	assert.equal( subscribe.textContent, 'Subscribe' );
	assert.equal( subscribe.attributes[ 'aria-label' ], 'Subscribe to STAX' );
} );

it( 'adds the plan a site still needs, so the price is not read as the whole cost', async () => {
	const { badge } = await priceCard(
		{
			name: 'STAX',
			price_product: 'theme_stax_yearly',
			price_plan: 'Personal plan',
			purchase_url: 'https://wordpress.com/checkout/example.org/personal-bundle,theme_stax_yearly',
		},
		() => Promise.resolve( STORE )
	);

	assert.equal( badge.textContent, '£7.42/mo, billed annually + Personal plan' );
} );

it( 'says nothing rather than nothing-in-particular when the store cannot be reached', async () => {
	const { badge } = await priceCard(
		{
			name: 'STAX',
			price_product: 'theme_stax_yearly',
			price_plan: '',
			purchase_url: 'https://wordpress.com/checkout/example.org/theme_stax_yearly',
		},
		() => Promise.reject( new Error( 'offline' ) )
	);

	assert.equal( badge.hidden, true );
	assert.equal( badge.textContent, undefined );
} );

it( 'leaves a theme from WordPress.org to core', () => {
	const card = node( 'div' );
	let asked = false;
	card.querySelector = () => {
		asked = true;
		return null;
	};

	const Theme = { prototype: { render: () => undefined } };
	const config = {
		sort: 'wpcom',
		label: 'Marketplace',
		upgrade: 'Upgrade',
		upgradeLabel: 'Upgrade for %s',
	};
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

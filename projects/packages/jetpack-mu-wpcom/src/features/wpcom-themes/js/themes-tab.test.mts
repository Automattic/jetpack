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
	value?: string;
	listeners: Record< string, () => void >;
	addEventListener: ( type: string, handler: () => void ) => void;
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
		listeners: {},
		addEventListener: ( type, handler ) => void ( el.listeners[ type ] = handler ),
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
			addEventListener: () => {},
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
		slug: 'example',
		name: 'Example',
		theme_tier: 'personal',
		required_plan: 'personal-bundle',
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
		document: { querySelector: () => null, createElement: node, addEventListener: () => {} },
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
	assert.deepEqual( upgrade.dataset, {
		wpcomThemesTrack: 'upgrade',
		theme: 'example',
		themeTier: 'personal',
		requiredPlan: 'personal-bundle',
		context: 'card',
		source: 'tab',
	} );
} );

it( 'names the plan beside the author in the theme preview', () => {
	const install = node( 'a' );
	install.className = 'button button-primary theme-install';
	const author = node( 'h5' );
	author.className = 'theme-by';
	const overlay = node( 'div' );
	overlay.querySelector = selector => ( selector === '.theme-by' ? author : install );

	const theme = {
		slug: 'example',
		name: 'Example',
		theme_tier: 'personal',
		required_plan: 'personal-bundle',
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
		document: { querySelector: () => null, createElement: node, addEventListener: () => {} },
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
	assert.equal( install.children[ 0 ].dataset.context, 'preview' );
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
		document: { querySelector: () => null, createElement: node, addEventListener: () => {} },
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
async function priceCard( theme: Record< string, unknown >, fetch: () => Promise< unknown > ) {
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
		document: { querySelector: () => null, createElement: node, addEventListener: () => {} },
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
			slug: 'organic-stax',
			name: 'STAX',
			theme_tier: 'partner',
			required_plan: 'personal-bundle',
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
	assert.deepEqual( subscribe.dataset, {
		wpcomThemesTrack: 'subscribe',
		theme: 'organic-stax',
		themeTier: 'partner',
		requiredPlan: 'personal-bundle',
		context: 'card',
		source: 'tab',
	} );
} );

it( 'credits a purchase offered at the top of a search to the search', async () => {
	const { install } = await priceCard(
		{
			name: 'STAX',
			price_product: 'theme_stax_yearly',
			purchase_url: 'https://wordpress.com/checkout/example.org/theme_stax_yearly',
			wpcom_search_slot: true,
		},
		() => Promise.resolve( STORE )
	);

	assert.equal( install.children[ 0 ].dataset.source, 'search' );
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
		document: { querySelector: () => null, createElement: node, addEventListener: () => {} },
		window: { wpcomThemesTab: config, wp: { themes: { view: { Theme } } } },
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	Theme.prototype.render.call( { el: card, model: { toJSON: () => ( { slug: 'ury' } ) } } );

	assert.equal( asked, false );
} );

/**
 * Loads the script with the hooks the origin marker uses, then renders themes through its decorator.
 *
 * @return The captured hooks and a way to render a theme as the tab, or as another tab, would.
 */
function markerPage() {
	type Prefilter = ( options: { data?: unknown } ) => void;
	type Listener = ( event: { target: unknown } ) => void;

	let prefilter: Prefilter | undefined;
	const listeners: Record< string, Listener > = {};
	const Theme = { prototype: { render: () => undefined } };
	const config = { sort: 'wpcom', label: 'Marketplace' };
	const context = {
		URL,
		URLSearchParams,
		document: {
			querySelector: () => null,
			createElement: node,
			addEventListener: ( type: string, handler: Listener ) => ( listeners[ type ] = handler ),
		},
		window: {
			wpcomThemesTab: config,
			location: { href: 'https://example.org/wp-admin/theme-install.php' },
			jQuery: { ajaxPrefilter: ( handler: Prefilter ) => ( prefilter = handler ) },
			wp: { themes: { view: { Theme } } },
		},
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	return {
		render: ( theme: Record< string, unknown > ) =>
			Theme.prototype.render.call( { el: node( 'div' ), model: { toJSON: () => theme } } ),
		install: ( data: string ) => {
			const options = { data };
			prefilter?.( options );
			return options.data;
		},
		activate: ( type: string, stylesheet: string ) => {
			const link = {
				href: `https://example.org/wp-admin/themes.php?action=activate&stylesheet=${ stylesheet }&_wpnonce=x`,
			};
			listeners[ type ]?.( { target: { closest: () => link } } );
			return new URL( link.href ).searchParams.get( 'wpcom_themes_origin' );
		},
	};
}

it( 'marks an install of a theme the tab listed', () => {
	const page = markerPage();
	page.render( { slug: 'organic-stax', wpcom_marketplace_tab: true } );

	assert.equal(
		page.install( 'action=install-theme&slug=organic-stax' ),
		'action=install-theme&slug=organic-stax&wpcom_themes_origin=marketplace-tab'
	);
	assert.equal(
		page.install( 'action=install-theme&slug=other' ),
		'action=install-theme&slug=other'
	);
} );

it( 'marks Activate for a theme the tab listed, however it is opened', () => {
	const page = markerPage();
	page.render( { slug: 'organic-stax', wpcom_marketplace_tab: true } );
	page.render( { slug: 'other' } );

	assert.equal( page.activate( 'click', 'organic-stax' ), 'marketplace-tab' );
	assert.equal( page.activate( 'auxclick', 'organic-stax' ), 'marketplace-tab' );
	assert.equal( page.activate( 'click', 'other' ), null );
} );

it( 'stops marking a theme once it renders outside the tab', () => {
	const page = markerPage();
	page.render( { slug: 'organic-stax', wpcom_marketplace_tab: true } );
	page.render( { slug: 'organic-stax' } );

	assert.equal(
		page.install( 'action=install-theme&slug=organic-stax' ),
		'action=install-theme&slug=organic-stax'
	);
	assert.equal( page.activate( 'click', 'organic-stax' ), null );
} );

/**
 * Loads the script on a page with core's filter bar and theme collection.
 *
 * @return The pricing filter, and what core's collection and installer were asked for.
 */
function pricingPage() {
	const list = node( 'ul' );
	const requests: unknown[] = [];
	const browsed: string[] = [];
	const Collection = {
		prototype: { query: ( request: unknown ) => void requests.push( request ) },
	};
	const config = { sort: 'wpcom', label: 'Marketplace', included: 'included' };
	const context = {
		document: { querySelector: () => list, createElement: node, addEventListener: () => {} },
		window: {
			wpcomThemesTab: config,
			wp: {
				themes: {
					view: { Theme: { prototype: { render: () => undefined } } },
					Collection,
					RunInstaller: { view: { browse: ( section: string ) => void browsed.push( section ) } },
				},
			},
		},
		wpcomThemesTab: config,
	};
	const file = new URL( './themes-tab.js', import.meta.url ).pathname;
	vm.createContext( context );
	new vm.Script( readFileSync( file, 'utf8' ), { filename: file } ).runInContext( context );

	const pricing = list.children.find( child => child.className === 'wpcom-themes-tab__pricing' );
	assert.ok( pricing );

	return {
		pricing,
		select: pricing.children[ 1 ],
		query: ( request: Record< string, unknown > ) => Collection.prototype.query.call( {}, request ),
		// The script builds some requests in the vm's realm, which a strict deepEqual tells apart.
		requests: () => JSON.parse( JSON.stringify( requests ) ),
		browsed,
	};
}

it( "narrows the tab's query and its later pages, and nothing else, to what the plan includes", () => {
	const page = pricingPage();
	page.query( { browse: 'wpcom' } );
	assert.equal( page.pricing.hidden, false );

	page.select.value = 'included';
	page.query( { browse: 'wpcom' } );
	page.query( { browse: 'wpcom', wpcom_pricing: 'included', page: 2 } );
	page.query( { browse: 'popular' } );
	assert.equal( page.pricing.hidden, true );
	page.query( { search: 'blog' } );

	assert.deepEqual( page.requests(), [
		{ browse: 'wpcom' },
		{ browse: 'wpcom', wpcom_pricing: 'included' },
		{ browse: 'wpcom', wpcom_pricing: 'included', page: 2 },
		{ browse: 'popular' },
		{ search: 'blog' },
	] );
} );

it( 'lists the tab again when the filter changes', () => {
	const page = pricingPage();
	page.select.listeners.change();

	assert.deepEqual( page.browsed, [ 'wpcom' ] );
} );

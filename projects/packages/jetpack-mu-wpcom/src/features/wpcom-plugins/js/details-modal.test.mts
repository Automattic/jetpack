import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { keepDetailsModals } from './details-modal.js';

type Handler = ( ...args: unknown[] ) => unknown;

/**
 * The parts of an element the details modal touches.
 */
class FakeElement {
	id: string;
	src = '';
	dataset: Record< string, string > = {};
	style: Record< string, string > = {};
	children: FakeElement[] = [];
	hidden = false;
	removed = false;

	constructor( id = '' ) {
		this.id = id;
	}

	removeAttribute() {
		this.id = '';
	}

	querySelectorAll() {
		return this.children.filter( child => child.id.startsWith( 'TB_' ) || child.dataset.wpcomTbId );
	}

	querySelector() {
		return this.children.find( child => child.src ) ?? null;
	}

	focus() {
		page.focused = this;
	}
}

let page: ReturnType< typeof fakePage >;

/**
 * An Add Plugins page with thickbox, plugin-install.js and jQuery stood in for.
 *
 * @return The page, and what core did to it.
 */
function fakePage() {
	const elements: FakeElement[] = [];
	const bodyHandlers: Record< string, Handler[] > = {};
	const fades: Handler[] = [];
	const classes = new Set< string >();
	let onGridClick: Handler = () => {};

	const doc = {
		body: {
			classList: {
				add: ( c: string ) => classes.add( c ),
				remove: ( c: string ) => classes.delete( c ),
			},
		},
		getElementById: ( id: string ) => elements.find( el => el.id === id && ! el.removed ) ?? null,
		querySelector: () => ( {
			addEventListener: ( _type: string, handler: Handler ) => ( onGridClick = handler ),
		} ),
	};

	const state = {
		doc,
		fades,
		classes,
		focused: null as FakeElement | null,
		coreOpens: 0,
		coreRemoves: 0,
		positions: 0,

		/**
		 * A card's Details link.
		 *
		 * @param plugin    - Plugin slug.
		 * @param installed - Whether the card is for an installed plugin.
		 * @return The link.
		 */
		link( plugin: string, installed = false ) {
			const card = { dataset: { installed: installed ? 'true' : 'false' } };
			const link = new FakeElement();
			return Object.assign( link, {
				href: `https://example.com/wp-admin/plugin-install.php?tab=plugin-information&plugin=${ plugin }&TB_iframe=true`,
				closest: () => card,
			} );
		},

		/**
		 * Clicks a Details link, opening a fresh modal as core would unless the click is stopped.
		 *
		 * @param link - The link.
		 * @return Whether the click was stopped before core saw it.
		 */
		click( link: FakeElement & { href: string } ) {
			let stopped = false;
			onGridClick( {
				target: { closest: () => link },
				preventDefault: () => {},
				stopPropagation: () => ( stopped = true ),
			} );
			if ( ! stopped ) {
				state.coreOpens++;
				const iframe = Object.assign( new FakeElement( 'TB_iframeContent' ), {
					src: link.href.split( 'TB_' )[ 0 ],
				} );
				const modal = new FakeElement( 'TB_window' );
				modal.children = [ new FakeElement( 'TB_closeWindowButton' ), iframe ];
				elements.push( new FakeElement( 'TB_overlay' ), modal, ...modal.children );
				classes.add( 'modal-open' );
			}
			return stopped;
		},

		/** Finishes loading the open modal's iframe. */
		load() {
			( bodyHandlers[ 'thickbox:iframe:loaded' ] ?? [] ).forEach( handler => handler() );
		},

		/** Lets every running fade finish. */
		finishFades() {
			fades.splice( 0 ).forEach( done => done() );
		},

		/**
		 * The modal currently answering to #TB_window.
		 *
		 * @return The modal, or null when none is open.
		 */
		modal: () => doc.getElementById( 'TB_window' ),
	};

	const $ = ( target: unknown ) => ( {
		on: ( type: string, handler: Handler ) => {
			if ( target === doc.body ) {
				( bodyHandlers[ type ] ??= [] ).push( handler );
			}
		},
		off: () => {},
		show: () => ( ( target as FakeElement ).hidden = false ),
		trigger: ( type: string ) => ( bodyHandlers[ type ] ?? [] ).forEach( handler => handler() ),
		fadeOut: ( _speed: string, done: Handler ) => {
			( target as FakeElement ).hidden = true;
			fades.push( done );
		},
		remove: () => ( target as FakeElement[] ).forEach( el => ( el.removed = true ) ),
	} );

	Object.assign( globalThis, {
		jQuery: $,
		window: {
			location: { href: 'https://example.com/wp-admin/plugin-install.php' },
			tb_position: () => state.positions++,
			tb_remove: () => {
				state.coreRemoves++;
				elements.filter( el => el.id.startsWith( 'TB_' ) ).forEach( el => ( el.removed = true ) );
				classes.delete( 'modal-open' );
			},
		},
	} );

	return state;
}

/**
 * Closes the open modal the way its Close button does.
 */
function close() {
	( globalThis as unknown as { window: { tb_remove: Handler } } ).window.tb_remove();
}

describe( 'keepDetailsModals', () => {
	beforeEach( () => {
		page = fakePage();
		keepDetailsModals( page.doc );
	} );

	it( 'reopens a closed modal without core rebuilding it', () => {
		const yoast = page.link( 'yoast' );

		page.click( yoast );
		page.load();
		const modal = page.modal();
		close();
		page.finishFades();

		assert.equal( page.modal(), null, 'a hidden modal gives up the thickbox ids' );
		assert.equal( page.coreRemoves, 0 );

		assert.equal( page.click( yoast ), true );
		assert.equal( page.modal(), modal );
		assert.equal( modal?.hidden, false );
		assert.equal( page.coreOpens, 1 );
		assert.equal( page.positions, 1 );
		assert.ok( page.classes.has( 'modal-open' ) );
	} );

	it( 'gives focus back to the link that opened it', () => {
		const yoast = page.link( 'yoast' );

		page.click( yoast );
		page.load();
		close();
		page.finishFades();

		assert.equal( page.focused, yoast );
		assert.equal( page.classes.has( 'modal-open' ), false );
	} );

	it( 'lets core remove a modal that had not finished loading', () => {
		const yoast = page.link( 'yoast' );

		page.click( yoast );
		close();

		assert.equal( page.coreRemoves, 1 );
		assert.equal( page.click( yoast ), false );
	} );

	it( 'leaves an installed plugin to core, since its buttons change', () => {
		const mailpoet = page.link( 'mailpoet', true );

		page.click( mailpoet );
		page.load();
		close();

		assert.equal( page.coreRemoves, 1 );
		assert.equal( page.click( mailpoet ), false );
	} );

	it( 'ignores a second close while the first is still fading', () => {
		const yoast = page.link( 'yoast' );

		page.click( yoast );
		page.load();
		const modal = page.modal();
		close();
		close();
		page.finishFades();

		assert.equal( page.coreRemoves, 0 );
		assert.equal( page.click( yoast ), true );
		assert.equal( page.modal(), modal );
	} );

	it( 'keeps the three most recent and discards the rest', () => {
		const links = [ 'a', 'b', 'c', 'd' ].map( plugin => page.link( plugin ) );
		const modals = links.map( link => {
			page.click( link );
			page.load();
			const modal = page.modal();
			close();
			page.finishFades();
			return modal;
		} );

		assert.equal( modals[ 0 ]?.removed, true );
		assert.equal( page.click( links[ 0 ] ), false );
		assert.equal( page.click( links[ 3 ] ), true );
	} );

	it( 'leaves thickbox modals it did not open to core', () => {
		close();

		assert.equal( page.coreRemoves, 1 );
	} );
} );

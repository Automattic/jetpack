import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';
import { recordLinkClick } from './tracks.ts';
import type { MouseEvent } from 'react';

type Queue = unknown[] & { push: ( ...items: unknown[] ) => number };

let queue: unknown[][];
let assigned: string[];

/**
 * Point the page's globals at a fake Tracks queue and location.
 *
 * @param active - Whether the Tracks client has loaded and taken over the queue.
 */
function setWindow( active: boolean ) {
	queue = [];
	assigned = [];
	const tkq = [] as unknown as Queue;
	if ( active ) {
		tkq.push = ( ...items: unknown[] ) => queue.push( ...( items as unknown[][] ) );
	}
	( globalThis as unknown as { window: unknown } ).window = {
		_tkq: tkq,
		location: { assign: ( href: string ) => assigned.push( href ) },
	};
}

/**
 * Build a click on a link.
 *
 * @param overrides - Event fields to change from a plain left click.
 * @return The event and whether its default was prevented.
 */
function click( overrides: Record< string, unknown > = {} ) {
	const state = { prevented: false };
	const event = {
		button: 0,
		metaKey: false,
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
		defaultPrevented: false,
		currentTarget: { href: 'https://example.com/tool', target: '' },
		preventDefault: () => {
			state.prevented = true;
		},
		...overrides,
	} as unknown as MouseEvent< HTMLAnchorElement >;
	return { event, state };
}

/**
 * The names of the events recorded so far.
 *
 * @return Event names, in order.
 */
function recordedNames() {
	return queue.filter( item => item[ 0 ] === 'recordEvent' ).map( item => item[ 1 ] );
}

describe( 'recordLinkClick', () => {
	beforeEach( () => mock.timers.enable( { apis: [ 'setTimeout' ] } ) );
	afterEach( () => mock.timers.reset() );

	it( 'holds a plain click until the pixel can leave, then follows the link', () => {
		setWindow( true );
		const { event, state } = click();

		recordLinkClick( event, 'wpcom_my_jetpack_tool_clicked', { tool: 'scan' } );

		const [ , name, properties ] = queue.find( item => item[ 0 ] === 'recordEvent' ) ?? [];
		assert.equal( name, 'wpcom_my_jetpack_tool_clicked' );
		assert.equal( ( properties as Record< string, unknown > ).tool, 'scan' );
		assert.equal( state.prevented, true );
		assert.deepEqual( assigned, [] );

		mock.timers.tick( 250 );
		assert.deepEqual( assigned, [ 'https://example.com/tool' ] );
	} );

	for ( const [ label, overrides ] of [
		[ 'a cmd-click', { metaKey: true } ],
		[ 'a ctrl-click', { ctrlKey: true } ],
		[ 'a shift-click', { shiftKey: true } ],
		[ 'an alt-click', { altKey: true } ],
		[ 'a middle click', { button: 1 } ],
		[ 'a click another handler took', { defaultPrevented: true } ],
		[
			'a link with its own target',
			{ currentTarget: { href: 'https://example.com', target: '_blank' } },
		],
	] as const ) {
		it( `records ${ label } but lets the browser handle it`, () => {
			setWindow( true );
			const { event, state } = click( overrides );

			recordLinkClick( event, 'wpcom_my_jetpack_tool_clicked' );

			assert.deepEqual( recordedNames(), [ 'wpcom_my_jetpack_tool_clicked' ] );
			assert.equal( state.prevented, false );
		} );
	}

	it( 'does not hold the click before the Tracks client loads', () => {
		setWindow( false );
		const { event, state } = click();

		recordLinkClick( event, 'wpcom_my_jetpack_tool_clicked' );

		assert.equal( state.prevented, false );
	} );
} );

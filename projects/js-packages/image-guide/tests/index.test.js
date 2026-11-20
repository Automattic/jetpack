import { jest } from '@jest/globals';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MeasurableImage } from '../src/MeasurableImage.ts';
import { commands } from '../src/stores/store.ts';

let roots = [];
let deferCommit = false;
let onLoad;
const createOwnedRoot = jest.fn( target => {
	const root = createRoot( target );
	const render = jest.fn( element => {
		if ( ! deferCommit ) root.render( element );
	} );
	roots.push( { target, root, render } );
	return { render, unmount: () => root.unmount() };
} );
jest.unstable_mockModule( 'react-dom/client', () => ( { createRoot: createOwnedRoot } ) );
const { setupImageGuideUI } = await import( '../src/index.ts' );
const { attachGuides } = await import( '../src/initialize.ts' );
beforeEach( () => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	roots = [];
	deferCommit = false;
	createOwnedRoot.mockClear();
	commands.setGuideState( 'active' );
	jest
		.spyOn( MeasurableImage.prototype, 'getFileSize' )
		.mockResolvedValue( { width: 800, height: 800 } );
	jest.spyOn( MeasurableImage.prototype, 'isImageTiny' ).mockResolvedValue( false );
	const addListener = window.addEventListener.bind( window );
	jest.spyOn( window, 'addEventListener' ).mockImplementation( ( event, callback, options ) => {
		if ( event === 'load' ) onLoad = callback;
		else addListener( event, callback, options );
	} );
} );

afterEach( () => {
	act( () => roots.forEach( ( { root } ) => root.unmount() ) );
	document.body.replaceChildren();
	MeasurableImage.prototype.getFileSize.mockRestore();
	MeasurableImage.prototype.isImageTiny.mockRestore();
	window.addEventListener.mockRestore();
} );

function fixture( position = 'relative', background = false ) {
	const owner = document.createElement( 'div' );
	owner.style.position = position;
	owner.style.display = 'block';
	owner.style.zIndex = 'auto';
	const content = document.createElement( 'span' );
	content.textContent = 'Page content';
	owner.append( content );
	const node = background ? owner : document.createElement( 'img' );
	if ( ! background ) {
		node.src = 'https://example.test/one.png';
		owner.append( node );
	}
	document.body.append( owner );
	return {
		owner,
		content,
		node,
		image: new MeasurableImage( node, () => 'https://example.test/one.png', jest.fn() ),
	};
}

function setup( target = document.createElement( 'div' ), tracksCallback = jest.fn() ) {
	return setupImageGuideUI( target, { href: '/guide', tracksCallback, fetchFunction: jest.fn() } );
}

describe( 'MeasurableImage', () => {
	it( 'returns a class', () => {
		expect( MeasurableImage ).toBeInstanceOf( Function );
		expect( MeasurableImage.constructor ).toBeInstanceOf( Function );
	} );
} );

it( 'registers tracking before load and attaches guides before React commits', async () => {
	const { owner } = fixture();
	const track = jest.fn();
	deferCommit = true;
	setup( document.createElement( 'div' ), track );
	await act( async () => onLoad() );
	expect( track ).toHaveBeenCalledWith( 'image_guide_initial_ui_state', {
		image_guide_state: 'active',
	} );
	expect( createOwnedRoot ).toHaveBeenCalledTimes( 2 );
	expect( roots[ 1 ].render ).toHaveBeenCalledTimes( 1 );
	expect( owner ).toContainElement( roots[ 1 ].target );
	expect( owner.querySelector( '.guide' ) ).toBeNull();
} );

it.each( [
	[ 'relative', false ],
	[ 'relative', true ],
	[ 'fixed', false ],
] )(
	'preserves page children when mounting in a %s container (background=%s)',
	async ( position, background ) => {
		const { owner, content, node, image } = fixture( position, background );
		await act( async () => attachGuides( [ image ] ) );
		expect( owner ).toContainElement( content );
		expect( owner ).toContainElement( node );
		expect( roots[ 0 ].target ).not.toBe( owner );
		expect( roots[ 0 ].target ).not.toBe( node );
		expect( roots[ 0 ].target ).not.toContainElement( content );
		expect( roots[ 0 ].target.querySelector( '.guide' ) ).toBeInTheDocument();
	}
);

it( 'attaches one shared-container root through an in-flight pause and repeated resumes', async () => {
	const { owner, node } = fixture();
	owner.append( node.cloneNode() );
	let finishMeasurement;
	const measured = new Promise( resolve => {
		finishMeasurement = resolve;
	} );
	MeasurableImage.prototype.isImageTiny.mockReturnValue( measured );
	await act( async () => {
		setup();
	} );
	await act( async () => {
		onLoad();
		commands.setGuideState( 'paused' );
		commands.setGuideState( 'active' );
	} );
	await act( async () => finishMeasurement( false ) );
	expect( owner.querySelectorAll( '.interaction-area' ) ).toHaveLength( 2 );
	const guideRoot = roots[ 1 ].target;
	for ( let resume = 0; resume < 2; resume++ ) {
		await act( async () => commands.setGuideState( 'paused' ) );
		expect( owner.querySelector( '.guide' ) ).toBeNull();
		await act( async () => commands.setGuideState( 'active' ) );
		expect( owner.querySelectorAll( '.interaction-area' ) ).toHaveLength( 2 );
	}
	owner.append( node.cloneNode() );
	await act( async () => commands.setGuideState( 'paused' ) );
	await act( async () => commands.setGuideState( 'active' ) );
	expect( owner.querySelectorAll( '.interaction-area' ) ).toHaveLength( 3 );
	expect( createOwnedRoot ).toHaveBeenCalledTimes( 2 );
	expect( roots[ 1 ].target ).toBe( guideRoot );
} );

it( 'returns an idempotent toolbar unmount handle that preserves existing children', async () => {
	const { owner, content } = fixture();
	let handle;
	await act( async () => {
		handle = setup( owner );
	} );
	expect( owner.querySelector( '#jetpack-boost-guide-bar' ) ).toBeInTheDocument();
	act( () => {
		handle.unmount();
		handle.unmount();
	} );
	expect( owner ).toContainElement( content );
	expect( owner.querySelector( '#jetpack-boost-guide-bar' ) ).toBeNull();
	expect( roots[ 0 ].target.parentNode ).toBeNull();
} );

import { createRoot } from '@wordpress/element';
import { act } from 'react';

jest.mock( '@automattic/jetpack-idc', () => ( { IDCScreen: () => 'Safe Mode choices' } ) );
jest.mock( '@wordpress/element', () => {
	const element = jest.requireActual( '@wordpress/element' );
	return { ...element, createRoot: jest.fn( element.createRoot ) };
} );

const lateContainerId = 'my-jetpack-identity-crisis-container';

/**
 * Add an element with the given ID to the page.
 *
 * @param {string}      id     - Element ID.
 * @param {HTMLElement} parent - Element to add it to.
 * @return {HTMLElement} The element.
 */
function addElement( id, parent = document.body ) {
	const element = document.createElement( 'div' );
	element.id = id;
	parent.appendChild( element );
	return element;
}

describe( 'Safe Mode screen', () => {
	let onLoad;

	beforeAll( () => {
		globalThis.IS_REACT_ACT_ENVIRONMENT = true;
		// jsdom fires its own load event at an unknown time, so call the page-load handler directly.
		const addEventListener = jest.spyOn( window, 'addEventListener' );
		require( '../admin' );
		onLoad = addEventListener.mock.calls.find( ( [ type ] ) => type === 'load' )[ 1 ];
		window.removeEventListener( 'load', onLoad );
		addEventListener.mockRestore();
	} );

	beforeEach( () => {
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = { consumerData: {}, isSafeModeConfirmed: false };
	} );

	afterEach( () => {
		act( () => createRoot.mock.results.forEach( ( { value } ) => value.unmount() ) );
		createRoot.mockClear();
		document.body.innerHTML = '';
		delete window.JP_IDENTITY_CRISIS__INITIAL_STATE;
	} );

	it( 'renders into a container that exists when the page loads', () => {
		const container = addElement( 'jp-identity-crisis-container' );

		act( () => onLoad() );

		expect( container ).toHaveTextContent( 'Safe Mode choices' );
		expect( createRoot ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders once into a container added after the page loads', async () => {
		window.JP_IDENTITY_CRISIS__INITIAL_STATE.containerID = lateContainerId;
		// The container appears deep inside an element already on the page, as in My Jetpack.
		const wrapper = addElement( 'wrapper' );
		act( () => onLoad() );
		expect( createRoot ).not.toHaveBeenCalled();

		let container;
		await act( async () => {
			container = addElement( lateContainerId, wrapper );
		} );
		expect( container ).toHaveTextContent( 'Safe Mode choices' );

		await act( async () => addElement( 'unrelated' ) );
		expect( createRoot ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'stops waiting a minute after the page loads', async () => {
		jest.useFakeTimers();
		const disconnect = jest.spyOn( MutationObserver.prototype, 'disconnect' );
		try {
			window.JP_IDENTITY_CRISIS__INITIAL_STATE.containerID = lateContainerId;
			onLoad();

			jest.advanceTimersByTime( 60 * 1000 - 1 );
			expect( disconnect ).not.toHaveBeenCalled();
			jest.advanceTimersByTime( 1 );
			expect( disconnect ).toHaveBeenCalledTimes( 1 );

			await act( async () => addElement( lateContainerId ) );
			expect( createRoot ).not.toHaveBeenCalled();
		} finally {
			disconnect.mockRestore();
			jest.useRealTimers();
		}
	} );

	it.each( [
		[ 'Safe Mode is confirmed', { containerID: lateContainerId, isSafeModeConfirmed: true } ],
		[ 'no custom container is set', {} ],
	] )( 'does not wait for a container when %s', ( _, state ) => {
		const observe = jest.spyOn( MutationObserver.prototype, 'observe' );
		try {
			Object.assign( window.JP_IDENTITY_CRISIS__INITIAL_STATE, state );
			onLoad();
			expect( observe ).not.toHaveBeenCalled();
		} finally {
			observe.mockRestore();
		}
	} );
} );

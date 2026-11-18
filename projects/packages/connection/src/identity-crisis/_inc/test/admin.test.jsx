import { createRoot } from '@wordpress/element';
import { act } from 'react';
import { goTo, reloadPage } from '../navigate';

let mockIdentityCrisis = null;
let mockScreenProps = null;
const mockNewScreen = props => {
	mockScreenProps = props;
	return 'New Safe Mode screen';
};
const mockConnection = {
	CONNECTION_FROM: { connectionSafeModeNotice: 'connection_safe_mode_notice' },
	CONNECTION_STORE_ID: 'jetpack-connection',
	IdentityCrisis: mockNewScreen,
};

jest.mock( '@automattic/jetpack-connection', () => mockConnection );
jest.mock( '@wordpress/data', () => ( {
	select: () => ( { getIdentityCrisis: () => mockIdentityCrisis } ),
} ) );
jest.mock( '../navigate', () => ( { goTo: jest.fn(), reloadPage: jest.fn() } ) );
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
		mockIdentityCrisis = null;
		mockScreenProps = null;
		mockConnection.IdentityCrisis = mockNewScreen;
		jest.clearAllMocks();
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

	it.each( [
		[ 'the flag is on', { useNewScreen: true }, true, undefined, 'New Safe Mode screen' ],
		[ 'the flag is off', { useNewScreen: false }, true, undefined, 'Safe Mode choices' ],
		[ 'the state has no Safe Mode entry', null, true, undefined, 'Safe Mode choices' ],
		[
			'the shared script has no new screen',
			{ useNewScreen: true },
			false,
			undefined,
			'Safe Mode choices',
		],
		[
			"it is My Jetpack's container",
			{ useNewScreen: true },
			true,
			lateContainerId,
			'Safe Mode choices',
		],
	] )(
		'shows the right screen when %s',
		( _, identityCrisis, hasNewScreen, containerID, expected ) => {
			mockIdentityCrisis = identityCrisis;
			if ( ! hasNewScreen ) {
				mockConnection.IdentityCrisis = undefined;
			}
			window.JP_IDENTITY_CRISIS__INITIAL_STATE.containerID = containerID;
			const container = addElement( containerID ?? 'jp-identity-crisis-container' );

			act( () => onLoad() );

			expect( container ).toHaveTextContent( expected );
		}
	);

	describe( 'with the new screen', () => {
		beforeEach( () => {
			mockIdentityCrisis = { useNewScreen: true };
			window.JP_IDENTITY_CRISIS__INITIAL_STATE.redirectUri = '/edit.php';
			addElement( 'jp-identity-crisis-container' );
			act( () => onLoad() );
		} );

		it( 'tells the screen where it shows', () => {
			expect( mockScreenProps ).toMatchObject( {
				context: 'notice',
				from: 'connection_safe_mode_notice',
				redirectUri: '/edit.php',
			} );
		} );

		it.each( [
			[
				'a fresh connection goes on to connect',
				props =>
					props.onActionSuccess( {
						action: 'start-fresh',
						connectUrl: 'https://wordpress.com/connect',
					} ),
				[ [ 'https://wordpress.com/connect' ] ],
				0,
			],
			[
				'staying in Safe Mode reloads',
				props => props.onActionSuccess( { action: 'confirm-safe-mode' } ),
				[],
				1,
			],
			[
				'migrating waits for its done view',
				props => props.onActionSuccess( { action: 'migrate' } ),
				[],
				0,
			],
			[ 'the migrate done view reloads', props => props.onMigratedDone(), [], 1 ],
		] )( '%s', ( _, trigger, goToCalls, reloads ) => {
			trigger( mockScreenProps );

			expect( goTo.mock.calls ).toEqual( goToCalls );
			expect( reloadPage ).toHaveBeenCalledTimes( reloads );
		} );
	} );
} );

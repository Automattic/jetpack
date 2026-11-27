import { createRoot } from '@wordpress/element';
import { act } from 'react';

let mockIdentityCrisis = null;
let mockSelectors = null;
let mockScreenProps = null;
let mockLegacyScreenProps = null;
const mockNewScreen = props => {
	mockScreenProps = props;
	return 'New Safe Mode screen';
};
const mockCurrentUser = { isConnected: true, wpcomUser: { ID: 42, login: 'admin' } };
const sharedScript = {
	CONNECTION_FROM: { connectionSafeModeNotice: 'connection_safe_mode_notice' },
	CONNECTION_STORE_ID: 'jetpack-connection',
	IdentityCrisis: mockNewScreen,
	initializeTracksIdentity: jest.fn(),
};

jest.mock( '@wordpress/data', () => ( {
	select: () =>
		mockSelectors ?? {
			getIdentityCrisis: () => mockIdentityCrisis,
			getUserConnectionData: () => ( { currentUser: mockCurrentUser } ),
		},
} ) );
jest.mock( '@automattic/jetpack-idc', () => ( {
	IDCScreen: props => {
		mockLegacyScreenProps = props;
		return 'Safe Mode choices';
	},
} ) );
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
		window.JetpackConnection = { ...sharedScript };
	} );

	afterEach( () => {
		act( () => createRoot.mock.results.forEach( ( { value } ) => value.unmount() ) );
		createRoot.mockClear();
		document.body.innerHTML = '';
		delete window.JP_IDENTITY_CRISIS__INITIAL_STATE;
		delete window.JetpackConnection;
		mockIdentityCrisis = null;
		mockSelectors = null;
		mockScreenProps = null;
		mockLegacyScreenProps = null;
		jest.clearAllMocks();
	} );

	it( 'renders into a container that exists when the page loads', () => {
		const container = addElement( 'jp-identity-crisis-container' );

		act( () => onLoad() );

		expect( container ).toHaveTextContent( 'Safe Mode choices' );
		expect( createRoot ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [ undefined, '', 'woocommerce-payments' ] )(
		'passes the optional consumer source to the legacy screen: %s',
		from => {
			window.JP_IDENTITY_CRISIS__INITIAL_STATE.consumerData = { from };
			addElement( 'jp-identity-crisis-container' );
			act( () => onLoad() );
			expect( mockLegacyScreenProps.from ).toBe( from );
		}
	);

	it( 'passes an opted-in consumer source to the new screen', () => {
		mockIdentityCrisis = { useNewScreen: true };
		window.JP_IDENTITY_CRISIS__INITIAL_STATE.consumerData = { from: 'woocommerce-payments' };
		addElement( 'jp-identity-crisis-container' );
		act( () => onLoad() );
		expect( mockScreenProps.from ).toBe( 'woocommerce-payments' );
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
		[ 'the flag is on', { useNewScreen: true }, sharedScript, undefined, 'New Safe Mode screen' ],
		[ 'the flag is off', { useNewScreen: false }, sharedScript, undefined, 'Safe Mode choices' ],
		[
			'the shared script is not loaded',
			{ useNewScreen: true },
			undefined,
			undefined,
			'Safe Mode choices',
		],
		[
			'the shared script has no new screen',
			{ useNewScreen: true },
			{ ...sharedScript, IdentityCrisis: undefined },
			undefined,
			'Safe Mode choices',
		],
		[ 'the state has no Safe Mode entry', null, sharedScript, undefined, 'Safe Mode choices' ],
		[
			"it is My Jetpack's container",
			{ useNewScreen: true },
			sharedScript,
			lateContainerId,
			'Safe Mode choices',
		],
	] )( 'shows the right screen when %s', ( _, identityCrisis, script, containerID, expected ) => {
		mockIdentityCrisis = identityCrisis;
		window.JetpackConnection = script;
		window.JP_IDENTITY_CRISIS__INITIAL_STATE.containerID = containerID;
		const container = addElement( containerID ?? 'jp-identity-crisis-container' );

		act( () => onLoad() );

		expect( container ).toHaveTextContent( expected );
	} );

	it( 'shows the old screen when an older store, without the selector, is registered', () => {
		mockSelectors = {};
		const container = addElement( 'jp-identity-crisis-container' );

		act( () => onLoad() );

		expect( container ).toHaveTextContent( 'Safe Mode choices' );
	} );

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
			// The screen's own handlers navigate.
			expect( mockScreenProps ).not.toHaveProperty( 'onActionSuccess' );
			expect( mockScreenProps ).not.toHaveProperty( 'onMigratedDone' );
		} );

		it( 'identifies the viewer to Tracks', () => {
			expect( sharedScript.initializeTracksIdentity ).toHaveBeenCalledWith( mockCurrentUser );
		} );
	} );
} );

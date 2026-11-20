import {
	findMissingDevice,
	getCameraProblem,
	getEnvironmentProblem,
	watchCameraPermission,
} from '../camera-problems';

it.each( [
	[ 'NotAllowedError', 'Permission denied', 'blocked' ],
	[ 'NotAllowedError', 'Permission denied by system', 'blocked-by-system' ],
	[ 'SecurityError', '', 'blocked' ],
	[ 'NotFoundError', '', 'missing-devices' ],
	[ 'OverconstrainedError', '', 'missing-devices' ],
	[ 'NotReadableError', 'Could not start video source', 'in-use' ],
	[ 'AbortError', '', 'in-use' ],
	[ 'TypeError', '', 'unknown' ],
] )( 'maps %s ( %s ) to %s', ( name, message, problem ) => {
	expect( getCameraProblem( new DOMException( message, name ) ) ).toBe( problem );
} );

it.each( [
	[ { isSecureContext: false, navigator: { mediaDevices: { getUserMedia() {} } } }, 'insecure' ],
	[ { isSecureContext: true, navigator: {} }, 'unsupported' ],
	[ { isSecureContext: true, navigator: { mediaDevices: { getUserMedia() {} } } }, null ],
] )( 'checks the page can ask for a camera', ( win, problem ) => {
	expect( getEnvironmentProblem( win as unknown as Window ) ).toBe( problem );
} );

it.each( [
	[ [ 'audioinput' ], 'missing-camera' ],
	[ [ 'videoinput' ], 'missing-microphone' ],
	[ [], 'missing-devices' ],
	[ [ 'audioinput', 'videoinput' ], 'missing-devices' ],
] )( 'names the missing device when only %j is attached', async ( kinds, problem ) => {
	const devices = {
		enumerateDevices: async () => kinds.map( kind => ( { kind } ) ),
	} as unknown as MediaDevices;
	await expect( findMissingDevice( devices ) ).resolves.toBe( problem );
} );

it( 'calls back once both inputs stop being denied', async () => {
	const statuses = [ 'camera', 'microphone' ].map( () =>
		Object.assign( new EventTarget(), { state: 'denied' } )
	);
	Object.defineProperty( navigator, 'permissions', {
		configurable: true,
		value: { query: jest.fn( async ( { name } ) => statuses[ name === 'camera' ? 0 : 1 ] ) },
	} );
	const onAllowed = jest.fn();
	watchCameraPermission( onAllowed );
	await Promise.resolve();
	await Promise.resolve();

	statuses[ 0 ].state = 'granted';
	statuses[ 0 ].dispatchEvent( new Event( 'change' ) );
	expect( onAllowed ).not.toHaveBeenCalled();
	statuses[ 1 ].state = 'prompt';
	statuses[ 1 ].dispatchEvent( new Event( 'change' ) );
	statuses[ 1 ].dispatchEvent( new Event( 'change' ) );
	expect( onAllowed ).toHaveBeenCalledTimes( 1 );
} );

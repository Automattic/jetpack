import { renderHook } from '@testing-library/react';
import { useConnectionKnown } from '../use-connection-known';

let mockStatus: { isRegistered?: unknown } | undefined;

jest.mock( '@automattic/jetpack-connection', () => ( {
	__esModule: true,
	CONNECTION_STORE_ID: 'connection',
} ) );

jest.mock( '@wordpress/data', () => ( {
	__esModule: true,
	useSelect: ( read: ( select: () => object ) => unknown ) =>
		read( () => ( { getConnectionStatus: () => mockStatus } ) ),
} ) );

describe( 'Whether the connection is known', () => {
	// False is an answer: a site nobody has connected is known, not still loading.
	it.each( [
		[ 'no status', undefined, false ],
		[ 'a status without the field', {}, false ],
		[ 'an unregistered site', { isRegistered: false }, true ],
		[ 'a registered site', { isRegistered: true }, true ],
	] )( 'reads %s as known: %p', ( _label, status, known ) => {
		mockStatus = status;

		expect( renderHook( () => useConnectionKnown() ).result.current ).toBe( known );
	} );
} );

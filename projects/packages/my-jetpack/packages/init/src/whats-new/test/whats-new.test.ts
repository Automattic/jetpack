import { mountWhatsNew } from '@automattic/jetpack-announcements';
import { showWhatsNew } from '../whats-new';

jest.mock( '@automattic/jetpack-announcements', () => ( {
	mountWhatsNew: jest.fn(),
} ) );

const open = ( page: string, whatsNew: boolean ): void => {
	window.history.replaceState( null, '', `?page=${ page }` );
	window.myJetpackInitialState = {
		myJetpackFlags: { whatsNew },
	} as Window[ 'myJetpackInitialState' ];
};

// The surface is imported on demand, so the mount lands a turn after the call.
const showAndSettle = async (): Promise< void > => {
	showWhatsNew();
	await new Promise( resolve => setTimeout( resolve, 0 ) );
};

describe( 'showWhatsNew', () => {
	afterEach( () => {
		jest.mocked( mountWhatsNew ).mockReset();
		delete window.myJetpackInitialState;
	} );

	it( 'mounts the surface with the channel of My Jetpack', async () => {
		open( 'my-jetpack', true );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
		expect( mountWhatsNew ).toHaveBeenCalledWith( { channels: [ 'my-jetpack' ] } );
	} );

	it.each( [
		[ 'while the flag is off', 'my-jetpack', false ],
		[ 'on another page, where the admin shell runs it ahead', 'stats', true ],
	] )( 'mounts nothing %s', async ( _case, page, whatsNew ) => {
		open( page, whatsNew );

		await showAndSettle();

		expect( mountWhatsNew ).not.toHaveBeenCalled();
	} );

	// Jest fails a test that leaves a rejection unhandled.
	it( 'stays quiet when the surface fails to mount', async () => {
		jest.mocked( mountWhatsNew ).mockImplementationOnce( () => {
			throw new Error( 'mount failed' );
		} );
		open( 'my-jetpack', true );

		await showAndSettle();

		expect( mountWhatsNew ).toHaveBeenCalledTimes( 1 );
	} );
} );

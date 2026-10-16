import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { getHeaderControls } from '../';

const setFlags = ( myJetpackFlags: Record< string, boolean > ) => {
	window.myJetpackInitialState = {
		myJetpackFlags,
	} as unknown as typeof window.myJetpackInitialState;
};

describe( 'getHeaderControls', () => {
	it.each( [
		[ 'off', { headerControls: false } ],
		[ 'missing, as from an older My Jetpack', {} ],
	] )( 'returns null while the flag is %s', ( _, flags ) => {
		setFlags( flags );

		expect( getHeaderControls() ).toBeNull();
	} );

	it( 'returns the controls once the flag is on', () => {
		setFlags( { headerControls: true } );
		render( <>{ getHeaderControls() }</> );

		expect( screen.getByRole( 'button', { name: 'Connection' } ) ).toBeInTheDocument();
	} );
} );

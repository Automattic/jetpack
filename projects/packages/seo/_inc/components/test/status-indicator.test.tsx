import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): import the component under test
// dynamically, mirroring the other component tests. No mocks needed.
const { default: StatusIndicator } = await import( '../status-indicator' );

describe( 'StatusIndicator', () => {
	it.each( [
		[ 'not-started', 'Not started', 'draft' ],
		[ 'in-progress', 'In progress', 'medium' ],
		[ 'complete', 'Complete', 'stable' ],
		[ 'paused', 'Paused', 'draft' ],
	] as const )( 'renders the %s state as a "%s" badge', ( status, label, intent ) => {
		render( <StatusIndicator status={ status } /> );

		// The Badge exposes its intent only as a class (e.g. `…__is-stable-intent`).
		expect( screen.getByText( label ).className ).toMatch( new RegExp( `is-${ intent }-intent` ) );
	} );
} );

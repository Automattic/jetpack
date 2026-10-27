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
	] as const )( 'renders the %s state as a "%s" badge', ( status, label, intent ) => {
		render( <StatusIndicator status={ status } /> );

		// The intent is a class on the `@wordpress/ui` Badge (e.g. `…__is-stable-intent`),
		// the same colors the GEO crawler groups use.
		expect( screen.getByText( label ).className ).toMatch( new RegExp( `is-${ intent }-intent` ) );
	} );

	it( 'renders text only, without the old state glyph', () => {
		const { container } = render( <StatusIndicator status="complete" /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting no glyph rendered.
		expect( container.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );
} );

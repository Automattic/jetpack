import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

// `--experimental-vm-modules` (true ESM): import the component under test
// dynamically, mirroring the other component tests. No mocks needed.
const { default: StatusIndicator } = await import( '../status-indicator' );

describe( 'StatusIndicator', () => {
	it.each( [
		[ 'not-started', 'Not started' ],
		[ 'in-progress', 'In progress' ],
		[ 'complete', 'Complete' ],
	] as const )( 'renders the %s state with a label and icon', ( status, label ) => {
		const { container } = render( <StatusIndicator status={ status } /> );

		expect( screen.getByText( label ) ).toBeInTheDocument();
		// The state glyph is a decorative SVG with no accessible role of its own.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting the glyph rendered.
		expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
	} );
} );

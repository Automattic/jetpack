import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { code } from '@wordpress/icons';

// `--experimental-vm-modules` (true ESM): import the component under test
// dynamically, mirroring the other component tests. No mocks are needed — this
// is a purely presentational chip.
const { default: CardTitleIcon } = await import( '../card-title-icon' );

describe( 'CardTitleIcon', () => {
	it( 'renders the title alongside a leading icon chip', () => {
		const { container } = render( <CardTitleIcon icon={ code } title="Schema" /> );

		expect( screen.getByText( 'Schema' ) ).toBeInTheDocument();
		// The chip glyph is a decorative SVG with no accessible role of its own.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- asserting the decorative glyph rendered.
		expect( container.querySelector( 'svg' ) ).toBeInTheDocument();
	} );
} );

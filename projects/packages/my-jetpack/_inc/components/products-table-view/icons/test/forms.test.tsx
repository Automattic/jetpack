import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import FormsIcon from '../forms';

describe( 'FormsIcon', () => {
	it( 'renders a decorative svg icon', () => {
		const { container } = render( <FormsIcon /> );
		// The icon is decorative (no accessible role), so query the SVG directly.
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const svg = container.querySelector( 'svg.table-view-icon' );
		expect( svg ).toBeInTheDocument();
	} );
} );

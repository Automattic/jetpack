import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import DateFieldHints from '../hints.jsx';

describe( 'DateFieldHints', () => {
	it.each( [
		[ 'mm/dd/yy', 'MM/DD/YYYY' ],
		[ 'dd/mm/yy', 'DD/MM/YYYY' ],
		[ 'yy-mm-dd', 'YYYY-MM-DD' ],
	] )( 'renders the hint for %s', ( dateFormat, expected ) => {
		render( <DateFieldHints dateFormat={ dateFormat } /> );

		expect( screen.getByText( expected ) ).toBeInTheDocument();
	} );

	it( 'renders nothing for an unknown format', () => {
		const { container } = render( <DateFieldHints dateFormat="nope" /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders a span, not a paragraph, so themes cannot restyle it', () => {
		const { container } = render( <DateFieldHints dateFormat="mm/dd/yy" /> );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelectorAll( 'p' ) ).toHaveLength( 0 );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.contact-form__field-format' ) ).toBeInTheDocument();
	} );
} );

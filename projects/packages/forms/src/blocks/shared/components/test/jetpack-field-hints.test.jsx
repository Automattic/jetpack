import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import JetpackFieldHints from '../jetpack-field-hints.jsx';

describe( 'JetpackFieldHints', () => {
	it( 'renders the format hint for a date field', () => {
		render( <JetpackFieldHints attributes={ { dateFormat: 'mm/dd/yy' } } isDateField /> );

		expect( screen.getByText( 'MM/DD/YYYY' ) ).toBeInTheDocument();
	} );

	it( 'renders nothing when it is not a date field, even with a dateFormat', () => {
		const { container } = render( <JetpackFieldHints attributes={ { dateFormat: 'mm/dd/yy' } } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders nothing for an unknown format', () => {
		const { container } = render(
			<JetpackFieldHints attributes={ { dateFormat: 'nope' } } isDateField />
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders a span, not a paragraph, so themes cannot restyle it', () => {
		const { container } = render(
			<JetpackFieldHints attributes={ { dateFormat: 'mm/dd/yy' } } isDateField />
		);

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelectorAll( 'p' ) ).toHaveLength( 0 );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( '.contact-form__field-format' ) ).toBeInTheDocument();
	} );
} );

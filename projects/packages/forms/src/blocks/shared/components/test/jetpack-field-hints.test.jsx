import { render, screen } from '@testing-library/react';
import JetpackFieldHints from '../jetpack-field-hints.jsx';

describe( 'JetpackFieldHints', () => {
	it( 'renders nothing when there is no help text and it is not a date field', () => {
		const { container } = render( <JetpackFieldHints attributes={ {} } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the author help text', () => {
		render( <JetpackFieldHints attributes={ { helpText: 'Say hi' } } /> );

		expect( screen.getByText( 'Say hi' ) ).toBeInTheDocument();
	} );

	it( 'renders the format hint for a date field', () => {
		render( <JetpackFieldHints attributes={ { dateFormat: 'mm/dd/yy' } } isDateField /> );

		expect( screen.getByText( 'Format: MM/DD/YYYY' ) ).toBeInTheDocument();
	} );

	it( 'renders the help text before the format hint', () => {
		const { container } = render(
			<JetpackFieldHints
				attributes={ { helpText: 'Say hi', dateFormat: 'mm/dd/yy' } }
				isDateField
			/>
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const paragraphs = container.querySelectorAll( 'p' );

		expect( paragraphs ).toHaveLength( 2 );
		expect( paragraphs[ 0 ] ).toHaveClass( 'contact-form__field-help' );
		expect( paragraphs[ 1 ] ).toHaveClass( 'contact-form__field-format' );
	} );

	it( 'treats whitespace-only help text as absent', () => {
		const { container } = render( <JetpackFieldHints attributes={ { helpText: '   ' } } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );

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

		expect( screen.getByText( 'MM/DD/YYYY' ) ).toBeInTheDocument();
	} );

	it( 'renders the help text before the format hint, both in one container', () => {
		const { container } = render(
			<JetpackFieldHints
				attributes={ { helpText: 'Say hi', dateFormat: 'mm/dd/yy' } }
				isDateField
			/>
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const hints = container.querySelectorAll( '.contact-form__field-hints > span' );

		expect( hints ).toHaveLength( 2 );
		expect( hints[ 0 ] ).toHaveClass( 'contact-form__field-help' );
		expect( hints[ 1 ] ).toHaveClass( 'contact-form__field-format' );
	} );

	it( 'renders no paragraphs, so themes cannot restyle the hints', () => {
		const { container } = render(
			<JetpackFieldHints
				attributes={ { helpText: 'Say hi', dateFormat: 'mm/dd/yy' } }
				isDateField
			/>
		);
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelectorAll( 'p' ) ).toHaveLength( 0 );
	} );

	it( 'treats whitespace-only help text as absent', () => {
		const { container } = render( <JetpackFieldHints attributes={ { helpText: '   ' } } /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'does not render a format hint when isDateField is not set, even with a dateFormat', () => {
		const { container } = render( <JetpackFieldHints attributes={ { dateFormat: 'mm/dd/yy' } } /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );

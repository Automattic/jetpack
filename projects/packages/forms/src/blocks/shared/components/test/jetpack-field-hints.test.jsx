import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import JetpackFieldHints from '../jetpack-field-hints.jsx';

const setAttributes = jest.fn();

const renderHints = props =>
	render( <JetpackFieldHints setAttributes={ setAttributes } { ...props } /> );

describe( 'JetpackFieldHints', () => {
	beforeEach( () => {
		setAttributes.mockClear();
	} );

	it.each( [
		[ 'nothing set', {} ],
		[ 'whitespace-only help text', { helpText: '   ' } ],
		[ 'a dateFormat but not a date field', { dateFormat: 'mm/dd/yy' } ],
	] )( 'renders nothing when inactive with %s', ( _label, attributes ) => {
		const { container } = renderHints( { attributes } );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the author help text', () => {
		renderHints( { attributes: { helpText: 'Say hi' } } );

		expect( screen.getByText( 'Say hi' ) ).toBeInTheDocument();
	} );

	it( 'renders the format hint for a date field', () => {
		renderHints( { attributes: { dateFormat: 'mm/dd/yy' }, isDateField: true } );

		expect( screen.getByText( 'MM/DD/YYYY' ) ).toBeInTheDocument();
	} );

	it( 'renders the help text before the format hint, both in one container', () => {
		const { container } = renderHints( {
			attributes: { helpText: 'Say hi', dateFormat: 'mm/dd/yy' },
			isDateField: true,
		} );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const hints = container.querySelectorAll( '.contact-form__field-hints > span' );

		expect( hints ).toHaveLength( 2 );
		expect( hints[ 0 ] ).toHaveClass( 'contact-form__field-help' );
		expect( hints[ 1 ] ).toHaveClass( 'contact-form__field-format' );
	} );

	it( 'renders no paragraphs, so themes cannot restyle the hints', () => {
		const { container } = renderHints( {
			attributes: { helpText: 'Say hi', dateFormat: 'mm/dd/yy' },
			isDateField: true,
		} );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelectorAll( 'p' ) ).toHaveLength( 0 );
	} );

	it( 'offers an editable help text slot once the field is active', () => {
		const { container } = renderHints( { attributes: {}, isActive: true } );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const help = container.querySelector( '.contact-form__field-help' );

		expect( help ).toBeInTheDocument();
		expect( help ).toHaveAttribute( 'contenteditable', 'true' );
	} );

	it( 'keeps the format hint non-editable', () => {
		const { container } = renderHints( {
			attributes: { dateFormat: 'mm/dd/yy' },
			isActive: true,
			isDateField: true,
		} );

		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const format = container.querySelector( '.contact-form__field-format' );

		expect( format ).not.toHaveAttribute( 'contenteditable' );
	} );
} );

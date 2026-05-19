import { fireEvent, render, screen } from '@testing-library/react';
import AiAnswerEdit from '../../../src/search-blocks/blocks/ai-answer/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: props => ( { ...props, className: props?.className } ),
	InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { title, children } ) => (
		<section data-testid="panel" aria-label={ title }>
			{ children }
		</section>
	),
	ToggleControl: ( { label, checked, onChange } ) => {
		const id = `toggle-${ String( label ).toLowerCase().replace( /\s+/g, '-' ) }`;
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="checkbox"
					checked={ !! checked }
					onChange={ event => onChange( event.target.checked ) }
				/>
			</>
		);
	},
	TextControl: ( { label, value, onChange, placeholder } ) => {
		const id = `text-${ String( label ).toLowerCase().replace( /\s+/g, '-' ) }`;
		return (
			<>
				<label htmlFor={ id }>{ label }</label>
				<input
					id={ id }
					type="text"
					value={ value || '' }
					placeholder={ placeholder }
					onChange={ event => onChange( event.target.value ) }
				/>
			</>
		);
	},
} ) );

describe( 'AiAnswerEdit', () => {
	it( 'renders the default heading when none is set', () => {
		render( <AiAnswerEdit attributes={ {} } setAttributes={ () => {} } /> );
		expect( screen.getByText( 'AI answer' ) ).toBeInTheDocument();
	} );

	it( 'renders a custom heading when set', () => {
		render( <AiAnswerEdit attributes={ { heading: 'Summary' } } setAttributes={ () => {} } /> );
		expect( screen.getByText( 'Summary' ) ).toBeInTheDocument();
	} );

	it( 'shows sample citations by default', () => {
		render( <AiAnswerEdit attributes={ {} } setAttributes={ () => {} } /> );
		// First sample citation's title — its presence stands in for the
		// whole citations list since the preview owns the fixture data.
		expect( screen.getByText( 'Getting started with WordPress' ) ).toBeInTheDocument();
	} );

	it( 'omits citations when showCitations is false', () => {
		render( <AiAnswerEdit attributes={ { showCitations: false } } setAttributes={ () => {} } /> );
		expect( screen.queryByText( 'Getting started with WordPress' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Show more button by default', () => {
		render( <AiAnswerEdit attributes={ {} } setAttributes={ () => {} } /> );
		expect( screen.getByText( 'Show more' ) ).toBeInTheDocument();
	} );

	it( 'omits the Show more button when enableShowMore is false', () => {
		render( <AiAnswerEdit attributes={ { enableShowMore: false } } setAttributes={ () => {} } /> );
		expect( screen.queryByText( 'Show more' ) ).not.toBeInTheDocument();
	} );

	it( 'calls setAttributes when the heading input changes', () => {
		const setAttributes = jest.fn();
		render( <AiAnswerEdit attributes={ {} } setAttributes={ setAttributes } /> );
		// `fireEvent.change` over `userEvent.type` here because the mocked
		// `TextControl` fires `onChange` once with the full value (matching
		// how Gutenberg's real component behaves), whereas `userEvent.type`
		// would fire one event per character and the assertion would only
		// see the last character.
		// eslint-disable-next-line testing-library/prefer-user-event
		fireEvent.change( screen.getByLabelText( 'Heading' ), {
			target: { value: 'Quick reply' },
		} );
		expect( setAttributes ).toHaveBeenCalledWith( { heading: 'Quick reply' } );
	} );
} );

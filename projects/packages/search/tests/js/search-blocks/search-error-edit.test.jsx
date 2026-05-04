import { render, screen } from '@testing-library/react';
import SearchErrorEdit from '../../../src/search-blocks/blocks/search-error/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-jetpack-search-error' } ),
	InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { title, children } ) => (
		<section data-testid="panel" aria-label={ title }>
			{ children }
		</section>
	),
	TextControl: ( { label, value, onChange, placeholder } ) => {
		const id = 'search-error-message-control';
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

jest.mock( '@wordpress/i18n', () => ( {
	__: text => text,
} ) );

describe( 'SearchErrorEdit', () => {
	it( 'keeps the error message out of the successful-results preview', () => {
		render( <SearchErrorEdit attributes={ {} } setAttributes={ jest.fn() } /> );

		expect( screen.getByRole( 'textbox', { name: 'Message' } ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'Something went wrong. Please try again.' )
		).not.toBeInTheDocument();
	} );
} );

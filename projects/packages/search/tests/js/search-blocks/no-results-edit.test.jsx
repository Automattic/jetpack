import { render, screen } from '@testing-library/react';
import NoResultsEdit from '../../../src/search-blocks/blocks/no-results/edit';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( { className: 'wp-block-jetpack-no-results' } ),
	InspectorControls: ( { children } ) => <div data-testid="inspector">{ children }</div>,
} ) );

jest.mock( '@wordpress/components', () => ( {
	PanelBody: ( { title, children } ) => (
		<section data-testid="panel" aria-label={ title }>
			{ children }
		</section>
	),
	TextControl: ( { label, value, onChange, placeholder } ) => {
		const id = 'no-results-message-control';
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

describe( 'NoResultsEdit', () => {
	it( 'keeps the no-results message out of the successful-results preview', () => {
		render( <NoResultsEdit attributes={ {} } setAttributes={ jest.fn() } /> );

		expect( screen.getByRole( 'textbox', { name: 'Message' } ) ).toBeInTheDocument();
		expect(
			screen.queryByText( 'No results found. Try a different search.' )
		).not.toBeInTheDocument();
	} );
} );

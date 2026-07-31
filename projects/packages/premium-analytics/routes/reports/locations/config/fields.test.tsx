import { render, screen } from '@testing-library/react';
import { getLocationFields, type LocationRow } from './fields';

const location: LocationRow = {
	id: 'IN:Mumbai',
	label: 'Mumbai',
	countryCode: 'IN',
	countryFull: 'India',
	views: 1234,
};

/**
 * Render one Locations table field for the fixture row.
 *
 * @param id - The field to render.
 * @return The Testing Library render result.
 */
function renderField( id: 'location' | 'views' ) {
	const field = getLocationFields().find( candidate => candidate.id === id );
	// eslint-disable-next-line testing-library/render-result-naming-convention -- This is the DataViews field render component, not RTL's render result.
	const LocationField = field?.render;

	if ( ! field || ! LocationField ) {
		throw new Error( `${ id } field render callback is unavailable` );
	}

	return render( <LocationField item={ location } field={ field as never } /> );
}

describe( 'locations fields', () => {
	it( 'renders a searchable location with its country flag', () => {
		const locationField = getLocationFields().find( field => field.id === 'location' );
		renderField( 'location' );

		expect( locationField?.enableGlobalSearch ).toBe( true );
		expect( screen.getByText( 'Mumbai' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'img', { name: 'Flag of India' } ) ).toHaveAttribute(
			'src',
			expect.stringContaining( '/flags/4x3/in.svg' )
		);
	} );

	it( 'formats views for display', () => {
		renderField( 'views' );

		expect( screen.getByText( ( 1234 ).toLocaleString() ) ).toBeInTheDocument();
	} );

	// DataViews sorts and searches on the raw field value, not the rendered
	// cell, so views must stay a number and the location must stay its label.
	it( 'sorts and searches on the raw row values', () => {
		const fields = getLocationFields();
		const getValue = ( id: string ) =>
			fields.find( field => field.id === id )?.getValue?.( { item: location } );

		expect( getValue( 'location' ) ).toBe( 'Mumbai' );
		expect( getValue( 'views' ) ).toBe( 1234 );
	} );
} );

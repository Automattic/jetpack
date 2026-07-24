import { render, screen } from '@testing-library/react';
import { makeLibraryItem } from '../../../test-utils/library-item';
import { libraryFields } from '../fields';
import type { LibraryItem } from '../../../types/library';
import type { Field } from '@wordpress/dataviews';

const getField = ( id: string ): Field< LibraryItem > => {
	const field = libraryFields.find( candidate => candidate.id === id );
	if ( ! field ) {
		throw new Error( `Field ${ id } is not registered` );
	}
	return field;
};

describe( 'orientation field', () => {
	const renderOrientation = ( item: LibraryItem ) => {
		const OrientationRender = getField( 'orientation' ).render as React.ComponentType< {
			item: LibraryItem;
		} >;
		return render( <OrientationRender item={ item } /> );
	};

	it( 'shows a labelled portrait indicator for portrait videos', () => {
		renderOrientation( makeLibraryItem( { orientation: 'portrait' } ) );

		const indicator = screen.getByRole( 'img', { name: 'Portrait' } );
		expect( indicator ).toHaveClass( 'vp-library__orientation--portrait' );
	} );

	it( 'shows a labelled landscape indicator for landscape videos', () => {
		renderOrientation( makeLibraryItem( { orientation: 'landscape' } ) );

		const indicator = screen.getByRole( 'img', { name: 'Landscape' } );
		expect( indicator ).toHaveClass( 'vp-library__orientation--landscape' );
	} );

	it( 'renders nothing when the orientation is unknown', () => {
		const { container } = renderOrientation( makeLibraryItem( { orientation: null } ) );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'exposes the orientation as the field value', () => {
		const field = getField( 'orientation' );

		expect( field.getValue?.( { item: makeLibraryItem( { orientation: 'landscape' } ) } ) ).toBe(
			'landscape'
		);
		expect( field.getValue?.( { item: makeLibraryItem( { orientation: null } ) } ) ).toBe( '' );
	} );
} );

import { render, screen } from '@testing-library/react';
import TockBlockEdit from '../edit';

jest.mock( '@wordpress/components', () => {
	const actual = jest.requireActual( '@wordpress/components' );
	const mocks = {
		SandBox: props => <iframe title="Tock" { ...props } />,
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

describe( 'TockBlockEdit', () => {
	const setAttributes = jest.fn();

	const previewMarkup = url => {
		render(
			<TockBlockEdit attributes={ { url } } setAttributes={ setAttributes } isSelected={ false } />
		);
		return screen.getByTitle( 'Tock' ).getAttribute( 'html' );
	};

	beforeEach( () => setAttributes.mockClear() );

	test( 'initializes the widget with the stored business name', () => {
		expect( previewMarkup( 'my-restaurant' ) ).toContain( `tock('init', "my-restaurant");` );
	} );

	test( 'keeps a single quote inside the literal', () => {
		const markup = previewMarkup( "x'); y='z'; //" );

		expect( markup ).toContain( `tock('init', "x'); y='z'; //");` );
	} );

	test( 'escapes a double quote inside the literal', () => {
		const markup = previewMarkup( `x"); y='z'; //` );

		expect( markup ).toContain( `tock('init', "x\\"); ` );
	} );

	test( 'escapes angle brackets inside the literal', () => {
		const markup = previewMarkup( 'x</script><script>y()</script>' );

		expect( markup ).not.toContain( '<script>y()' );
		expect( markup ).toContain( '\\u003C/script\\u003E' );
	} );
} );

import { join } from 'node:path';
import { compile } from 'sass-embedded';

const isFloor = ( value: string ) => value !== '' && value !== 'auto' && parseFloat( value ) !== 0;

describe( 'HelpCard styles', () => {
	it( 'sets no minimum width on the card', () => {
		const style = document.createElement( 'style' );
		style.textContent = compile( join( __dirname, '..', 'styles.module.scss' ) ).css;
		document.head.appendChild( style );
		const wrapper = Array.from( style.sheet!.cssRules ).find(
			( rule ): rule is CSSStyleRule =>
				rule instanceof CSSStyleRule && rule.selectorText === '.wrapper'
		);

		expect( wrapper ).toBeDefined();
		expect(
			[ 'min-width', 'min-inline-size' ]
				.map( property => [ property, wrapper!.style.getPropertyValue( property ) ] )
				.filter( ( [ , value ] ) => isFloor( value ) )
		).toEqual( [] );
	} );
} );
